import './style.css'
import * as THREE from 'three'
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
  <div class="status" id="game-status">White's Turn</div>
  <div id="move-history">
    <table>
      <thead><tr><th>#</th><th>W</th><th>B</th></tr></thead>
      <tbody id="move-list"></tbody>
    </table>
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
`
document.body.appendChild(sidebar)
sidebar.style.display = 'block' // show initially

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
scene.background = new THREE.Color(0x000000)

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
  color: 0x2a2a2a, // lighter than black to stand out
  roughness: 0.15,
  metalness: 0.3,
  envMap: envMap,
  envMapIntensity: 1.2 // stronger reflections
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
    gradient.addColorStop(0, 'rgba(100, 255, 180, 0.6)')
    gradient.addColorStop(0.5, 'rgba(100, 255, 180, 0.3)')
    gradient.addColorStop(1, 'rgba(100, 255, 180, 0)')

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

function finalizeTurn(overrideTurn?: string) {
  if (lastMove) {
    const notation = toChessNotation(lastMove)
    updateMoveHistory(notation, lastMove.piece.isWhite)
  }

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
}

function onMouseClick(event: MouseEvent) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  console.log("Click. P/A:", !!pendingPromotion, !!animatingPiece, "GO:", gameOver)

  if (animatingPiece || pendingPromotion) return

  raycaster.setFromCamera(mouse, camera)

  // if a piece is selected, check if we clicked a legal move square
  if (selectedPiece) {
    // check if we clicked on a highlight (legal move)
    const highlightIntersects = raycaster.intersectObjects(highlightMeshes, false)


    if (highlightIntersects.length > 0) {
      // get the position we clicked
      const clickedHighlight = highlightIntersects[0].object as THREE.Mesh
      const targetX = clickedHighlight.position.x
      const targetZ = clickedHighlight.position.z

      // convert world position back to board coordinates
      const boardX = Math.round((targetX / tileSize) + boardSize / 2 - 0.5)
      const boardZ = Math.round((targetZ / tileSize) + boardSize / 2 - 0.5)

      // check for castling move
      if (selectedPiece.type === 'king' && Math.abs(boardX - selectedPiece.x) === 2) {
        const isKingside = boardX > selectedPiece.x
        const rookX = isKingside ? 7 : 0
        const rookTargetX = isKingside ? 5 : 3
        const rook = allPieces.find(p => p.type === 'rook' && p.isWhite === selectedPiece.isWhite && p.x === rookX && p.z === boardZ)
        if (rook) {
          // move rook immediately (or could animate, but let's keep it simple for now)
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
        const captureZ = selectedPiece.z // The enemy pawn is on the same rank as the start position
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
        // remove captured piece from scene and array
        scene.remove(capturedPiece.group)
        const index = allPieces.indexOf(capturedPiece)
        if (index > -1) allPieces.splice(index, 1)
        isCapture = true
      }

      // start animation
      const startPos = selectedPiece.group.position.clone()
      const endPos = new THREE.Vector3(targetX, boardHeight, targetZ)

      animatingPiece = {
        group: selectedPiece.group,
        startPos,
        endPos,
        progress: 0,
        pieceData: selectedPiece
      }

      // update piece position data
      lastMove = { piece: selectedPiece, from: { x: selectedPiece.x, z: selectedPiece.z }, to: { x: boardX, z: boardZ }, isCapture }
      selectedPiece.x = boardX
      selectedPiece.z = boardZ
      selectedPiece.hasMoved = true


      // clear selection and highlights
      selectedPiece = null
      clearHighlights()

      return

    }
  }

  // check if we clicked a piece
  const allMeshes = allPieces.flatMap(p => p.group.children)
  const intersects = raycaster.intersectObjects(allMeshes, false)

  if (intersects.length > 0 && !gameOver) {
    // find which piece was clicked
    const clickedMesh = intersects[0].object
    const clickedPiece = allPieces.find(p => p.group.children.includes(clickedMesh))

    if (clickedPiece) {
      // only allow selecting pieces of current turn
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

  // piece animation
  if (animatingPiece) {
    animatingPiece.progress += 0.08 // animation speed

    if (animatingPiece.progress >= 1) {
      // animation 
      animatingPiece.group.position.copy(animatingPiece.endPos)

      // Check for promotion
      const p = animatingPiece.pieceData
      if (p.type === 'pawn' && (p.z === 0 || p.z === 7)) {
        showPromotionUI(p)
      } else {
        finalizeTurn()
      }

      animatingPiece = null
    } else {
      // smooth easing 
      const t = animatingPiece.progress
      const eased = 1 - Math.pow(1 - t, 3)

      // interpolate position
      animatingPiece.group.position.lerpVectors(
        animatingPiece.startPos,
        animatingPiece.endPos,
        eased
      )
    }
  }

  controls.update()
  renderer.render(scene, camera)
}

animate()
