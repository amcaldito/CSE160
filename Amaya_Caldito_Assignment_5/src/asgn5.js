import * as THREE from "three";
import getLayer from "../lib/getLayer.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();

const amount = 40;

// Layers for selective bloom
const BLOOM_LAYER = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_LAYER);

const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.set(0, 30, 120);
camera.lookAt(0, 0, 0);
camera.layers.enable(0);
camera.layers.enable(BLOOM_LAYER);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// skybox
const skyboxLoader = new THREE.TextureLoader();
const skyboxTexture = skyboxLoader.load('../lib/milky-way.jpg');
skyboxTexture.mapping = THREE.EquirectangularReflectionMapping;
scene.background = skyboxTexture;

// mats for selective bloom
const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const materials = {};

function darkenNonBloomed(obj) {
  if (obj.isMesh || obj.isLineSegments || obj.isLine) {
    if (bloomLayer.test(obj.layers) === false) {
      materials[obj.uuid] = obj.material;
      obj.material = darkMaterial;
    }
  }
}

function restoreMaterial(obj) {
  if (materials[obj.uuid]) {
    obj.material = materials[obj.uuid];
    delete materials[obj.uuid];
  }
}

// Post-processing with selective bloom
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 100);
bloomPass.threshold = 0;
bloomPass.strength = 1.0;
bloomPass.radius = 0.3;

// Bloom composer (renders only bloom layer objects)
const bloomComposer = new EffectComposer(renderer);
bloomComposer.renderToScreen = false;
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);

