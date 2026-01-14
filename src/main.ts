import './style.css'
import * as THREE from 'three'
import gsap from 'gsap'


import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'


// UI overlay
const style = document.createElement('style')
style.textContent = `
  #ui-sidebar {
    position: absolute;
    top: 50%;
    left: 20px;
    transform: translateY(-50%);
    width: 250px;
    background: rgba(10, 10, 10, 0.95);
    border: 1px solid #333;
    border-radius: 4px;
    padding: 20px;
    color: #eee;
    font-family: 'Inter', sans-serif;
    display: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    z-index: 1000;
  }
  #ui-sidebar h2 {
    margin: 0 0 5px 0;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  #ui-sidebar .status {
    font-size: 10px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 20px;
    border-bottom: 1px solid #333;
    padding-bottom: 15px;
  }
  #move-history {
    margin-top: 15px;
    font-size: 13px;
    max-height: 150px;
    overflow-y: auto;
    border-top: 1px solid #333;
    padding-top: 10px;
  }
  #move-history table { width: 100%; border-collapse: collapse; }
  #move-history th { text-align: left; color: #666; font-size: 11px; padding: 2px 4px; }
  #move-history td { padding: 2px 4px; color: #ddd; }
  #move-history tr:nth-child(even) { background: rgba(255,255,255,0.03); }
  .promotion-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .promotion-btn {
    background: #1a1a1a;
    border: 1px solid #444;
    color: #ccc;
    padding: 10px;
    text-align: center;
    cursor: pointer;
    border-radius: 4px;
    font-size: 12px;
    text-transform: uppercase;
    transition: all 0.2s;
  }
  .promotion-btn:hover {
    background: #333;
    border-color: #666;
    color: #fff;
  }
`
document.head.appendChild(style)

// UI sidebar
const sidebar = document.createElement('div')
sidebar.id = 'ui-sidebar'
sidebar.innerHTML = `
  <h2>Match Details</h2>
  <div style="margin-bottom: 15px; display: flex; gap: 10px;">
    <button id="start-game-btn" style="flex: 1; padding: 10px; background:#222; border:1px solid #444; color:#fff; font-family:'Inter'; text-transform:uppercase; font-size:11px; letter-spacing:1px; font-weight:600; cursor:pointer; transition:background 0.2s;">Start</button>
    <button id="exit-game-btn" style="flex: 1; padding: 10px; background:transparent; border:1px solid #444; color:#888; font-family:'Inter'; text-transform:uppercase; font-size:11px; letter-spacing:1px; font-weight:600; cursor:pointer; transition:all 0.2s;">Exit</button>
  </div>
  <div class="status" id="game-status">White's Turn</div>
  <div id="move-history">
    <table>
      <thead><tr><th>#</th><th>W</th><th>B</th></tr></thead>
      <tbody id="move-list"></tbody>
    </table>
  </div>
  <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #333;">
     <button id="toggle-viz-btn" style="width: 100%; padding: 8px; background: transparent; border: 1px solid #ccb066; color: #ccb066; font-family: 'Inter'; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: all 0.2s;">Hide AI Thoughts</button>
  </div>


  </div>

  <div id="promotion-area" style="display:none">

    <div style="font-size: 12px; margin-bottom: 10px; color:#aaa;">Pawn Promotion</div>
    <div class="promotion-options">
      <div class="promotion-btn" data-type="queen">Queen</div>
      <div class="promotion-btn" data-type="rook">Rook</div>
      <div class="promotion-btn" data-type="bishop">Bishop</div>
      <div class="promotion-btn" data-type="knight">Knight</div>
    </div>
  </div>
  <div style="margin-top: 15px; text-align: center;">

  </div>
`
document.body.appendChild(sidebar)

// Top Timer & HTML
const timerStyle = document.createElement('style')
timerStyle.textContent = `
  #top-timer-display {
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    z-index: 900; pointer-events: none;
  }
  .timer-container {
    background: rgba(10, 10, 10, 0.8);
    border: 1px solid #444;
    border-radius: 4px;
    padding: 10px 40px;
    display: flex; align-items: center; gap: 30px;
    backdrop-filter: blur(10px);
  }
  .timer-side { text-align: center; }
  .timer-label {
    font-family: 'Inter', sans-serif;
    font-size: 9px; color: #666; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 2px;
  }
  .timer-value {
    font-family: 'Playfair Display', serif;
    font-size: 28px; color: #555; font-variant-numeric: tabular-nums;
  }
  .timer-value.active { color: #ccb066; text-shadow: 0 0 10px rgba(204, 176, 102, 0.3); }
  .timer-divider { font-family: 'Playfair Display', serif; font-size: 20px; color: #444; margin-top: 10px; }
`
document.head.appendChild(timerStyle)

const timerDisplay = document.createElement('div')
timerDisplay.id = 'top-timer-display'
timerDisplay.innerHTML = `
  <div class="timer-container">
    <div class="timer-side">
      <div class="timer-label">WHITE</div>
      <div id="top-white-timer" class="timer-value">10:00</div>
    </div>
    <div class="timer-divider">:</div>
    <div class="timer-side">
      <div class="timer-label">BLACK</div>
      <div id="top-black-timer" class="timer-value">10:00</div>
    </div>
  </div>
`
document.body.appendChild(timerDisplay)


// AI narrating log UI
const logStyle = document.createElement('style')
logStyle.textContent = `
  #ai-log {
     position: fixed; right: 20px; top: 100px; width: 300px; max-height: 400px;
     background: rgba(15, 15, 20, 0.95); border: 1px solid #444; border-left: 3px solid #ccb066;
     font-family: 'Inter', sans-serif; font-size: 11px; color: #aaa;
     padding: 20px; overflow-y: auto; pointer-events: auto;
     display: none; z-index: 1000;
     border-radius: 0 4px 4px 0;
     box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  }
  .log-header { font-size: 10px; color: #ccb066; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 15px; font-weight: 700; border-bottom: 1px solid #333; padding-bottom: 5px; }
  .log-entry { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #222; line-height: 1.5; }
  .log-entry:last-child { border-bottom: none; }
  .log-action { color: #fff; font-weight: 600; }
  .log-good { color: #6fc; }
  .log-bad { color: #f66; }
  .log-info { color: #aaa; }
`
document.head.appendChild(logStyle)

const aiLog = document.createElement('div')
aiLog.id = 'ai-log'
aiLog.innerHTML = `
  <div class="log-header">
     AI Thought Process
     <div style="font-size:8px; color:#666; font-weight:400; text-transform:none; margin-top:2px;">
       (+ White Adv | - Black Adv)
     </div>
  </div>
`
document.body.appendChild(aiLog)

function addAiLog(msg: string, type = 'info') {
  const el = document.getElementById('ai-log')
  if (!el) return
  el.style.display = 'block'

  const entry = document.createElement('div')
  entry.className = 'log-entry'

  let colorClass = 'log-info'
  if (type === 'good') colorClass = 'log-good'
  if (type === 'bad') colorClass = 'log-bad'
  if (type === 'action') colorClass = 'log-action'

  entry.innerHTML = `<span class="${colorClass}">${msg}</span>`
  el.appendChild(entry)
  el.scrollTop = el.scrollHeight

  // Keep log length manageable but allow scrolling
  if (el.children.length > 100) {
    el.removeChild(el.children[1]) // Keep header
  }
}






