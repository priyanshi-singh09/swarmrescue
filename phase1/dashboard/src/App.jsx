import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

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
  const mountRef = useRef(null);
  const droneMeshesRef = useRef(new Map());
  const sceneRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#10151f");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(17, 24, 24);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight("#ffffff", 0.75);
    const directionalLight = new THREE.DirectionalLight("#ffffff", 1.2);
    directionalLight.position.set(4, 10, 8);
    scene.add(ambientLight, directionalLight);

    const grid = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, "#64748b", "#233044");
    scene.add(grid);

    const rubbleMaterial = new THREE.MeshStandardMaterial({ color: "#384152", roughness: 0.8 });
    for (let i = 0; i < 28; i += 1) {
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, randomBetween(0.25, 1.4), 0.6),
        rubbleMaterial
      );
      block.position.set(randomBetween(-9, 9), block.geometry.parameters.height / 2, randomBetween(-9, 9));
      scene.add(block);
    }

    function handleResize() {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }

    function animate() {
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    drones.forEach((drone) => {
      const existing = droneMeshesRef.current.get(drone.drone_id);
      const style = detectionStyles[drone.detected] ?? detectionStyles.clear;

      if (existing) {
        existing.material.color.set(style.color);
        existing.position.set(drone.x - GRID_SIZE / 2, drone.z + 0.45, drone.y - GRID_SIZE / 2);
        return;
      }

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 24, 24),
        new THREE.MeshStandardMaterial({ color: style.color, emissive: style.color, emissiveIntensity: 0.25 })
      );
      mesh.position.set(drone.x - GRID_SIZE / 2, drone.z + 0.45, drone.y - GRID_SIZE / 2);
      scene.add(mesh);
      droneMeshesRef.current.set(drone.drone_id, mesh);
    });
  }, [drones]);

  return <div className="map-stage" ref={mountRef} />;
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
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
