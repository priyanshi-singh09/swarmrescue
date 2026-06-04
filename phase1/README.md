# SwarmRescue Phase 1: Software Simulation Prototype

This folder contains the first working version of SwarmRescue. It uses simulated drone agents instead of real hardware.

## What This Prototype Does

- Runs 3 to 4 virtual drones in Python.
- Moves each drone around a disaster-area grid.
- Generates fake detections such as survivor, fire, blocked path, and clear area.
- Sends drone updates to a FastAPI backend.
- Streams live updates to a React dashboard using WebSockets.
- Shows a simple 3D-style rescue map with drone and alert markers.

## Project Flow

```text
Python Drone Simulator
        |
        v
FastAPI Backend
        |
        v
WebSocket Stream
        |
        v
React Dashboard
```

## Folder Structure

```text
phase1/
  backend/
    main.py
    requirements.txt
  simulator/
    drone_simulation.py
  dashboard/
    package.json
    index.html
    src/
      App.jsx
      main.jsx
      styles.css
```

## Run The Backend

Open a terminal in `phase1/backend`:

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend URL:

```text
http://localhost:8000
```

## Run The Drone Simulator

Open another terminal in `phase1/simulator`:

```bash
python drone_simulation.py
```

This sends simulated drone updates to the backend every second.

## Run The Dashboard

Open another terminal in `phase1/dashboard`:

```bash
npm install
npm run dev
```

Dashboard URL:

```text
http://localhost:5173
```

## Beginner Goal For The First Demo

Your first successful demo should show:

- Multiple drones moving on the dashboard.
- Survivor/fire alerts appearing in real time.
- Event log updating when detections happen.

After this works, your team can add YOLO/video input, graph-based map fusion, and hardware camera input.
