import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'


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

//Initialize board with pieces
// White pieces
for (let i = 0; i < 8; i++) createPiece('pawn', true, i, 1)
createPiece('rook', true, 0, 0)
createPiece('knight', true, 1, 0)
createPiece('bishop', true, 2, 0)
createPiece('queen', true, 3, 0)
createPiece('king', true, 4, 0)
createPiece('bishop', true, 5, 0)
createPiece('knight', true, 6, 0)
createPiece('rook', true, 7, 0)

// Black pieces
for (let i = 0; i < 8; i++) createPiece('pawn', false, i, 6)
createPiece('rook', false, 0, 7)
createPiece('knight', false, 1, 7)
createPiece('bishop', false, 2, 7)
createPiece('queen', false, 3, 7)
createPiece('king', false, 4, 7)
createPiece('bishop', false, 5, 7)
createPiece('knight', false, 6, 7)
createPiece('rook', false, 7, 7)

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
