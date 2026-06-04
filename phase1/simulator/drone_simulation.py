import json
import random
import time
from dataclasses import dataclass
from urllib.error import URLError
from urllib.request import Request, urlopen


BACKEND_URL = "http://localhost:8000/drone/update"
GRID_WIDTH = 20
GRID_HEIGHT = 20
DRONE_COUNT = 4


DETECTION_OPTIONS = [
    ("clear", 0.72),
    ("survivor", 0.08),
    ("fire", 0.07),
    ("blocked_path", 0.08),
    ("unstable_wall", 0.05),
]


@dataclass
class Drone:
    drone_id: str
    x: int
    y: int
    z: int
    battery: int = 100
    status: str = "scanning"

    def move(self) -> None:
        dx, dy = random.choice([(0, 1), (1, 0), (0, -1), (-1, 0), (1, 1), (-1, -1)])
        self.x = max(0, min(GRID_WIDTH - 1, self.x + dx))
        self.y = max(0, min(GRID_HEIGHT - 1, self.y + dy))
        self.z = random.choice([0, 1, 2])
        self.battery = max(0, self.battery - random.choice([0, 1]))
        self.status = "returning" if self.battery < 20 else "scanning"

    def scan(self) -> tuple[str, float]:
        labels = [item[0] for item in DETECTION_OPTIONS]
        weights = [item[1] for item in DETECTION_OPTIONS]
        detected = random.choices(labels, weights=weights, k=1)[0]
        confidence = random.uniform(0.55, 0.98) if detected != "clear" else random.uniform(0.8, 1.0)
        return detected, round(confidence, 2)

    def to_payload(self) -> dict:
        detected, confidence = self.scan()
        return {
            "drone_id": self.drone_id,
            "x": self.x,
            "y": self.y,
            "z": self.z,
            "battery": self.battery,
            "status": self.status,
            "detected": detected,
            "confidence": confidence,
        }


def send_update(payload: dict) -> None:
    body = json.dumps(payload).encode("utf-8")
    request = Request(
        BACKEND_URL,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=3) as response:
        response.read()


def create_drones() -> list[Drone]:
    return [
        Drone(
            drone_id=f"drone_{index + 1}",
            x=random.randint(0, GRID_WIDTH - 1),
            y=random.randint(0, GRID_HEIGHT - 1),
            z=random.randint(0, 2),
        )
        for index in range(DRONE_COUNT)
    ]


def main() -> None:
    drones = create_drones()
    print("SwarmRescue simulator started. Press Ctrl+C to stop.")

    while True:
        for drone in drones:
            drone.move()
            payload = drone.to_payload()

            try:
                send_update(payload)
                print(f"sent {payload}")
            except URLError:
                print("backend is not reachable. Start FastAPI on http://localhost:8000")
                time.sleep(3)

        time.sleep(1)


if __name__ == "__main__":
    main()