// Mat Discplay
const materialStyle = document.createElement('style')
materialStyle.textContent = `
  #white-material, #black-material {
    position: fixed; top: 30px; z-index: 900;
    font-size: 24px; letter-spacing: 2px;
    display: flex; gap: 2px;
    pointer-events: none;
    font-family: "Segoe UI Symbol", "DejaVu Sans", sans-serif;
  }
  #white-material { left: 40px; color: #fff; text-shadow: 0 0 5px rgba(255,255,255,0.4); }
  #black-material { right: 40px; color: #666; text-shadow: 0 0 2px rgba(0,0,0,0.5); }
`
document.head.appendChild(materialStyle)

const whiteMat = document.createElement('div'); whiteMat.id = 'white-material';
const blackMat = document.createElement('div'); blackMat.id = 'black-material';
document.body.appendChild(whiteMat);
document.body.appendChild(blackMat);

// Exit Handler
document.getElementById('exit-game-btn')?.addEventListener('click', () => {
  window.location.reload()
})
// Landing Page Implementation
// Landing Page Implementation
const landingStyle = document.createElement('style')
landingStyle.textContent = `
  #landing-page {
    position: fixed; top: 0; left: 0; width: 100%; height: 100vh;
    z-index: 2000;
    display: flex;
    font-family: 'Inter', sans-serif;
  }
  
  #landing-page .sidebar-left {
    width: 80px;
    background: #000;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 15px 0;
    border-right: 1px solid #222;
  }
  .logo-box {
    font-size: 32px; color: #ccb066;
  }
  #landing-page .brand-vertical {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    color: #ccb066;
    font-weight: 800;
    letter-spacing: 6px;
    font-size: 14px;
    transform: rotate(180deg);
    margin-bottom: 60px;
  }

  #landing-page .main-content {
    flex: 1;
    padding: 0 120px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: radial-gradient(circle at 0% 50%, #151515 0%, #080808 100%);
    position: relative;
  }
  
  #landing-page nav {
    position: absolute; top: 0; left: 0; width: 100%;
    height: 80px;
    background: #000;
    border-bottom: 1px solid #222;
    display: flex; align-items: center;
    padding-left: 60px;
    gap: 40px;
    font-size: 13px; font-weight: 700; color: #555; letter-spacing: 2px;
  }
  #landing-page nav span:hover { color: #fff; cursor: pointer; transition: color 0.3s; }

  #landing-page .hero { margin-top: 120px; }
  
  #landing-page .version-tag {
    font-size: 12px;
    letter-spacing: 3px;
    color: #ccb066;
    margin-bottom: 30px;
    text-transform: uppercase;
    display: flex; align-items: center; gap: 15px;
    font-weight: 700;
  }
  #landing-page .version-tag::before {
    content: ''; width: 40px; height: 2px; background: #ccb066; display: block;
  }

  #landing-page h1 {
    font-family: 'Playfair Display', serif;
    font-size: 96px;
    line-height: 1.05;
    font-weight: 500;
    margin: 0 0 40px 0;
    color: #fff;
    letter-spacing: -2px;
  }
  
  #landing-page h1 .accent {
    font-style: italic;
    color: #ccb066;
    background: linear-gradient(45deg, #ccb066, #ffdf85);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  #landing-page .subtitle {
    font-size: 18px;
    color: #888;
    max-width: 600px;
    line-height: 1.8;
    margin-bottom: 60px;
    padding-left: 30px;
    border-left: 3px solid #ccb066;
  }

  #landing-page .actions { display: flex; gap: 30px; align-items: center; }
  
  button.landing-btn {
    background: #ccb066;
    color: #000;
    border: none;
    padding: 20px 50px;
    font-size: 14px;
    letter-spacing: 2px;
    font-weight: 800;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.3s;
    box-shadow: 0 10px 30px rgba(204, 176, 102, 0.2);
  }
  button.landing-btn.outline {
    background: transparent;
    color: #fff;
    border: 1px solid #444;
    box-shadow: none;
  }
  button.landing-btn:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(204, 176, 102, 0.3);
  }
  button.landing-btn.outline:hover {
    border-color: #fff;
    box-shadow: 0 5px 20px rgba(255,255,255,0.1);
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30px;
    margin-top: 80px;
    border-top: 1px solid #222;
    padding-top: 40px;
    max-width: 800px;
  }
  .feature-item h3 { font-size: 14px; color: #fff; margin: 0 0 10px 0; font-weight: 700; letter-spacing: 1px; }
  .feature-item p { font-size: 12px; color: #666; line-height: 1.6; margin: 0; }

  #landing-page .right-panel {
    width: 40%;
    background: #000;
    position: relative;
    overflow: hidden;
    border-left: 1px solid #222;
  }
  .visual-element {
    position: absolute;
    top: 50%; left: 50%;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(204,176,102,0.1) 0%, rgba(0,0,0,0) 70%);
    transform: translate(-50%, -50%);
    border-radius: 50%;
  }
  .grid-overlay {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 50px 50px;
    opacity: 0.5;
  }
`
document.head.appendChild(landingStyle)

const landing = document.createElement('div')
landing.id = 'landing-page'
landing.innerHTML = `
  <div class="sidebar-left">
     <div class="logo-box">♔</div>
     <div class="brand-vertical">ROOKE ENGINE</div>
  </div>
  <div class="main-content">
     <nav>
        <span id="nav-github">GITHUB</span>
        <span id="nav-portfolio">VIEW MORE</span>
        <span id="nav-about">ABOUT</span>
     </nav>
     <div class="hero">
         <div class="version-tag">KAI KIM 2026</div>
         <h1>Rooke <br> <span class="accent">Engine</span></h1>
         <p class="subtitle">A 3D chess app exploring graphics and game logic. Built with TypeScript, Vite, and Three.js.</p>
         <div class="actions">
             <button id="mode-sandbox" class="landing-btn">SANDBOX GAME</button>
             <button id="mode-ai" class="landing-btn outline" style="border-color:#ccb066; color:#ccb066;">VS AI</button>
         </div>
     </div>
     <div class="feature-grid">
        <div class="feature-item">
            <h3>TYPESCRIPT</h3>
            <p>Made in TypeScript to keep the game logic clean, strict, and bug free.</p>
        </div>
        <div class="feature-item">
            <h3>THREE.JS</h3>
            <p>A custom 3D scene built with Three.js which adds depth and atmosphere to every match.</p>
        </div>
        <div class="feature-item">
            <h3>WEB ARCHITECTURE</h3>
            <p>Powered by Vite for a super fast, responsive experience that needs no downloads.</p>
        </div>
     </div>
  </div>
  <div class="right-panel">
      <div class="grid-overlay" style="z-index: 2;"></div>
      <div class="tech-overlay" style="z-index: 3; position: absolute; inset: 0; pointer-events: none;">
          

          <div style="position: absolute; bottom: 40px; left: 40px;">

          </div>
          <div style="position: absolute; top: 30px; left: 30px; width: 30px; height: 30px; border-top: 2px solid rgba(204, 176, 102, 0.5); border-left: 2px solid rgba(204, 176, 102, 0.5);"></div>
          <div style="position: absolute; bottom: 30px; right: 30px; width: 30px; height: 30px; border-bottom: 2px solid rgba(204, 176, 102, 0.5); border-right: 2px solid rgba(204, 176, 102, 0.5);"></div>
      </div>
      <video src="/Screen%20Recording%202026-01-08%20182219.mp4#t=0.1" muted playsinline style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8; filter: grayscale(40%) contrast(1.2);"></video>
  </div>
`
document.body.appendChild(landing)

const landingVideo = landing.querySelector('video')
if (landingVideo) {
  // \\\
  landingVideo.currentTime = 0
}



let isAIEnabled = false

function startGameTransition() {
  landing.style.transition = 'opacity 0.8s ease'
  landing.style.opacity = '0'
  setTimeout(() => {
    landing.remove()
    sidebar.style.display = 'block'
  }, 800)
}


