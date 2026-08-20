"""
WebSocket route for real-time features.
Handles presence updates, live collaboration, and real-time notifications.
"""
import json
import logging
from typing import Dict, Set, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from backend.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws")


class ConnectionManager:
    """Manages WebSocket connections and presence tracking."""
    
    def __init__(self):
        # Store active connections: {user_id: WebSocket}
        self.active_connections: Dict[int, WebSocket] = {}
        # Store presence data: {user_id: {name, color, last_seen}}
        self.presence_data: Dict[int, dict] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int, user_data: dict = None):
        """Accept a WebSocket connection and track presence."""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        
        if user_data:
            self.presence_data[user_id] = {
                **user_data,
                'last_seen': None  # Will be updated on messages
            }
        
        logger.info(f"WebSocket connected for user {user_id}")
        
        # Broadcast presence update to all connected clients
        await self.broadcast_presence_update(user_id, user_data)
    
    def disconnect(self, user_id: int):
        """Remove a WebSocket connection and broadcast leave event."""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        
        if user_id in self.presence_data:
            del self.presence_data[user_id]
        
        logger.info(f"WebSocket disconnected for user {user_id}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Send a message to a specific user."""
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to user {user_id}: {e}")
                self.disconnect(user_id)
    
    async def broadcast(self, message: dict, exclude_user_id: int = None):
        """Broadcast a message to all connected clients."""
        disconnected_users = []
        
        for user_id, websocket in list(self.active_connections.items()):
            if exclude_user_id and user_id == exclude_user_id:
                continue
            
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to broadcast to user {user_id}: {e}")
                disconnected_users.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected_users:
            self.disconnect(user_id)
    
    async def broadcast_presence_update(self, user_id: int, user_data: dict = None):
        """Broadcast presence update to all connected clients."""
        presence = user_data or self.presence_data.get(user_id, {})
        
        message = {
            'type': 'presence_update',
            'data': presence,
            'sender': str(user_id),
            'timestamp': None  # Will be set by client
        }
        
        await self.broadcast(message, exclude_user_id=user_id)
    
    async def broadcast_presence_leave(self, user_id: int):
        """Broadcast presence leave event to all connected clients."""
        message = {
            'type': 'presence_leave',
            'data': {},
            'sender': str(user_id),
            'timestamp': None
        }
        
        await self.broadcast(message)
    
    def get_active_users(self) -> list:
        """Get list of active user IDs."""
        return list(self.active_connections.keys())
    
    def get_presence_data(self) -> dict:
        """Get all presence data."""
        return self.presence_data


# Global connection manager instance
manager = ConnectionManager()


@router.websocket("/")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    """
    WebSocket endpoint for real-time communication.
    
    Supports:
    - Presence updates (presence_update)
    - Custom event subscriptions
    - Broadcast messaging
    
    Authentication: Optional token query parameter for authenticated users.
    Without token, connects as a guest user.
    """
    from backend.database import get_db
    from backend.utils.auth_utils import verify_token
    from sqlalchemy.orm import Session
    
    user_id = None
    user_data = None
    
    # Try to authenticate with token if provided
    if token:
        try:
            db_gen = get_db()
            db = next(db_gen)
            try:
                payload = verify_token(token)
                if payload:
                    user_id = payload.get('sub')
                    if user_id:
                        user = db.query(User).filter(User.id == user_id).first()
                        if user:
                            user_data = {
                                'name': user.full_name or user.email,
                                'color': _generate_user_color(user.id)
                            }
            finally:
                db.close()
        except Exception as e:
            logger.warning(f"Token validation failed: {e}")
    
    # If no authenticated user, generate a temporary ID
    if not user_id:
        import random
        user_id = random.randint(1000000, 9999990)
        user_data = {
            'name': f'Guest_{user_id}',
            'color': _generate_user_color(user_id)
        }
    
    try:
        await manager.connect(websocket, user_id, user_data)
        
        # Send current presence list to the newly connected client
        await websocket.send_json({
            'type': 'presence_list',
            'data': manager.get_presence_data(),
            'timestamp': None
        })
        
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            message_type = data.get('type')
            message_data = data.get('data', {})
            
            # Update last_seen for presence
            if user_id in manager.presence_data:
                manager.presence_data[user_id]['last_seen'] = None
            
            # Handle different message types
            if message_type == 'presence_update':
                # Update presence data
                if user_id in manager.presence_data:
                    manager.presence_data[user_id].update(message_data)
                
                # Broadcast to other clients
                await manager.broadcast_presence_update(user_id, manager.presence_data.get(user_id))
            
            elif message_type == 'broadcast':
                # Broadcast custom message to all clients
                await manager.broadcast({
                    'type': message_data.get('event_type', 'custom'),
                    'data': message_data.get('payload', {}),
                    'sender': str(user_id),
                    'timestamp': None
                }, exclude_user_id=user_id)
            
            elif message_type == 'direct_message':
                # Send message to specific user
                target_user_id = message_data.get('target_user_id')
                if target_user_id:
                    await manager.send_personal_message({
                        'type': 'direct_message',
                        'data': message_data.get('payload', {}),
                        'sender': str(user_id),
                        'timestamp': None
                    }, target_user_id)
            
            else:
                # Echo back unknown message types
                await websocket.send_json({
                    'type': 'echo',
                    'data': data,
                    'timestamp': None
                })
    
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        await manager.broadcast_presence_leave(user_id)
    
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(user_id)
        await manager.broadcast_presence_leave(user_id)


def _generate_user_color(user_id: int) -> str:
    """Generate a consistent color for a user based on their ID."""
    colors = [
        '#EF4444', # red
        '#F59E0B', # amber
        '#10B981', # emerald
        '#3B82F6', # blue
        '#8B5CF6', # violet
        '#EC4899', # pink
        '#06B6D4', # cyan
        '#84CC16', # lime
    ]
    return colors[user_id % len(colors)]


@router.get("/active-users")
async def get_active_users():
    """Get list of currently connected users via WebSocket."""
    return {
        'active_users': manager.get_active_users(),
        'presence_data': manager.get_presence_data(),
        'count': len(manager.active_connections)
    }
