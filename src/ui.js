import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as THREE from 'three'

// ref for solar irradiances: https://en.wikipedia.org/wiki/Lux
export const camera = {
  static: () => {
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    )
    camera.position.x = -4
    camera.position.z = 4
    camera.position.y = 2
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    camera.lookAt(0, 0, 0)
    return camera
  },
  'car following': (carPosition) => {
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    )
    camera.position.x = -4
    camera.position.z = 4
    camera.position.y = 2
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    camera.lookAt(carPosition)
    return camera
  },
  car: (carPosition, carTarget) => {
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    )
    camera.position.set(carPosition.x + 0.4, carPosition.y + 0.1, carPosition.z)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    return camera
  },
}

export const params = {
  moveReflector: 0.68,
  // bulbPower: Object.keys( bulbLuminousPowers )[ 4 ],
  shading: 'Phong',
  camera: 'static',
}

export const shading = {
  basic: THREE.MeshBasicMaterial,
  Phong: THREE.MeshPhongMaterial,
  Gouraud: THREE.MeshLambertMaterial,
}

export let objects = []

const gui = new GUI()

gui.add(params, 'camera', Object.keys(camera))
// gui.add( params, 'bulbPower', Object.keys( bulbLuminousPowers ) ).onChange(()=>{
//     alert("changed");
// });
gui.add(params, 'shading', Object.keys(shading)).onChange(() => {
  objects.forEach((obj) => {
    const newMaterial = new shading[params.shading]()
    newMaterial.map = obj.material.map
    newMaterial.metalnessMap = obj.material.metalnessMap
    //newMaterial.flatShading = true;
    obj.material = newMaterial
  })
})
gui.add(params, 'moveReflector', -1, 1)
gui.open()