document.getElementById('mode-sandbox')?.addEventListener('click', () => {
  isAIEnabled = false
  startGameTransition()
})

document.getElementById('mode-ai')?.addEventListener('click', () => {
  isAIEnabled = true
  startGameTransition()
  startGameTransition()
})

document.getElementById('nav-portfolio')?.addEventListener('click', () => {
  window.open('https://kaificial.vercel.app', '_blank')
})

document.getElementById('nav-github')?.addEventListener('click', () => {
  alert("Github Link Placeholder")
})

document.getElementById('nav-about')?.addEventListener('click', () => {
  window.open('https://kaificial.vercel.app', '_blank')
})

// show/hide promotion UI
let pendingPromotion: { pieceData: any } | null = null

function showPromotionUI(pieceData: any) {
  pendingPromotion = { pieceData }
  const promoArea = document.getElementById('promotion-area')!
  const statusEl = document.getElementById('game-status')!

  if (promoArea) {
    promoArea.style.display = 'block'
    statusEl.innerText = "Select Promotion"
  }
}

function hidePromotionUI() {
  const promoArea = document.getElementById('promotion-area')!
  const statusEl = document.getElementById('game-status')!

  if (promoArea) {
    promoArea.style.display = 'none'
    statusEl.innerText = (currentTurn === 'white' ? "White" : "Black") + "'s Turn"
  }
  pendingPromotion = null
}

// Start Game Listener
document.getElementById('start-game-btn')?.addEventListener('click', () => {
  if (gameActive) return
  gameActive = true
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(updateTimers, 1000)

  const btn = document.getElementById('start-game-btn')
  if (btn) {
    btn.innerText = "GAME IN PROGRESS"
    btn.style.opacity = '0.5'
    btn.style.cursor = 'default'
  }
})

// handle promotion selection
document.querySelectorAll('.promotion-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation()
    if (!pendingPromotion) return

    const p = pendingPromotion.pieceData

    try {
      // @ts-ignore
      const type = e.target.getAttribute('data-type')

      console.log("Promoting piece:", p, "to", type)

      // Remove pawn
      if (p.group) scene.remove(p.group)

      // Create new piece
      const newGroup = createPiece(type, p.isWhite, p.x, p.z)
      p.group = newGroup
      p.type = type

      console.log("Promotion success")
    } catch (err) {
      console.error("Promotion Logic Failed", err)
    } finally {
      hidePromotionUI()
      console.log("Finalizing turn...")
      const nextTurn = p.isWhite ? 'black' : 'white'
      finalizeTurn(nextTurn as any)
    }
  })
})


const scene = new THREE.Scene()
scene.background = new THREE.Color(0x080808)
scene.fog = new THREE.Fog(0x080808, 20, 50)

//camera
const aspect = window.innerWidth / window.innerHeight
const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000)
// set position camera
camera.position.set(10, 10, 10)
camera.lookAt(0, 0, 0)

// renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.querySelector<HTMLDivElement>('#app')!.appendChild(renderer.domElement)

// controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.screenSpacePanning = false
controls.minDistance = 2
controls.maxDistance = 50
controls.maxPolarAngle = Math.PI / 2.1 // can;t go below the board

// lighting 
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

// light with shadows
const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(5, 10, 7.5)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 2048
directionalLight.shadow.mapSize.height = 2048
directionalLight.shadow.camera.left = -10
directionalLight.shadow.camera.right = 10
directionalLight.shadow.camera.top = 10
directionalLight.shadow.camera.bottom = -10
scene.add(directionalLight)

// enviornment mapping 
const pmremGenerator = new THREE.PMREMGenerator(renderer)
pmremGenerator.compileEquirectangularShader()
// reflections
const roomScene = new THREE.Scene()
const roomLight = new THREE.PointLight(0xffffff, 50, 10)
roomLight.position.set(2, 2, 2)
roomScene.add(roomLight)
const envMap = pmremGenerator.fromScene(roomScene).texture

// board
const boardSize = 8
const tileSize = 1
const boardHeight = 0.2
const bevelSize = 0.05

