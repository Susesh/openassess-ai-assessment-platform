export type ProctoringEventType =
  | "camera_disconnected"
  | "face_not_detected"
  | "multiple_faces_detected"
  | "tab_switch"
  | "browser_minimized"
  | "fullscreen_exit"
  | "copy_paste_attempt"
  | "right_click_attempt"
  | "devtools_attempt";

export type ProctoringSeverity = "info" | "warning" | "critical";

export type FaceCheckResult = {
  faceVisible: boolean;
  singleFace: boolean;
};

export type ProctoringStartResult = {
  ok: boolean;
  message?: string;
};

export type ProctoringEventPayload = {
  type: ProctoringEventType;
  description: string;
  severity?: ProctoringSeverity;
};
