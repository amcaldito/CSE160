// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    //gl_PointSize = 10.0;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global Variables (vid 1.3a 2:10):
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  // Enable alpha blending
  gl.enable(gl.BLEND);

  // Specify the blending function
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function connectVariablesToGLSL() {
  // compiles and installs shader programs. Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // looking for pointer location of a_position. Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

    // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
// added:
const CIRCLE = 2;

// Globals related to UI elems
let g_selectedColor = [1.0, 1.0, 1.0, 1.0,];
let g_selectedSize = 5;
let g_selectedType = POINT;
// added:
let g_selectedSegments = 10;
let g_selectedAlpha = 1.0;

function addActionsForHtmlUI() {
  document.getElementById('green').onclick = function() {g_selectedColor = [0.0, 1.0, 0.0, 1.0]; };
  document.getElementById('red').onclick = function() {g_selectedColor = [1.0, 0.0, 0.0, 1.0]; };
  
  document.getElementById('clear').onclick = function() {g_shapesList=[]; renderAllShapes(); };
  
  document.getElementById('pointButton').onclick = function() {g_selectedType=POINT};
  document.getElementById('triButton').onclick = function() {g_selectedType=TRIANGLE};
  document.getElementById('circleButton').onclick = function() {g_selectedType=CIRCLE};
  //added
  document.getElementById('segmentSlide').addEventListener('mouseup', function() {g_selectedSegments = this.value; });
  document.getElementById('alphaSlide').addEventListener('mouseup', function() { g_selectedAlpha = this.value / 100.0;});
  document.getElementById('drawPic').onclick = function() {drawPicture(); };
  document.getElementById('refPic').onclick = function() {
    let img = document.getElementById('myrefpic');
    if (img.style.display === "none") {
      img.style.display = "block";
    } else {
      img.style.display = "none";
    }
  };

  document.getElementById('redSlide').addEventListener('mouseup', function() {g_selectedColor[0] = this.value/100; });
  document.getElementById('greenSlide').addEventListener('mouseup', function() {g_selectedColor[1] = this.value/100; });
  document.getElementById('blueSlide').addEventListener('mouseup', function() {g_selectedColor[2] = this.value/100; });
  
  document.getElementById('sizeSlide').addEventListener('mouseup', function() {g_selectedSize = this.value; });
}

function main() {
  // set up canvas and gl variables
  setupWebGL();
  // set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();
  // set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { if (ev.buttons == 1) {click(ev)}};

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];

function click(ev) {
  [x, y] = convertCoordinatesEventToGL(ev);
  
  // Create and store new point
  let point;
  if (g_selectedType==POINT) {
    point = new Point();
  } else if (g_selectedType==TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle();
    // adeded:
    point.segments = g_selectedSegments;
  }

  point.position=[x,y];
  // Update: Combine the RGB colors with the selected Alpha
  point.color = [g_selectedColor[0], g_selectedColor[1], g_selectedColor[2], g_selectedAlpha];
  //point.color=g_selectedColor.slice();
  point.size=g_selectedSize;
  g_shapesList.push(point);

  renderAllShapes();
}

// extract the event click and return it in WebGl coords
function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  return([x, y]);
}


