// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform float u_UVScale; 
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV * u_UVScale;
    }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform sampler2D u_Sampler4;
  uniform sampler2D u_Sampler5;
  uniform sampler2D u_Sampler6;
  uniform sampler2D u_Sampler7;
  uniform sampler2D u_Sampler8;
  uniform sampler2D u_Sampler9;
  uniform sampler2D u_Sampler10;
  uniform sampler2D u_Sampler11;
  uniform sampler2D u_Sampler12;
  
  uniform int u_whichTexture; 
  // -2 for color, -1 UV Debug color, 0 for sky, 1 for grass, 2 for oak, 3 for leaves, 4 for stonebrick, 5 for plank, 6 for glass, 7 for grass2, 8 for water, 9 for barrel, 10 for hay-top, 11 for haybale-sides, 12 for gray_wool

  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor; // Use solid color
    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);  // Use UV debug color
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);  // Use sky texture
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);  // Use grass texture
    } else if (u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);  // Use oak texture
    } else if (u_whichTexture == 3) {
      gl_FragColor = texture2D(u_Sampler3, v_UV);  // Use leaves texture
    } else if (u_whichTexture == 4) {
      gl_FragColor = texture2D(u_Sampler4, v_UV);  // Use stonebrick texture
    } else if (u_whichTexture == 5) {
      gl_FragColor = texture2D(u_Sampler5, v_UV);  // Use plank texture
    } else if (u_whichTexture == 6) {
      gl_FragColor = texture2D(u_Sampler6, v_UV);  // Use glass texture
    } else if (u_whichTexture == 7) {
      gl_FragColor = texture2D(u_Sampler7, v_UV);  // Use grass2 texture
    } else if (u_whichTexture == 8) {
      gl_FragColor = texture2D(u_Sampler8, v_UV);  // Use water texture
    } else if (u_whichTexture == 9) {
      gl_FragColor = texture2D(u_Sampler9, v_UV);  // Use barrel texture
    } else if (u_whichTexture == 10) {
      gl_FragColor = texture2D(u_Sampler10, v_UV);  // Use hay-top texture
    } else if (u_whichTexture == 11) {
      gl_FragColor = texture2D(u_Sampler11, v_UV);  // Use haybale-sides texture
    } else if (u_whichTexture == 12) {
      gl_FragColor = texture2D(u_Sampler12, v_UV);  // Use gray_wool texture
    } else {
      gl_FragColor = vec4(1, .2, .2, 1);
    }
  }`

// Global Variables
let canvas, gl, a_Position, u_FragColor, u_Size, u_ModelMatrix, u_GlobalRotateMatrix, u_ViewMatrix, u_ProjectionMatrix, u_Sampler0, a_UV, u_Sampler1, u_Sampler2, u_Sampler3, u_Sampler4, u_Sampler5, u_Sampler6, u_Sampler7, u_Sampler8, u_Sampler9, u_Sampler10, u_Sampler11, u_Sampler12, u_whichTexture, u_UVScale;

let g_camera;
let g_skyCube = null;
let g_floorCube = null;

// Mouse rotation tracking
let g_lastMouseX = null;
let g_lastMouseY = null;

function buildMapCubes() {
  g_wallCubes = []; 

  const size = 32; // 32x32 world
  const height = 4; // 4 blocks tall
  
  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      // Boundary walls only
      if (x === 0 || x === size-1 || z === 0 || z === size-1) {
        // Stack walls 4 high
        for (let y = 0; y < height; y++) {
          const c = new Cube();
          c.textureNum = -2;
          c.color = [0.8, 1, 1, 1];
          c.matrix.setIdentity();
          c.matrix.translate(x - size/2, y - 0.75, z - size/2);
          g_wallCubes.push(c);
        }
      }
    }
  }
  buildWallBatch();
}

let g_wallVertBuffer = null;
let g_wallUVBuffer = null;
let g_wallVertCount = 0;

let g_treeVertBuffer = null;
let g_treeUVBuffer = null;
let g_treeTrunkVertCount = 0;
let g_treeLeavesVertCount = 0;
let g_treeTrunkVerts = [];
let g_treeTrunkUVs = [];
let g_treeLeavesVerts = [];
let g_treeLeavesUVs = [];

// Unit cube vertices (36 verts for 12 triangles)
const CUBE_VERTS = [
  // FRONT
  0,0,0,  1,1,0,  1,0,0,
  0,0,0,  0,1,0,  1,1,0,
  // BACK
  0,0,1,  1,0,1,  1,1,1,
  0,0,1,  1,1,1,  0,1,1,
  // TOP
  0,1,0,  0,1,1,  1,1,1,
  0,1,0,  1,1,1,  1,1,0,
  // BOTTOM
  0,0,0,  1,0,1,  0,0,1,
  0,0,0,  1,0,0,  1,0,1,
  // LEFT
  0,0,0,  0,0,1,  0,1,1,
  0,0,0,  0,1,1,  0,1,0,
  // RIGHT
  1,0,0,  1,1,1,  1,0,1,
  1,0,0,  1,1,0,  1,1,1,
];

const CUBE_UVS = [
  0,0,  1,1,  1,0,
  0,0,  0,1,  1,1,
  0,0,  1,0,  1,1,
  0,0,  1,1,  0,1,
  0,0,  0,1,  1,1,
  0,0,  1,1,  1,0,
  0,0,  1,1,  0,1,
  0,0,  1,0,  1,1,
  0,0,  1,0,  1,1,
  0,0,  1,1,  0,1,
  0,0,  1,1,  1,0,
  0,0,  0,1,  1,1,
];

function addCubeToArrays(verts, uvs, tx, ty, tz) {
  for (let i = 0; i < CUBE_VERTS.length; i += 3) {
    verts.push(CUBE_VERTS[i] + tx, CUBE_VERTS[i+1] + ty, CUBE_VERTS[i+2] + tz);
  }
  for (let i = 0; i < CUBE_UVS.length; i++) {
    uvs.push(CUBE_UVS[i]);
  }
}

// Add only the top face of a cube (for grass top texture)
function addCubeTopToArrays(verts, uvs, tx, ty, tz) {
  for (let i = 36; i < 54; i += 3) {
    verts.push(CUBE_VERTS[i] + tx, CUBE_VERTS[i+1] + ty, CUBE_VERTS[i+2] + tz);
  }
  for (let i = 24; i < 36; i++) {
    uvs.push(CUBE_UVS[i]);
  }
}

// Add all faces EXCEPT top (for grass side texture)
function addCubeSidesToArrays(verts, uvs, tx, ty, tz) {
  // front is (0-17), back (18-35), skip top (36-53) since needs to be changed, bottom (54-71), l (72-89), r (90-107)
  
  
  // FRONT
  for (let i = 0; i < 18; i += 3) {
    verts.push(CUBE_VERTS[i] + tx, CUBE_VERTS[i+1] + ty, CUBE_VERTS[i+2] + tz);
  }
  for (let i = 0; i < 12; i++) { uvs.push(CUBE_UVS[i]); }
  // BACK
  for (let i = 18; i < 36; i += 3) {
    verts.push(CUBE_VERTS[i] + tx, CUBE_VERTS[i+1] + ty, CUBE_VERTS[i+2] + tz);
  }
  for (let i = 12; i < 24; i++) { uvs.push(CUBE_UVS[i]); }
  // BOTTOM
  for (let i = 54; i < 72; i += 3) {
    verts.push(CUBE_VERTS[i] + tx, CUBE_VERTS[i+1] + ty, CUBE_VERTS[i+2] + tz);
  }
  for (let i = 36; i < 48; i++) { uvs.push(CUBE_UVS[i]); }
  // LEFT
  for (let i = 72; i < 90; i += 3) {
    verts.push(CUBE_VERTS[i] + tx, CUBE_VERTS[i+1] + ty, CUBE_VERTS[i+2] + tz);
  }
  for (let i = 48; i < 60; i++) { uvs.push(CUBE_UVS[i]); }
  // RIGHT
  for (let i = 90; i < 108; i += 3) {
    verts.push(CUBE_VERTS[i] + tx, CUBE_VERTS[i+1] + ty, CUBE_VERTS[i+2] + tz);
  }
  for (let i = 60; i < 72; i++) { uvs.push(CUBE_UVS[i]); }
}

function buildWallBatch() {
  let verts = [];
  let uvs = [];
  
  for (let i = 0; i < g_wallCubes.length; i++) {
    let m = g_wallCubes[i].matrix.elements;
    addCubeToArrays(verts, uvs, m[12], m[13], m[14]);
  }
  
  g_wallVertCount = verts.length / 3;
  
  g_wallVertBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_wallVertBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
  
  g_wallUVBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_wallUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
}

function buildTreeBatch() {
  g_treeTrunkVerts = [];
  g_treeTrunkUVs = [];
  g_treeLeavesVerts = [];
  g_treeLeavesUVs = [];
  
  for (let i = 0; i < g_treeCubes.length; i++) {
    let cube = g_treeCubes[i];
    let m = cube.matrix.elements;
    if (cube.textureNum === 2) { // tre trunk
      addCubeToArrays(g_treeTrunkVerts, g_treeTrunkUVs, m[12], m[13], m[14]);
    } else { // leaves
      addCubeToArrays(g_treeLeavesVerts, g_treeLeavesUVs, m[12], m[13], m[14]);
    }
  }
  
  g_treeTrunkVertCount = g_treeTrunkVerts.length / 3;
  g_treeLeavesVertCount = g_treeLeavesVerts.length / 3;
  
  g_treeVertBuffer = gl.createBuffer();
  g_treeUVBuffer = gl.createBuffer();
}

function drawMapBatched() { return; }

function drawTreesBatched() {
  let identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);
  gl.uniform1f(u_UVScale, 1.0);
  
  // Draw trunks
  if (g_treeTrunkVertCount > 0) {
    gl.uniform1i(u_whichTexture, 2);
    if (g_oakTexture) {
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, g_oakTexture);
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_treeVertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_treeTrunkVerts), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_treeUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_treeTrunkUVs), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
    
    gl.drawArrays(gl.TRIANGLES, 0, g_treeTrunkVertCount);
  }
  
  // Draw leaves
  if (g_treeLeavesVertCount > 0) {
    gl.uniform1i(u_whichTexture, 3);
    if (g_leavesTexture) {
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, g_leavesTexture);
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_treeVertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_treeLeavesVerts), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_treeUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_treeLeavesUVs), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
    
    gl.drawArrays(gl.TRIANGLES, 0, g_treeLeavesVertCount);
  }
}

function drawMap() { drawMapBatched();}

// Texture storage
let g_skyTexture = null;
let g_grassTexture = null;
let g_oakTexture = null;
let g_leavesTexture = null;

// --- COLLISION DETECTION ----
let g_collisionBoxes = [];

function buildCollisionBoxes() {
  g_collisionBoxes = [];
  
  // Add tree trunk collisions (just the trunk, not leaves)
  const treePositions = [
    {x: 2, z: 2},
    {x: -5, z: 8},
    {x: 10, z: -3},
    {x: -8, z: -10},
    {x: -2, z: -5},
    {x: 6, z: -8},
    {x: -10, z: 2},
    {x: 12, z: 8},
    {x: 0, z: 10},
    {x: -3, z: -12},
    {x: 8, z: 12},
    {x: -12, z: -3}
  ];
  for (let tp of treePositions) {
    g_collisionBoxes.push({
      minX: tp.x - 0.5, maxX: tp.x + 1.5,
      minZ: tp.z - 0.5, maxZ: tp.z + 1.5
    });
  }
  
  // Add house collision 
  g_collisionBoxes.push({
    minX: 4.5, maxX: 10.5,
    minZ: 4.5, maxZ: 9.5
  });
  
  // Add mountain collision 
  g_collisionBoxes.push({
    minX: -14.5, maxX: -6.5,
    minZ: -14.5, maxZ: -7.5
  });
  
  // Add boundary wall collisions (32x32 world centered at 0)
  const wallThickness = 1.5;
  const halfSize = 16;
  // N,S,W,E Walss
  g_collisionBoxes.push({ minX: -halfSize-wallThickness, maxX: halfSize+wallThickness, minZ: halfSize-wallThickness, maxZ: halfSize+wallThickness });
  g_collisionBoxes.push({ minX: -halfSize-wallThickness, maxX: halfSize+wallThickness, minZ: -halfSize-wallThickness, maxZ: -halfSize+wallThickness });
  g_collisionBoxes.push({ minX: halfSize-wallThickness, maxX: halfSize+wallThickness, minZ: -halfSize-wallThickness, maxZ: halfSize+wallThickness });
  g_collisionBoxes.push({ minX: -halfSize-wallThickness, maxX: -halfSize+wallThickness, minZ: -halfSize-wallThickness, maxZ: halfSize+wallThickness });
  
  // rock collisions
  const rockPositions = [
    {x: -6, z: -2},
    {x: 4, z: -5},
    {x: -1, z: 6},
    {x: 11, z: 2},
    {x: -4, z: 12},
    {x: 7, z: -12},
    {x: -9, z: -6},
    {x: 13, z: -7},
    {x: 3, z: 13},
    {x: -11, z: 10},
  ];
  for (let rp of rockPositions) {
    g_collisionBoxes.push({
      minX: rp.x - 0.3, maxX: rp.x + 1.3,
      minZ: rp.z - 0.3, maxZ: rp.z + 1.3
    });
  }
}

function checkCollision(x, z) {
  const playerRadius = 0.4; // set to keep track of how "wide" the player is
  
  for (let box of g_collisionBoxes) {
    if (x + playerRadius > box.minX && x - playerRadius < box.maxX &&
        z + playerRadius > box.minZ && z - playerRadius < box.maxZ) {
      return true; // means collision
    }
  }
  return false; // no collision
}

// Tree cubes storage
let g_treeCubes = [];

function buildTree(baseX, baseY, baseZ) {
  // Build trunk ( which i s 4 blocks tall)
  for (let y = 0; y < 4; y++) {
    let trunk = new Cube();
    trunk.textureNum = 2; // oak texture
    trunk.color = [0.6, 0.4, 0.2, 1]; // brown 
    trunk.matrix.setIdentity();
    trunk.matrix.translate(baseX, baseY + y, baseZ);
    g_treeCubes.push(trunk);
  }
  
  // Build leaves (3x3x3 cube on top. each have same shape)
  for (let x = -1; x <= 1; x++) {
    for (let y = 0; y <= 2; y++) {
      for (let z = -1; z <= 1; z++) {
        if ((y === 0 || y === 2) && Math.abs(x) === 1 && Math.abs(z) === 1) continue;
        
        let leaf = new Cube();
        leaf.textureNum = 3; // leaves texture
        leaf.color = [0.2, 0.6, 0.1, 1]; // green 
        leaf.matrix.setIdentity();
        leaf.matrix.translate(baseX + x, baseY + 4 + y, baseZ + z);
        g_treeCubes.push(leaf);
      }
    }
  }
}

function drawTrees() {
  drawTreesBatched();
}

// init house vars 
let g_houseCubes = [];
let g_houseVertBuffer = null;
let g_houseUVBuffer = null;
let g_houseVertCount = 0;
let g_houseWallVerts = [];
let g_houseWallUVs = [];
let g_houseCornerVerts = [];
let g_houseCornerUVs = [];
let g_houseFloorVerts = [];
let g_houseFloorUVs = [];
let g_houseRoofVerts = [];
let g_houseRoofUVs = [];
let g_houseWindowVerts = [];
let g_houseWindowUVs = [];
let g_houseWallVertCount = 0;
let g_houseCornerVertCount = 0;
let g_houseFloorVertCount = 0;
let g_houseRoofVertCount = 0;
let g_houseWindowVertCount = 0;

function buildHouse(baseX, baseY, baseZ) {
  g_houseCubes = [];
  
  const width = 5;
  const depth = 4;
  const wallHeight = 3;
  
  // Build floor
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      let floor = new Cube();
      floor.textureNum = 5; // plank texture
      floor.color = [0.6, 0.4, 0.2, 1];
      floor.matrix.setIdentity();
      floor.matrix.translate(baseX + x, baseY, baseZ + z);
      floor.blockType = 'floor';
      g_houseCubes.push(floor);
    }
  }
  
  // Build walls (hollow inside)
  for (let y = 1; y <= wallHeight; y++) {
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        // Only build on edges (walls)
        const isWall = (x === 0 || x === width-1 || z === 0 || z === depth-1);
        
        // Check if this is a corner block
        const isCorner = (x === 0 || x === width-1) && (z === 0 || z === depth-1);
        
        // Door opening (front wall, middle, bottom 2 blocks)
        const isDoor = (z === 0 && x === 2 && y <= 2);
        
        // Window openings (side walls)
        const isWindow = ((x === 0 || x === width-1) && z === 2 && y === 2);
        
        if (isWall && !isDoor) {
          let wall = new Cube();
          wall.color = [0.6, 0.4, 0.2, 1];
          wall.matrix.setIdentity();
          wall.matrix.translate(baseX + x, baseY + y, baseZ + z);
          
          if (isWindow) {
            wall.textureNum = 6; // glass texture
            wall.blockType = 'window';
          } else if (isCorner) {
            wall.textureNum = 4; // stonebrick texture
            wall.blockType = 'corner';
          } else {
            wall.textureNum = 5; // plank texture
            wall.blockType = 'wall';
          }
          g_houseCubes.push(wall);
        }
      }
    }
  }
  
  // Build roof
  const roofBase = wallHeight + 1;
  for (let layer = 0; layer < 3; layer++) {
    const roofWidth = width - layer;
    const startX = layer * 0.5;
    
    for (let x = 0; x < roofWidth; x++) {
      for (let z = -1; z < depth + 1; z++) {
        let roof = new Cube();
        roof.textureNum = 12; // gray_wool texture
        roof.color = [0.5, 0.5, 0.5, 1];
        roof.matrix.setIdentity();
        roof.matrix.translate(baseX + startX + x, baseY + roofBase + layer, baseZ + z);
        roof.blockType = 'roof';
        g_houseCubes.push(roof);
      }
    }
  }
}

function buildHouseBatch() {
  g_houseWallVerts = [];
  g_houseWallUVs = [];
  g_houseCornerVerts = [];
  g_houseCornerUVs = [];
  g_houseFloorVerts = [];
  g_houseFloorUVs = [];
  g_houseRoofVerts = [];
  g_houseRoofUVs = [];
  g_houseWindowVerts = [];
  g_houseWindowUVs = [];
  
  for (let i = 0; i < g_houseCubes.length; i++) {
    let cube = g_houseCubes[i];
    let m = cube.matrix.elements;
    if (cube.blockType === 'roof') {
      addCubeToArrays(g_houseRoofVerts, g_houseRoofUVs, m[12], m[13], m[14]);
    } else if (cube.blockType === 'corner') {
      addCubeToArrays(g_houseCornerVerts, g_houseCornerUVs, m[12], m[13], m[14]);
    } else if (cube.blockType === 'floor') {
      addCubeToArrays(g_houseFloorVerts, g_houseFloorUVs, m[12], m[13], m[14]);
    } else if (cube.blockType === 'window') {
      addCubeToArrays(g_houseWindowVerts, g_houseWindowUVs, m[12], m[13], m[14]);
    } else {
      addCubeToArrays(g_houseWallVerts, g_houseWallUVs, m[12], m[13], m[14]);
    }
  }
  
  g_houseWallVertCount = g_houseWallVerts.length / 3;
  g_houseCornerVertCount = g_houseCornerVerts.length / 3;
  g_houseFloorVertCount = g_houseFloorVerts.length / 3;
  g_houseRoofVertCount = g_houseRoofVerts.length / 3;
  g_houseWindowVertCount = g_houseWindowVerts.length / 3;
  
  g_houseVertBuffer = gl.createBuffer();
  g_houseUVBuffer = gl.createBuffer();
}

function drawHouseBatched() {
  let identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);
  gl.uniform1f(u_UVScale, 1.0);
  
  // Draw walls (plank texture)
  if (g_houseWallVertCount > 0) {
    gl.uniform1i(u_whichTexture, 5);
    if (g_plankTexture) {
      gl.activeTexture(gl.TEXTURE5);
      gl.bindTexture(gl.TEXTURE_2D, g_plankTexture);
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_houseVertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_houseWallVerts), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_houseUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_houseWallUVs), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
    
    gl.drawArrays(gl.TRIANGLES, 0, g_houseWallVertCount);
  }
  
  // Draw corners (stonebrick texture)
  if (g_houseCornerVertCount > 0) {
    gl.uniform1i(u_whichTexture, 4);
    if (g_stonebrickTexture) {
      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D, g_stonebrickTexture);
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_houseVertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_houseCornerVerts), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_houseUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_houseCornerUVs), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
    
    gl.drawArrays(gl.TRIANGLES, 0, g_houseCornerVertCount);
  }
  
  // Draw floor (stonebrick texture)
  if (g_houseFloorVertCount > 0) {
    gl.uniform1i(u_whichTexture, 4);
    if (g_stonebrickTexture) {
      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D, g_stonebrickTexture);
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_houseVertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_houseFloorVerts), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_houseUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_houseFloorUVs), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
    
    gl.drawArrays(gl.TRIANGLES, 0, g_houseFloorVertCount);
  }
  
  // Draw roof (gray_wool texture)
  if (g_houseRoofVertCount > 0) {
    gl.uniform1i(u_whichTexture, 12);
    gl.activeTexture(gl.TEXTURE12);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_houseVertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_houseRoofVerts), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_houseUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_houseRoofUVs), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
    
    gl.drawArrays(gl.TRIANGLES, 0, g_houseRoofVertCount);
  }
  
  // Draw windows (glass texture)
  if (g_houseWindowVertCount > 0) {
    gl.uniform1i(u_whichTexture, 6);
    if (g_glassTexture) {
      gl.activeTexture(gl.TEXTURE6);
      gl.bindTexture(gl.TEXTURE_2D, g_glassTexture);
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_houseVertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_houseWindowVerts), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_houseUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_houseWindowUVs), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
    
    gl.drawArrays(gl.TRIANGLES, 0, g_houseWindowVertCount);
  }
}

// Mountain blocks
let g_mountainCubes = [];
let g_mountainVertBuffer = null;
let g_mountainUVBuffer = null;
let g_mountainVertCount = 0;
let g_mountainVerts = [];
let g_mountainUVs = [];

// Separate buffers for mountain top and sides
let g_mountainTopVerts = [];
let g_mountainTopUVs = [];
let g_mountainTopVertBuffer = null;
let g_mountainTopUVBuffer = null;
let g_mountainTopVertCount = 0;
let g_mountainSideVerts = [];
let g_mountainSideUVs = [];
let g_mountainSideVertBuffer = null;
let g_mountainSideUVBuffer = null;
let g_mountainSideVertCount = 0;

// Water cubes for waterfall animation
let g_waterCubes = [];
let g_waterTime = 0;

function buildMountain(cornerX, cornerZ) {
  g_mountainCubes = [];
  const width = 7;
  const depth = 6;

  const heightMap = [
    [1, 1, 2, 2, 2, 1, 1],
    [1, 2, 3, 2, 3, 2, 1], 
    [2, 3, 4, 3, 4, 3, 1],
    [1, 3, 4, 2, 3, 2, 1],
    [1, 2, 2, 1, 2, 1, 0],
    [0, 1, 1, 0, 1, 0, 0],
  ];
  
  for (let z = 0; z < depth; z++) {
    for (let x = 0; x < width; x++) {
      const maxHeight = heightMap[z][x];
      // stack blocks up to the height at this position
      for (let y = 0; y < maxHeight; y++) {
        let block = new Cube();
        block.textureNum = 1; // grass tex
        block.color = [0.2, 0.8, 0.2, 1]; // green 
        block.matrix.setIdentity();
        block.matrix.translate(cornerX + x, y - 0.75, cornerZ + z);
        g_mountainCubes.push(block);
      }
    }
  }
  
  // Build waterfall running through the carved channel in the mountain
  const waterfallPath = [
    {x: 3, z: 0, y: 2},  // Top - inside mountain
    {x: 3, z: 1, y: 2},  // Flowing through channel
    {x: 3, z: 2, y: 3},  // Higher up in channel
    {x: 3, z: 2, y: 2},  // Inside channel
    {x: 3, z: 3, y: 2},  // Continue
    {x: 3, z: 3, y: 1},  // Dropping
    {x: 3, z: 4, y: 1},  // Continue
    {x: 3, z: 4, y: 0},  // Dropping to ground
    {x: 3, z: 5, y: 0},  // Exit channel
    {x: 3, z: 6, y: 0},  // Ground level (pool)
  ];
  
  for (let i = 0; i < waterfallPath.length; i++) {
    let wp = waterfallPath[i];
    let water = new Cube();
    water.textureNum = -2; // solid color
    water.color = [0.2, 0.5, 1.0, 0.8]; // blue water color
    water.matrix.setIdentity();
    water.baseX = cornerX + wp.x;
    water.baseY = wp.y - 0.75;
    water.baseZ = cornerZ + wp.z;
    water.matrix.translate(water.baseX, water.baseY, water.baseZ);
    g_waterCubes.push(water);
  }
  
  // Build small pond at bottom of waterfall
  buildPond(cornerX + 2, cornerZ + 6);
}

// ========== POND ==========
let g_pondVerts = [];
let g_pondUVs = [];
let g_pondVertBuffer = null;
let g_pondUVBuffer = null;
let g_pondVertCount = 0;

function buildPond(centerX, centerZ) {
  g_pondVerts = [];
  g_pondUVs = [];
 
  const pondY = -1.64;
  
  
  const pondTiles = [
    // Main body of pond
    {dx: 0, dz: 0},
    {dx: 0, dz: 1},
    {dx: 0, dz: 2},
    {dx: 1, dz: 1},
    {dx: -1, dz: 1},
    {dx: 1, dz: 2},
    {dx: -1, dz: 0},
    {dx: 0, dz: 3},
    {dx: -1, dz: 2},
  ];
  
  for (let tile of pondTiles) {
    let x = centerX + tile.dx;
    let z = centerZ + tile.dz;
    addCubeTopToArrays(g_pondVerts, g_pondUVs, x, pondY, z);
  }
  
  g_pondVertCount = g_pondVerts.length / 3;
  
  g_pondVertBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_pondVertBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_pondVerts), gl.STATIC_DRAW);
  
  g_pondUVBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_pondUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_pondUVs), gl.STATIC_DRAW);
}

function drawPond() {
  if (g_pondVertCount === 0) return;
  
  gl.uniform1i(u_whichTexture, 8); // water texture
  if (g_waterTexture) {
    gl.activeTexture(gl.TEXTURE8);
    gl.bindTexture(gl.TEXTURE_2D, g_waterTexture);
  }
  
  let identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);
  gl.uniform1f(u_UVScale, 1.0);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, g_pondVertBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, g_pondUVBuffer);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);
  
  gl.drawArrays(gl.TRIANGLES, 0, g_pondVertCount);
}

// -- BARRELS ---
let g_barrelVerts = [];
let g_barrelUVs = [];
let g_barrelVertBuffer = null;
let g_barrelUVBuffer = null;
let g_barrelVertCount = 0;

function initBarrels() {
  g_barrelVerts = [];
  g_barrelUVs = [];
  
  // Place a couple of barrels near the house (house is at around x=5, z=5)
  const barrelPositions = [
    {x: 3.5, z: 5.5},   // Left side of house
    {x: 3.5, z: 7},     // Left side, further back
    {x: 10, z: 6},      // Right side of house
  ];
  
  const barrelY = -0.75; // Ground level
  
  for (let pos of barrelPositions) {
    addCubeToArrays(g_barrelVerts, g_barrelUVs, pos.x, barrelY, pos.z);
  }
  
  g_barrelVertCount = g_barrelVerts.length / 3;
  
  g_barrelVertBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_barrelVertBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_barrelVerts), gl.STATIC_DRAW);
  
  g_barrelUVBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_barrelUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_barrelUVs), gl.STATIC_DRAW);
}

function drawBarrels() {
  if (g_barrelVertCount === 0) return;
  
  gl.uniform1i(u_whichTexture, 9); // barrel texture
  if (g_barrelTexture) {
    gl.activeTexture(gl.TEXTURE9);
    gl.bindTexture(gl.TEXTURE_2D, g_barrelTexture);
  }
  
  let identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);
  gl.uniform1f(u_UVScale, 1.0);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, g_barrelVertBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, g_barrelUVBuffer);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);
  
  gl.drawArrays(gl.TRIANGLES, 0, g_barrelVertCount);
}

// --- HAYBALES --
let g_rockTopVerts = [];
let g_rockTopUVs = [];
let g_rockSideVerts = [];
let g_rockSideUVs = [];
let g_rockTopVertBuffer = null;
let g_rockTopUVBuffer = null;
let g_rockSideVertBuffer = null;
let g_rockSideUVBuffer = null;
let g_rockTopVertCount = 0;
let g_rockSideVertCount = 0;
let g_rockPositions = [];

function initRocks() {
  g_rockTopVerts = [];
  g_rockTopUVs = [];
  g_rockSideVerts = [];
  g_rockSideUVs = [];
  g_rockPositions = [];
  
  // Scatter haybales around the map as obstacles (just used rock as vars cause was going to be rocks)
  const rockPositions = [
    {x: -6, z: -2},
    {x: 4, z: -5},
    {x: -1, z: 6},
    {x: 11, z: 2},
    {x: -4, z: 12},
    {x: 7, z: -12},
    {x: -9, z: -6},
    {x: 13, z: -7},
    {x: 3, z: 13},
    {x: -11, z: 10},
  ];
  
  const rockY = -0.75;
  
  for (let pos of rockPositions) {
    // Add top face (for hay-top texture)
    addCubeTopToArrays(g_rockTopVerts, g_rockTopUVs, pos.x, rockY, pos.z);
    // Add side faces (for haybale-sides texture)
    addCubeSidesToArrays(g_rockSideVerts, g_rockSideUVs, pos.x, rockY, pos.z);
    g_rockPositions.push(pos);
  }
  
  g_rockTopVertCount = g_rockTopVerts.length / 3;
  g_rockSideVertCount = g_rockSideVerts.length / 3;
  
  // Create buffers for top faces
  g_rockTopVertBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_rockTopVertBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_rockTopVerts), gl.STATIC_DRAW);
  
  g_rockTopUVBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_rockTopUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_rockTopUVs), gl.STATIC_DRAW);
  
  // Create buffers for side faces
  g_rockSideVertBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_rockSideVertBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_rockSideVerts), gl.STATIC_DRAW);
  
  g_rockSideUVBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_rockSideUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_rockSideUVs), gl.STATIC_DRAW);
}

function drawRocks() {
  let identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);
  gl.uniform1f(u_UVScale, 1.0);
  
  // Draw top faces with hay-top texture
  if (g_rockTopVertCount > 0) {
    gl.uniform1i(u_whichTexture, 10); // hay-top texture
    if (g_hayTopTexture) {
      gl.activeTexture(gl.TEXTURE10);
      gl.bindTexture(gl.TEXTURE_2D, g_hayTopTexture);
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_rockTopVertBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_rockTopUVBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
    
    gl.drawArrays(gl.TRIANGLES, 0, g_rockTopVertCount);
  }
  
  // Draw side faces with haybale-sides texture
  if (g_rockSideVertCount > 0) {
    gl.uniform1i(u_whichTexture, 11); // haybale-sides texture
    if (g_haybaleSidesTexture) {
      gl.activeTexture(gl.TEXTURE11);
      gl.bindTexture(gl.TEXTURE_2D, g_haybaleSidesTexture);
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_rockSideVertBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_rockSideUVBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
    
    gl.drawArrays(gl.TRIANGLES, 0, g_rockSideVertCount);
  }
}

function buildMountainBatch() {
  g_mountainVerts = [];
  g_mountainUVs = [];
  g_mountainTopVerts = [];
  g_mountainTopUVs = [];
  g_mountainSideVerts = [];
  g_mountainSideUVs = [];
  
  for (let i = 0; i < g_mountainCubes.length; i++) {
    let m = g_mountainCubes[i].matrix.elements;
    // Add top face to top arrays (for grass texture)
    addCubeTopToArrays(g_mountainTopVerts, g_mountainTopUVs, m[12], m[13], m[14]);
    // Add side faces to side arrays (for grass2 texture)
    addCubeSidesToArrays(g_mountainSideVerts, g_mountainSideUVs, m[12], m[13], m[14]);
  }
  
  g_mountainTopVertCount = g_mountainTopVerts.length / 3;
  g_mountainSideVertCount = g_mountainSideVerts.length / 3;
  
  // Create buffers for top faces
  g_mountainTopVertBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_mountainTopVertBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_mountainTopVerts), gl.STATIC_DRAW);
  
  g_mountainTopUVBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_mountainTopUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_mountainTopUVs), gl.STATIC_DRAW);
  
  // Create buffers for side faces
  g_mountainSideVertBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_mountainSideVertBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_mountainSideVerts), gl.STATIC_DRAW);
  
  g_mountainSideUVBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_mountainSideUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_mountainSideUVs), gl.STATIC_DRAW);
}

function drawMountainBatched() {
  let identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);
  gl.uniform1f(u_UVScale, 1.0);
  
  // Draw top faces with grass texture
  if (g_mountainTopVertCount > 0) {
    gl.uniform1i(u_whichTexture, 1); // grass texture
    if (g_grassTexture) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, g_grassTexture);
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_mountainTopVertBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_mountainTopUVBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
    
    gl.drawArrays(gl.TRIANGLES, 0, g_mountainTopVertCount);
  }
  
  // Draw side faces with grass2 texture
  if (g_mountainSideVertCount > 0) {
    gl.uniform1i(u_whichTexture, 7); // grass2 texture
    if (g_grass2Texture) {
      gl.activeTexture(gl.TEXTURE7);
      gl.bindTexture(gl.TEXTURE_2D, g_grass2Texture);
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_mountainSideVertBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, g_mountainSideUVBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
    
    gl.drawArrays(gl.TRIANGLES, 0, g_mountainSideVertCount);
  }
}

function drawWaterfall() {
  // Animate water blocks
  g_waterTime += 0.05;
  
  for (let i = 0; i < g_waterCubes.length; i++) {
    let water = g_waterCubes[i];
    // Animate Y position with wave effect
    let offset = Math.sin(g_waterTime + i * 0.5) * 0.1;
    water.matrix.elements[13] = water.baseY + offset;
    
    // Pulsing blue color
    let pulse = 0.5 + Math.sin(g_waterTime * 2 + i) * 0.2;
    water.color = [0.2, pulse, 1.0, 0.8];
    
    water.renderfast();
  }
}

// --- for coin game --
let g_coins = [];
let g_score = 0;
let g_totalCoins = 0;
let g_coinRotation = 0;
let g_gameWon = false;

function initCoins() {
  g_coins = [];
  g_score = 0;
  g_gameWon = false;
  
  // Coin positions scattered around the world
  const coinPositions = [
    // Near spawn area
    {x: 0, y: 0.5, z: 0},
    {x: 3, y: 0.5, z: -3},
    {x: -3, y: 0.5, z: 3},
    
    // Near trees
    {x: 2, y: 1.5, z: 2},
    {x: -5, y: 0.5, z: 8},
    {x: 10, y: 0.5, z: -3},
    {x: -8, y: 0.5, z: -10},
    
    // Near house
    {x: 7, y: 0.5, z: 7},
    {x: 4, y: 0.5, z: 4},
    
    // On mountain
    {x: -11, y: 2, z: -12},
    {x: -12, y: 3.5, z: -11},
    
    // Around the map edges
    {x: 12, y: 0.5, z: 12},
    {x: -12, y: 0.5, z: 10},
    {x: 8, y: 0.5, z: -12},
    {x: -10, y: 0.5, z: -5},
  ];
  
  for (let i = 0; i < coinPositions.length; i++) {
    let pos = coinPositions[i];
    let coin = {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      collected: false,
      cube: new Cube()
    };
    coin.cube.textureNum = -2; // solid color
    coin.cube.color = [1.0, 0.85, 0.0, 1.0]; // gold color
    g_coins.push(coin);
  }
  
  g_totalCoins = g_coins.length;
}

function checkCoinCollision() {
  const collectDistance = 1.5; // to define how close player needs to be to collect
  
  for (let i = 0; i < g_coins.length; i++) {
    let coin = g_coins[i];
    if (coin.collected) continue;
    
    // Get distance from camera to coin
    let dx = g_camera.eye.elements[0] - coin.x;
    let dy = g_camera.eye.elements[1] - coin.y;
    let dz = g_camera.eye.elements[2] - coin.z;
    let distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    if (distance < collectDistance) {
      coin.collected = true;
      g_score++;
      console.log("Coin collected! Score: " + g_score + "/" + g_totalCoins);
      
      // Check win condition
      if (g_score >= g_totalCoins) {
        g_gameWon = true;
        console.log("YOU WIN! All coins collected!");
      }
    }
  }
}

function drawCoins() {
  // Animate rotation
  g_coinRotation += 3;
  if (g_coinRotation >= 360) g_coinRotation = 0;
  
  for (let i = 0; i < g_coins.length; i++) {
    let coin = g_coins[i];
    if (coin.collected) continue;
    
    // Floating animation
    let floatOffset = Math.sin(g_seconds * 2 + i) * 0.15;
    
    // Draw coin as a flat rotating cube (looks like a coin)
    coin.cube.matrix.setIdentity();
    coin.cube.matrix.translate(coin.x, coin.y + floatOffset, coin.z);
    coin.cube.matrix.rotate(g_coinRotation, 0, 1, 0); // Spin around Y axis
    coin.cube.matrix.scale(0.3, 0.3, 0.08); // Flat coin shape
    coin.cube.matrix.translate(-0.5, -0.5, -0.5); // Center it
    
    // to make coin look like it is sparkling
    let sparkle = 0.85 + Math.sin(g_seconds * 5 + i * 2) * 0.15;
    coin.cube.color = [1.0, sparkle, 0.0, 1.0];
    
    coin.cube.renderfast();
  }
}

function updateGameUI() {
  // Update score display
  let scoreText = "Coins: " + g_score + "/" + g_totalCoins;
  if (g_gameWon) {
    scoreText += " - Yay. You won yo. GG. Press R to restart";
  }
  sendTextToHTML(scoreText, "score");
}

function resetGame() {
  initCoins();
  g_camera.eye.elements[0] = 0;
  g_camera.eye.elements[1] = 0;
  g_camera.eye.elements[2] = 3;
}

// --- attempt at grass ---
let g_grassTufts = [];
let g_grassVerts = [];
let g_grassUVs = [];
let g_grassVertCount = 0;
let g_grassVertBuffer = null;
let g_grassUVBuffer = null;

function initGrassTufts() {
  g_grassTufts = [];
  g_grassVerts = [];
  g_grassUVs = [];
  
  // Scatter grass tufts randomly around the map
  const numTufts = 50;
  for (let i = 0; i < numTufts; i++) {
    // Random position within the map bounds (avoiding edges and structures)
    let x = (Math.random() - 0.5) * 28; // -14 to 14
    let z = (Math.random() - 0.5) * 28;
    
    // Skip if too close to trees, house, or mountain
    if (Math.abs(x - 2) < 2 && Math.abs(z - 2) < 2) continue;
    if (Math.abs(x + 5) < 2 && Math.abs(z - 8) < 2) continue;
    if (Math.abs(x - 10) < 2 && Math.abs(z + 3) < 2) continue;
    if (Math.abs(x + 8) < 2 && Math.abs(z + 10) < 2) continue;
    if (x > 4 && x < 11 && z > 4 && z < 10) continue; // house area
    if (x < -7 && z < -7) continue; // mountain area
    
    let height = 0.2 + Math.random() * 0.3;
    
    // Add scaled cube vertices directly
    for (let j = 0; j < CUBE_VERTS.length; j += 3) {
      g_grassVerts.push(
        (CUBE_VERTS[j] - 0.5) * 0.15 + x,
        CUBE_VERTS[j+1] * height - 0.65,
        (CUBE_VERTS[j+2] - 0.5) * 0.15 + z
      );
    }
    for (let j = 0; j < CUBE_UVS.length; j++) {
      g_grassUVs.push(CUBE_UVS[j]);
    }
  }
  
  g_grassVertCount = g_grassVerts.length / 3;
  
  // Create static buffers
  g_grassVertBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_grassVertBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_grassVerts), gl.STATIC_DRAW);
  
  g_grassUVBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_grassUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_grassUVs), gl.STATIC_DRAW);
}

function drawGrassTufts() {
  if (g_grassVertCount === 0) return;
  
  gl.uniform1i(u_whichTexture, -2);
  gl.uniform4f(u_FragColor, 0.2, 0.55, 0.1, 1.0); // Green color
  
  let identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);
  gl.uniform1f(u_UVScale, 1.0);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, g_grassVertBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, g_grassUVBuffer);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);
  
  gl.drawArrays(gl.TRIANGLES, 0, g_grassVertCount);
}

// block placement handling
let g_placedBlocks = [];  // Array of {x, y, z} positions
let g_placedBlockVerts = [];
let g_placedBlockUVs = [];
let g_placedBlockVertBuffer = null;
let g_placedBlockUVBuffer = null;
let g_placedBlockVertCount = 0;

function getBlockInFront() {
  // Get the forward direction from camera
  let fx = g_camera.at.elements[0] - g_camera.eye.elements[0];
  let fy = g_camera.at.elements[1] - g_camera.eye.elements[1];
  let fz = g_camera.at.elements[2] - g_camera.eye.elements[2];
  
  // Normalize
  let len = Math.hypot(fx, fy, fz);
  if (len > 0) {
    fx /= len; fy /= len; fz /= len;
  }
  
  // Position 2 units in front of camera, snapped to grid
  let blockX = Math.round(g_camera.eye.elements[0] + fx * 2);
  let blockY = Math.round(g_camera.eye.elements[1] + fy * 2);
  let blockZ = Math.round(g_camera.eye.elements[2] + fz * 2);
  
  // Clamp Y to ground level at minimum
  if (blockY < 0) blockY = 0;
  
  return {x: blockX, y: blockY, z: blockZ};
}

function addBlock() {
  let pos = getBlockInFront();
  
  // Check if block already exists at this position
  for (let block of g_placedBlocks) {
    if (block.x === pos.x && block.y === pos.y && block.z === pos.z) {
      console.log('Block already exists at', pos);
      return;
    }
  }
  
  // Add new block
  g_placedBlocks.push(pos);
  console.log('Added block at', pos);
  
  // Rebuild the buffer
  rebuildPlacedBlockBuffer();
}

function deleteBlock() {
  let pos = getBlockInFront();
  
  // Find and remove block at this position
  for (let i = 0; i < g_placedBlocks.length; i++) {
    let block = g_placedBlocks[i];
    if (block.x === pos.x && block.y === pos.y && block.z === pos.z) {
      g_placedBlocks.splice(i, 1);
      console.log('Deleted block at', pos);
      rebuildPlacedBlockBuffer();
      return;
    }
  }
  console.log('No block to delete at', pos);
}

function rebuildPlacedBlockBuffer() {
  g_placedBlockVerts = [];
  g_placedBlockUVs = [];
  
  for (let block of g_placedBlocks) {
    addCubeToArrays(g_placedBlockVerts, g_placedBlockUVs, block.x, block.y - 0.75, block.z);
  }
  
  g_placedBlockVertCount = g_placedBlockVerts.length / 3;
  
  if (g_placedBlockVertBuffer === null) {
    g_placedBlockVertBuffer = gl.createBuffer();
    g_placedBlockUVBuffer = gl.createBuffer();
  }
  
  gl.bindBuffer(gl.ARRAY_BUFFER, g_placedBlockVertBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_placedBlockVerts), gl.DYNAMIC_DRAW);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, g_placedBlockUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g_placedBlockUVs), gl.DYNAMIC_DRAW);
}

function drawPlacedBlocks() {
  if (g_placedBlockVertCount === 0) return;
  
  // Use stonebrick texture for placed blocks
  gl.uniform1i(u_whichTexture, 4);
  if (g_stonebrickTexture) {
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, g_stonebrickTexture);
  }
  
  let identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);
  gl.uniform1f(u_UVScale, 1.0);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, g_placedBlockVertBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, g_placedBlockUVBuffer);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);
  
  gl.drawArrays(gl.TRIANGLES, 0, g_placedBlockVertCount);
}

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
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }
  
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return;
  }
  

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return;
  }
  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if (!u_Sampler2) {
    console.log('Failed to get the storage location of u_Sampler2');
    return;
  }
  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
  if (!u_Sampler3) {
    console.log('Failed to get the storage location of u_Sampler3');
    return;
  }
  u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4');
  if (!u_Sampler4) {
    console.log('Failed to get the storage location of u_Sampler4');
    return;
  }
  u_Sampler5 = gl.getUniformLocation(gl.program, 'u_Sampler5');
  if (!u_Sampler5) {
    console.log('Failed to get the storage location of u_Sampler5');
    return;
  }
  u_Sampler6 = gl.getUniformLocation(gl.program, 'u_Sampler6');
  if (!u_Sampler6) {
    console.log('Failed to get the storage location of u_Sampler6');
    return;
  }
  u_Sampler7 = gl.getUniformLocation(gl.program, 'u_Sampler7');
  if (!u_Sampler7) {
    console.log('Failed to get the storage location of u_Sampler7');
    return;
  }
  u_Sampler8 = gl.getUniformLocation(gl.program, 'u_Sampler8');
  if (!u_Sampler8) {
    console.log('Failed to get the storage location of u_Sampler8');
    return;
  }
  u_Sampler9 = gl.getUniformLocation(gl.program, 'u_Sampler9');
  if (!u_Sampler9) {
    console.log('Failed to get the storage location of u_Sampler9');
    return;
  }
  u_Sampler10 = gl.getUniformLocation(gl.program, 'u_Sampler10');
  if (!u_Sampler10) {
    console.log('Failed to get the storage location of u_Sampler10');
    return;
  }
  u_Sampler11 = gl.getUniformLocation(gl.program, 'u_Sampler11');
  if (!u_Sampler11) {
    console.log('Failed to get the storage location of u_Sampler11');
    return;
  }
  u_Sampler12 = gl.getUniformLocation(gl.program, 'u_Sampler12');
  if (!u_Sampler12) {
    console.log('Failed to get the storage location of u_Sampler12');
    return;
  }
  u_UVScale = gl.getUniformLocation(gl.program, 'u_UVScale');
  if (!u_UVScale) {
    console.log('Failed to get the storage location of u_UVScale');
    return;
  }
  gl.uniform1f(u_UVScale, 1.0);

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Globals related to UI
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT; 
let g_globalAngle = 0;
let g_globalAngleX = 0;
let g_globalAngleY = 0;

function initTextures() {
  var image1 = new Image();

  if (!image1) {
      console.log('Failed to create the image object');
      return false;
   } else {
    console.log("loaded image1");
   }

  image1.src = "textures/mc-sky.png"; 
  

  // image 2 - grass
  var image2 = new Image();
  if (!image2) {
      console.log('Failed to create the image1 object');
      return false;
   }
  image1.onload = function() { sendTextureToTEXTURE0(image1); };
  image2.onload = function() { sendTextureToTEXTURE1(image2); };
  image2.src = "textures/grass-top.jpg";
  
  // image 3 - oak
  var image3 = new Image();
  if (!image3) {
      console.log('Failed to create the image3 object');
      return false;
  }
  image3.onload = function() { sendTextureToTEXTURE2(image3); };
  image3.src = "textures/oak.png";
  
  // image 4 - leaves
  var image4 = new Image();
  if (!image4) {
      console.log('Failed to create the image4 object');
      return false;
  }
  image4.onload = function() { sendTextureToTEXTURE3(image4); };
  image4.src = "textures/leaves.png";
  
  // image 5 - stonebrick
  var image5 = new Image();
  if (!image5) {
      console.log('Failed to create the image5 object');
      return false;
  }
  image5.onload = function() { sendTextureToTEXTURE4(image5); };
  image5.src = "textures/stonebrick.png";
  
  // image 6 - plank
  var image6 = new Image();
  if (!image6) {
      console.log('Failed to create the image6 object');
      return false;
  }
  image6.onload = function() { sendTextureToTEXTURE5(image6); };
  image6.src = "textures/plank.png";
  
  // image 7 - glass
  var image7 = new Image();
  if (!image7) {
      console.log('Failed to create the image7 object');
      return false;
  }
  image7.onload = function() { sendTextureToTEXTURE6(image7); };
  image7.src = "textures/glass.png";
  
  // image 8 - grass2 (grass side)
  var image8 = new Image();
  if (!image8) {
      console.log('Failed to create the image8 object');
      return false;
  }
  image8.onload = function() { sendTextureToTEXTURE7(image8); };
  image8.src = "textures/grass2.jpg";
  
  // image 9 - water
  var image9 = new Image();
  if (!image9) {
      console.log('Failed to create the image9 object');
      return false;
  }
  image9.onload = function() { sendTextureToTEXTURE8(image9); };
  image9.src = "textures/water.jpg";
  
  // image 10 - barrel
  var image10 = new Image();
  if (!image10) {
      console.log('Failed to create the image10 object');
      return false;
  }
  image10.onload = function() { sendTextureToTEXTURE9(image10); };
  image10.src = "textures/barrel.jpg";
  
  // image 11 - hay-top
  var image11 = new Image();
  if (!image11) {
      console.log('Failed to create the image11 object');
      return false;
  }
  image11.onload = function() { sendTextureToTEXTURE10(image11); };
  image11.src = "textures/hay-top.png";
  
  // image 12 - haybale-sides
  var image12 = new Image();
  if (!image12) {
      console.log('Failed to create the image12 object');
      return false;
  }
  image12.onload = function() { sendTextureToTEXTURE11(image12); };
  image12.src = "textures/haybale-sides.jpg";
  
  // image 13 - gray_wool (roof)
  var image13 = new Image();
  if (!image13) {
      console.log('Failed to create the image13 object');
      return false;
  }
  image13.onload = function() { sendTextureToTEXTURE12(image13); };
  image13.src = "textures/gray_wool.png";
  
  return true;
}


function sendTextureToTEXTURE0(image){
    var texture = gl.createTexture();   // create a texture object
    if(!texture){
        console.log('Failed to create the texture0 object');
        return false;
    }
    g_skyTexture = texture;
    // flip the image's Y axis
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // enable texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    // bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // Set the texture unit 0 to the sampler
    gl.uniform1i(u_Sampler0, 0);
}

function sendTextureToTEXTURE1(image){
    var texture = gl.createTexture();   // create a texture object
    if(!texture){
        console.log('Failed to create the texture1 object');
        return false;
    }
    g_grassTexture  = texture;
    // flip the image's Y axis
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // enable texture unit 1
    gl.activeTexture(gl.TEXTURE1);
    // bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // Set the texture unit 1 to the sampler
    gl.uniform1i(u_Sampler1, 1);
}

function sendTextureToTEXTURE2(image){
    var texture = gl.createTexture();
    if(!texture){
        console.log('Failed to create the texture2 object');
        return false;
    }
    g_oakTexture = texture;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler2, 2);
    console.log('Oak texture loaded');
}

function sendTextureToTEXTURE3(image){
    var texture = gl.createTexture();
    if(!texture){
        console.log('Failed to create the texture3 object');
        return false;
    }
    g_leavesTexture = texture;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler3, 3);
    console.log('Leaves texture loaded');
}

let g_stonebrickTexture = null;
function sendTextureToTEXTURE4(image){
    var texture = gl.createTexture();
    if(!texture){
        console.log('Failed to create the texture4 object');
        return false;
    }
    g_stonebrickTexture = texture;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler4, 4);
    console.log('Stonebrick texture loaded');
}

let g_plankTexture = null;
function sendTextureToTEXTURE5(image){
    var texture = gl.createTexture();
    if(!texture){
        console.log('Failed to create the texture5 object');
        return false;
    }
    g_plankTexture = texture;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler5, 5);
    console.log('Plank texture loaded');
}

let g_glassTexture = null;
function sendTextureToTEXTURE6(image){
    var texture = gl.createTexture();
    if(!texture){
        console.log('Failed to create the texture6 object');
        return false;
    }
    g_glassTexture = texture;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler6, 6);
    console.log('Glass texture loaded');
}

let g_grass2Texture = null;
function sendTextureToTEXTURE7(image){
    var texture = gl.createTexture();
    if(!texture){
        console.log('Failed to create the texture7 object');
        return false;
    }
    g_grass2Texture = texture;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler7, 7);
    console.log('Grass2 texture loaded');
}

let g_waterTexture = null;
function sendTextureToTEXTURE8(image){
    var texture = gl.createTexture();
    if(!texture){
        console.log('Failed to create the texture8 object');
        return false;
    }
    g_waterTexture = texture;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE8);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler8, 8);
    console.log('Water texture loaded');
}

let g_barrelTexture = null;
function sendTextureToTEXTURE9(image){
    var texture = gl.createTexture();
    if(!texture){
        console.log('Failed to create the texture9 object');
        return false;
    }
    g_barrelTexture = texture;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE9);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler9, 9);
    console.log('Barrel texture loaded');
}

let g_hayTopTexture = null;
function sendTextureToTEXTURE10(image){
    var texture = gl.createTexture();
    if(!texture){
        console.log('Failed to create the texture10 object');
        return false;
    }
    g_hayTopTexture = texture;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE10);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler10, 10);
    console.log('Hay-top texture loaded');
}

let g_haybaleSidesTexture = null;
function sendTextureToTEXTURE11(image){
    var texture = gl.createTexture();
    if(!texture){
        console.log('Failed to create the texture11 object');
        return false;
    }
    g_haybaleSidesTexture = texture;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE11);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler11, 11);
    console.log('Haybale-sides texture loaded');
}

function sendTextureToTEXTURE12(image){
    var texture = gl.createTexture();
    if(!texture){
        console.log('Failed to create the texture12 object');
        return false;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE12);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler12, 12);
    console.log('Gray wool texture loaded');
}

function sendTextureToTexture2(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.error('Failed to create the texture object');
    return false;
  }
  g_grassTexture = texture;

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.uniform1i(u_Sampler1, 0);
  //renderAllShapes(); // Draw the world now that the texture is ready
}




function main() {
  setupWebGL();

  connectVariablesToGLSL();

  g_camera = new Camera();
  document.onkeydown = keydown;
  window.addEventListener('keydown', keydown);

  // Mouse rotation - rotate camera when mouse moves across canvas
  canvas.onmousemove = function(ev) {
    if (g_lastMouseX !== null) {
      let deltaX = ev.clientX - g_lastMouseX;
      let rotationAmount = deltaX * 0.2; // Sensitivity factor
      if (rotationAmount > 0) {
        g_camera.panRight(rotationAmount);
      } else {
        g_camera.panLeft(-rotationAmount);
      }
    }
    // Vertical rotation
    if (g_lastMouseY !== null) {
      let deltaY = ev.clientY - g_lastMouseY;
      let rotationAmount = deltaY * 0.2; // sens
      if (rotationAmount > 0) {
        g_camera.panDown(rotationAmount);
      } else {
        g_camera.panUp(-rotationAmount);
      }
    }
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  };

  // Reset mouse tracking when leaving canvas
  canvas.onmouseleave = function() {
    g_lastMouseX = null;
    g_lastMouseY = null;
  };

  //addActionsForHtmlUI();
  initTextures();
  buildMapCubes();
  
  // Build trees at various positions (kinda just randomized)
  buildTree(2, -0.75, 2);
  buildTree(-5, -0.75, 8);
  buildTree(10, -0.75, -3);
  buildTree(-8, -0.75, -10);
  buildTree(-2, -0.75, -5);
  buildTree(6, -0.75, -8);
  buildTree(-10, -0.75, 2);
  buildTree(12, -0.75, 8);
  buildTree(0, -0.75, 10);
  buildTree(-3, -0.75, -12);
  buildTree(8, -0.75, 12);
  buildTree(-12, -0.75, -3);
  buildTreeBatch();
  
  buildMountain(-14, -14);
  buildMountainBatch();

  buildHouse(5, -0.75, 5);
  buildHouseBatch();

  initCoins();

  buildCollisionBoxes();

  initGrassTufts();

  initBarrels();

  initRocks();

  g_skyCube = new Cube();
  g_skyCube.textureNum = 0;
  g_skyCube.uvScale = 1;

  g_floorCube = new Cube();
  g_floorCube.textureNum = 1;
  g_floorCube.uvScale = 32;

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
  //updateAnimationAngles();
  renderAllShapes();
  requestAnimationFrame(tick);
}



function keydown(ev) {
  // Prevent arrow keys from scrolling the page when used for camera
  if ([37,38,39,40,65,68,87,83,81,69,82,66,88].indexOf(ev.keyCode) !== -1) ev.preventDefault();

  if (ev.keyCode==39 || ev.keyCode == 68) { // right arrow or 'D'
    g_camera.moveRight(0.2);
  } else if (ev.keyCode==37 || ev.keyCode == 65) { // left arrow or 'A' 
    g_camera.moveLeft(0.2);
  } else if (ev.keyCode==38 || ev.keyCode == 87) { // up arrow or 'W'
    g_camera.moveForward(0.2);
  } else if (ev.keyCode==40 || ev.keyCode == 83) { // down arrow or 'S'
    g_camera.moveBackwards(0.2);
  } else if (ev.keyCode==81) { // 'Q'
    g_camera.panLeft(5);
  } else if (ev.keyCode==69) { // 'E'
    g_camera.panRight(5);
  } else if (ev.keyCode==82) { // 'R' - restart game
    resetGame();
  } else if (ev.keyCode==66) { // 'B' - add block
    addBlock();
  } else if (ev.keyCode==88) { // 'X' - delete block
    deleteBlock();
  }

  renderAllShapes();
  console.log(ev.keyCode);
}

function renderAllShapes() {
  var startTime = performance.now();;

  var viewMat = g_camera.viewMatrix;
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  var projMat = g_camera.projectionMatrix;
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);
  
  var globalRotMat = new Matrix4()
    .rotate(g_globalAngle, 0, 1, 0)
    .rotate(g_globalAngleY, 0, 1, 0)
    .rotate(g_globalAngleX, 1, 0, 0);
    
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  // --- SKYBOX ---
  gl.depthMask(false);
  gl.disable(gl.CULL_FACE);

  g_skyCube.matrix.setIdentity();
  g_skyCube.matrix.translate(
    g_camera.eye.elements[0],
    g_camera.eye.elements[1],
    g_camera.eye.elements[2]
  );
  g_skyCube.matrix.scale(1000, 1000, 1000);
  g_skyCube.matrix.translate(-0.5, -0.5, -0.5);
  g_skyCube.renderfast();

  gl.depthMask(true);
  gl.enable(gl.CULL_FACE);



  // --- FLOOR ---
  g_floorCube.matrix.setIdentity();
  g_floorCube.matrix.translate(0, -0.75, 0);
  g_floorCube.matrix.scale(32, 0.1, 32);
  g_floorCube.matrix.translate(-0.5, 0, -0.5);
  g_floorCube.renderfast();


  drawMap();
  drawTrees();
  drawMountainBatched();
  drawHouseBatched();
  drawBarrels();
  drawRocks();
  drawWaterfall();
  drawPond();
  drawGrassTufts();
  drawPlacedBlocks();  // Player-placed blocks
  
  // Coin collection game
  checkCoinCollision();
  drawCoins();
  updateGameUI();

  // --- PERFORMANCE ---
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