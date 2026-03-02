var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;

  varying vec2 v_UV;
  varying vec3 v_WorldPos;
  varying vec3 v_WorldNormal;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  void main() {
    // True world position (lighting space)
    vec4 worldPos4 = u_ModelMatrix * a_Position;
    v_WorldPos = worldPos4.xyz;

    // True world normal
    v_WorldNormal = normalize((u_NormalMatrix * vec4(a_Normal, 0.0)).xyz);

    // Draw position (camera/view/proj only)
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * worldPos4;

    v_UV = a_UV;
  }
`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;

  varying vec2 v_UV;
  varying vec3 v_WorldPos;
  varying vec3 v_WorldNormal;

  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;  
  uniform sampler2D u_Sampler2; // for grass-top.jpg
  uniform sampler2D u_Sampler3; // for sky texture
  uniform int u_whichTexture;

  uniform vec3 u_LightPos; 
  uniform vec3 u_LightColor;
  uniform vec3 u_CameraPosition;
  uniform bool u_LightOn;
  
  // Spotlight uniforms (always active)
  uniform vec3 u_SpotlightDir;
  uniform float u_SpotlightCutoff; 

  void main() {
    vec4 baseColor;

    // ----- Base color selection -----
    if (u_whichTexture == -3) {
      // Normal visualization
      vec3 N = normalize(v_WorldNormal);
      gl_FragColor = vec4((N + 1.0) / 2.0, 1.0);
      return;
    } else if (u_whichTexture == -2) {
      baseColor = u_FragColor;
    } else if (u_whichTexture == -1) {
      // UV debug
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
      return;
    } else if (u_whichTexture == 0) {
      baseColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 2) {
      baseColor = texture2D(u_Sampler2, v_UV);
    } else if (u_whichTexture == 3) {
      baseColor = texture2D(u_Sampler3, v_UV);
    } else {
      baseColor = u_FragColor;
    }

    if (!u_LightOn) {
      gl_FragColor = baseColor;
      return;
    }

    // ----- Phong lighting -----
    vec3 N = normalize(v_WorldNormal);
    vec3 L = normalize(u_LightPos - v_WorldPos);
    vec3 V = normalize(u_CameraPosition - v_WorldPos);
    vec3 R = reflect(-L, N);

    float nDotL = max(dot(N, L), 0.0);
    float ka = 0.65; // ambient strength
    float kd = 1.0;  // diffuse strength
    float ks = 0.2; // spec strength
    float shininess = 32.0;

    vec3 ambient  = ka * baseColor.rgb * u_LightColor;
    vec3 diffuse  = kd * baseColor.rgb * u_LightColor * nDotL;

    float specPow = pow(max(dot(V, R), 0.0), shininess);
    vec3 specular = ks * u_LightColor * specPow;
    
    // Spotlight calc
    float spotCos = dot(-L, normalize(u_SpotlightDir));
    float spotEffect = 1.0;
    if (spotCos < u_SpotlightCutoff) {
      // outside cone - should only ambient light
      spotEffect = 0.0;
    } else {
      spotEffect = smoothstep(u_SpotlightCutoff, u_SpotlightCutoff + 0.1, spotCos);
    }

    gl_FragColor = vec4(ambient + (diffuse + specular) * spotEffect, baseColor.a);
  }
`;


// global vars -----

let canvas, gl;
let a_Position, a_UV, a_Normal;
let u_FragColor, u_ModelMatrix, u_NormalMatrix, u_ViewMatrix, u_ProjectionMatrix;
let u_whichTexture, u_UVScale, u_Sampler0, u_Sampler1, u_Sampler2, u_Sampler3;
let u_LightPos, u_LightColor, u_CameraPosition, u_LightOn;
let u_SpotlightDir, u_SpotlightCutoff;

let g_camera;
let g_skyCube = null;
let g_floorCube = null;

let g_companionCubeTexture = null;
let g_normalMapTexture = null;
let g_skyTexture = null;

let g_normalOn = false;
let g_lightOn = true;
let g_lightAnim = true; 

let g_benchyModel = null;

let g_lightPos = [0, 5, 4];
let g_lightColor = [1.0, 1.0, 1.0];

// for spotlight settings
let g_spotlightCutoff = 0.7;

// Global rotation angles 
let g_globalAngle = 0;
let g_globalAngleX = 0;
let g_globalAngleY = 0;

