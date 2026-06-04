
SwarmRescue: Autonomous Edge-AI Swarm Mapping for Post-Disaster Search & Rescue

•• *Working in Brief*
Imagine a major earthquake hits a city, collapsing a massive building and wiping out all internet and cellular networks. Instead of sending human rescuers into dangerous, unstable ruins, our project runs multiple python programs on a laptop to simulate a swarm of 3 or 4 small, cheap micro-drones flying inside the rubble. Because there is no internet, the drones talk directly to each other like walkie-talkies. Each drone uses a lightweight AI camera model (YOLO) to scan its surroundings for dangers (like fires) and signs of life (like human body heat). A specialized Graph Machine Learning model then takes these separate, messy camera views and instantly pieces them together—like a live 3D jigsaw puzzle—to create a single, accurate 3D map of the broken building. This live map is streamed directly to a central React web dashboard at base camp, allowing rescue teams to safely watch the building structure update in real-time on their screens and get a major warning alert the exact millisecond the AI spots a trapped survivor.

•• *Tech Stack*
 • Machine Learning & Backend (Python): PyTorch (for building the AI graph map), OpenCV / YOLO (for detecting people/objects in the video feed), and FastAPI (to handle drone-to-drone communication).
 • Frontend Dashboard: React.js with Three.js (for rendering the interactive 3D map on the screen), Tailwind CSS (for clean styling), and WebSockets (for lag-free, instant map updates).
  • Simulation Layer: Python multi-threading (to run all 3 to 4 independent drone scripts simultaneously on a single computer).
