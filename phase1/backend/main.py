from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


app = FastAPI(title="SwarmRescue Phase 1 Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DroneUpdate(BaseModel):
    drone_id: str
    x: int = Field(ge=0)
    y: int = Field(ge=0)
    z: int = Field(default=0, ge=0)
    battery: int = Field(ge=0, le=100)
    status: str
    detected: str
    confidence: float = Field(ge=0, le=1)


clients: set[WebSocket] = set()
latest_state: dict[str, dict[str, Any]] = {}
event_log: list[dict[str, Any]] = []


def build_payload(update: DroneUpdate) -> dict[str, Any]:
    timestamp = datetime.now(timezone.utc).isoformat()
    payload = update.model_dump()
    payload["timestamp"] = timestamp
    return payload


async def broadcast(message: dict[str, Any]) -> None:
    disconnected: list[WebSocket] = []
    for client in clients:
        try:
            await client.send_json(message)
        except RuntimeError:
            disconnected.append(client)

    for client in disconnected:
        clients.discard(client)


@app.get("/")
def health_check() -> dict[str, str]:
    return {"status": "online", "service": "SwarmRescue Phase 1 Backend"}


@app.get("/state")
def get_state() -> dict[str, Any]:
    return {
        "drones": list(latest_state.values()),
        "events": event_log[-30:],
    }


@app.post("/drone/update")
async def receive_drone_update(update: DroneUpdate) -> dict[str, str]:
    payload = build_payload(update)
    latest_state[update.drone_id] = payload

    if update.detected != "clear":
        event_log.append(
            {
                "type": update.detected,
                "drone_id": update.drone_id,
                "x": update.x,
                "y": update.y,
                "z": update.z,
                "confidence": update.confidence,
                "timestamp": payload["timestamp"],
            }
        )

    await broadcast(
        {
            "type": "drone_update",
            "drones": list(latest_state.values()),
            "events": event_log[-30:],
        }
    )
    return {"status": "received"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    clients.add(websocket)

    await websocket.send_json(
        {
            "type": "initial_state",
            "drones": list(latest_state.values()),
            "events": event_log[-30:],
        }
    )

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        clients.discard(websocket)