let g_lastMouseX = null;
let g_lastMouseY = null;

var g_startTime = performance.now() / 1000.0;
var g_seconds = 0;


// setup ----

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  u_UVScale = gl.getUniformLocation(gl.program, 'u_UVScale');
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');

  u_LightPos = gl.getUniformLocation(gl.program, 'u_LightPos');
  u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  u_CameraPosition = gl.getUniformLocation(gl.program, 'u_CameraPosition');
  u_LightOn = gl.getUniformLocation(gl.program, 'u_LightOn');
  
  u_SpotlightDir = gl.getUniformLocation(gl.program, 'u_SpotlightDir');
  u_SpotlightCutoff = gl.getUniformLocation(gl.program, 'u_SpotlightCutoff');
  if (!u_ModelMatrix || !u_NormalMatrix || !u_ViewMatrix || !u_ProjectionMatrix ||
      !u_LightPos || !u_LightColor || !u_CameraPosition || !u_LightOn) {
    console.log('Failed to get one or more uniform locations.');
    return;
  }

  // Defaults
  const identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, identity.elements);

  gl.uniform3f(u_LightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  gl.uniform3f(u_LightColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);
  gl.uniform1i(u_LightOn, 1);

  // Texture units
  gl.uniform1i(u_Sampler0, 0);
  gl.uniform1i(u_Sampler1, 1);
  gl.uniform1i(u_Sampler2, 2);
  gl.uniform1i(u_Sampler3, 3);
}

function addActionsForHTMLUI() {
  document.getElementById('NormalOn').onclick = function() { g_normalOn = true; };
  document.getElementById('NormalOff').onclick = function() { g_normalOn = false; };

  document.getElementById('LightOn').onclick = function() { g_lightOn = true; };
  document.getElementById('LightOff').onclick = function() { g_lightOn = false; };

  document.getElementById('AnimOn').onclick = function() { g_lightAnim = true; };
  document.getElementById('AnimOff').onclick = function() { g_lightAnim = false; };

  // Light position sliders
  document.getElementById('lightX').addEventListener('mousemove', function(ev) {
    if (ev.buttons == 1) { g_lightPos[0] = this.value / 100; }
  });
  document.getElementById('lightY').addEventListener('mousemove', function(ev) {
    if (ev.buttons == 1) { g_lightPos[1] = this.value / 100; }
  });
  document.getElementById('lightZ').addEventListener('mousemove', function(ev) {
    if (ev.buttons == 1) { g_lightPos[2] = this.value / 100; }
  });

  // Light color sliders
  document.getElementById('lightR').addEventListener('input', function() { g_lightColor[0] = this.value / 255; });
  document.getElementById('lightG').addEventListener('input', function() { g_lightColor[1] = this.value / 255; });
  document.getElementById('lightB').addEventListener('input', function() { g_lightColor[2] = this.value / 255; });

  // Global angle slider
  document.getElementById('angleSlide').addEventListener('input', function() { g_globalAngle = this.value; });
}


// --- TEXTURES --

function initTextures() {
  loadTexture('textures/cube-portal.jpg', 0);
  loadTexture('textures/cube-portal-normal.jpg', 1);
  loadTexture('textures/grass-top.jpg', 2);
  loadTexture('textures/mc-sky2.jpg', 3);  // sky texture
}

function loadTexture(src, texUnit) {
  var image = new Image();
  image.onload = function() { sendImageToTexture(image, texUnit); };
  image.crossOrigin = "anonymous";
  image.src = src;
}

function sendImageToTexture(image, texUnit) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  if (texUnit === 0) {
    gl.activeTexture(gl.TEXTURE0);
    g_companionCubeTexture = texture;
  } else if (texUnit === 1) {
    gl.activeTexture(gl.TEXTURE1);
    g_normalMapTexture = texture;
  } else if (texUnit === 2) {
    gl.activeTexture(gl.TEXTURE2);
    g_grassTopTexture = texture;
  } else if (texUnit === 3) {
    gl.activeTexture(gl.TEXTURE3);
    g_skyTexture = texture;
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  console.log('Loaded texture unit: ' + texUnit);
}

