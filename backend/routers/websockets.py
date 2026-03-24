from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/ws",
    tags=["WebSockets"]
)

class ConnectionManager:
    def __init__(self):
        # Maps exam_id -> list of teacher websockets
        self.teacher_connections: Dict[int, List[WebSocket]] = {}
        # We can also store student connections if we need to send them commands (e.g. force submit)
        self.student_connections: Dict[int, List[WebSocket]] = {}

    async def connect_teacher(self, websocket: WebSocket, exam_id: int):
        await websocket.accept()
        if exam_id not in self.teacher_connections:
            self.teacher_connections[exam_id] = []
        self.teacher_connections[exam_id].append(websocket)
        logger.info(f"Teacher connected to exam room {exam_id}")

    def disconnect_teacher(self, websocket: WebSocket, exam_id: int):
        if exam_id in self.teacher_connections and websocket in self.teacher_connections[exam_id]:
            self.teacher_connections[exam_id].remove(websocket)

    async def connect_student(self, websocket: WebSocket, exam_id: int):
        await websocket.accept()
        if exam_id not in self.student_connections:
            self.student_connections[exam_id] = []
        self.student_connections[exam_id].append(websocket)

    def disconnect_student(self, websocket: WebSocket, exam_id: int):
        if exam_id in self.student_connections and websocket in self.student_connections[exam_id]:
            self.student_connections[exam_id].remove(websocket)

    async def broadcast_to_teachers(self, exam_id: int, message: dict):
        """Send an alert/event to all teachers watching this exam."""
        if exam_id in self.teacher_connections:
            for connection in self.teacher_connections[exam_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending WS msg to teacher: {e}")

manager = ConnectionManager()

@router.websocket("/exams/{exam_id}/teacher")
async def websocket_teacher(websocket: WebSocket, exam_id: int):
    # Note: In production, verify the teacher's JWT from headers or query params
    await manager.connect_teacher(websocket, exam_id)
    try:
        while True:
            # Keep connection alive, listen for any commands from teacher
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_teacher(websocket, exam_id)

@router.websocket("/exams/{exam_id}/student")
async def websocket_student(websocket: WebSocket, exam_id: int):
    # Note: Validate student JWT
    await manager.connect_student(websocket, exam_id)
    try:
        while True:
            data = await websocket.receive_json()
            # If student sends an anti-cheat event (e.g. blur, hidden)
            event_type = data.get("type")
            if event_type in ["blur", "focus", "submit", "join"]:
                # Broadcast this event to the teacher
                await manager.broadcast_to_teachers(exam_id, data)
    except WebSocketDisconnect:
        manager.disconnect_student(websocket, exam_id)
        # Notify teacher that student disconnected
        # await manager.broadcast_to_teachers(exam_id, {"type": "disconnect", "student_id": ...})
