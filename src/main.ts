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



// set up pieces for reference
function createPawn(color: number, x_coord: number, z_coord: number) {
  const group = new THREE.Group()

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.4, 0.1, 32),
    new THREE.MeshStandardMaterial({ color })
  )
  base.position.y = 0.05
  base.castShadow = true
  base.receiveShadow = true
  group.add(base)

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.3, 0.8, 32),
    new THREE.MeshStandardMaterial({ color })
  )
  body.position.y = 0.5
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 32, 32),
    new THREE.MeshStandardMaterial({ color })
  )
  head.position.y = 1.0
  head.castShadow = true
  head.receiveShadow = true
  group.add(head)

  // align with board squares
  const x = (x_coord - boardSize / 2 + 0.5) * tileSize
  const z = (z_coord - boardSize / 2 + 0.5) * tileSize
  group.position.set(x, boardHeight, z)
  scene.add(group)
}

createPawn(0xff4444, 0, 0) // corner
createPawn(0x4444ff, 7, 7) // opposite corner

const box = new THREE.Mesh(
  new THREE.BoxGeometry(0.8, 0.8, 0.8),
  new THREE.MeshStandardMaterial({ color: 0x888888 })
)
box.position.set(0.5, boardHeight + 0.4, 0.5) // sitting on a square
box.castShadow = true
box.receiveShadow = true
scene.add(box)

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
