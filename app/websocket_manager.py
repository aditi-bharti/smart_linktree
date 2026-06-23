from fastapi import WebSocket
from typing import Dict, Set
import json


class ConnectionManager:
    """Manages WebSocket connections for real-time analytics updates"""
    
    def __init__(self):
        # Map profile_id to set of connected WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, profile_id: str):
        """Accept a new WebSocket connection for a profile"""
        await websocket.accept()
        if profile_id not in self.active_connections:
            self.active_connections[profile_id] = set()
        self.active_connections[profile_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, profile_id: str):
        """Remove a WebSocket connection"""
        if profile_id in self.active_connections:
            self.active_connections[profile_id].discard(websocket)
            if not self.active_connections[profile_id]:
                del self.active_connections[profile_id]
    
    async def broadcast_to_profile(self, profile_id: str, data: dict):
        """Send data to all connections watching a specific profile"""
        import json
        if profile_id in self.active_connections:
            dead_connections = set()
            for connection in self.active_connections[profile_id]:
                try:
                    await connection.send_text(json.dumps(data))
                except Exception:
                    dead_connections.add(connection)
            
            # Clean up dead connections
            for conn in dead_connections:
                self.active_connections[profile_id].discard(conn)


# Global instance
manager = ConnectionManager()