function createBeveledBox(w: number, h: number, d: number, bevel: number, material: THREE.Material) {
  const shape = new THREE.Shape()
  shape.moveTo(-w / 2, -d / 2)
  shape.lineTo(w / 2, -d / 2)
  shape.lineTo(w / 2, d / 2)
  shape.lineTo(-w / 2, d / 2)
  shape.lineTo(-w / 2, -d / 2)

  const extrudeSettings = {
    steps: 1,
    depth: h,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: 3
  }

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI / 2
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

// board group
const boardGroup = new THREE.Group()
scene.add(boardGroup)

// materials
const lightMaterial = new THREE.MeshStandardMaterial({
  color: 0xe0d6c3,
  roughness: 0.15,
  metalness: 0.05,
  envMap: envMap,
  envMapIntensity: 0.5
})

const darkMaterial = new THREE.MeshStandardMaterial({
  color: 0x221108,
  roughness: 0.1,
  metalness: 0.1,
  envMap: envMap,
  envMapIntensity: 0.8
})

const baseMaterial = new THREE.MeshStandardMaterial({
  color: 0x150a05, // even darker base
  roughness: 0.3,
  metalness: 0.0,
  envMap: envMap,
  envMapIntensity: 0.3
})

// board base
const baseMesh = createBeveledBox(
  boardSize * tileSize + 0.6,
  boardHeight,
  boardSize * tileSize + 0.6,
  0.05,
  baseMaterial
)
baseMesh.position.y = -bevelSize // adjust for thickness
boardGroup.add(baseMesh)

// individual squares
for (let i = 0; i < boardSize; i++) {
  for (let j = 0; j < boardSize; j++) {
    const isLight = (i + j) % 2 === 0
    const mat = isLight ? lightMaterial : darkMaterial

    //thinner squares on top of the base
    const square = createBeveledBox(tileSize, 0.05, tileSize, 0.01, mat)

    square.position.x = (i - boardSize / 2 + 0.5) * tileSize
    square.position.z = (j - boardSize / 2 + 0.5) * tileSize
    square.position.y = boardHeight - 0.02 // embedded or on top
    boardGroup.add(square)
  }
}



// pieces mats
const ivoryMaterial = new THREE.MeshStandardMaterial({
  color: 0xfffffc,
  roughness: 0.2,
  metalness: 0.1,
  envMap: envMap,
  envMapIntensity: 0.4
})

const ebonyMaterial = new THREE.MeshStandardMaterial({
  color: 0x555555, // lighter grey for better visibility
  roughness: 0.15,
  metalness: 0.8,
  emissive: 0x111111, // subtle glow to prevent total blackness
  envMap: envMap,
  envMapIntensity: 2.0 // maximized reflections
})

const createPiece = (type: string, isWhite: boolean, x_coord: number, z_coord: number) => {
  const group = new THREE.Group()
  const material = isWhite ? ivoryMaterial : ebonyMaterial

  const createLathePiece = (points: THREE.Vector2[]) => {
    const geo = new THREE.LatheGeometry(points, 32)
    const mesh = new THREE.Mesh(geo, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
  }

  const basePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.35, 0),
    new THREE.Vector2(0.35, 0.05),
    new THREE.Vector2(0.3, 0.1),
    new THREE.Vector2(0.25, 0.15),
    new THREE.Vector2(0, 0.15), // close base
  ]

  if (type === 'pawn') {
    const points = [
      ...basePoints,
      new THREE.Vector2(0.2, 0.2),
      new THREE.Vector2(0.15, 0.4),
      new THREE.Vector2(0.2, 0.5),
      new THREE.Vector2(0.25, 0.6),
      new THREE.Vector2(0, 0.8), // close top
    ]
    group.add(createLathePiece(points))
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), material)
    head.position.y = 0.7
    head.castShadow = true
    group.add(head)
  }
  else if (type === 'rook') {
    const points = [
      ...basePoints,
      new THREE.Vector2(0.25, 0.2),
      new THREE.Vector2(0.25, 0.7),
      new THREE.Vector2(0.3, 0.8),
      new THREE.Vector2(0.3, 0.9),
      new THREE.Vector2(0, 0.9), // close top
    ]
    group.add(createLathePiece(points))
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.15, 32), material)
    top.position.y = 0.95
    top.castShadow = true
    group.add(top)
  }
  else if (type === 'knight') {
    const knightBasePoints = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.4, 0),
      new THREE.Vector2(0.4, 0.08),
      new THREE.Vector2(0.35, 0.12),
      new THREE.Vector2(0.3, 0.18),
      new THREE.Vector2(0.25, 0.22),
      new THREE.Vector2(0, 0.22), // Close base top
    ]
    group.add(createLathePiece(knightBasePoints))

    // Knight head 
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(0.3, 0) // neck base front
    shape.lineTo(0.3, 0.4) // lower neck
    shape.quadraticCurveTo(0.35, 0.4, 0.5, 0.35) // nopse bottom
    shape.lineTo(0.55, 0.4) // lip
    shape.lineTo(0.55, 0.5) // tip of nose
    shape.quadraticCurveTo(0.55, 0.6, 0.4, 0.6) // top of nose
    shape.quadraticCurveTo(0.35, 0.65, 0.3, 0.8) // 4head to ear
    shape.lineTo(0.25, 0.95) // ear tip front
    shape.lineTo(0.15, 0.85) // ear valley
    shape.lineTo(0.05, 0.95) // ear tip back
    shape.lineTo(0, 0.75) // back of head
    shape.quadraticCurveTo(-0.15, 0.6, -0.25, 0.4) // neck back curve
    shape.lineTo(-0.25, 0) // neck base back
    shape.lineTo(0, 0)

    const extrudeSettings = { depth: 0.16, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04 }
    const headGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    // center the head thickness on the base
    headGeo.translate(0, 0, -0.08)

    const head = new THREE.Mesh(headGeo, material)
    head.position.set(0, 0.2, 0) // start head above the base

    head.rotation.y = isWhite ? -Math.PI / 2 : Math.PI / 2

    head.castShadow = true
    group.add(head)
  }
  else if (type === 'bishop') {
    const points = [
      ...basePoints,
      new THREE.Vector2(0.2, 0.2),
      new THREE.Vector2(0.15, 0.6),
      new THREE.Vector2(0.2, 0.8),
      new THREE.Vector2(0.1, 1.1),
      new THREE.Vector2(0, 1.2),
    ]
    group.add(createLathePiece(points))
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), material)
    tip.position.y = 1.2
    group.add(tip)
  }
  else if (type === 'queen') {
    const points = [
      ...basePoints,
      new THREE.Vector2(0.25, 0.2),
      new THREE.Vector2(0.15, 0.8),
      new THREE.Vector2(0.3, 1.2),
      new THREE.Vector2(0.35, 1.3),
      new THREE.Vector2(0, 1.4),
    ]
    group.add(createLathePiece(points))
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), material)
    crown.position.y = 1.45
    group.add(crown)
  }
  else if (type === 'king') {
    const points = [
      ...basePoints,
      new THREE.Vector2(0.25, 0.2),
      new THREE.Vector2(0.2, 0.9),
      new THREE.Vector2(0.3, 1.3),
      new THREE.Vector2(0.3, 1.4),
      new THREE.Vector2(0, 1.5),
    ]
    group.add(createLathePiece(points))
    // simple cross top
    const crossBar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05), material)
    crossBar.position.y = 1.6
    group.add(crossBar)
    const crossVert = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.05), material)
    crossVert.position.y = 1.6
    group.add(crossVert)
  }

  // position on board
  const x = (x_coord - boardSize / 2 + 0.5) * tileSize
  const z = (z_coord - boardSize / 2 + 0.5) * tileSize
  group.position.set(x, boardHeight, z)
  scene.add(group)
  return group
}

// track pieces with data
const allPieces: Array<{
  group: THREE.Group,
  type: string,
  isWhite: boolean,
  x: number,
  z: number,
  hasMoved: boolean
}> = []

//Initialize board with pieces
// White pieces
for (let i = 0; i < 8; i++) allPieces.push({ group: createPiece('pawn', true, i, 1), type: 'pawn', isWhite: true, x: i, z: 1, hasMoved: false })
allPieces.push({ group: createPiece('rook', true, 0, 0), type: 'rook', isWhite: true, x: 0, z: 0, hasMoved: false })
allPieces.push({ group: createPiece('knight', true, 1, 0), type: 'knight', isWhite: true, x: 1, z: 0, hasMoved: false })
allPieces.push({ group: createPiece('bishop', true, 2, 0), type: 'bishop', isWhite: true, x: 2, z: 0, hasMoved: false })
allPieces.push({ group: createPiece('queen', true, 3, 0), type: 'queen', isWhite: true, x: 3, z: 0, hasMoved: false })
allPieces.push({ group: createPiece('king', true, 4, 0), type: 'king', isWhite: true, x: 4, z: 0, hasMoved: false })
allPieces.push({ group: createPiece('bishop', true, 5, 0), type: 'bishop', isWhite: true, x: 5, z: 0, hasMoved: false })
allPieces.push({ group: createPiece('knight', true, 6, 0), type: 'knight', isWhite: true, x: 6, z: 0, hasMoved: false })
allPieces.push({ group: createPiece('rook', true, 7, 0), type: 'rook', isWhite: true, x: 7, z: 0, hasMoved: false })

// Black pieces
for (let i = 0; i < 8; i++) allPieces.push({ group: createPiece('pawn', false, i, 6), type: 'pawn', isWhite: false, x: i, z: 6, hasMoved: false })
allPieces.push({ group: createPiece('rook', false, 0, 7), type: 'rook', isWhite: false, x: 0, z: 7, hasMoved: false })
allPieces.push({ group: createPiece('knight', false, 1, 7), type: 'knight', isWhite: false, x: 1, z: 7, hasMoved: false })
allPieces.push({ group: createPiece('bishop', false, 2, 7), type: 'bishop', isWhite: false, x: 2, z: 7, hasMoved: false })
allPieces.push({ group: createPiece('queen', false, 3, 7), type: 'queen', isWhite: false, x: 3, z: 7, hasMoved: false })
allPieces.push({ group: createPiece('king', false, 4, 7), type: 'king', isWhite: false, x: 4, z: 7, hasMoved: false })
allPieces.push({ group: createPiece('bishop', false, 5, 7), type: 'bishop', isWhite: false, x: 5, z: 7, hasMoved: false })
allPieces.push({ group: createPiece('knight', false, 6, 7), type: 'knight', isWhite: false, x: 6, z: 7, hasMoved: false })
allPieces.push({ group: createPiece('rook', false, 7, 7), type: 'rook', isWhite: false, x: 7, z: 7, hasMoved: false })


// game state
let currentTurn: 'white' | 'black' = 'white'
let gameOver = false
let gameActive = false
let whiteTime = 600
let blackTime = 600
let timerInterval: any = null
let lastMove: { piece: any, from: { x: number, z: number }, to: { x: number, z: number }, isCapture?: boolean } | null = null