// Shader to combine bloom with base render
const mixPass = new ShaderPass(
  new THREE.ShaderMaterial({
    uniforms: {
      baseTexture: { value: null },
      bloomTexture: { value: bloomComposer.renderTarget2.texture }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D baseTexture;
      uniform sampler2D bloomTexture;
      varying vec2 vUv;
      void main() {
        gl_FragColor = texture2D(baseTexture, vUv) + texture2D(bloomTexture, vUv);
      }
    `
  }),
  'baseTexture'
);

// final composer (renders everything and adds bloom on top)
const finalComposer = new EffectComposer(renderer);
finalComposer.addPass(renderScene);
finalComposer.addPass(mixPass);
finalComposer.addPass(new OutputPass());

const ctrls = new OrbitControls(camera, renderer.domElement);
ctrls.enableDamping = true;
ctrls.target.set(0, 0, 0);

const size = 0.5;
const geometry = new THREE.SphereGeometry(size * 0.75, 8, 8);
const material = new THREE.MeshBasicMaterial();

const count = amount ** 3;
const mesh = new THREE.InstancedMesh(geometry, material, count);
scene.add(mesh);

// noise
const noise = new ImprovedNoise();
const nAmp = 0.1;
const nScale = 3;
let nz;

const offset = (amount - 1) * 0.5;
const dummy = new THREE.Object3D();
const clr = new THREE.Color(0x000000);

// metacube group
const metacube = new THREE.Group();
metacube.add(mesh);
scene.add(metacube);

// Video cube 1 - cat.mp4
const video = document.createElement('video');
video.src = '../lib/cat.mp4';
video.loop = true;
video.muted = true;
video.playsInline = true;
video.play();

const videoTexture = new THREE.VideoTexture(video);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;

const videoCubeGeometry = new THREE.BoxGeometry(45, 45, 45);
const videoCubeMaterial = new THREE.MeshBasicMaterial({
    map: videoTexture,
    side: THREE.DoubleSide
});
const videoCube = new THREE.Mesh(videoCubeGeometry, videoCubeMaterial);
videoCube.position.set(120, 20, -60);
videoCube.layers.set(0);
scene.add(videoCube);

// Video cube 3 - cat-huh.mp4
const video2 = document.createElement('video');
video2.src = '../lib/cat-huh.mp4';
video2.loop = true;
video2.muted = true;
video2.playsInline = true;
video2.play();

const videoTexture2 = new THREE.VideoTexture(video2);
videoTexture2.minFilter = THREE.LinearFilter;
videoTexture2.magFilter = THREE.LinearFilter;

const videoCube3Geometry = new THREE.BoxGeometry(20, 20, 20);
const videoCube3Material = new THREE.MeshBasicMaterial({
    map: videoTexture2,
    side: THREE.DoubleSide
});
const videoCube3 = new THREE.Mesh(videoCube3Geometry, videoCube3Material);
videoCube3.position.set(-50, 20, -40);
videoCube3.layers.set(0);
scene.add(videoCube3);

// Video cube 2 - war-cat.mp4
const video3 = document.createElement('video');
video3.src = '../lib/war-cat.mp4';
video3.loop = true;
video3.muted = true;
video3.playsInline = true;
video3.play();

const videoTexture3 = new THREE.VideoTexture(video3);
videoTexture3.minFilter = THREE.LinearFilter;
videoTexture3.magFilter = THREE.LinearFilter;

const videoCube2Geometry = new THREE.BoxGeometry(40, 40, 40);
const videoCube2Material = new THREE.MeshBasicMaterial({
    map: videoTexture3,
    side: THREE.DoubleSide
});
const videoCube2 = new THREE.Mesh(videoCube2Geometry, videoCube2Material);
videoCube2.position.set(-100, -30, 60);
videoCube2.layers.set(0);
scene.add(videoCube2);

// Load 3D model (cat-model.glb)
const gltfLoader = new GLTFLoader();
gltfLoader.load('../lib/cat-model.glb', (gltf) => {
    const catModel = gltf.scene;
    catModel.scale.set(10, 10, 10);
    catModel.position.set(0, 35, 0);
    catModel.traverse(obj => { obj.layers.set(0); });
    scene.add(catModel);
}, undefined, (error) => {
    console.error('Error loading cat model:', error);
});

metacube.userData = {
    update: function (t) {
    let i = 0;
    for (let x = 0; x < amount; x += 1) {
        for (let y = 0; y < amount; y += 1) {
            for (let z = 0; z < amount; z += 1) {
                nz = noise.noise(t + x * nAmp, t + y * nAmp, t + z * nAmp) * nScale;

                const px = offset - x;
                const py = offset - y;
                const pz = offset - z;
                dummy.position.set(px, py, pz);
                dummy.scale.setScalar(nz);

                clr.setHSL(0.95 + nz * 0.1, 1.0, 0.3 + nz * 0.1);
                mesh.setColorAt(i, clr);
                mesh.instanceColor.needsUpdate = true;

                dummy.updateMatrix();
                mesh.setMatrixAt(i, dummy.matrix);
                i += 1;
            }
        }
    }
    mesh.instanceMatrix.needsUpdate = true;
    }
}

// LIGHTING
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
scene.add(hemiLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 3.0);
directionalLight.position.set(50, 50, 50);
directionalLight.castShadow = true;
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xff00ff, 2, 100);
pointLight.position.set(-30, 20, 0);
scene.add(pointLight);

const spotLight = new THREE.SpotLight(0x00ffff, 3);
spotLight.position.set(0, 60, 30);
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 0.3;
spotLight.target.position.set(0, 0, 0);
scene.add(spotLight);
scene.add(spotLight.target);

const catLight = new THREE.PointLight(0xffffff, 50, 200);
catLight.position.set(0, 60, 30);
scene.add(catLight);

// Ring path sizing
const ringRadius = 45;
const ringHeight = 0;
const numRingPoints = 32;
const tunnelPoints = [];

for (let i = 0; i <= numRingPoints; i++) {
  const angle = (i / numRingPoints) * Math.PI * 2;
  tunnelPoints.push(new THREE.Vector3(
    Math.cos(angle) * ringRadius,
    ringHeight,
    Math.sin(angle) * ringRadius
  ));
}

const cameraSpline = new THREE.CatmullRomCurve3(tunnelPoints, true);

const tubularSegments = 30;
const radialSegments = 16;
const tubeRadius = 8;

const tubeGroup = new THREE.Group();
const ringPoints = [];

for (let i = 0; i <= tubularSegments; i++) {
  const t = i / tubularSegments;
  const pos = cameraSpline.getPointAt(t);
  const tangent = cameraSpline.getTangentAt(t).normalize();

  const up = new THREE.Vector3(0, 1, 0);
  if (Math.abs(tangent.dot(up)) > 0.99) up.set(1, 0, 0);
  const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
  const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

  const ring = [];
  for (let j = 0; j <= radialSegments; j++) {
    const angle = (j / radialSegments) * Math.PI * 2;
    const x = pos.x + tubeRadius * (Math.cos(angle) * normal.x + Math.sin(angle) * binormal.x);
    const y = pos.y + tubeRadius * (Math.cos(angle) * normal.y + Math.sin(angle) * binormal.y);
    const z = pos.z + tubeRadius * (Math.cos(angle) * normal.z + Math.sin(angle) * binormal.z);
    ring.push(new THREE.Vector3(x, y, z));
  }
  ringPoints.push(ring);

  const ringGeometry = new THREE.BufferGeometry().setFromPoints(ring);
  const ringLine = new THREE.Line(ringGeometry, new THREE.LineBasicMaterial({ color: 0x0088ff }));
  ringLine.layers.set(BLOOM_LAYER);
  tubeGroup.add(ringLine);
}

for (let j = 0; j < radialSegments; j++) {
  const longPoints = [];
  for (let i = 0; i <= tubularSegments; i++) {
    longPoints.push(ringPoints[i][j]);
  }
  const longGeometry = new THREE.BufferGeometry().setFromPoints(longPoints);
  const longLine = new THREE.Line(longGeometry, new THREE.LineBasicMaterial({ color: 0x0088ff }));
  longLine.layers.set(BLOOM_LAYER);
  tubeGroup.add(longLine);
}

scene.add(tubeGroup);

scene.fog = new THREE.FogExp2(0x000000, 0.008);

let cameraFollowsSpline = false;
const loopDuration = 30000;

const moveSpeed = 2;
const keys = { w: false, a: false, s: false, d: false, shift: false, q: false, e: false };

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'w') keys.w = true;
  if (key === 'a') keys.a = true;
  if (key === 's') keys.s = true;
  if (key === 'd') keys.d = true;
  if (key === 'shift') keys.shift = true;
  if (key === 'q') keys.q = true;
  if (key === 'e') keys.e = true;
  if (e.key === ' ') {
    cameraFollowsSpline = !cameraFollowsSpline;
    ctrls.enabled = !cameraFollowsSpline;
  }
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'w') keys.w = false;
  if (key === 'a') keys.a = false;
  if (key === 's') keys.s = false;
  if (key === 'd') keys.d = false;
  if (key === 'shift') keys.shift = false;
  if (key === 'q') keys.q = false;
  if (key === 'e') keys.e = false;
});

function updateCameraMovement() {
  if (cameraFollowsSpline) return;

  const speed = keys.shift ? moveSpeed * 3 : moveSpeed;
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);

  const right = new THREE.Vector3();
  right.crossVectors(camera.up, direction).normalize().negate();

  if (keys.w) { camera.position.addScaledVector(direction, speed); ctrls.target.addScaledVector(direction, speed); }
  if (keys.s) { camera.position.addScaledVector(direction, -speed); ctrls.target.addScaledVector(direction, -speed); }
  if (keys.a) { camera.position.addScaledVector(right, -speed); ctrls.target.addScaledVector(right, -speed); }
  if (keys.d) { camera.position.addScaledVector(right, speed); ctrls.target.addScaledVector(right, speed); }
  if (keys.q) { camera.position.y += speed; ctrls.target.y += speed; }
  if (keys.e) { camera.position.y -= speed; ctrls.target.y -= speed; }
}

function updateCamera(time) {
  if (!cameraFollowsSpline) return;

  const p = (time % loopDuration) / loopDuration;
  const pos = cameraSpline.getPointAt(p);
  const lookAt = cameraSpline.getPointAt((p + 0.03) % 1);

  camera.position.copy(pos);
  camera.lookAt(lookAt);
}

function animate(time = 0) {
  requestAnimationFrame(animate);
  const t = time * 0.00025;
  metacube.userData.update(t);
  updateCamera(time);
  updateCameraMovement();

  videoCube.rotation.x += 0.005;
  videoCube.rotation.y += 0.007;
  videoCube2.rotation.x += 0.006;
  videoCube2.rotation.y += 0.004;
  videoCube3.rotation.x += 0.004;
  videoCube3.rotation.y += 0.008;

  // Bloom pass — hide skybox, restrict camera to bloom layer only
  const bgCache = scene.background;
  scene.background = null;
  scene.traverse(darkenNonBloomed);
  camera.layers.set(BLOOM_LAYER);
  bloomComposer.render();
  camera.layers.enableAll();
  scene.traverse(restoreMaterial);
  scene.background = bgCache;

  // Final render — full scene + bloom composited on top
  finalComposer.render();

  if (!cameraFollowsSpline) ctrls.update();
}

animate();

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  bloomComposer.setSize(window.innerWidth, window.innerHeight);
  finalComposer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);