//contextMenu.js

// let visibility = false;

let posX = 0;
let posY = 0;

let dragging = false;

function showContextMenu(e) {
  e.preventDefault();

  posX = e.clientX;
  posY = e.clientY;

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

function main(){
  document.querySelector('#c').addEventListener("contextmenu", showContextMenu);
  document.querySelector('#closeMenu').addEventListener("mouseup", closeMenu);

  // dragging
  document.querySelector('#contextMenu').addEventListener("mousedown", startDrag);

  window.addEventListener("mousemove", doDrag);
  window.addEventListener("mouseup", endDrag);
}

main();