// selection state
let selectedPiece: { group: THREE.Group, type: string, isWhite: boolean, x: number, z: number, hasMoved: boolean } | null = null
let highlightMeshes: THREE.Mesh[] = []

// mouse 
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// helper to find king 
function findKing(isWhite: boolean) {
  return allPieces.find(p => p.type === 'king' && p.isWhite === isWhite)
}

// check if a square is under attack 
function isSquareUnderAttack(x: number, z: number, byWhite: boolean): boolean {
  const attackers = allPieces.filter(p => p.isWhite === byWhite)

  for (const attacker of attackers) {
    const moves = getPossibleMovesRaw(attacker)
    if (moves.some(m => m.x === x && m.z === z)) {
      return true
    }
  }
  return false
}

// check if player is in check
function isInCheck(isWhite: boolean): boolean {
  const king = findKing(isWhite)
  if (!king) return false
  return isSquareUnderAttack(king.x, king.z, !isWhite)
}

// check if player is in checkmate
function isCheckmate(isWhite: boolean): boolean {
  if (!isInCheck(isWhite)) return false

  // try all moves for all pieces
  const pieces = allPieces.filter(p => p.isWhite === isWhite)
  for (const piece of pieces) {
    const moves = getPossibleMoves(piece)
    if (moves.length > 0) return false // at least one legal move 
  }
  return true
}

// get possible moves for a piece (simplified chess rules)
// helper to check if a square is not open
function getPieceAt(x: number, z: number) {
  return allPieces.find(p => p.x === x && p.z === z)
}

// get possible moves (without check validation)
function getPossibleMovesRaw(piece: { type: string, isWhite: boolean, x: number, z: number }): Array<{ x: number, z: number }> {
  const moves: Array<{ x: number, z: number }> = []

  // helper to add move if open
  const addMove = (x: number, z: number) => {
    if (x < 0 || x >= 8 || z < 0 || z >= 8) return false
    const target = getPieceAt(x, z)
    if (target && target.isWhite === piece.isWhite) return false // can't capture own piece
    moves.push({ x, z })
    return !target // continue if square is opnn 
  }

  if (piece.type === 'pawn') {
    const dir = piece.isWhite ? 1 : -1
    const startRow = piece.isWhite ? 1 : 6

    // forward 
    if (!getPieceAt(piece.x, piece.z + dir)) {
      moves.push({ x: piece.x, z: piece.z + dir })

      // double move from start
      if (piece.z === startRow && !getPieceAt(piece.x, piece.z + dir * 2)) {
        moves.push({ x: piece.x, z: piece.z + dir * 2 })
      }
    }

    // diagonal 
    const captureLeft = getPieceAt(piece.x - 1, piece.z + dir)
    if (captureLeft && captureLeft.isWhite !== piece.isWhite) {
      moves.push({ x: piece.x - 1, z: piece.z + dir })
    }
    const captureRight = getPieceAt(piece.x + 1, piece.z + dir)
    if (captureRight && captureRight.isWhite !== piece.isWhite) {
      moves.push({ x: piece.x + 1, z: piece.z + dir })
    }

    // En Passant
    if (lastMove && lastMove.piece.type === 'pawn' && lastMove.piece.isWhite !== piece.isWhite) {
      const movedTwoSquares = Math.abs(lastMove.to.z - lastMove.from.z) === 2
      const isAdjacent = lastMove.to.z === piece.z && Math.abs(lastMove.to.x - piece.x) === 1

      if (movedTwoSquares && isAdjacent) {
        moves.push({ x: lastMove.to.x, z: piece.z + dir })
      }
    }
  }
  else if (piece.type === 'knight') {
    const offsets = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]
    offsets.forEach(([dx, dz]) => addMove(piece.x + dx, piece.z + dz))
  }
  else if (piece.type === 'rook') {
    // horizontal and vertical lines
    for (let i = piece.x + 1; i < 8; i++) if (!addMove(i, piece.z)) break
    for (let i = piece.x - 1; i >= 0; i--) if (!addMove(i, piece.z)) break
    for (let i = piece.z + 1; i < 8; i++) if (!addMove(piece.x, i)) break
    for (let i = piece.z - 1; i >= 0; i--) if (!addMove(piece.x, i)) break
  }
  else if (piece.type === 'bishop') {
    // diagonal lines
    for (let i = 1; i < 8; i++) if (!addMove(piece.x + i, piece.z + i)) break
    for (let i = 1; i < 8; i++) if (!addMove(piece.x + i, piece.z - i)) break
    for (let i = 1; i < 8; i++) if (!addMove(piece.x - i, piece.z + i)) break
    for (let i = 1; i < 8; i++) if (!addMove(piece.x - i, piece.z - i)) break
  }
  else if (piece.type === 'queen') {
    // combination of rook and bishop
    for (let i = piece.x + 1; i < 8; i++) if (!addMove(i, piece.z)) break
    for (let i = piece.x - 1; i >= 0; i--) if (!addMove(i, piece.z)) break
    for (let i = piece.z + 1; i < 8; i++) if (!addMove(piece.x, i)) break
    for (let i = piece.z - 1; i >= 0; i--) if (!addMove(piece.x, i)) break
    for (let i = 1; i < 8; i++) if (!addMove(piece.x + i, piece.z + i)) break
    for (let i = 1; i < 8; i++) if (!addMove(piece.x + i, piece.z - i)) break
    for (let i = 1; i < 8; i++) if (!addMove(piece.x - i, piece.z + i)) break
    for (let i = 1; i < 8; i++) if (!addMove(piece.x - i, piece.z - i)) break
  }
  else if (piece.type === 'king') {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx !== 0 || dz !== 0) {
          addMove(piece.x + dx, piece.z + dz)
        }
      }
    }
  }

  return moves
}

// get legal moves (filters out moves that leave king in check)
function getPossibleMoves(piece: { type: string, isWhite: boolean, x: number, z: number, hasMoved: boolean }): Array<{ x: number, z: number }> {
  const rawMoves = getPossibleMovesRaw(piece)
  const legalMoves: Array<{ x: number, z: number }> = []

  // simulate each move and check if it leaves king in check
  for (const move of rawMoves) {
    // save state
    const originalX = piece.x
    const originalZ = piece.z
    const capturedPiece = getPieceAt(move.x, move.z)
    const capturedIndex = capturedPiece ? allPieces.indexOf(capturedPiece) : -1

    // simulate move
    piece.x = move.x
    piece.z = move.z
    if (capturedPiece) {
      allPieces.splice(capturedIndex, 1)
    }

    // check if king is safe
    const safe = !isInCheck(piece.isWhite)

    // restore state
    piece.x = originalX
    piece.z = originalZ
    if (capturedPiece && capturedIndex >= 0) {
      allPieces.splice(capturedIndex, 0, capturedPiece)
    }

    if (safe) {
      legalMoves.push(move)
    }
  }

  // Castling
  if (piece.type === 'king' && !piece.hasMoved && !isInCheck(piece.isWhite)) {
    const z = piece.isWhite ? 0 : 7

    // Kingside (x=6)
    const rookK = allPieces.find(p => p.type === 'rook' && p.isWhite === piece.isWhite && p.x === 7 && p.z === z)
    if (rookK && !rookK.hasMoved) {
      const pathEmpty = !getPieceAt(5, z) && !getPieceAt(6, z)
      const pathSafe = !isSquareUnderAttack(5, z, !piece.isWhite) && !isSquareUnderAttack(6, z, !piece.isWhite)
      if (pathEmpty && pathSafe) {
        legalMoves.push({ x: 6, z })
      }
    }

    // Queenside (x=2)
    const rookQ = allPieces.find(p => p.type === 'rook' && p.isWhite === piece.isWhite && p.x === 0 && p.z === z)
    if (rookQ && !rookQ.hasMoved) {
      const pathEmpty = !getPieceAt(1, z) && !getPieceAt(2, z) && !getPieceAt(3, z)
      const pathSafe = !isSquareUnderAttack(2, z, !piece.isWhite) && !isSquareUnderAttack(3, z, !piece.isWhite)
      if (pathEmpty && pathSafe) {
        legalMoves.push({ x: 2, z })
      }
    }
  }

  return legalMoves
}