// set normal matrix from an object's model matrix, then call render()
function renderWithNormals(obj) {
  // normalMatrix = inverse(transpose(modelMatrix))
  let normalMat = new Matrix4();
  normalMat.setInverseOf(obj.matrix);
  normalMat.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMat.elements);

  obj.render();
}


// --- scene objects --

function drawCompanionCube(x, y, z, scale) {
  scale = scale || 1.0;

  let mainCube = new Cube();
  mainCube.color = [0.85, 0.85, 0.87, 1.0];

  mainCube.matrix.setIdentity();
  mainCube.matrix.translate(x, y, z);
  mainCube.matrix.scale(scale, scale, scale);
  mainCube.matrix.translate(-0.5, -0.5, -0.5);

  gl.uniform1f(u_UVScale, 1.0);

  if (g_normalOn) {
    mainCube.textureNum = -3;
  } else {
    if (g_companionCubeTexture) {
      mainCube.textureNum = 0;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, g_companionCubeTexture);
      gl.uniform1i(u_Sampler0, 0);
    } else {
      mainCube.textureNum = -2;
    }
  }

  renderWithNormals(mainCube);
}

function drawFloorGrid() {
  gl.uniform1i(u_LightOn, 0);
  
  g_floorCube.matrix.setIdentity();
  g_floorCube.matrix.translate(0, -0.75, 0);
  g_floorCube.matrix.scale(32, 0.1, 32);
  g_floorCube.matrix.translate(-0.5, 0, -0.5);
  g_floorCube.color = [0.9, 0.9, 0.9, 1.0];
  g_floorCube.textureNum = 2; // Using grass-top.jpg texture
  renderWithNormals(g_floorCube);
    gl.uniform1i(u_LightOn, g_lightOn ? 1 : 0);
}



function keydown(ev) {
  const speed = 0.5;

  if (ev.keyCode == 87) g_camera.moveForward(speed);   // W
  else if (ev.keyCode == 83) g_camera.moveBackwards(speed); // S
  else if (ev.keyCode == 65) g_camera.moveLeft(speed); // A
  else if (ev.keyCode == 68) g_camera.moveRight(speed);// D
  else if (ev.keyCode == 81) g_camera.panLeft(5);  // Q
  else if (ev.keyCode == 69) g_camera.panRight(5); // E
  else if (ev.keyCode == 32) { g_camera.eye.elements[1] += speed; g_camera.at.elements[1] += speed; g_camera.updateView(); } // Space
  else if (ev.keyCode == 16) { g_camera.eye.elements[1] -= speed; g_camera.at.elements[1] -= speed; g_camera.updateView(); } // Shift

  renderAllShapes();
}



function updateAnimationAngles() {
  if (g_lightAnim) {
    g_lightPos[0] = 3.0 * Math.cos(g_seconds);
    g_lightPos[2] = 3.0 * Math.sin(g_seconds);
  }
}

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  updateAnimationAngles();
  renderAllShapes();
  requestAnimationFrame(tick);
}


// main ----
async function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHTMLUI();
  initTextures();

  // Benchy OBJ model
  g_benchyModel = new OBJModel();
  await g_benchyModel.loadFromURL('textures/benchy.obj');

  g_camera = new Camera();
  document.onkeydown = keydown;
  window.addEventListener('keydown', keydown);

  // Mouse rotation -> camera pan
  canvas.onmousemove = function(ev) {
    if (g_lastMouseX !== null) {
      let deltaX = ev.clientX - g_lastMouseX;
      let rotationAmount = deltaX * 0.2;
      if (rotationAmount > 0) g_camera.panRight(rotationAmount);
      else g_camera.panLeft(-rotationAmount);
    }
    if (g_lastMouseY !== null) {
      let deltaY = ev.clientY - g_lastMouseY;
      let rotationAmount = deltaY * 0.2;
      if (rotationAmount > 0) g_camera.panDown(rotationAmount);
      else g_camera.panUp(-rotationAmount);
    }
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  };

  canvas.onmouseleave = function() {
    g_lastMouseX = null;
    g_lastMouseY = null;
  };

  // Sky cube
  g_skyCube = new Cube();
  g_skyCube.textureNum = -2;
  g_skyCube.color = [0.7, 0.7, 0.7, 1.0];
  g_skyCube.uvScale = 1.0;

  // Floor cube
  g_floorCube = new Cube();
  g_floorCube.textureNum = 2; // grass-top.jpg texture
  g_floorCube.color = [0.95, 0.95, 0.95, 1.0];
  g_floorCube.uvScale = 1.0;

  gl.clearColor(0.7, 0.7, 0.7, 1.0);

  requestAnimationFrame(tick);
}


