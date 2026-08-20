import os
import traceback
from datetime import datetime
from typing import Optional, Dict, List, Tuple
from sqlalchemy.orm import Session

# Feature flag: enable AI proctoring by default when runtime packages are available.
PROCTORING_ENABLED = os.getenv("AI_PROCTORING_ENABLED", "true").lower() == "true"

cv2 = None
np = None
mp_tasks = None

try:
    import cv2  # type: ignore
    import numpy as np  # type: ignore
    # Import modern MediaPipe Tasks API only
    from mediapipe.tasks import python as mp_tasks  # type: ignore
    from mediapipe.tasks.python import BaseOptions  # type: ignore
    from mediapipe.tasks.python.vision import FaceLandmarker, FaceLandmarkerOptions  # type: ignore
except Exception as e:
    print(f"Error importing AI proctoring dependencies: {e}")
    traceback.print_exc()
    cv2 = None
    np = None
    mp_tasks = None
    PROCTORING_ENABLED = False

if PROCTORING_ENABLED and (cv2 is None or np is None or mp_tasks is None):
    PROCTORING_ENABLED = False
    print("Warning: AI proctoring disabled - required dependencies not available")

from backend.models.ai_violation import AIViolation, ProctoringSession
from backend.models.attempt import Attempt


class AIProctoringService:
    """Enterprise-grade AI proctoring service using MediaPipe Tasks Vision API."""
    
    def __init__(self):
        # If proctoring is disabled, keep service as a no-op placeholder.
        print(f"AIProctoringService - Initializing. PROCTORING_ENABLED: {PROCTORING_ENABLED}")
        if not PROCTORING_ENABLED:
            self.enabled = False
            self.face_landmarker = None
            print("AIProctoringService - Service disabled")
            return

        self.enabled = True
        self.face_landmarker = None
        self.model_path = os.path.join(os.path.dirname(__file__), "..", "ai_models", "face_landmarker.task")
        
        try:
            # Verify model file exists
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Face landmark model not found at: {self.model_path}")
            
            print(f"Loading Face Landmarker model from: {self.model_path}")
            
            # Initialize MediaPipe Base Options with local model
            base_options = BaseOptions(
                model_asset_path=self.model_path
            )
            
            # Initialize Face Landmarker options
            landmarker_options = FaceLandmarkerOptions(
                base_options=base_options,
                num_faces=2,  # Detect up to 2 faces for multi-person detection
                min_face_detection_confidence=0.5,
                min_face_presence_confidence=0.5,
                min_tracking_confidence=0.5,
                output_face_blendshapes=False,
                output_facial_transformation_matrixes=False
            )
            
            # Create Face Landmarker
            self.face_landmarker = FaceLandmarker.create_from_options(landmarker_options)
            print("Face Landmarker initialized successfully")
            
        except Exception as exc:
            print(f"Error initializing MediaPipe Face Landmarker: {exc}")
            traceback.print_exc()
            self.enabled = False
        
        # Violation severity thresholds
        self.SEVERITY_THRESHOLDS = {
            'face_not_detected': 'high',
            'multiple_faces': 'critical',
            'eye_movement': 'high',
            'head_pose': 'high',
            'audio_detected': 'medium',
            'phone_detected': 'critical',
            'tab_switch': 'high',
            'fullscreen_exit': 'high',
            'copy_paste': 'medium'
        }
        
        # Integrity score penalties
        self.INTEGRITY_PENALTIES = {
            'low': 5,
            'medium': 10,
            'high': 20,
            'critical': 40
        }
        
        # Update AI models used for session tracking
        self.ai_models_used = ['face_landmarker']
    
    def create_proctoring_session(
        self,
        db: Session,
        attempt_id: int,
        user_id: int
    ) -> ProctoringSession:
        """Create a new proctoring session for an attempt."""
        
        if not self.enabled:
            raise RuntimeError("AI proctoring is disabled")

        # Verify attempt exists
        attempt = db.query(Attempt).filter(
            Attempt.id == attempt_id,
            Attempt.user_id == user_id
        ).first()
        
        if not attempt:
            raise ValueError("Attempt not found or access denied")
        
        # Check if session already exists
        existing = db.query(ProctoringSession).filter(
            ProctoringSession.attempt_id == attempt_id
        ).first()
        
        if existing:
            return existing
        
        session = ProctoringSession(
            attempt_id=attempt_id,
            user_id=user_id,
            status='active',
            integrity_score=100.0,
            ai_models_used=self.ai_models_used
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return session
    
    def detect_faces(
        self,
        frame: np.ndarray
    ) -> Dict:
        """Detect faces in frame and return face count and landmarks using MediaPipe Tasks API."""
        
        try:
            if not self.enabled or self.face_landmarker is None:
                return {
                    'faces_detected': 0,
                    'face_landmarks': [],
                    'alerts': ['AI proctoring not enabled or model not loaded']
                }
            
            # Convert BGR to RGB for MediaPipe
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Create MediaPipe Image using the Tasks API
            mp_image = mp_tasks.vision.Image(image_format=mp_tasks.vision.ImageFormat.SRGB, data=rgb_frame.tobytes())
            mp_image.width = rgb_frame.shape[1]
            mp_image.height = rgb_frame.shape[0]
            
            # Detect face landmarks
            detection_result = self.face_landmarker.detect(mp_image)
            
            faces_detected = len(detection_result.face_landmarks) if detection_result.face_landmarks else 0
            face_landmarks = detection_result.face_landmarks if detection_result.face_landmarks else []
            
            return {
                'faces_detected': faces_detected,
                'face_landmarks': face_landmarks,
                'alerts': []
            }
        except Exception as e:
            print(f"Error in detect_faces: {e}")
            traceback.print_exc()
            return {
                'faces_detected': 0,
                'face_landmarks': [],
                'alerts': [f'Face detection error: {str(e)}']
            }
    
    def analyze_head_pose(
        self,
        face_landmarks
    ) -> Dict:
        """Analyze head pose direction from face landmarks using geometric heuristics."""
        
        try:
            if not face_landmarks or len(face_landmarks) == 0:
                return {
                    'head_pose': 'unknown',
                    'confidence': 0.0,
                    'alerts': ['No face landmarks available']
                }
            
            # Use the first detected face
            landmarks = face_landmarks[0]
            
            # MediaPipe Face Mesh has 478 landmarks
            # Key landmarks for head pose estimation:
            # Nose tip: 1, Left eye outer: 33, Right eye outer: 263
            # Left cheek: 234, Right cheek: 454, Chin: 152, Forehead: 10
            
            if len(landmarks) < 454:
                return {
                    'head_pose': 'unknown',
                    'confidence': 0.0,
                    'alerts': ['Insufficient landmarks for head pose analysis']
                }
            
            nose = landmarks[1]
            left_eye_outer = landmarks[33]
            right_eye_outer = landmarks[263]
            left_cheek = landmarks[234]
            right_cheek = landmarks[454]
            chin = landmarks[152]
            forehead = landmarks[10]
            
            # Calculate horizontal gaze direction (yaw)
            # Compare nose position relative to eye centers
            eye_center_x = (left_eye_outer.x + right_eye_outer.x) / 2
            nose_offset_x = nose.x - eye_center_x
            
            # Calculate vertical gaze direction (pitch)
            # Compare nose position relative to face center
            face_center_y = (forehead.y + chin.y) / 2
            nose_offset_y = nose.y - face_center_y
            
            # Thresholds for determining direction
            horizontal_threshold = 0.05
            vertical_threshold = 0.05
            
            head_pose = 'center'
            alerts = []
            
            # Determine horizontal direction
            if nose_offset_x > horizontal_threshold:
                head_pose = 'right'
                alerts.append('Looking away from screen (right)')
            elif nose_offset_x < -horizontal_threshold:
                head_pose = 'left'
                alerts.append('Looking away from screen (left)')
            
            # Determine vertical direction
            if nose_offset_y > vertical_threshold:
                if head_pose == 'center':
                    head_pose = 'down'
                else:
                    head_pose = f'{head_pose}--down'
                alerts.append('Looking away from screen (down)')
            elif nose_offset_y < -vertical_threshold:
                if head_pose == 'center':
                    head_pose = 'up'
                else:
                    head_pose = f'{head_pose}-up'
                alerts.append('Looking away from screen (up)')
            
            # Calculate confidence based on landmark visibility
            confidence = 0.9 if head_pose == 'center' else 0.7
            
            return {
                'head_pose': head_pose,
                'confidence': confidence,
                'alerts': alerts,
                'nose_offset_x': nose_offset_x,
                'nose_offset_y': nose_offset_y
            }
        except Exception as e:
            print(f"Error in analyze_head_pose: {e}")
            traceback.print_exc()
            return {
                'head_pose': 'unknown',
                'confidence': 0.0,
                'alerts': [f'Head pose analysis error: {str(e)}']
            }
    
    def log_violation(
        self,
        db: Session,
        attempt_id: int,
        user_id: int,
        violation_type: str,
        violation_data: Optional[Dict] = None,
        confidence_score: Optional[float] = None,
        question_id: Optional[int] = None,
        session_time_seconds: Optional[int] = None
    ) -> AIViolation:
        """Log an AI-detected violation."""
        
        severity = self.SEVERITY_THRESHOLDS.get(violation_type, 'medium')
        
        violation = AIViolation(
            attempt_id=attempt_id,
            user_id=user_id,
            violation_type=violation_type,
            severity=severity,
            confidence_score=confidence_score,
            violation_data=violation_data,
            question_id=question_id,
            session_time_seconds=session_time_seconds
        )
        
        db.add(violation)
        db.commit()
        db.refresh(violation)
        
        # Update proctoring session
        self._update_session_after_violation(
            db=db,
            attempt_id=attempt_id,
            violation_type=violation_type,
            severity=severity
        )
        
        return violation
    
    def _update_session_after_violation(
        self,
        db: Session,
        attempt_id: int,
        violation_type: str,
        severity: str
    ):
        """Update proctoring session after a violation."""
        
        session = db.query(ProctoringSession).filter(
            ProctoringSession.attempt_id == attempt_id
        ).first()
        
        if not session:
            return
        
        # Update counts
        session.violation_count += 1
        
        if severity == 'high':
            session.high_severity_count += 1
        elif severity == 'critical':
            session.critical_severity_count += 1
        
        # Update specific violation counters
        if violation_type == 'face_not_detected':
            session.face_not_detected_count += 1
        elif violation_type == 'multiple_faces':
            session.multiple_face_detected_count += 1
        elif violation_type == 'eye_movement':
            session.eye_movement_violations += 1
        elif violation_type == 'head_pose':
            session.head_pose_violations += 1
        elif violation_type == 'audio_detected':
            session.audio_violations += 1
        elif violation_type == 'tab_switch':
            session.tab_switch_count += 1
        elif violation_type == 'fullscreen_exit':
            session.fullscreen_exit_count += 1
        elif violation_type == 'copy_paste':
            session.copy_paste_count += 1
        elif violation_type == 'phone_detected':
            session.phone_detected_count += 1
        
        # Update integrity score
        penalty = self.INTEGRITY_PENALTIES.get(severity, 10)
        session.integrity_score = max(0, session.integrity_score - penalty)
        
        # Check if should be flagged
        if session.integrity_score < 50 or session.critical_severity_count >= 1:
            session.is_flagged = True
            session.flag_reason = f"Integrity score dropped to {session.integrity_score}%"
        
        # Check if should auto-submit
        if session.integrity_score < 30 or session.critical_severity_count >= 2:
            session.auto_submit_triggered = True
            session.status = 'terminated'
            session.ended_at = datetime.utcnow()
        
        db.commit()
    
    def process_frame(
        self,
        db: Session,
        attempt_id: int,
        user_id: int,
        frame: np.ndarray,
        frame_timestamp: float,
        session_time_seconds: int
    ) -> Dict:
        """Process a single video frame for enterprise-grade proctoring violations."""
        
        if not self.enabled:
            return {
                'faces_detected': 0,
                'head_pose': 'unknown',
                'alerts': ['AI proctoring not enabled'],
                'violations_detected': 0,
                'violations': []
            }
        
        # Detect faces
        face_data = self.detect_faces(frame)
        faces_detected = face_data['faces_detected']
        face_landmarks = face_data['face_landmarks']
        alerts = face_data['alerts']
        violations = []
        
        # Get existing session to track violations
        session = db.query(ProctoringSession).filter(
            ProctoringSession.attempt_id == attempt_id
        ).first()
        
        # Track head turn count in session metadata
        head_turn_count = 0
        if session and session.session_metadata:
            try:
                head_turn_count = session.session_metadata.get('head_turn_count', 0)
            except:
                pass
        
        # Track no-face duration
        no_face_duration = 0
        if session and session.session_metadata:
            try:
                no_face_duration = session.session_metadata.get('no_face_duration_seconds', 0)
            except:
                pass
        
        # Check for no face (camera range violation - 2 seconds threshold)
        if faces_detected == 0:
            no_face_duration += 1  # Increment by 1 second (frames sent every second)
            alerts.append('No face detected')
            
            if no_face_duration >= 2:  # 2 seconds threshold
                violations.append({
                    'type': 'face_not_detected',
                    'severity': 'high',
                    'data': {
                        'faces_detected': 0,
                        'duration_seconds': no_face_duration
                    }
                })
        else:
            # Reset no-face duration when face is detected
            no_face_duration = 0
            
            # Check for multiple faces (critical violation)
            if faces_detected > 1:
                alerts.append(f'Multiple faces detected ({faces_detected} people)')
                violations.append({
                    'type': 'multiple_faces',
                    'severity': 'critical',
                    'data': {'faces_detected': faces_detected}
                })
        
        # Analyze head pose if face detected
        if faces_detected == 1 and face_landmarks:
            head_data = self.analyze_head_pose(face_landmarks)
            head_pose = head_data['head_pose']
            alerts.extend(head_data['alerts'])
            
            # Strict head turn detection - max 2 turns allowed
            if head_pose != 'center':
                head_turn_count += 1
                alerts.append(f'Head turned {head_pose} (Turn #{head_turn_count})')
                
                if head_turn_count > 2:  # More than 2 turns = violation
                    violations.append({
                        'type': 'head_pose',
                        'severity': 'high',
                        'data': {
                            'head_pose': head_pose,
                            'confidence': head_data['confidence'],
                            'turn_count': head_turn_count
                        }
                    })
        
        # Update session metadata with tracking data
        if session:
            if session.session_metadata is None:
                session.session_metadata = {}
            # Ensure metadata is a dict
            if not isinstance(session.session_metadata, dict):
                session.session_metadata = {}
            session.session_metadata['head_turn_count'] = head_turn_count
            session.session_metadata['no_face_duration_seconds'] = no_face_duration
            db.commit()
        
        # Log violations to database
        for violation in violations:
            self.log_violation(
                db=db,
                attempt_id=attempt_id,
                user_id=user_id,
                violation_type=violation['type'],
                violation_data=violation['data'],
                confidence_score=0.8,
                session_time_seconds=session_time_seconds
            )
        
        return {
            'faces_detected': faces_detected,
            'head_pose': head_pose if faces_detected == 1 and face_landmarks else 'unknown',
            'alerts': alerts,
            'violations_detected': len(violations),
            'violations': violations,
            'head_turn_count': head_turn_count,
            'no_face_duration': no_face_duration
        }
    
    def log_environment_violation(
        self,
        db: Session,
        attempt_id: int,
        user_id: int,
        violation_type: str,
        session_time_seconds: int
    ) -> AIViolation:
        """Log environment-based violations (tab switch, copy-paste, etc.)."""
        
        return self.log_violation(
            db=db,
            attempt_id=attempt_id,
            user_id=user_id,
            violation_type=violation_type,
            confidence_score=1.0,  # Environment events are certain
            session_time_seconds=session_time_seconds
        )
    
    def end_proctoring_session(
        self,
        db: Session,
        attempt_id: int
    ) -> ProctoringSession:
        """End a proctoring session and finalize integrity score."""
        
        session = db.query(ProctoringSession).filter(
            ProctoringSession.attempt_id == attempt_id
        ).first()
        
        if not session:
            raise ValueError("Proctoring session not found")
        
        session.status = 'completed'
        session.ended_at = datetime.utcnow()
        
        db.commit()
        db.refresh(session)
        
        return session
    
    def get_session_violations(
        self,
        db: Session,
        attempt_id: int
    ) -> List[AIViolation]:
        """Get all violations for a proctoring session."""
        
        return db.query(AIViolation).filter(
            AIViolation.attempt_id == attempt_id
        ).order_by(AIViolation.detection_timestamp.asc()).all()


# Global service instance
ai_proctoring_service = AIProctoringService()
