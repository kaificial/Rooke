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

// set up board chess
const boardSize = 8
const tileSize = 1
const boardHeight = 0.1

// board group
const boardGroup = new THREE.Group()
scene.add(boardGroup)

// board base
const baseGeometry = new THREE.BoxGeometry(boardSize * tileSize + 0.4, boardHeight, boardSize * tileSize + 0.4)
const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x442200 }) // wooden dark brown
const base = new THREE.Mesh(baseGeometry, baseMaterial)
base.position.y = boardHeight / 2
base.receiveShadow = true
boardGroup.add(base)

// squares
const lightSquareMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee })
const darkSquareMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 })

for (let i = 0; i < boardSize; i++) {
  for (let j = 0; j < boardSize; j++) {
    const squareGeometry = new THREE.PlaneGeometry(tileSize, tileSize)
    const material = (i + j) % 2 === 0 ? lightSquareMaterial : darkSquareMaterial
    const square = new THREE.Mesh(squareGeometry, material)

    square.rotation.x = -Math.PI / 2
    square.position.x = (i - boardSize / 2 + 0.5) * tileSize
    square.position.z = (j - boardSize / 2 + 0.5) * tileSize
    square.position.y = boardHeight + 0.001 // slightly above base
    square.receiveShadow = true
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
