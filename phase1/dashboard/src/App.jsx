import { useEffect, useMemo, useRef, useState } from "react";

const GRID_SIZE = 20;
const WS_URL = "ws://localhost:8000/ws";

const detectionStyles = {
  clear: { label: "Clear", color: "#5eead4" },
  survivor: { label: "Survivor", color: "#facc15" },
  fire: { label: "Fire", color: "#fb7185" },
  blocked_path: { label: "Blocked", color: "#a78bfa" },
  unstable_wall: { label: "Unstable", color: "#f97316" },
};

function useSwarmSocket() {
  const [connected, setConnected] = useState(false);
  const [drones, setDrones] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      setDrones(data.drones ?? []);
      setEvents(data.events ?? []);
    };

    return () => socket.close();
  }, []);

  return { connected, drones, events };
}

function RescueMap({ drones }) {
  const cells = useMemo(
    () => Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => index),
    []
  );

  return (
    <div className="map-stage" aria-label="Rescue grid map">
      <div className="map-grid">
        {cells.map((cell) => {
          const x = cell % GRID_SIZE;
          const y = Math.floor(cell / GRID_SIZE);
          const dronesHere = drones.filter((drone) => drone.x === x && drone.y === y);
          const primaryDrone = dronesHere[0];
          const style = primaryDrone
            ? detectionStyles[primaryDrone.detected] ?? detectionStyles.clear
            : null;

          return (
            <div className="map-cell" key={cell}>
              {primaryDrone && (
                <span
                  className="drone-dot"
                  style={{ background: style.color }}
                  title={`${primaryDrone.drone_id}: ${style.label}`}
                >
                  {primaryDrone.drone_id.replace("drone_", "D")}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const { connected, drones, events } = useSwarmSocket();
  const latestSurvivor = useMemo(
    () => events.slice().reverse().find((event) => event.type === "survivor"),
    [events]
  );

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">SwarmRescue Phase 1</p>
          <h1>Autonomous Rescue Mapping Dashboard</h1>
        </div>
        <div className={`connection ${connected ? "online" : "offline"}`}>
          {connected ? "Backend online" : "Waiting for backend"}
        </div>
      </section>

      {latestSurvivor && (
        <section className="alert-strip">
          <strong>Survivor detected</strong>
          <span>
            {latestSurvivor.drone_id} at grid ({latestSurvivor.x}, {latestSurvivor.y}) with{" "}
            {Math.round(latestSurvivor.confidence * 100)}% confidence
          </span>
        </section>
      )}

      <section className="dashboard-grid">
        <RescueMap drones={drones} />

        <aside className="side-panel">
          <div className="panel-section">
            <h2>Drone Status</h2>
            <div className="drone-list">
              {drones.length === 0 && <p className="muted">Start the Python simulator to see drone movement.</p>}
              {drones.map((drone) => {
                const style = detectionStyles[drone.detected] ?? detectionStyles.clear;
                return (
                  <div className="drone-row" key={drone.drone_id}>
                    <span className="marker" style={{ background: style.color }} />
                    <div>
                      <strong>{drone.drone_id}</strong>
                      <p>
                        ({drone.x}, {drone.y}, {drone.z}) - {style.label} - battery {drone.battery}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel-section">
            <h2>Live Events</h2>
            <div className="event-log">
              {events.length === 0 && <p className="muted">No hazards or survivors detected yet.</p>}
              {events.slice().reverse().map((event, index) => {
                const style = detectionStyles[event.type] ?? detectionStyles.clear;
                return (
                  <div className="event-row" key={`${event.timestamp}-${index}`}>
                    <span className="marker" style={{ background: style.color }} />
                    <p>
                      <strong>{style.label}</strong> reported by {event.drone_id} at ({event.x}, {event.y})
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
