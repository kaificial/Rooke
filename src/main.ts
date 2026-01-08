import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'


const scene = new THREE.Scene()
scene.background = new THREE.Color(0x1a1a1a)

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
const planeSize = 20
const gridHelper = new THREE.GridHelper(planeSize, 20, 0x444444, 0x222222)
scene.add(gridHelper)

const groundGeometry = new THREE.PlaneGeometry(planeSize, planeSize)
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x333333,
  roughness: 0.8,
  metalness: 0.2
})
const ground = new THREE.Mesh(groundGeometry, groundMaterial)
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

// set up pieces for reference
function createPawn(color: number, x: number, z: number) {
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

  group.position.set(x, 0, z)
  scene.add(group)
}

createPawn(0xff4444, 1, 1)
createPawn(0x4444ff, -1, -1)

const box = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x888888 })
)
box.position.set(0, 0.5, 0)
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