// render stuff ----
function renderAllShapes() {
  var startTime = performance.now();

  // Base camera matrices
  let viewMat = g_camera.viewMatrix;
  let projMat = g_camera.projectionMatrix;

  // Build global rotate matrix
  let globalRotMat = new Matrix4()
    .rotate(g_globalAngle, 0, 1, 0)
    .rotate(g_globalAngleY, 0, 1, 0)
    .rotate(g_globalAngleX, 1, 0, 0);

  let viewWithGlobal = new Matrix4(viewMat);
  viewWithGlobal.multiply(globalRotMat);

  gl.uniformMatrix4fv(u_ViewMatrix, false, viewWithGlobal.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Upload light + camera uniforms (world space)
  gl.uniform3f(u_LightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  gl.uniform3f(u_LightColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);
  gl.uniform3f(u_CameraPosition,
    g_camera.eye.elements[0],
    g_camera.eye.elements[1],
    g_camera.eye.elements[2]
  );
  gl.uniform1i(u_LightOn, g_lightOn ? 1 : 0);
  
  // Spotlight uniforms - direction points from light position toward origin
  let spotDir = [
    -g_lightPos[0],
    -g_lightPos[1],
    -g_lightPos[2]
  ];
  // Normalize the direction
  let len = Math.sqrt(spotDir[0]*spotDir[0] + spotDir[1]*spotDir[1] + spotDir[2]*spotDir[2]);
  if (len > 0) {
    spotDir[0] /= len; spotDir[1] /= len; spotDir[2] /= len;
  }
  gl.uniform3f(u_SpotlightDir, spotDir[0], spotDir[1], spotDir[2]);
  gl.uniform1f(u_SpotlightCutoff, g_spotlightCutoff);

  // Draw light cube (debug visualization)
  let light = new Cube();
  light.color = [1, 1, 0, 1];
  light.textureNum = -2;
  light.matrix.setIdentity();
  light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  light.matrix.scale(0.3, 0.3, 0.3);
  light.matrix.translate(-0.5, -0.5, -0.5);
  renderWithNormals(light);
  gl.uniform1f(u_UVScale, 1.0);

  // skycube
  gl.depthMask(false);
  gl.disable(gl.CULL_FACE);

  g_skyCube.matrix.setIdentity();
  g_skyCube.matrix.translate(
    g_camera.eye.elements[0],
    g_camera.eye.elements[1],
    g_camera.eye.elements[2]
  );
  g_skyCube.matrix.scale(100, 100, 100);
  g_skyCube.matrix.translate(-0.5, -0.5, -0.5);

  g_skyCube.textureNum = g_normalOn ? -3 : 3;  // Use sky texture
  renderWithNormals(g_skyCube);

  gl.depthMask(true);
  gl.enable(gl.CULL_FACE);

  drawFloorGrid();

  // companion cube from portal
  drawCompanionCube(0, 0.5, 0, 2.0);

 // sphere requirement
  var sphere = new Sphere();
  sphere.matrix.setIdentity();
  sphere.matrix.translate(-3, 0.5, 0);
  sphere.matrix.scale(1.5, 1.5, 1.5);   
  sphere.color = [1.0, 0.3, 0.3, 1.0];
  sphere.textureNum = g_normalOn ? -3 : -2;
  renderWithNormals(sphere);

  // for obj model
  if (g_benchyModel && g_benchyModel.loaded) {
    g_benchyModel.matrix.setIdentity();
    g_benchyModel.matrix.translate(3, 0, -3);
    g_benchyModel.matrix.scale(0.5, 0.5, 0.5); 
    g_benchyModel.color = [0.9, 0.7, 0.2, 1.0]; 
    g_benchyModel.textureNum = g_normalOn ? -3 : -2;
    renderWithNormals(g_benchyModel);
  }

  // calculate performacne stats
  var duration = performance.now() - startTime;
  sendTextToHTML(
    "ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration) / 10,
    "numdot"
  );
}


// text to html ----

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("failed to find html element with id " + htmlID);
    return;
  }
  htmlElm.innerHTML = text;
}