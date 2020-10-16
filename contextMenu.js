//contextMenu.js

import {selection} from './axonViewer.js';

let posX = 0;
let posY = 0;

let dragging = false;

//------ open, drag, close ------
function showContextMenu(e) {
  e.preventDefault();
  e.stopPropagation();

  posX = e.clientX;
  posY = e.clientY;

  console.log(selection);
  if(selection.length){
    setMenuState(selection[0]);
  }

  document.querySelector("#contextMenu").style.visibility = "visible";
  document.querySelector("#contextMenu").style.top = posY + "px";
  document.querySelector("#contextMenu").style.left = posX + "px";
}

function startDrag(e) {
  if(e.target.id != "contextMenu") return;
  dragging = true;
}

function doDrag(e) {
  if(!dragging) return;
  
  e.stopPropagation();
  e.preventDefault();
  posX = e.clientX;
  posY = e.clientY;

  document.querySelector("#contextMenu").style.top = posY + "px";
  document.querySelector("#contextMenu").style.left = posX + "px";
}

function endDrag(e) {
  if(dragging) e.preventDefault();
  dragging = false;
}

function closeMenu(e){
  e.preventDefault();
  document.querySelector("#contextMenu").style.visibility = "hidden";

  dragging = false;
}
//------ open, drag, close ------

function setMenuState(obj){
  console.log(obj.userData.explode);
  document.querySelector('#X').value = obj.userData.explode.vec.x.toFixed(2);
  document.querySelector('#Y').value = obj.userData.explode.vec.y.toFixed(2);
  document.querySelector('#Z').value = obj.userData.explode.vec.z.toFixed(2);
  document.querySelector('#maxExplode').value = obj.userData.explode.max;
  // document.querySelector('#modelColor').value = 
}


function main(){
  //------ open, drag, close ------
  document.querySelector('#c').addEventListener("contextmenu", showContextMenu);
  document.querySelector('#closeMenu').addEventListener("mouseup", closeMenu);

  document.querySelector('#contextMenu').addEventListener("mousedown", startDrag);

  window.addEventListener("mousemove", doDrag);
  window.addEventListener("mouseup", endDrag);
  //------ open, drag, close ------

  // document.querySelector('#X').addEventListener('input', changeX);
  // document.querySelector('#Y').addEventListener('input', changeY);
  // document.querySelector('#Z').addEventListener('input', changeZ);
  // document.querySelector('#maxExplode').addEventListener('input', changeMaxExplode);
  // document.querySelector('#modelColor').addEventListener('input', changeColor);
}

main();