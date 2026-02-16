class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [1, 1, 1, 1];
    this.matrix = new Matrix4();
    this.textureNum = 0;
    this.uvScale = 1.0; 
  }
  render() {
    var rgba = this.color;
    var s = this.uvScale; 

    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // FRONT FACE
    drawTriangle3DUV( [0,0,0, 1,1,0, 1,0,0], [0,0, s,s, s,0] );
    drawTriangle3DUV( [0,0,0, 0,1,0, 1,1,0], [0,0, 0,s, s,s] );

    // BACK
    drawTriangle3DUV(
      [0,0,1, 1,0,1, 1,1,1],
      [0,0, s,0, s,s]
    );
    drawTriangle3DUV(
      [0,0,1, 1,1,1, 0,1,1],
      [0,0, s,s, 0,s]
    );

    // TOP
    drawTriangle3DUV(
      [0,1,0, 0,1,1, 1,1,1],
      [0,0, 0,s, s,s]
    );
    drawTriangle3DUV(
      [0,1,0, 1,1,1, 1,1,0],
      [0,0, s,s, s,0]
    );

    // BOTTOM
    drawTriangle3DUV(
      [0,0,0, 1,0,1, 0,0,1],
      [0,0, s,s, 0,s]
    );
    drawTriangle3DUV(
      [0,0,0, 1,0,0, 1,0,1],
      [0,0, s,0, s,s]
    );

    // LEFT
    drawTriangle3DUV(
      [0,0,0, 0,0,1, 0,1,1],
      [0,0, s,0, s,s]
    );
    drawTriangle3DUV(
      [0,0,0, 0,1,1, 0,1,0],
      [0,0, s,s, 0,s]
    );

    // RIGHT
    drawTriangle3DUV(
      [1,0,0, 1,1,1, 1,0,1],
      [0,0, s,s, s,0]
    );
    drawTriangle3DUV(
      [1,0,0, 1,1,0, 1,1,1],
      [0,0, 0,s, s,s]
    );
  }

  renderfast() {
      const rgba = this.color;

      // ----- bind correct texture (same idea as your render()) -----
      if (this.textureNum === 0 && g_skyTexture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, g_skyTexture);
      } else if (this.textureNum === 1 && g_grassTexture) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, g_grassTexture);
      } else if (this.textureNum === 2 && g_oakTexture) {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, g_oakTexture);
      } else if (this.textureNum === 3 && g_leavesTexture) {
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, g_leavesTexture);
      }

      // uniforms
      // let u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
      // gl.uniform1i(u_whichTexture, this.textureNum);
      gl.uniform1i(u_whichTexture, this.textureNum);
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

      // IMPORTANT: apply tiling via uniform (fast)
      gl.uniform1f(u_UVScale, this.uvScale);

      // ----- create static buffers once -----
      if (!Cube._fastPosBuffer) {
        Cube._fastPosBuffer = gl.createBuffer();
        Cube._fastUVBuffer = gl.createBuffer();

        // 36 vertices (12 triangles) cube positions
        Cube._fastVerts = new Float32Array([
          // FRONT (z=0)
          0,0,0,  1,1,0,  1,0,0,
          0,0,0,  0,1,0,  1,1,0,

          // BACK (z=1)
          0,0,1,  1,0,1,  1,1,1,
          0,0,1,  1,1,1,  0,1,1,

          // TOP (y=1)
          0,1,0,  0,1,1,  1,1,1,
          0,1,0,  1,1,1,  1,1,0,

          // BOTTOM (y=0)
          0,0,0,  1,0,1,  0,0,1,
          0,0,0,  1,0,0,  1,0,1,

          // LEFT (x=0)
          0,0,0,  0,0,1,  0,1,1,
          0,0,0,  0,1,1,  0,1,0,

          // RIGHT (x=1)
          1,0,0,  1,1,1,  1,0,1,
          1,0,0,  1,1,0,  1,1,1,
        ]);

        // matching UVs (0..1) for each triangle
        Cube._fastUVs = new Float32Array([
          // FRONT
          0,0,  1,1,  1,0,
          0,0,  0,1,  1,1,

          // BACK
          0,0,  1,0,  1,1,
          0,0,  1,1,  0,1,

          // TOP
          0,0,  0,1,  1,1,
          0,0,  1,1,  1,0,

          // BOTTOM
          0,0,  1,1,  0,1,
          0,0,  1,0,  1,1,

          // LEFT
          0,0,  1,0,  1,1,
          0,0,  1,1,  0,1,

          // RIGHT
          0,0,  1,1,  1,0,
          0,0,  0,1,  1,1,
        ]);

        gl.bindBuffer(gl.ARRAY_BUFFER, Cube._fastPosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, Cube._fastVerts, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, Cube._fastUVBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, Cube._fastUVs, gl.STATIC_DRAW);
      }

      // ----- bind position buffer -----
      gl.bindBuffer(gl.ARRAY_BUFFER, Cube._fastPosBuffer);
      gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);

      // ----- bind UV buffer -----
      gl.bindBuffer(gl.ARRAY_BUFFER, Cube._fastUVBuffer);
      gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_UV);

      // draw all 36 verts in one call
      gl.drawArrays(gl.TRIANGLES, 0, 36);

      // (optional) reset UV scale for other draws if you want
      // gl.uniform1f(u_UVScale, 1.0);
    }
  }
