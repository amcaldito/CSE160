// inspired by Model.js from lab assignment

class OBJModel {
  constructor() {
    this.type = 'obj';
    this.color = [1, 1, 1, 1];
    this.matrix = new Matrix4();
    this.textureNum = -2;
    
    this.modelData = null;
    this.vertexBuffer = null;
    this.normalBuffer = null;
    this.uvBuffer = null;
    this.loaded = false;
  }

  // Load and parse OBJ file from URL
  async loadFromURL(filePath) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error('Could not load file: ' + filePath);
      }
      
      const fileContent = await response.text();
      this.parseModel(fileContent);
      
      // Create buffers after parsing
      this.vertexBuffer = gl.createBuffer();
      this.normalBuffer = gl.createBuffer();
      this.uvBuffer = gl.createBuffer();
      
      if (!this.vertexBuffer || !this.normalBuffer) {
        console.log('Failed to create buffers for model');
        return;
      }
      
      this.loaded = true;
      console.log('OBJ loaded:', filePath, 'Vertices:', this.modelData.vertices.length / 3);
      
    } catch (error) {
      console.error('Failed to load OBJ:', error);
    }
  }

  // Parse the OBJ file content
  parseModel(fileContent) {
    const lines = fileContent.split('\n');
    
    // Store all vertex/normal/uv data from file
    const allVertices = [];
    const allNormals = [];
    const allUVs = [];
    
    // Unpacked data for rendering (expanded per-face)
    const unpackedVerts = [];
    const unpackedNormals = [];
    const unpackedUVs = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '' || line.startsWith('#')) continue;
      
      const tokens = line.split(/\s+/);

      if (tokens[0] === 'v') {
        // Vertex position
        allVertices.push(
          parseFloat(tokens[1]),
          parseFloat(tokens[2]),
          parseFloat(tokens[3])
        );
      } else if (tokens[0] === 'vn') {
        // Vertex normal
        allNormals.push(
          parseFloat(tokens[1]),
          parseFloat(tokens[2]),
          parseFloat(tokens[3])
        );
      } else if (tokens[0] === 'vt') {
        // Texture coordinate
        allUVs.push(
          parseFloat(tokens[1]),
          parseFloat(tokens[2]) || 0
        );
      } else if (tokens[0] === 'f') {
        // Face - handle different formats: v, v/vt, v/vt/vn, v//vn
        const faceVertices = [];
        
        for (let j = 1; j < tokens.length; j++) {
          const indices = tokens[j].split('/');
          
          const vertIdx = (parseInt(indices[0]) - 1) * 3;
          const uvIdx = indices[1] ? (parseInt(indices[1]) - 1) * 2 : -1;
          const normIdx = indices[2] ? (parseInt(indices[2]) - 1) * 3 : 
                         (indices[1] === '' && indices.length > 2) ? (parseInt(indices[2]) - 1) * 3 : -1;
          
          faceVertices.push({ vertIdx, uvIdx, normIdx });
        }
        
        // Triangulate face (handles triangles, quads, n-gons)
        for (let j = 1; j < faceVertices.length - 1; j++) {
          const triangle = [faceVertices[0], faceVertices[j], faceVertices[j + 1]];
          
          for (const vert of triangle) {
            // Add vertex position
            unpackedVerts.push(
              allVertices[vert.vertIdx],
              allVertices[vert.vertIdx + 1],
              allVertices[vert.vertIdx + 2]
            );
            
            // Add normal (default to up if not present)
            if (vert.normIdx >= 0 && allNormals.length > 0) {
              unpackedNormals.push(
                allNormals[vert.normIdx],
                allNormals[vert.normIdx + 1],
                allNormals[vert.normIdx + 2]
              );
            } else {
              unpackedNormals.push(0, 1, 0);
            }
            
            // Add UV (default to 0,0 if not present)
            if (vert.uvIdx >= 0 && allUVs.length > 0) {
              unpackedUVs.push(
                allUVs[vert.uvIdx],
                allUVs[vert.uvIdx + 1]
              );
            } else {
              unpackedUVs.push(0, 0);
            }
          }
        }
      }
    }

    // If no normals in file, calculate them from faces
    if (allNormals.length === 0) {
      this.calculateFaceNormals(unpackedVerts, unpackedNormals);
    }

    this.modelData = {
      vertices: new Float32Array(unpackedVerts),
      normals: new Float32Array(unpackedNormals),
      uvs: new Float32Array(unpackedUVs)
    };
  }

  // Calculate normals from face geometry if OBJ has none
  calculateFaceNormals(vertices, normals) {
    normals.length = 0; // Clear existing
    
    for (let i = 0; i < vertices.length; i += 9) {
      // Get 3 vertices of triangle
      const v0 = [vertices[i], vertices[i+1], vertices[i+2]];
      const v1 = [vertices[i+3], vertices[i+4], vertices[i+5]];
      const v2 = [vertices[i+6], vertices[i+7], vertices[i+8]];
      
      // Calculate edges
      const edge1 = [v1[0]-v0[0], v1[1]-v0[1], v1[2]-v0[2]];
      const edge2 = [v2[0]-v0[0], v2[1]-v0[1], v2[2]-v0[2]];
      
      // Cross product for normal
      const normal = [
        edge1[1]*edge2[2] - edge1[2]*edge2[1],
        edge1[2]*edge2[0] - edge1[0]*edge2[2],
        edge1[0]*edge2[1] - edge1[1]*edge2[0]
      ];
      
      // Normalize
      const len = Math.sqrt(normal[0]*normal[0] + normal[1]*normal[1] + normal[2]*normal[2]);
      if (len > 0) {
        normal[0] /= len;
        normal[1] /= len;
        normal[2] /= len;
      }
      
      // Same normal for all 3 vertices of this face
      for (let j = 0; j < 3; j++) {
        normals.push(normal[0], normal[1], normal[2]);
      }
    }
  }

  render() {
    if (!this.loaded || !this.modelData) return;

    // Set uniforms
    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Bind vertex positions
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.modelData.vertices, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Bind normals
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.modelData.normals, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    // Bind UVs
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.modelData.uvs, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    // Draw the model
    gl.drawArrays(gl.TRIANGLES, 0, this.modelData.vertices.length / 3);
  }
}
