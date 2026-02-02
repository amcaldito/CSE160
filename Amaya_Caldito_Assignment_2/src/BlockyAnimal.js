// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global Variables
let canvas, gl, a_Position, u_FragColor, u_Size, u_ModelMatrix, u_GlobalRotateMatrix;

function setupWebGL() {
  canvas = document.getElementById('webgl');
  
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Globals related to UI
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT; // POINT=0, TRIANGLE=1, CIRCLE=2
let g_globalAngle = 0;
let bodyAngle = 0;
let g_magentaAngle = 0;
let g_yellowAnimation = false;
let g_magentaAnimation = false;
let g_legsAngle = 0;
let g_legsAnimation = false;  

let g_tailAngle = 0;
let g_tailAnimation = false;

let g_pokeAnimation = false;
let g_pokeStartTime = -5.0;
let g_eyeBlinkScale = 1.0;

let g_tail1Angle = 0, g_tail2Angle = 0, g_tail3Angle = 0;
let g_tail1Animation = false, g_tail2Animation = false, g_tail3Animation = false;

function addActionsForHtmlUI() {
  // s
  //document.getElementById('clear').onclick = function() { g_shapesList = []; renderAllShapes(); };
  

  
  // document.getElementById('bodyOn').onclick = function() { g_yellowAnimation = true; };
  // document.getElementById('bodyOff').onclick = function() { g_yellowAnimation = false; };

  document.getElementById('animationMagentaOnButton').onclick = function() { g_magentaAnimation = true; };
  document.getElementById('animationMagentaOffButton').onclick = function() { g_magentaAnimation = false; };

  document.getElementById('animationLegsOnButton').onclick = function() {g_legsAnimation = true;};

  document.getElementById('animationLegsOffButton').onclick = function() {g_legsAnimation = false; };
  //document.getElementById('legsSlide').addEventListener('mousemove', function() { g_legsAngle = this.value; renderAllShapes(); });
  document.getElementById('legsSlide').addEventListener('mousemove', function() { g_legsAngle = this.value; renderAllShapes(); });

  document.getElementById('bodySlide').addEventListener('mousemove', function() { bodyAngle = this.value; renderAllShapes(); });
  document.getElementById('magentaSlide').addEventListener('mousemove', function() { g_magentaAngle = this.value; renderAllShapes(); });
  
  document.getElementById('angleSlide').addEventListener('mousemove', function() { g_globalAngle = this.value; renderAllShapes(); });

  document.getElementById('tail1On').onclick = function() { g_tail1Animation = true; };
  document.getElementById('tail1Off').onclick = function() { g_tail1Animation = false; };
  document.getElementById('tail1Slide').addEventListener('input', function() { g_tail1Angle = this.value; renderAllShapes(); });

  document.getElementById('tail2On').onclick = function() { g_tail2Animation = true; };
  document.getElementById('tail2Off').onclick = function() { g_tail2Animation = false; };
  document.getElementById('tail2Slide').addEventListener('input', function() { g_tail2Angle = this.value; renderAllShapes(); });

  document.getElementById('tail3On').onclick = function() { g_tail3Animation = true; };
  document.getElementById('tail3Off').onclick = function() { g_tail3Animation = false; };
  document.getElementById('tail3Slide').addEventListener('input', function() { g_tail3Angle = this.value; renderAllShapes(); });
}

function main() {
  setupWebGL();

  connectVariablesToGLSL();

  addActionsForHtmlUI();

  //canvas.onmousedown = click;
  canvas.onmousedown = function(ev) {
    if (ev.shiftKey) {
      g_pokeStartTime = g_seconds; 
    } else {
      click(ev);
    }
  };
  
  canvas.onmousemove = function(ev) { 
    if (ev.buttons == 1) { 
      click(ev); 
      } 
    };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  requestAnimationFrame(tick);
}

var g_shapesList = [];

function click(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);
  let shape;
  if (g_selectedType == 0) shape = new Point();
  else if (g_selectedType == 1) shape = new Triangle();
  else shape = new Circle();

  shape.position = [x, y];
  shape.color = g_selectedColor.slice();
  shape.size = g_selectedSize;
  g_shapesList.push(shape);

  renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX, y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();
  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
  return [x, y];
}

var g_startTime=performance.now()/1000.0;
var g_seconds=performance.now()/1000.0 - g_startTime;

