// Resources
// https://threejsfundamentals.org/threejs/lessons/threejs-responsive.html

import * as THREE from 'https://unpkg.com/three@latest/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@latest/examples/jsm/controls/OrbitControls.js';

import { Rhino3dmLoader } from 'https://unpkg.com/three@latest/examples/jsm/loaders/3DMLoader.js';

THREE.Object3D.DefaultUp = new THREE.Vector3( 0, 0, 1 );

let renderer, aspect, scene, camera, controls, sceneBox;

// For hover / selection
let raycaster, mouse, selection;

// Initialize scene
function init() {

  const canvas = document.querySelector('#c');
  renderer = new THREE.WebGL1Renderer({
                                      canvas,
                                      alphas:true,
                                      premultipliedAlpha: false,
                                      });
  
  renderer.setClearColor( new THREE.Color(0xffffff), 0 );
  renderer.setPixelRatio( window.devicePixelRatio );

  aspect = canvas.clientWidth / canvas.clientHeight;

  scene = new THREE.Scene();
  
  // Orthographic Camera
  // https://threejs.org/docs/#api/en/cameras/OrthographicCamera
  camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0, 20000);
  camera.position.set(-100, -100, 100);
  // Orbit Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  // Scene bounding box
  sceneBox = new THREE.Box3();

  // hover / selection                                 
  raycaster = new THREE.Raycaster;
  mouse = new THREE.Vector2();
  selection = [];

  
  // Visualize origin
  // var axesHelper = new THREE.AxesHelper( 200 );
  // scene.add( axesHelper );

  // Lighting
  {				
    scene.add( new THREE.AmbientLight( 0xFFEDBA, 0.1 ) );
    // const dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    // dirLight.position.set(250, 250, 2000);
    // dirLight.lookAt(0,0,0);
    // scene.add(dirLight);
    // let hemiLight = new THREE.HemisphereLight( 0xffffbb, 0x5544BB, 0.4 );
    // scene.add( hemiLight );
    var light = new THREE.HemisphereLight( 0xffffff, 0x080808, 1 );
    light.position.set( - 10.25, 10, 10.25 );
    scene.add( light );
  }

  // Load Rhino File
  var loader = new Rhino3dmLoader();
  loader.setLibraryPath( './libs/rhino3dm/' );

  loader.load( './maison.3dm', function ( rhinoDoc ) {
    // We can see properties of rhinoDoc
    // console.log(rhinoDoc);

    rhinoDoc.name = "rhinoDoc";

    for(let i = 0; i < rhinoDoc.children.length; i++){
      // if(rhinoDoc.children[i].type !== 'Object3D' && rhinoDoc.children[i].type !== 'Mesh') continue;
      
      // Set Material from Rhino Display Color
      let col = rhinoDoc.children[i].userData.attributes.drawColor;

      let mat = new THREE.MeshLambertMaterial( {
        color: new THREE.Color(col.r/255, col.g/255, col.b/255),
        side: THREE.DoubleSide,
      } );

      if (rhinoDoc.children[i].children.length < 1){
        rhinoDoc.children[i].material = mat;
      } else {
        let box = new THREE.Box3().setFromObject(rhinoDoc.children[i]);
        box.getCenter(rhinoDoc.children[i].position);

        for (let m of rhinoDoc.children[i].children){
          m.material = mat;
          
          box.getCenter(m.position);
          m.position.multiplyScalar(-1);
        }
      }
    }

    scene.add( rhinoDoc );
    console.log(scene);
    console.log(scene.children.filter((a) => a.type === 'Object3D').length > 0);
    sceneBox.setFromObject(rhinoDoc);
    zoomToScene();
  });
  
  // Hover
  document.querySelector("#c").addEventListener('mousemove', mouseMove, false);
  document.querySelector("#c").addEventListener('mouseup', mouseUp, false);
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
 
  scene.traverse((obj) => {
      if(obj.material){
        obj.material.emissiveIntensity = 0.0;
      }
  })

  // Using the name for our Rhino document
  let doc = scene.children.find(a => a.name === 'rhinoDoc');

  if(typeof doc !== 'undefined'){
    
    let intersects = raycaster.intersectObjects(doc.children, true);
    // console.log(intersects);
    
    if(intersects.length > 0 ){

      let hover = intersects[0].object;

      if(hover.type == "Mesh"){
        // Get parent of mesh
        if(hover.parent.name !== 'rhinoDoc'){
          hover = hover.parent;
          
          for(let c of hover.children){
            c.material.emissive.set(new THREE.Color(0xffeeee));
            c.material.emissiveIntensity = 0.65;
          }
        } else {
            hover.material.emissive.set(new THREE.Color(0xffeeee));
            hover.material.emissiveIntensity = 0.65;
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
  // camera.position.set((sceneBox.max.x - sceneBox.min.x) / 2, (sceneBox.max.y - sceneBox.min.y), (sceneBox.max.z - sceneBox.min.z)/2);
  
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
    renderer.setSize(width, height, false);
  }
  return needResize;
}

//https://threejsfundamentals.org/threejs/lessons/threejs-picking.html
function getCanvasRelativePosition(event) {
  let canvas = renderer.domElement;
  let rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * canvas.width  / rect.width,
    y: (event.clientY - rect.top ) * canvas.height / rect.height,
  };
}

// Mouse coords are in "Normalized Device Coordinates"
// Meaning (-1 , 1) with Y flipped
function mouseMove(e){
  // let rect = canvas.getBoundingClientRect();
  let canvas = renderer.domElement;
  let pos = getCanvasRelativePosition(e);

  mouse.x = (pos.x / canvas.width) * 2 - 1;
  mouse.y = (pos.y / canvas.height) * -2 + 1;
  
  // console.log(mouse);
}

function mouseUp(e){
  
}

init();