// Draw every shape that is supposed to be in the canvas
function renderAllShapes() {
  var startTime = performance.now();
 
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  //var len = g_points.length;
  // Draw each shape in the list
  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  // Check the time at the end of the function and show on web page
  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

function drawPicture() {
  // creating this picture was difficult because It was difficult to map where exactly i wanted the vertices to be in WebGL coords.
  // took  a lot of trial and error to get the coordinates right.
  // I started off with creating the main triangle in the center and then was able to build the other triangles around it.

  g_shapesList = [];
  let white = [1.0, 1.0, 1.0, 1.0];
  let rainbowColors = [
    [1.0, 0.0, 0.0, 1.0], // red
    [1.0, 0.5, 0.0, 1.0], // orange
    [1.0, 1.0, 0.0, 1.0], // yellw
    [0.0, 1.0, 0.0, 1.0], // green
    [0.0, 0.0, 1.0, 1.0], // blue
    [0.5, 0.0, 0.5, 1.0]  // purple
  ];
  
  // 1. Rainbow strips coming out of the triangle to the right. Each strip is made up of two triangles to create a "line"
  for (let i = 0; i < rainbowColors.length; i++) {
    let yShift = i * 0.04; // adjusting this changes gap in between the colors
    let xOffset = i * 0.02; // x offset controls where the triangles start next to the main white triangle
    let leftX = 0.2 + xOffset; // this is the starting point on the triangle's edge. must add 0.2 since triangle's right edge is at x=0.2
    
    // to make slant along the main triangle, I adjusted the y-values based on xOffset
    // to make a stack of these different colored triangles, i adjusted the y-values based on i
    
    // triangle 1 for current color strip
    let t1 = new Triangle();
    t1.color = rainbowColors[i];
    t1.vertices = [
        leftX, 0.15 - yShift, 
        1.0, -0.1 - yShift, 
        1.0, -0.05 - yShift
    ];
    g_shapesList.push(t1);

    // triangle 2 for current color strip
    let t2 = new Triangle();
    t2.color = rainbowColors[i];
    t2.vertices = [
        leftX, 0.15 - yShift,
        leftX + 0.02, 0.11 - yShift,
        1.0, -0.1 - yShift
    ];
    g_shapesList.push(t2);
  }
  // 2. the light beam entering the prism on the left. made up of two triangles
  let beamColor = [0.9, 0.9, 0.9, 1.0]; // set to grayish white color
  let beamColor2 = [0.50, 0.50, 0.50, 1.0]; // darker gray for the second triangle
   // Triangle 1 for the beam
  let b1 = new Triangle();
  b1.color = beamColor;
  b1.vertices = [
      -1.0, -0.15,
      -0.2, 0.05,
      -0.2, 0.02 
  ];
  g_shapesList.push(b1);

    // Triangle 2 for the beam
  let b2 = new Triangle();
  b2.color = beamColor2;
 
  b2.vertices = [
      -1.0, -0.15, // far left edge top
      -1.0, -0.18, // far left edge bottom
      -0.2, 0.02  //  the prism bottom
  ];
  g_shapesList.push(b2);

  // 3. The primary triangle in the middle:
  let prism = new Triangle();
  prism.color = white;
  prism.vertices = [
    -0.5, // x-coord for bottom right
    -0.4, // y-coord for bottom right
    0.0,  // x-coord for top peak
    0.5,  // y-coord for top peak
    0.5,  // x-coord for bottom left
    -0.4  // y-coord for bottom left
  ];
  g_shapesList.push(prism);

  //4. added 4 more nested triangles to hit the 20 triangles total
  for (let i = 1; i <= 4; i++) {
    let inner = new Triangle();
    // attempting to make each triangle slightly darker as it goes inward
    let colorVal = 0.45 / i; 
    inner.color = [colorVal, colorVal, colorVal, 1.0];
    // vertices should be closer to center as they move inward
    let inset = i * 0.02; 
    inner.vertices = [
        -0.5 + (inset * 1.2), -0.4 + inset, // bottom left
         0.0, 0.5 - inset, // top peak of triangle
         0.5 - (inset * 1.2), -0.4 + inset  // bottomt right
    ];
    g_shapesList.push(inner);
  }

  // how i made my inititals (AC) using triangles:
  let initialColors = [0.6, 0.6, 0.6, 1.0]; // chse a gray color for the initials

  // sa1 is the left leg of A
  let sa1 = new Triangle();
  sa1.color = initialColors;
  sa1.vertices = [-0.9, -0.9, -0.85, -0.75, -0.87, -0.9];
  g_shapesList.push(sa1);
  
  // sa2 is the right leg of A and I mirrored the vertices from sa1
  let sa2 = new Triangle();
  sa2.color = initialColors;
  sa2.vertices = [-0.8, -0.9, -0.85, -0.75, -0.83, -0.9];
  g_shapesList.push(sa2);
  
  // sa3 to make crossbar of A:
  let sa3 = new Triangle();
  sa3.color = initialColors;
  sa3.vertices = [-0.87, -0.83, -0.83, -0.83, -0.85, -0.85];
  g_shapesList.push(sa3);

  // sc1 is the top of C
  let sc1 = new Triangle();
  sc1.color = initialColors;
  sc1.vertices = [-0.75, -0.75, -0.65, -0.75, -0.72, -0.78];
  g_shapesList.push(sc1);

  // sc2 is the straight left line  of C
  let sc2 = new Triangle();
  sc2.color = initialColors;
  sc2.vertices = [-0.75, -0.75, -0.75, -0.9, -0.72, -0.82];
  g_shapesList.push(sc2);

  // sc3 is the bottom of C
  let sc3 = new Triangle();
  sc3.color = initialColors;
  sc3.vertices = [-0.75, -0.9, -0.65, -0.9, -0.72, -0.87];
  g_shapesList.push(sc3);
    
  renderAllShapes();
}