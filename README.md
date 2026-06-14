# PushUp Tracker AI 🏋️‍♂️🤖

An advanced, private, real-time computer vision fitness tracking application that runs fully in the browser. Using **MediaPipe Pose** estimation, it counts push-ups automatically, provides real-time form coaching, tracks workout history, and visualizes calories and pace over time.

## 🚀 Key Features

1. **Automated AI Push-Up Counting**: Tracks elbow joint angle continuously using computer vision. Transition from DOWN ($< 85^\circ$) to UP ($> 155^\circ$) increments your rep tally reliably.
2. **Instant Form Coaching & Speech Feedback**: Speaks your rep count aloud and provides voice alerts like *"Go deeper"* or *"Keep your back straight"* in real time.
3. **Beautiful Bento-Grid Dashboard**: Displays real-time metrics, elapsed workout time, repetition pace (RPM), and calories based on height/weight MET parameters.
4. **Rich Analytics & Charts**: Interactive charts powered by Recharts showing strength progression and calories over time. Includes personal best streak tracking.
5. **CSV Workout Export**: Download your full historical workout data in CSV format for self-tracking.
6. **100% Client-Side Privacy**: Frame processing happens locally in the user's browser—no video frames or tracking data are ever transmitted to external servers.

---

## 🛠️ Technology Stack

- **Frontend Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Computer Vision**: MediaPipe Pose Estimation ML Solution (WASM-accelerated CDN client-side scripts)
- **Data Persistence**: HTML5 LocalStorage (fully preserved across scale-to-zero container schedules)
- **Charts**: Recharts & ResponsiveContainer
- **Audio Synthesis**: Web Speech API (`SpeechSynthesisUtterance`) & HTML5 Synth Oscillator Chimes

---

## 💻 Running the Application Locally

### Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

### Installation & Launch

1. Clone or extract the project bundle into a local directory.
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Boot the development server:
   ```bash
   npm run dev
   ```
4. Open the displayed URL `http://localhost:3000` in your browser. Be sure to grant **Camera permissions** when prompted!

---

## 📁 Project Structure

```text
/
├── src/
│   ├── components/
│   │   ├── HomeView.tsx        # Dashboard home, fitness configuration, guide cards
│   │   ├── WorkoutView.tsx     # LIVE camera feed, skeleton overlay, state-machine tracking
│   │   ├── HistoryView.tsx     # Lists of past workouts, expands warned reps, CSV download
│   │   ├── AnalyticsView.tsx   # Recharts area and bar displays of progress and calories
│   │   └── SettingsView.tsx    # Calorie profile editing & custom joint angle Calibration
│   ├── utils/
│   │   ├── loadScripts.ts      # Dynamic script loader for MediaPipe CDN WASM assets
│   │   ├── speech.ts           # Speech synthesis alerts and high-quality oscillator sounds
│   │   ├── storage.ts          # State storage helper with beautiful initial seeded analytics
│   │   └── calories.ts         # Metabolic MET-based formula adjusted for personal weights
│   ├── types.ts                # TypeScript definition contracts
│   ├── App.tsx                 # View Router and master application state
│   ├── main.tsx                # Client initialization entry point
│   └── index.css               # Global tailwind directive loading and font pairings
├── package.json                # Project dependencies and script runner configurations
└── metadata.json               # Lens and system authorization descriptors
```

---

## 📐 Math & Pose Heuristic Rules

### 1. Elbow Bend Angle Heuristics

The elbow angle is calculated using the dot product of the vectors from the elbow to the shoulder ($\vec{BA}$) and wrist ($\vec{BC}$):

$$\text{angle} = \arccos\left(\frac{\vec{BA} \cdot \vec{BC}}{|\vec{BA}| \times |\vec{BC}|}\right)$$

- **Descent state**: Triggered when the elbow angle drops below `minDownAngle` (Default: **$85^\circ$**).
- **Extension lockout state**: Completes rep when elbow angle extends back above `minUpAngle` (Default: **$155^\circ$**).

### 2. Torso Alignment Heuristic

Checks the angle formed by Shoulder, Hip, and Knee joints:
- If pelvic angle drops below **$140^\circ$**, the hips are sagging (*"Hips Sagging"* / *"Keep Back Straight"* warning).
- If pelvic angle increases above **$215^\circ$**, the hips are positioned too high (*"Hips too high"* warning).

---

## 🐳 Docker Deployment Instructions (Standalone Container)

To package and run the application as a standalone container:

### 1. Build the Docker Image
```bash
docker build -t pushup-tracker-ai .
```

### 2. Run the Container
```bash
docker run -d -p 3000:3000 --name pushup-coach pushup-tracker-ai
```
3. Visually load `http://localhost:3000` in the browser!