// clear all highlights
function clearHighlights() {
  highlightMeshes.forEach(mesh => scene.remove(mesh))
  highlightMeshes = []
}

// highlight possible moves
function highlightMoves(moves: Array<{ x: number, z: number }>) {
  clearHighlights()

  moves.forEach(move => {
    // glow using a canvas texture
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')!

    // radial gradient for glow effect
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, 'rgba(204, 176, 102, 0.6)')
    gradient.addColorStop(0.5, 'rgba(204, 176, 102, 0.3)')
    gradient.addColorStop(1, 'rgba(204, 176, 102, 0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)

    const texture = new THREE.CanvasTexture(canvas)

    const highlightGeo = new THREE.PlaneGeometry(0.8, 0.8)
    const highlightMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
    const highlight = new THREE.Mesh(highlightGeo, highlightMat)
    highlight.rotation.x = -Math.PI / 2
    const x = (move.x - boardSize / 2 + 0.5) * tileSize
    const z = (move.z - boardSize / 2 + 0.5) * tileSize
    highlight.position.set(x, boardHeight + 0.12, z)
    scene.add(highlight)
    highlightMeshes.push(highlight)
  })
}



// animation state
let animatingPiece: {
  group: THREE.Group,
  startPos: THREE.Vector3,
  endPos: THREE.Vector3,
  progress: number,
  pieceData: any
} | null = null


function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function updateTimers() {
  if (!gameActive) return

  const wTimer = document.getElementById('top-white-timer')
  const bTimer = document.getElementById('top-black-timer')

  if (currentTurn === 'white') {
    whiteTime--
    if (wTimer) {
      wTimer.innerText = formatTime(whiteTime)
      wTimer.classList.add('active')
      bTimer?.classList.remove('active')
    }
    if (whiteTime <= 0) {
      console.log("White ran out of time!")
      gameOver = true
      gameActive = false
      if (timerInterval) clearInterval(timerInterval)
    }
  } else {
    blackTime--
    if (bTimer) {
      bTimer.innerText = formatTime(blackTime)
      bTimer.classList.add('active')
      wTimer?.classList.remove('active')
    }
    if (blackTime <= 0) {
      console.log("Black ran out of time!")
      gameOver = true
      gameActive = false
      if (timerInterval) clearInterval(timerInterval)
    }
  }
}

let moveNumber = 1

function toChessNotation(move: any) {
  if (!move) return ""
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8']

  const fromFile = files[move.from.x]
  const rank = ranks[move.to.z]
  const file = files[move.to.x]

  if (move.piece.type === 'pawn') {
    if (move.isCapture) {
      return fromFile + 'x' + file + rank
    }
    return file + rank
  }

  if (move.piece.type === 'king') {
    if (Math.abs(move.to.x - move.from.x) > 1) {
      return move.to.x > move.from.x ? "O-O" : "O-O-O"
    }
  }

  const pieceChar = move.piece.type === 'knight' ? 'N' : move.piece.type[0].toUpperCase()
  return pieceChar + (move.isCapture ? 'x' : '') + file + rank
}

function updateMoveHistory(moveText: string, isWhite: boolean) {
  const list = document.getElementById('move-list')
  if (!list) return

  if (isWhite) {
    const row = document.createElement('tr')
    row.innerHTML = `<td>${moveNumber}.</td><td>${moveText}</td><td></td>`
    list.appendChild(row)
    list.scrollTop = list.scrollHeight
  } else {
    const rows = list.querySelectorAll('tr')
    const lastRow = rows[rows.length - 1]
    if (lastRow) {
      lastRow.children[2].textContent = moveText
    }
    moveNumber++
  }
}

const pieceIcons: { [key: string]: string } = {
  king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟'
}

function updateMaterialDisplay() {
  const order = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn']

  const wContainer = document.getElementById('white-material')
  const bContainer = document.getElementById('black-material')

  if (wContainer) {
    const pieces = allPieces.filter(p => p.isWhite).sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))
    wContainer.innerHTML = pieces.map(p => pieceIcons[p.type]).join('')
  }
  if (bContainer) {
    const pieces = allPieces.filter(p => !p.isWhite).sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))
    bContainer.innerHTML = pieces.map(p => pieceIcons[p.type]).join('')
  }
}



function finalizeTurn(overrideTurn?: string) {
  if (lastMove) {
    const notation = toChessNotation(lastMove)
    updateMoveHistory(notation, lastMove.piece.isWhite)
  }


  updateMaterialDisplay()

  console.log("finalizeTurn called. Old Turn:", currentTurn, "Override:", overrideTurn)
  // switch turns
  if (overrideTurn) {
    currentTurn = overrideTurn
  } else {
    currentTurn = currentTurn === 'white' ? 'black' : 'white'
  }
  console.log("New Turn:", currentTurn)

  let statusText = (currentTurn === 'white' ? "White" : "Black") + "'s Turn"

  // check for check/checkmate
  if (isInCheck(currentTurn === 'white')) {
    if (isCheckmate(currentTurn === 'white')) {
      statusText = `Checkmate! ${currentTurn === 'white' ? "Black" : "White"} Wins!`
      console.log(statusText)
      gameOver = true
    } else {
      statusText += " (CHECK)"
      console.log(`${currentTurn === 'white' ? 'White' : 'Black'} is in check!`)
    }
  }

  const statusEl = document.getElementById('game-status')
  if (statusEl) statusEl.innerText = statusText


  // AI Trigger
  if (isAIEnabled && currentTurn === 'black' && !gameOver) {
    console.log("Requesting AI Move...")
    const fen = generateFen()
    aiWorker.postMessage({ fen, depth: 3 })

  }
}

// AI Worker Integration
const aiWorker = new Worker(new URL('./chess-ai.worker.ts', import.meta.url), { type: 'module' })

// playback
const aiVisualQueue: any[] = []

aiWorker.onmessage = (e) => {
  const data = e.data
  // Push to queue instead of moving right away 
  aiVisualQueue.push(data)
}

// playback loop (800ms every thought)
setInterval(() => {
  if (aiVisualQueue.length > 0) {
    // if queue is huge (>20) skip first thinking steps
    if (aiVisualQueue.length > 20) {
      // keep last 5
      const lastFew = aiVisualQueue.slice(aiVisualQueue.length - 5)
      aiVisualQueue.length = 0
      aiVisualQueue.push(...lastFew)
    }

    const data = aiVisualQueue.shift()
    processAiEvent(data)
  }
}, 800)

// visualization toggle on/off button
let visualsEnabled = true
document.getElementById('toggle-viz-btn')?.addEventListener('click', (e) => {
  visualsEnabled = !visualsEnabled
  const btn = e.target as HTMLButtonElement
  btn.innerText = visualsEnabled ? "Hide AI Thoughts" : "Show AI Thoughts"
  btn.style.color = visualsEnabled ? "#888" : "#ccb066"

  // immediate toggle
  ghostGroup.visible = visualsEnabled
  arrowGroup.visible = visualsEnabled
  auraGroup.visible = visualsEnabled

  const logEl = document.getElementById('ai-log')
  if (logEl) logEl.style.display = visualsEnabled ? 'block' : 'none'
})

