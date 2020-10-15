// Resources
// https://threejsfundamentals.org/threejs/lessons/threejs-responsive.html

import * as THREE from 'https://unpkg.com/three@latest/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@latest/examples/jsm/controls/OrbitControls.js';

import { Rhino3dmLoader } from 'https://unpkg.com/three@latest/examples/jsm/loaders/3DMLoader.js';

THREE.Object3D.DefaultUp = new THREE.Vector3( 0, 0, 1 );

let renderer, aspect, scene, camera, controls, sceneBox;

// For hover / selection
let raycaster, mouse, selection, hover;

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
  camera.position.set(-100, -100, 200);
  // Orbit Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.update();

  // Scene bounding box
  sceneBox = new THREE.Box3();

  // hover / selection                                 
  raycaster = new THREE.Raycaster;
  mouse = new THREE.Vector2();
  selection = [];
  hover = {};

  // Visualize origin
  var axesHelper = new THREE.AxesHelper( 200 );
  scene.add( axesHelper );

  // Lighting
  {				
    // scene.add( new THREE.AmbientLight( 0xffffff, 0.75 ) );

    // let dirLight = new THREE.DirectionalLight(0x0000ff, 0.125);
    // dirLight.position.set(100, 100, 400);
    // dirLight.lookAt(0,0,0);
    // scene.add(dirLight);
    // let dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 15, 0xff0000);
    // scene.add(dirLightHelper);

    let hemiLight = new THREE.HemisphereLight( 0xffffff, 0x080808, 0.75 );
    hemiLight.position.set( 0, 0, 400 );
    scene.add( hemiLight );
    // let hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 8, 0xff0000);
    // scene.add( hemiLightHelper );
  }

  // Load Rhino File
  var loader = new Rhino3dmLoader();
  loader.setLibraryPath( './libs/rhino3dm/' );

  loader.load( './maison.3dm', function ( rhinoDoc ) {
    // We can see properties of rhinoDoc
    // console.log(rhinoDoc);

    rhinoDoc.name = "rhinoDoc";

    for(let i = 0; i < rhinoDoc.children.length; i++){      
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

    sceneBox.setFromObject(rhinoDoc);
    let boxHelper = new THREE.Box3Helper(sceneBox, 0x0000ff);
    scene.add(boxHelper);
    zoomToScene();
  });

  // Hover
  document.querySelector("#c").addEventListener('mousemove', mouseMove);
  document.querySelector("#c").addEventListener('pointerdown', mouseUp);

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
 
  // scene.traverse((obj) => {
  //     if(obj.material){
  //       obj.material.emissiveIntensity = 0.0;
  //     }
  // })

  if(typeof hover.parent !== 'undefined'){
    hover.traverse((m) => {
      // console.log(m);
      if(!m.material) return;
      m.material.emissiveIntensity = 0.0;
    })
    hover = {};
    // controls.enabled = true;
  }

  // Using the name for our Rhino document
  let doc = scene.children.find(a => a.name === 'rhinoDoc');

  if(typeof doc !== 'undefined'){
    
    let intersects = raycaster.intersectObjects(doc.children, true);
    
    // If we've intersected things
    if(intersects.length > 0 ){

      // Intersects are sorted by distance to camera
      // Item 0 is the closest object
      hover = intersects[0].object;

      // Grab the top level object that has access to
      // attributes from Rhino
      while(hover.parent.name !== 'rhinoDoc'){
        hover = hover.parent;
      }

      // Traverse is called on hover and all descendants
      hover.traverse((m) => {
        // Object3D won't have a material, just descendants
        if(!m.material) return;
        m.material.emissive.set(new THREE.Color(0xffeeee));
        m.material.emissiveIntensity = 0.35;
      })
      // controls.enabled = false;
    }
  }

  renderer.render(scene, camera);

  requestAnimationFrame(render);
}

// Zoom ortho camera to sceneBox
function zoomToScene () {
  // Choose largest dimension of scenebox to set the larger dimension of the viewport
  let side = Math.max(sceneBox.max.x - sceneBox.min.x, sceneBox.max.z - sceneBox.min.z);

  // Note: camera position and controls can't be the same
  controls.target.set((sceneBox.max.x - sceneBox.min.x)/2, (sceneBox.max.y - sceneBox.min.y)/2, (sceneBox.max.z - sceneBox.min.z)/2);
  
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
  e.stopPropagation();
  // e.preventDefault();
  // let rect = canvas.getBoundingClientRect();
  let canvas = renderer.domElement;
  let pos = getCanvasRelativePosition(e);

  mouse.x = (pos.x / canvas.width) * 2 - 1;
  mouse.y = (pos.y / canvas.height) * -2 + 1;
  
  // console.log(mouse);
}

function mouseUp(e){
  // e.preventDefault();
  e.stopPropagation();

  console.log(hover);
  if(typeof hover.parent !== 'undefined' && !selection.filter(a => a.uuid === hover.uuid).length){
    selection.push(hover);
    selection.map(a => a.traverse((b) => {
        if(b.material) b.material.color.set(0xff0000);
        return b;
      })
    );
    hover = {};
    console.log(selection);
  } else {
    // deselect
    selection.map(a => a.traverse((b) => {
        let col = a.userData.attributes.drawColor;
        let color = new THREE.Color(col.r/255, col.g/255, col.b/255);
        if(b.material) b.material.color.set(color);
        return b;
      })
    );
    selection.length = 0;
  }
  // controls.enabled = true;
}

init();
