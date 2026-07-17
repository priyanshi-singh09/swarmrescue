import time


class EventTracker:
    def __init__(self):
        self.active_events = {}
        self.next_event_id = 1

    def find_existing_event(self, payload):
        """
        Check if a similar event already exists nearby.
        """

        for event_id, event in self.active_events.items():

            # Skip if event type is different
            if event["type"] != payload["detected"]:
                continue

            dx = abs(event["x"] - payload["x"])
            dy = abs(event["y"] - payload["y"])

            # Same event if within 2 grid cells
            if dx <= 2 and dy <= 2:
                return event_id

        return None

    def update(self, payload):

        # Ignore clear detections
        if payload["detected"] == "clear":
            return payload

        # Check if this event already exists
        event_id = self.find_existing_event(payload)

        if event_id is not None:

            # Update existing event
            event = self.active_events[event_id]

            event["x"] = payload["x"]
            event["y"] = payload["y"]
            event["confidence"] = payload["confidence"]
            event["last_seen"] = time.time()

            payload["event_id"] = event_id

        else:

            # Create a new event
            event = {
                "event_id": self.next_event_id,
                "type": payload["detected"],
                "x": payload["x"],
                "y": payload["y"],
                "drone_id": payload["drone_id"],
                "confidence": payload["confidence"],
                "last_seen": time.time()
            }

            self.active_events[self.next_event_id] = event

            payload["event_id"] = self.next_event_id

            self.next_event_id += 1

        return payload