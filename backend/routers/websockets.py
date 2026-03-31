from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Dict, List
from jose import JWTError, jwt
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["WebSockets"])


class ConnectionManager:
    def __init__(self):
        # Maps exam_id -> list of teacher websockets
        self.teacher_connections: Dict[int, List[WebSocket]] = {}
        # We can also store student connections if we need to send them commands (e.g. force submit)
        self.student_connections: Dict[int, List[WebSocket]] = {}
        # Global teacher monitoring connections (dashboard-level)
        self.global_teacher_connections: List[WebSocket] = []

    async def connect_teacher(self, websocket: WebSocket, exam_id: int):
        await websocket.accept()
        if exam_id not in self.teacher_connections:
            self.teacher_connections[exam_id] = []
        self.teacher_connections[exam_id].append(websocket)
        logger.info(f"Teacher connected to exam room {exam_id}")

    def disconnect_teacher(self, websocket: WebSocket, exam_id: int):
        if (
            exam_id in self.teacher_connections
            and websocket in self.teacher_connections[exam_id]
        ):
            self.teacher_connections[exam_id].remove(websocket)

    async def connect_global_teacher(self, websocket: WebSocket):
        await websocket.accept()
        self.global_teacher_connections.append(websocket)
        logger.info("Teacher connected to global monitoring")

    def disconnect_global_teacher(self, websocket: WebSocket):
        if websocket in self.global_teacher_connections:
            self.global_teacher_connections.remove(websocket)

    async def connect_student(self, websocket: WebSocket, exam_id: int):
        await websocket.accept()
        if exam_id not in self.student_connections:
            self.student_connections[exam_id] = []
        self.student_connections[exam_id].append(websocket)

    def disconnect_student(self, websocket: WebSocket, exam_id: int):
        if (
            exam_id in self.student_connections
            and websocket in self.student_connections[exam_id]
        ):
            self.student_connections[exam_id].remove(websocket)

    async def broadcast_to_teachers(self, exam_id: int, message: dict):
        """Send an alert/event to all teachers watching this exam."""
        if exam_id in self.teacher_connections:
            for connection in self.teacher_connections[exam_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending WS msg to teacher: {e}")
        # Also broadcast to global dashboard listeners
        for connection in self.global_teacher_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending WS msg to global teacher: {e}")


manager = ConnectionManager()


@router.websocket("/exams/{exam_id}/teacher")
async def websocket_teacher(
    websocket: WebSocket, exam_id: int, token: str = Query(default=None)
):
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    try:
        from config import settings

        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        role = payload.get("role", "")
        if role not in ("teacher", "admin"):
            await websocket.close(code=4003, reason="Insufficient permissions")
            return
    except JWTError:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await manager.connect_teacher(websocket, exam_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_teacher(websocket, exam_id)


@router.websocket("/anti-cheat/global")
async def websocket_global_teacher(
    websocket: WebSocket, token: str = Query(default=None)
):
    """
    Global anti-cheat monitoring for Teacher Dashboard.
    Authenticates via ?token=<JWT> query parameter.
    Receives broadcast events from ALL active exams.
    """
    # Validate JWT token
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    try:
        from config import settings

        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        role = payload.get("role", "")
        if role not in ("teacher", "admin"):
            await websocket.close(code=4003, reason="Insufficient permissions")
            return
    except JWTError:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await manager.connect_global_teacher(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_global_teacher(websocket)


@router.websocket("/exams/{exam_id}/student")
async def websocket_student(
    websocket: WebSocket, exam_id: int, token: str = Query(default=None)
):
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    try:
        from config import settings

        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        role = payload.get("role", "")
        if role != "student":
            await websocket.close(code=4003, reason="Insufficient permissions")
            return
    except JWTError:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await manager.connect_student(websocket, exam_id)
    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type")
            if event_type in ["blur", "focus", "submit", "join"]:
                await manager.broadcast_to_teachers(exam_id, data)
    except WebSocketDisconnect:
        manager.disconnect_student(websocket, exam_id)
