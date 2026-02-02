// made cone class for spikes on back of dinosaur. edited from circle.js

class Cone {
  constructor() {
    this.type = 'cone';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.segments = 12;
  }

  render() {
    var rgba = this.color;
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    let angleStep = 360 / this.segments;
    for (var angle = 0; angle < 360; angle += angleStep) {
      let a1 = angle * Math.PI / 180;
      let a2 = (angle + angleStep) * Math.PI / 180;
      let v1 = [Math.cos(a1), 0, Math.sin(a1)];
      let v2 = [Math.cos(a2), 0, Math.sin(a2)];
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      drawTriangle3D([v1[0], 0, v1[2],  v2[0], 0, v2[2],  0, 1, 0]);
      gl.uniform4f(u_FragColor, rgba[0] * 0.7, rgba[1] * 0.7, rgba[2] * 0.7, rgba[3]);
      drawTriangle3D([0, 0, 0,  v2[0], 0, v2[2],  v1[0], 0, v1[2]]);
    }
  }
}