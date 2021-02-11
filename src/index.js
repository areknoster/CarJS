import * as THREE from 'three'
import { WEBGL } from './webgl'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { params, camera, objects } from './ui'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

if (WEBGL.isWebGLAvailable()) {
  let scene, renderer, bulbLight, bulbMat, hemiLight
  const wheels = []

  let ballMat, cubeMat, floorMat

  let previousShadowMap = false
  let pivot = new THREE.Group()
  const carRadius = 1.8
  const ambientLight = new THREE.AmbientLight(0xffffff)

  init()
  animate()

  function init() {
    const container = document.getElementById('container')

    scene = new THREE.Scene()

    scene.fog = new THREE.Fog(0x101010, 3, 15)
    scene.add(ambientLight)
    loadCar()
    loadCarReflectors()
    loadBulbLight()
    loadMirror()

    floorMat = new THREE.MeshStandardMaterial({
      roughness: 0.8,
      color: 0xffffff,
      metalness: 0.2,
      bumpScale: 0.0005,
    })
    const textureLoader = new THREE.TextureLoader()
    textureLoader.load('../textures/hardwood2_diffuse.jpg', function (map) {
      map.wrapS = THREE.RepeatWrapping
      map.wrapT = THREE.RepeatWrapping
      map.anisotropy = 4
      map.repeat.set(10, 24)
      map.encoding = THREE.sRGBEncoding
      floorMat.map = map
      floorMat.needsUpdate = true
    })
    textureLoader.load('../textures/hardwood2_bump.jpg', function (map) {
      map.wrapS = THREE.RepeatWrapping
      map.wrapT = THREE.RepeatWrapping
      map.anisotropy = 4
      map.repeat.set(10, 24)
      floorMat.bumpMap = map
      floorMat.needsUpdate = true
    })
    textureLoader.load('../textures/hardwood2_roughness.jpg', function (map) {
      map.wrapS = THREE.RepeatWrapping
      map.wrapT = THREE.RepeatWrapping
      map.anisotropy = 4
      map.repeat.set(10, 24)
      floorMat.roughnessMap = map
      floorMat.needsUpdate = true
    })

    cubeMat = new THREE.MeshStandardMaterial({
      roughness: 0.7,
      color: 0xffffff,
      bumpScale: 0.002,
      metalness: 0.2,
    })
    textureLoader.load('../textures/brick_diffuse.jpg', function (map) {
      map.wrapS = THREE.RepeatWrapping
      map.wrapT = THREE.RepeatWrapping
      map.anisotropy = 4
      map.repeat.set(1, 1)
      map.encoding = THREE.sRGBEncoding
      cubeMat.map = map
      cubeMat.needsUpdate = true
    })
    textureLoader.load('../textures/brick_bump.jpg', function (map) {
      map.wrapS = THREE.RepeatWrapping
      map.wrapT = THREE.RepeatWrapping
      map.anisotropy = 4
      map.repeat.set(1, 1)
      cubeMat.bumpMap = map
      cubeMat.needsUpdate = true
    })

    ballMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 1.0,
    })
    textureLoader.load('../textures/planets/earth_atmos_2048.jpg', function (
      map
    ) {
      map.anisotropy = 4
      map.encoding = THREE.sRGBEncoding
      ballMat.map = map
      ballMat.needsUpdate = true
    })
    textureLoader.load('../textures/planets/earth_specular_2048.jpg', function (
      map
    ) {
      map.anisotropy = 4
      map.encoding = THREE.sRGBEncoding
      ballMat.metalnessMap = map
      ballMat.needsUpdate = true
    })

    const floorGeometry = new THREE.PlaneGeometry(20, 20)
    const floorMesh = new THREE.Mesh(floorGeometry, floorMat)
    floorMesh.receiveShadow = true
    floorMesh.rotation.x = -Math.PI / 2.0
    objects.push(floorMesh)
    scene.add(floorMesh)

    const ballGeometry = new THREE.SphereGeometry(0.25, 32, 32)
    const ballMesh = new THREE.Mesh(ballGeometry, ballMat)
    ballMesh.position.set(1, 0.25, 1)
    ballMesh.rotation.y = Math.PI
    ballMesh.castShadow = true
    objects.push(ballMesh)
    scene.add(ballMesh)

    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)
    const boxMesh = new THREE.Mesh(boxGeometry, cubeMat)
    boxMesh.position.set(-0.5, 0.25, -1)
    boxMesh.castShadow = true
    objects.push(boxMesh)
    scene.add(boxMesh)

    const boxMesh2 = new THREE.Mesh(boxGeometry, cubeMat)
    boxMesh2.position.set(0, 0.25, -5)
    boxMesh2.castShadow = true
    objects.push(boxMesh2)
    scene.add(boxMesh2)

    const boxMesh3 = new THREE.Mesh(boxGeometry, cubeMat)
    boxMesh3.position.set(7, 0.25, 0)
    boxMesh3.castShadow = true
    objects.push(boxMesh3)
    scene.add(boxMesh3)

    renderer = new THREE.WebGLRenderer()
    renderer.physicallyCorrectLights = true
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.shadowMap.enabled = true
    renderer.toneMapping = THREE.ReinhardToneMapping
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    container.appendChild(renderer.domElement)

    window.addEventListener('resize', onWindowResize)
  }

  function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  function animate(time) {
    requestAnimationFrame(animate)
    render()
  }
  function loadCar() {
    const shadow = new THREE.TextureLoader().load(
      '../static/models/ferrari_ao.png'
    )

    const draco = new DRACOLoader()
    draco.setDecoderConfig({ type: 'js' })
    draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')

    const loader = new GLTFLoader().setPath('../static/models/')
    loader.setDRACOLoader(draco)

    loader.load('ferrari.glb', function (gltf) {
      const carModel = gltf.scene.children[0]
      carModel.castShadow = true
      carModel.name = 'car'

      wheels.push(
        carModel.getObjectByName('wheel_fl'),
        carModel.getObjectByName('wheel_fr'),
        carModel.getObjectByName('wheel_rl'),
        carModel.getObjectByName('wheel_rr')
      )

      // shadow
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4),
        new THREE.MeshBasicMaterial({
          map: shadow,
          blending: THREE.MultiplyBlending,
          toneMapped: false,
          transparent: true,
        })
      )
      mesh.rotation.x = Math.PI / 2
      mesh.renderOrder = 2
      objects.push(mesh)
      carModel.add(mesh)
      carModel.position.set(carRadius, 0, 0)
      carModel.scale.set(0.1, 0.1, 0.1)
      pivot.add(carModel)

      scene.add(pivot)
    })
  }

  function loadBulbLight() {
    const bulbGeometry = new THREE.SphereGeometry(0.02, 16, 8)
    const bulbMat = new THREE.MeshStandardMaterial({
      emissive: 0xffffee,
      emissiveIntensity: 10,
      color: 0x000000,
    })

    const bulbLight1 = new THREE.PointLight(0xffee88, 1, 100, 2)
    bulbLight1.power = 1000
    bulbLight1.intensity = 10

    bulbLight1.add(new THREE.Mesh(bulbGeometry, bulbMat))
    bulbLight1.castShadow = true

    const bulbLight2 = bulbLight1.clone(true)
    bulbLight1.position.set(0, 2, 0)
    bulbLight2.position.set(1, 1, 0)
    scene.add(bulbLight1)
    scene.add(bulbLight2)
  }

  function loadCarReflectors() {
    const light = new THREE.SpotLight(0xffffff, 10000)

    light.position.set(carRadius, 0.1, -0.1)
    light.angle = 0.2

    const target = new THREE.Object3D()
    target.position.set(carRadius, 0, -1)
    target.name = 'reflector_target'
    pivot.add(target)
    light.target = target
    light.castShadow = true
    light.name = 'reflector'

    pivot.add(light)
  }

  function loadMirror() {
    const SIZE = 0.5
    const geometry = new THREE.PlaneGeometry(SIZE, SIZE)
    const verticalMirror = new Reflector(geometry, {
      clipBias: 0.003,
      color: 0x889999,
    })

    verticalMirror.position.x = -0.5
    verticalMirror.position.z = -0.74
    verticalMirror.position.y = SIZE / 2

    scene.add(verticalMirror)
  }

  function render() {
    renderer.toneMappingExposure = Math.pow(0.7, 5.0) // to allow for very bright scenes.
    renderer.shadowMap.enabled = true

    if (params.shadows !== previousShadowMap) {
      ballMat.needsUpdate = true
      cubeMat.needsUpdate = true
      floorMat.needsUpdate = true
      previousShadowMap = params.shadows
    }

    const time = Date.now() * 0.0005
    for (let i = 0; i < wheels.length; i++) {
      wheels[i].rotation.x = -time * Math.PI * 100
    }
    pivot.rotation.y += 0.01

    const cam = camera[params.camera]
    const car = pivot.getObjectByName('car')
    const carPosition = car
      ? car.getWorldPosition(new THREE.Vector3(0, 0, 0))
      : new THREE.Vector3(0, 0, 0)

    const reflectorTarget = pivot.getObjectByName('reflector_target')
    reflectorTarget.position.x = carRadius + params.moveReflector

    ambientLight.intensity = ((Math.cos(time) + 1) * 10) % 20
    renderer.render(scene, cam(carPosition, reflectorTarget))
  }
} else {
  var warning = WEBGL.getWebGLErrorMessage()
  document.body.appendChild(warning)
}
