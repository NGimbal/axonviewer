// Resources
// https://threejsfundamentals.org/threejs/lessons/threejs-responsive.html

import * as THREE from 'https://unpkg.com/three@latest/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@latest/examples/jsm/controls/OrbitControls.js';

import { Rhino3dmLoader } from 'https://unpkg.com/three@latest/examples/jsm/loaders/3DMLoader.js';

THREE.Object3D.DefaultUp = new THREE.Vector3( 0, 0, 1 );

let renderer, aspect, scene, camera, controls, sceneBox;

// For hover / selection
let raycaster, mouse;

// Initialize scene
function init() {

  const canvas = document.querySelector('#c');
  renderer = new THREE.WebGL1Renderer({
                                      canvas,
                                      alphas:true,
                                      premultipliedAlpha: false,
                                      });
  
  renderer.setClearColor( new THREE.Color(0xdae9f2), 0 );
  renderer.setPixelRatio( window.devicePixelRatio );

  aspect = canvas.clientWidth / canvas.clientHeight;

  scene = new THREE.Scene();
  
  // Orthographic Camera
  // https://threejs.org/docs/#api/en/cameras/OrthographicCamera
  camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, -5000, 5000);
  
  controls = new OrbitControls(camera, renderer.domElement);
  
  sceneBox = new THREE.Box3();

  // For hover / selection                                 
  raycaster = new THREE.Raycaster;
  mouse = new THREE.Vector2();

  controls.update();
                                      
  var axesHelper = new THREE.AxesHelper( 200 );
  scene.add( axesHelper );

  // Lighting
  {				
    scene.add( new THREE.AmbientLight( 0xFFEDBA, 1 ) );
    
    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 2);
    dirLight.position.set(250, 250, 2000);
    dirLight.lookAt(0,0,0);
    scene.add(dirLight);

    let hemiLight = new THREE.HemisphereLight( 0xffffbb, 0x5544BB, 1 );
    scene.add( hemiLight );
  }

  // Load Rhino File
  var loader = new Rhino3dmLoader();
  loader.setLibraryPath( './libs/rhino3dm/' );

  loader.load( './simple.3dm', function ( object ) {
    console.log(object);
    console.log(object.children.length);
    // Set Bounding Box
    scene.add( object );

    for(let i = 0; i < object.children.length; i++){
      let col = object.children[i].userData.attributes.objectColor;
      let mat = new THREE.MeshStandardMaterial({transparent:true,opacity:0.5});
     
      mat.color = col;
      
      for (let m of object.children[i].children){
        m.material = mat;
      }
    }

    sceneBox.setFromObject(object);

    zoomToScene();
  });
  
  // Hover
  document.querySelector("#c").addEventListener('mousemove', mouseMove, false);
  requestAnimationFrame(render);
}

// Render scene
function render(time) {
  controls.update();
  
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    aspect = canvas.clientWidth / canvas.clientHeight;
    let side = Math.max(sceneBox.max.x - sceneBox.min.x, sceneBox.max.z - sceneBox.min.z);
    
    // Ortho camera resize
    camera.left = aspect * side * -1;
    camera.right = aspect * side;
    camera.bottom = side * -1;
    camera.top = side;


    camera.updateProjectionMatrix();
    controls.update();
  }

  raycaster.setFromCamera(mouse, camera);
// console.log(scene.children[4]);
  if(scene.children[4]){
    let intersects = raycaster.intersectObjects(scene.children, true);
    
    if(intersects.length > 1){
      let hover = intersects[0].object;

      if(hover.type == "Mesh"){
        let parent = hover.parent;

        for(let i = 0; i < parent.children.length; i++){
          parent.children[i].material.color = new THREE.Color(0xff0000);
        }
      }
    }

  }
  

  renderer.render(scene, camera);

  requestAnimationFrame(render);
}

// Zoom ortho camera to sceneBox
function zoomToScene () {
  // Choose largest dimension of scenebox to set the larger dimension of the viewport
  let side = Math.max(sceneBox.max.x - sceneBox.min.x, sceneBox.max.z - sceneBox.min.z);

  // Camera position and controls can't be the same
  controls.target.set((sceneBox.max.x - sceneBox.min.x)/2, (sceneBox.max.y - sceneBox.min.y)/2, (sceneBox.max.z - sceneBox.min.z)/2);
  camera.position.set((sceneBox.max.x - sceneBox.min.x) / 2, (sceneBox.max.y - sceneBox.min.y), (sceneBox.max.z - sceneBox.min.z)/2);
  
  camera.left = aspect * side * -1;
  camera.right = aspect * side;
  camera.bottom = side * -1;
  camera.top = side;

  camera.updateProjectionMatrix();
  controls.update();
}

// Resize canvas
function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const pixelRatio = window.devicePixelRatio;
  const width  = canvas.clientWidth | 0;
  const height = canvas.clientHeight | 0;
  const needResize = canvas.width !== width * pixelRatio || canvas.height !== height * pixelRatio ;
  if (needResize) {
    // console.log("hi!")
    renderer.setSize(width, height, false);
  }
  return needResize;
}

function mouseMove(e){
  let canvas = renderer.domElement;

  mouse.x = ( e.offsetX / canvas.clientWidth ) * 2 - 1;
  mouse.y = - ( e.offsetY / canvas.clientHeight ) * 2 + 1;
}

init();