function processAiEvent(data: any) {
  if (!visualsEnabled) {
    // even if disabled execute the move if it's bestMove
    if (data.type === 'bestMove' && data.move) {
      setTimeout(() => executeAIMove(data.move), 2000)
    }
    return
  }

  if (data.pv) updateGhosts(data.pv)
  if (data.score !== undefined) updateAura(data.score)

  if (data.type === 'thinking') {
    updateArrows(data.move)
    updateNarrative(data)
  } else if (data.type === 'bestMove') {
    if (data.move) {
      // show final decision 
      updateArrows(data.move, true)
      updateNarrative(data, true)

      // wait for users to understand 
      setTimeout(() => {
        executeAIMove(data.move)
      }, 2000)
    }
  }
}

// 3D arrows 
const arrowGroup = new THREE.Group()
scene.add(arrowGroup)

function updateArrows(move: any, persist = false) {
  if (!persist) {
    // clear out the old arrows
    while (arrowGroup.children.length > 0) arrowGroup.remove(arrowGroup.children[0])
  }

  if (!move) return

  const fromR = Math.floor(move.from / 8)
  const fromC = move.from % 8
  const toR = Math.floor(move.to / 8)
  const toC = move.to % 8

  const fromX = (fromC - 3.5) * tileSize
  const fromZ = (7 - fromR - 3.5) * tileSize
  const toX = (toC - 3.5) * tileSize
  const toZ = (7 - toR - 3.5) * tileSize

  const start = new THREE.Vector3(fromX, boardHeight + 0.1, fromZ)
  const end = new THREE.Vector3(toX, boardHeight + 0.1, toZ)
  const dir = new THREE.Vector3().subVectors(end, start)
  const len = dir.length()

  // create new arrow
  const color = persist ? 0xccb066 : 0x00ffff // gold for final, blue for thinking arrow
  const opacity = persist ? 0.8 : 0.4

  // point
  const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, len - 0.25, 8)
  const headGeo = new THREE.ConeGeometry(0.12, 0.25, 8)
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity })

  const arrowObj = new THREE.Group()
  const shaft = new THREE.Mesh(shaftGeo, mat)
  shaft.rotation.x = Math.PI / 2
  shaft.position.z = - (len - 0.25) / 2

  const head = new THREE.Mesh(headGeo, mat)
  head.rotation.x = Math.PI / 2
  head.position.z = - len + 0.125

  arrowObj.add(shaft, head)
  arrowObj.position.copy(start)
  arrowObj.lookAt(end)

  arrowGroup.add(arrowObj)
}

function updateNarrative(data: any, isFinal = false) {
  const m = data.move
  const s = data.score

  const fromR = Math.floor(m.from / 8)
  const fromC = m.from % 8
  const piece = allPieces.find(p => p.x === fromC && p.z === (7 - fromR))
  const pType = piece ? piece.type : 'Piece'
  const pName = pType.charAt(0).toUpperCase() + pType.slice(1)

  let action = isFinal ? "Decided to move" : "Thinking about moving"
  let reason = "to improve position"

  const cols = "abcdefgh"
  const row = 8 - Math.floor(m.to / 8)
  const colStr = cols[m.to % 8]
  const dest = colStr + row

  // heuristics
  // capture
  const target = getPieceAt(m.to % 8, 7 - Math.floor(m.to / 8))
  if (target) {
    reason = `to capture Black's ${target.type} (Material Gain)`
    if (target.isWhite) reason = `to capture White's ${target.type}!`
  }

  // center cntrol (d4, e4, d5, e5)
  // indices: 27, 28, 35, 36
  const centerIndices = [27, 28, 35, 36]
  if (centerIndices.includes(m.to)) reason = "to control the center"

  // check
  // (needs check logic simple check here: score spike?)

  // score context
  let sentiment = 'info'
  if (s > 100) { action = "Winning move:"; sentiment = 'good' }
  else if (s < -100) { action = "Defensive move:"; sentiment = 'bad' } // Black AI winning is negative?
  // + is White adv, - is Black adv.
  // if AI is black -100 is good for ai.
  if (currentTurn === 'black') {
    if (s < -50) { action = "Aggressive Move:"; sentiment = 'good' }
    if (s > 50) { action = "Defending:"; sentiment = 'bad' }
  }

  const scoreText = (s / 100).toFixed(2)
  const msg = `${action} ${pName} to ${dest} ${reason} (${scoreText})`
  addAiLog(msg, sentiment)
}

// holo PV visuals
const ghostGroup = new THREE.Group()
scene.add(ghostGroup)

const ghostMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  transparent: true,
  opacity: 0.5,
  wireframe: true,
  blending: THREE.AdditiveBlending
})

function updateGhosts(pv: any[]) {
  // Ccear old holos
  while (ghostGroup.children.length > 0) {
    ghostGroup.remove(ghostGroup.children[0])
  }

  // render PV
  // Only render the first move as a full holo ghost model for higher fidelity
  if (pv.length > 0) {
    const firstMove = pv[0]
    const toR = Math.floor(firstMove.to / 8)
    const toC = firstMove.to % 8
    const toX = (toC - 3.5) * tileSize
    const toZ = (7 - toR - 3.5) * tileSize

    const fromR = Math.floor(firstMove.from / 8)
    const fromC = firstMove.from % 8
    const fromX = fromC
    const fromZ = 7 - fromR

    const piece = allPieces.find(p => p.x === fromX && p.z === fromZ)
    if (piece) {
      const ghost = piece.group.clone()
      ghost.position.set(toX, boardHeight, toZ)
      // replace material
      ghost.traverse((child: any) => {
        if (child.isMesh) {
          child.material = ghostMaterial
        }
      })
      ghostGroup.add(ghost)
    }

    // render lines for the rest of the path?
    if (pv.length > 1) {
      const points = []
      points.push(new THREE.Vector3(toX, boardHeight + 0.5, toZ))

      for (let i = 1; i < pv.length; i++) {
        const m = pv[i]
        const tr = Math.floor(m.to / 8)
        const tc = m.to % 8
        const tx = (tc - 3.5) * tileSize
        const tz = (7 - tr - 3.5) * tileSize
        points.push(new THREE.Vector3(tx, boardHeight + 0.5, tz))
      }

      const geo = new THREE.BufferGeometry().setFromPoints(points)
      const mat = new THREE.LineBasicMaterial({ color: 0x00ffff, opacity: 0.3, transparent: true })
      const line = new THREE.Line(geo, mat)
      ghostGroup.add(line)
    }
  }
}

// confidence aura farming 
const auraGroup = new THREE.Group()
scene.add(auraGroup)
const auraRing = new THREE.Mesh(
  new THREE.RingGeometry(0.35, 0.45, 32),
  new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending })
)
const auraGlow = new THREE.Mesh(
  new THREE.RingGeometry(0.2, 0.6, 32),
  new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending })
)
auraRing.rotation.x = -Math.PI / 2
auraGlow.rotation.x = -Math.PI / 2
auraGlow.position.y = 0.02
auraRing.position.y = 0.03
auraGroup.add(auraRing, auraGlow)

