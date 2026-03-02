class Sphere {
  constructor() {
    this.type = 'sphere';
    this.color = [1, 1, 1, 1];
    this.matrix = new Matrix4();
    this.textureNum = -2;
    this.verts32 = new Float32Array();
  }
  render() {
    var rgba = this.color;

    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    var d = Math.PI / 15;   // Balanced subdivisions for smooth look + performance
    var dd = Math.PI / 15;

    for (var t = 0; t < Math.PI; t += d) {
      for (var r = 0; r < (2 * Math.PI); r += dd) {
        var p1 = [Math.sin(t) * Math.cos(r), Math.sin(t) * Math.sin(r), Math.cos(t)];
        var p2 = [Math.sin(t + d) * Math.cos(r), Math.sin(t + d) * Math.sin(r), Math.cos(t + d)];
        var p3 = [Math.sin(t) * Math.cos(r + dd), Math.sin(t) * Math.sin(r + dd), Math.cos(t)];
        var p4 = [Math.sin(t + d) * Math.cos(r + dd), Math.sin(t + d) * Math.sin(r + dd), Math.cos(t + d)];

        // For a sphere centered at origin, normal = position (already normalized)
        // Triangle 1
        var v = [];
        var uv = [];
        var n = [];  // normals
        v = v.concat(p1); uv = uv.concat([0, 0]); n = n.concat(p1);
        v = v.concat(p2); uv = uv.concat([0, 0]); n = n.concat(p2);
        v = v.concat(p4); uv = uv.concat([0, 0]); n = n.concat(p4);
        drawTriangle3DUVNormal(v, uv, n);

        // Triangle 2
        v = []; uv = []; n = [];
        v = v.concat(p1); uv = uv.concat([0, 0]); n = n.concat(p1);
        v = v.concat(p4); uv = uv.concat([0, 0]); n = n.concat(p4);
        v = v.concat(p3); uv = uv.concat([0, 0]); n = n.concat(p3);
        drawTriangle3DUVNormal(v, uv, n);
      }
    }
  }
}