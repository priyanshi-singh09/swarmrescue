import time


class EventTracker:
    def __init__(self):
        # Dictionary to store all active events
        self.active_events = {}

        # Counter used to generate unique event IDs
        self.next_event_id = 1

    def find_existing_event(self, payload):
        """
        Check whether a similar event already exists nearby.
        Returns the existing event ID if found,
        otherwise returns None.
        """

        for event_id, event in self.active_events.items():

            # Skip if the event type is different
            if event["type"] != payload["detected"]:
                continue

            # Calculate distance between old and new location
            dx = abs(event["x"] - payload["x"])
            dy = abs(event["y"] - payload["y"])

            # If both coordinates are within 2 cells,
            # consider it the same event
            if dx <= 2 and dy <= 2:
                return event_id

        return None

    def cleanup_old_events(self, timeout=10):
        """
        Remove events that have not been updated
        within the timeout period.
        """

        current_time = time.time()

        expired_events = []

        for event_id, event in self.active_events.items():
            if current_time - event["last_seen"] > timeout:
                expired_events.append(event_id)

        for event_id in expired_events:
            del self.active_events[event_id]

    def update(self, payload):
        """
        Process incoming drone data and update
        the event tracker.
        """

        # Remove expired events
        self.cleanup_old_events()

        # Ignore clear detections
        if payload["detected"] == "clear":
            return payload

        # Check if event already exists
        event_id = self.find_existing_event(payload)

        if event_id is not None:

            # Update existing event
            event = self.active_events[event_id]

            event["x"] = payload["x"]
            event["y"] = payload["y"]
            event["confidence"] = payload["confidence"]
            event["drone_id"] = payload["drone_id"]
            event["last_seen"] = time.time()

            # Save movement history
            event["path"].append(
                (
                    payload["x"],
                    payload["y"]
                )
            )

            # Attach existing event ID
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
                "last_seen": time.time(),

                # Store movement history
                "path": [
                    (
                        payload["x"],
                        payload["y"]
                    )
                ]
            }

            # Save event
            self.active_events[self.next_event_id] = event

            # Attach new event ID
            payload["event_id"] = self.next_event_id

            # Prepare next ID
            self.next_event_id += 1

        return payload

    def get_active_events(self):
        """
        Return all active events.
        """

        return self.active_events

    def print_active_events(self):
        """
        Print all active events.
        Useful for debugging.
        """

        print("\n========== ACTIVE EVENTS ==========")

        if not self.active_events:
            print("No active events.")

        for event in self.active_events.values():
            print(
                f"ID: {event['event_id']} | "
                f"Type: {event['type']} | "
                f"Location: ({event['x']}, {event['y']}) | "
                f"Drone: {event['drone_id']} | "
                f"Confidence: {event['confidence']}"
            )

        print("===================================\n")