function updateAura(score: number) {
  // AI is Black. Positive = White adv. Negative = Black adv.
  // Winning = Score < -100
  // Losing = Score > 100
  // Draw = -100 to 100

  let color = 0x0088ff
  let intensity = 0.3

  if (score < -100) { color = 0x00ff00; intensity = 0.8 }
  if (score > 100) { color = 0xff3300; intensity = 0.6 }

  const c = new THREE.Color(color)
    ; (auraRing.material as THREE.MeshBasicMaterial).color = c
    ; (auraGlow.material as THREE.MeshBasicMaterial).color = c

  // find AI King (Black King)
  const king = allPieces.find(p => p.type === 'king' && !p.isWhite)
  if (king) {
    auraGroup.position.x = king.group.position.x
    auraGroup.position.z = king.group.position.z

    gsap.to((auraRing.material as THREE.MeshBasicMaterial), { opacity: intensity, duration: 0.5 })
    gsap.to((auraGlow.material as THREE.MeshBasicMaterial), { opacity: intensity * 0.3, duration: 0.5 })
  }
}


function executeAIMove(move: { from: number, to: number }) {
  const fromR = Math.floor(move.from / 8)
  const fromC = move.from % 8
  const toR = Math.floor(move.to / 8)
  const toC = move.to % 8

  const fromZ = 7 - fromR
  const fromX = fromC
  const targetZ = 7 - toR
  const targetX = toC

  const piece = allPieces.find(p => p.x === fromX && p.z === fromZ)
  if (!piece) return

  // Capture logic
  const captured = getPieceAt(targetX, targetZ)
  let isCapture = false
  if (captured && captured.isWhite !== piece.isWhite) {
    if (captured.group) scene.remove(captured.group)
    const idx = allPieces.indexOf(captured)
    if (idx > -1) allPieces.splice(idx, 1)
    isCapture = true
  }

  lastMove = { piece, from: { x: piece.x, z: piece.z }, to: { x: targetX, z: targetZ }, isCapture }

  piece.x = targetX
  piece.z = targetZ
  piece.hasMoved = true

  const targetPos = new THREE.Vector3((targetX - boardSize / 2 + 0.5) * tileSize, boardHeight, (targetZ - boardSize / 2 + 0.5) * tileSize)

  gsap.to(piece.group.position, {
    x: targetPos.x,
    y: targetPos.y,
    z: targetPos.z,
    duration: 0.6,
    ease: "power2.inOut",
    onComplete: () => {
      finalizeTurn()
    }
  })
}

function generateFen() {
  let fen = ''
  for (let r = 0; r < 8; r++) {
    let empty = 0
    const z = 7 - r
    for (let c = 0; c < 8; c++) {
      const x = c
      const piece = allPieces.find(p => p.x === x && p.z === z)
      if (piece) {
        if (empty > 0) { fen += empty; empty = 0 }
        const typeMap: any = { 'knight': 'n', 'rook': 'r', 'bishop': 'b', 'queen': 'q', 'king': 'k', 'pawn': 'p' }
        const char = typeMap[piece.type] || 'p'
        fen += piece.isWhite ? char.toUpperCase() : char
      } else {
        empty++
      }
    }
    if (empty > 0) fen += empty
    if (r < 7) fen += '/'
  }
  fen += ' ' + (currentTurn === 'white' ? 'w' : 'b') + ' - - 0 1'
  return fen
}


function onMouseClick(event: MouseEvent) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  console.log("Click. P/A:", !!pendingPromotion, !!animatingPiece, "GO:", gameOver)

  if (animatingPiece || pendingPromotion) return

  raycaster.setFromCamera(mouse, camera)

  // if a piece is selected check if we clicked a legal move square
  if (selectedPiece) {
    // check if we clicked on a highlight (legal move)
    const highlightIntersects = raycaster.intersectObjects(highlightMeshes, false)


    if (highlightIntersects.length > 0) {
      // get the position we clicked
      const clickedHighlight = highlightIntersects[0].object as THREE.Mesh
      const targetX = clickedHighlight.position.x
      const targetZ = clickedHighlight.position.z

      const boardX = Math.round((targetX / tileSize) + boardSize / 2 - 0.5)
      const boardZ = Math.round((targetZ / tileSize) + boardSize / 2 - 0.5)

      // check for castling move
      if (selectedPiece.type === 'king' && Math.abs(boardX - selectedPiece.x) === 2) {
        const isKingside = boardX > selectedPiece.x
        const rookX = isKingside ? 7 : 0
        const rookTargetX = isKingside ? 5 : 3
        const rook = allPieces.find(p => p.type === 'rook' && p.isWhite === selectedPiece.isWhite && p.x === rookX && p.z === boardZ)
        if (rook) {
          const rx = (rookTargetX - boardSize / 2 + 0.5) * tileSize
          const rz = (boardZ - boardSize / 2 + 0.5) * tileSize
          rook.group.position.set(rx, boardHeight, rz)
          rook.x = rookTargetX
          rook.hasMoved = true
        }
      }

      let isCapture = false

      // check for En Passant capture
      if (selectedPiece.type === 'pawn' && boardX !== selectedPiece.x && !getPieceAt(boardX, boardZ)) {
        const captureZ = selectedPiece.z
        const capturedPawn = getPieceAt(boardX, captureZ)
        if (capturedPawn && capturedPawn.type === 'pawn' && capturedPawn.isWhite !== selectedPiece.isWhite) {
          scene.remove(capturedPawn.group)
          const index = allPieces.indexOf(capturedPawn)
          if (index > -1) allPieces.splice(index, 1)
          isCapture = true
        }
      }

      // check if there's a piece to capture (normal capture)
      const capturedPiece = getPieceAt(boardX, boardZ)
      if (capturedPiece) {
        scene.remove(capturedPiece.group)
        const index = allPieces.indexOf(capturedPiece)
        if (index > -1) allPieces.splice(index, 1)
        isCapture = true
      }

      // start animation (GSAP)
      const targetPos = new THREE.Vector3(targetX, boardHeight, targetZ)

      // update pieces position data
      lastMove = { piece: selectedPiece, from: { x: selectedPiece.x, z: selectedPiece.z }, to: { x: boardX, z: boardZ }, isCapture }
      selectedPiece.x = boardX
      selectedPiece.z = boardZ
      selectedPiece.hasMoved = true

      const pData = selectedPiece

      gsap.to(selectedPiece.group.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          // Check for promotion
          if (pData.type === 'pawn' && (pData.z === 0 || pData.z === 7)) {
            showPromotionUI(pData)
          } else {
            finalizeTurn()
          }
        }
      })

      // clear selection and highlights
      selectedPiece = null
      clearHighlights()

      return

      // clear selection and highlights
      selectedPiece = null
      clearHighlights()

      return

    }
  }

  // check if we clicked a piece
  const allMeshes = allPieces.flatMap(p => p.group.children)
  const intersects = raycaster.intersectObjects(allMeshes, false)

  if (intersects.length > 0 && !gameOver && gameActive) {
    // find which piece we clicked
    const clickedMesh = intersects[0].object
    const clickedPiece = allPieces.find(p => p.group.children.includes(clickedMesh))

    if (clickedPiece) {
      const isWhiteTurn = currentTurn === 'white'
      if (clickedPiece.isWhite !== isWhiteTurn) {
        console.log(`It's ${currentTurn}'s turn!`)
        return
      }

      // deselect previous piece
      if (selectedPiece) {
        selectedPiece.group.position.y = boardHeight
      }

      // select new piece
      selectedPiece = clickedPiece
      selectedPiece.group.position.y = boardHeight + 0.3

      // show possible moves
      const moves = getPossibleMoves(selectedPiece)
      highlightMoves(moves)


    }
  } else {
    // clicked empty space
    if (selectedPiece) {
      selectedPiece.group.position.y = boardHeight
      selectedPiece = null
      clearHighlights()
    }
  }
}

window.addEventListener('click', onMouseClick)

// resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// animation
function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

animate()
updateMaterialDisplay()