function tick() {
  g_seconds=performance.now()/1000.0 - g_startTime;
  updateAnimationAngles();
  console.log(g_seconds);
  renderAllShapes();
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_yellowAnimation) {
    bodyAngle = 45 * Math.sin(g_seconds);
  }
  if (g_magentaAnimation) {
    g_magentaAngle = 15 * Math.sin(g_seconds);
  }
  if (g_legsAnimation == true) {
    g_legsAngle = 25 * Math.sin(g_seconds);
  }
  if (g_tailAnimation) {
    g_tailAngle = 15 * Math.sin(g_seconds);
  }
  if (g_seconds - g_pokeStartTime < 5.0) {
    if (Math.sin(g_seconds * 15) > 0) {
      g_eyeBlinkScale = 0.1;
    } else {
      g_eyeBlinkScale = 1.0;
    }
  } else {
    g_eyeBlinkScale = 1.0;
  }

  if (g_tail1Animation) g_tail1Angle = (15 * Math.sin(g_seconds));
  if (g_tail2Animation) g_tail2Angle = (20 * Math.sin(g_seconds * 1.5));
  if (g_tail3Animation) g_tail3Angle = (25 * Math.sin(g_seconds * 2));
}

function renderAllShapes() {
  var startTime = performance.now();
  
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // --------- MAIN BODY ---------
  var mainBody = new Cube();
  mainBody.color = [0.4, 0.6, 0.2, 1.0];
  mainBody.matrix.setTranslate(-0.275, -0.6, -0.115);

  mainBody.matrix.rotate(-5, 1, 0, 0);
  mainBody.matrix.rotate(-bodyAngle, 1, 0, 0);
  var yellowCoordinatesMat = new Matrix4(mainBody.matrix);
  mainBody.matrix.scale(0.6, 0.5, 0.8); 
  mainBody.render();

  // left leg
  var lleg = new Cube();
  lleg.color = [0.4, 0.6, 0.2, 1.0];
  lleg.matrix.set(yellowCoordinatesMat);
  lleg.matrix.setTranslate(-0.2, -0.5, 0); 
  lleg.matrix.rotate(g_legsAngle, 1, 0, 0);
  var llegMat = new Matrix4(lleg.matrix); 
  lleg.matrix.scale(0.15, -0.33, 0.17);
  lleg.render();

  // left foot (Connected to lleg)
  var leftFoot = new Cube();
  leftFoot.color = [0.32, 0.48, 0.16, 1.0];
  leftFoot.matrix.set(llegMat);
  leftFoot.matrix.translate(0, -0.33, -0.1);
  leftFoot.matrix.scale(0.15, 0.08, 0.2);
  leftFoot.render();

  // right leg
  var rleg = new Cube();
  rleg.color = [0.4, 0.6, 0.2, 1.0];
  lleg.matrix.set(yellowCoordinatesMat);
  rleg.matrix.setTranslate(0.1, -0.5, 0);
  rleg.matrix.rotate(-g_legsAngle, 1, 0, 0);
  var rlegMat = new Matrix4(rleg.matrix);
  rleg.matrix.scale(0.15, -0.33, 0.17);
  rleg.render();

  // right foot (Connected to rleg)
  var rightFoot = new Cube();
  rightFoot.color = [0.32, 0.48, 0.16, 1.0];
  rightFoot.matrix.set(rlegMat);
  rightFoot.matrix.translate(0, -0.33, -0.1);
  rightFoot.matrix.scale(0.15, 0.08, 0.2);
  rightFoot.render();

  // back left leg
  var backLleg = new Cube();
  backLleg.color = [0.4, 0.6, 0.2, 1.0];
  lleg.matrix.set(yellowCoordinatesMat);
  backLleg.matrix.setTranslate(-0.2, -0.5, 0.4); 
  backLleg.matrix.rotate(-g_legsAngle, 1, 0, 0);
  var backLlegMat = new Matrix4(backLleg.matrix);
  backLleg.matrix.scale(0.15, -0.33, 0.17);
  backLleg.render();

  // back left foot (Connected to backLleg)
  var backLeftFoot = new Cube();
  backLeftFoot.color = [0.32, 0.48, 0.16, 1.0];
  backLeftFoot.matrix.set(backLlegMat);
  backLeftFoot.matrix.translate(0, -0.33, -0.05);
  backLeftFoot.matrix.scale(0.15, 0.08, 0.2);
  backLeftFoot.render();

  // backr ight leg
  var backRleg = new Cube();
  backRleg.color = [0.4, 0.6, 0.2, 1.0];
  lleg.matrix.set(yellowCoordinatesMat);
  backRleg.matrix.setTranslate(0.1, -0.5, 0.4);
  backRleg.matrix.rotate(g_legsAngle, 1, 0, 0);
  var backRlegMat = new Matrix4(backRleg.matrix);
  backRleg.matrix.scale(0.15, -0.33, 0.17);
  backRleg.render();

  // back right foot (Connected to backRleg)
  var backRightFoot = new Cube();
  backRightFoot.color = [0.32, 0.48, 0.16, 1.0];
  backRightFoot.matrix.set(backRlegMat);
  backRightFoot.matrix.translate(0, -0.33, -0.05);
  backRightFoot.matrix.scale(0.15, 0.08, 0.2);
  backRightFoot.render();

  // --------- NECK
  var neck = new Cube();
  neck.color = [0.4, 0.7, 0.2, 1.0];
  neck.matrix.set(yellowCoordinatesMat); 
  neck.matrix.translate(0.20, 0.3, .08); 
  neck.matrix.rotate(-bodyAngle * 0.5, 0, 0, 1); 
  var neckCoordinatesMat = new Matrix4(neck.matrix); 
  neck.matrix.scale(0.2, 0.6, 0.22);
  neck.render();
   // --------- HEAD
  var head = new Cube();
  head.color = [0.45, 0.75, 0.25, 1.0];
  head.matrix.set(neckCoordinatesMat); // Parented to neck
  head.matrix.translate(-0.07, 0.6, 0.05); 
  head.matrix.rotate(g_magentaAngle, 1, 0, 0);
  var headCoordinatesMat = new Matrix4(head.matrix); 
  head.matrix.scale(0.35, 0.30, 0.30); 
  head.render();
  // --------- MOUTH  
  var mouth = new Cube();
  mouth.color = [0.32, 0.48, 0.16, 1.0];
  mouth.matrix.set(neckCoordinatesMat); 
  mouth.matrix.translate(-.05, 0.6, -0.1); 
  mouth.matrix.rotate(g_magentaAngle, 1, 0, 0); 
  mouth.matrix.scale(0.3, 0.15, 0.2); 
  mouth.render();

  // left eyeball
  var leftEye = new Cube();
  leftEye.color = [1, 1, 1, 1]; // White
  leftEye.matrix.set(headCoordinatesMat); // Parent to head
  leftEye.matrix.translate(0.05, 0.12, -0.01); 
  leftEye.matrix.scale(0.08, 0.08 * g_eyeBlinkScale, 0.05); 
  var leftEyeMat = new Matrix4(leftEye.matrix);
  leftEye.render();

  // left pupil (Child of Left Eyeball)
  var leftPupil = new Cube();
  leftPupil.color = [0, 0, 0, 1]; // Black
  leftPupil.matrix.set(leftEyeMat); 
  leftPupil.matrix.translate(0.2, 0.2, -0.1); 
  leftPupil.matrix.scale(0.6, 0.6, 0.1); 
  leftPupil.render();

  // right eyeball
  var rightEye = new Cube();
  rightEye.color = [1, 1, 1, 1];
  rightEye.matrix.set(headCoordinatesMat);
  rightEye.matrix.translate(0.22, 0.12, -0.01); 
  rightEye.matrix.scale(0.08, 0.08 * g_eyeBlinkScale, 0.05); 
  var rightEyeMat = new Matrix4(rightEye.matrix); 
  rightEye.render();

  // right pupil
  var rightPupil = new Cube();
  rightPupil.color = [0, 0, 0, 1];
  rightPupil.matrix.set(rightEyeMat);
  rightPupil.matrix.translate(0.2, 0.2, -0.1); 
  rightPupil.matrix.scale(0.6, 0.6, 0.1); 
  rightPupil.render();


  // --------- Trhee joint tail ---------

  // tail 1 (Attached to Body)
  var tail1 = new Cube();
  tail1.color = [0.4, 0.6, 0.2, 1.0];
  tail1.matrix.set(yellowCoordinatesMat); 
  tail1.matrix.translate(0.2, 0.1, 0.75);
  tail1.matrix.rotate(g_tail1Angle, 0, 1, 0); 
  var tail1Mat = new Matrix4(tail1.matrix);
  tail1.matrix.scale(0.15, 0.15, 0.25);
  tail1.render();

  // tail 2 (Attached to Tail 1)
  var tail2 = new Cube();
  tail2.color = [0.35, 0.55, 0.15, 1.0];
  tail2.matrix.set(tail1Mat); 
  tail2.matrix.translate(0.015, 0, 0.25); 
  tail2.matrix.rotate(g_tail2Angle, 0, 1, 0);
  var tail2Mat = new Matrix4(tail2.matrix);
  tail2.matrix.scale(0.12, 0.12, 0.2);
  tail2.render();

  // tail 3 (Attached to Tail 2)
  var tail3 = new Cube();
  tail3.color = [0.3, 0.5, 0.1, 1.0];
  tail3.matrix.set(tail2Mat); 
  tail3.matrix.translate(0.01, 0, 0.2);
  tail3.matrix.rotate(g_tail3Angle, 0, 1, 0);
  tail3.matrix.scale(0.08, 0.08, 0.15);
  tail3.render();


  var duration = performance.now() - startTime;
  sendTextToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration) / 10, "numdot");
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if( !htmlElm ) {
    console.log("failed to find html element with id " + htmlID);
    return;
  }
  htmlElm.innerHTML = text;
}