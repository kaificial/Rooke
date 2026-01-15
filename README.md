# ♔ Rooke

Rooke is a 3D chess app for beginners looking to improve their chess skills but it also focuses on the **visual transparency of machines**. 
While traditional chess engines just output a move without any explanation, Rooke lets you to see the AI's internal deliberation in real time. 

Built with **TypeScript**, **Three.js**, and **GSAP**

---

## Getting Started

Follow these steps to set up Rooke locally:

### Installation
1. **Clone the repo:**
   ```bash
   git clone https://github.com/kaificial/Rooke.git
   cd Rooke
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
---

## Gameplay Guides

### 1. Game Modes
- **Sandbox Game Mode**: Explore the 3D environment and move pieces to test the mechanics or play against friends irl.
- **VS AI**: Challenge the Rooke Engine. This mode activates the full "thought process" visualization (which can be toggled on or off)

### 2. Nav controls
The 3D scene uses `OrbitControls` for a fluid perspectives:
- **Rotate**: Left click and drag.
- **Zoom**: Scroll wheel/mouse pad.
- **Pan**: Right click and drag.
---

## Tech Stack

- **Core**: TypeScript
- **3D Graphics**: Three.js 
- **Animations**: GSAP 
- **Styling**: Tailwind CSS & PostCSS

---

## File Structure

```text
├── src/
│   ├── main.ts            # Entry point & 3D Scene orchestration
│   ├── chess-ai.worker.ts # The AI Engine (Minimax/Alpha-Beta)
│   ├── style.css          # Global styles & Tailwind 
│   └── ...                # Assets and helper modules
├── public/                # Static assets & cinematics
├── index.html             # App container
├── package.json           # Dependencies & Scripts
└── tsconfig.json          # TypeScript config
```

---
Kai Kim, 2026
