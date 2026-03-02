class Camera {
  constructor() {
    this.fov = 60;

    // Camera vectors
    this.eye = new Vector3([0, 3, 10]);
    this.at  = new Vector3([0, 0, 0]); // Looking at center of room
    this.up  = new Vector3([0, 1, 0]);

    // View Matrix
    this.viewMatrix = new Matrix4();
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0],  this.at.elements[1],  this.at.elements[2],
      this.up.elements[0],  this.up.elements[1],  this.up.elements[2]
    );

    // Projection Matrix
    this.projectionMatrix = new Matrix4();
    this.projectionMatrix.setPerspective(
      this.fov,
      canvas.width / canvas.height,
      0.1,
      1000
    );
  }
  updateView() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0],  this.at.elements[1],  this.at.elements[2],
      this.up.elements[0],  this.up.elements[1],  this.up.elements[2]
    );
  }

  moveForward(speed) {
    // f = at - eye
    let f = new Vector3();
    f.elements[0] = this.at.elements[0] - this.eye.elements[0];
    f.elements[1] = this.at.elements[1] - this.eye.elements[1];
    f.elements[2] = this.at.elements[2] - this.eye.elements[2];
    // normalize
    let len = Math.hypot(f.elements[0], f.elements[1], f.elements[2]);
    if (len > 0) {
      f.elements[0] /= len; f.elements[1] /= len; f.elements[2] /= len;
    }
    // scale
    f.elements[0] *= speed; f.elements[1] *= speed; f.elements[2] *= speed;

    // Calculate new position
    let newX = this.eye.elements[0] + f.elements[0];
    let newZ = this.eye.elements[2] + f.elements[2];
    
    // Check collision before moving
    if (typeof checkCollision !== 'undefined' && checkCollision(newX, newZ)) {
      return; // Don't move if collision
    }

    // eye += f; at += f
    this.eye.elements[0] += f.elements[0]; this.eye.elements[1] += f.elements[1]; this.eye.elements[2] += f.elements[2];
    this.at.elements[0]  += f.elements[0]; this.at.elements[1]  += f.elements[1]; this.at.elements[2]  += f.elements[2];

    this.updateView();
  }

  moveBackwards(speed) {
    // b = eye - at
    let b = new Vector3();
    b.elements[0] = this.eye.elements[0] - this.at.elements[0];
    b.elements[1] = this.eye.elements[1] - this.at.elements[1];
    b.elements[2] = this.eye.elements[2] - this.at.elements[2];
    let len = Math.hypot(b.elements[0], b.elements[1], b.elements[2]);
    if (len > 0) {
      b.elements[0] /= len; b.elements[1] /= len; b.elements[2] /= len;
    }
    b.elements[0] *= speed; b.elements[1] *= speed; b.elements[2] *= speed;

    let newX = this.eye.elements[0] + b.elements[0];
    let newZ = this.eye.elements[2] + b.elements[2];
    
    // Check collision before moving
    if (typeof checkCollision !== 'undefined' && checkCollision(newX, newZ)) {
      return;
    }

    this.eye.elements[0] += b.elements[0]; this.eye.elements[1] += b.elements[1]; this.eye.elements[2] += b.elements[2];
    this.at.elements[0]  += b.elements[0]; this.at.elements[1]  += b.elements[1]; this.at.elements[2]  += b.elements[2];

    this.updateView();
  }

  moveLeft(speed) {
    // f = at - eye
    let f = new Vector3();
    f.elements[0] = this.at.elements[0] - this.eye.elements[0];
    f.elements[1] = this.at.elements[1] - this.eye.elements[1];
    f.elements[2] = this.at.elements[2] - this.eye.elements[2];

    // s = up x f
    let s = new Vector3();
    s.elements[0] = this.up.elements[1] * f.elements[2] - this.up.elements[2] * f.elements[1];
    s.elements[1] = this.up.elements[2] * f.elements[0] - this.up.elements[0] * f.elements[2];
    s.elements[2] = this.up.elements[0] * f.elements[1] - this.up.elements[1] * f.elements[0];
    let len = Math.hypot(s.elements[0], s.elements[1], s.elements[2]);
    if (len > 0) { s.elements[0] /= len; s.elements[1] /= len; s.elements[2] /= len; }
    s.elements[0] *= speed; s.elements[1] *= speed; s.elements[2] *= speed;

    // Calculate new position
    let newX = this.eye.elements[0] + s.elements[0];
    let newZ = this.eye.elements[2] + s.elements[2];
    
    // Check collision before moving
    if (typeof checkCollision !== 'undefined' && checkCollision(newX, newZ)) {
      return; // Don't move if collision
    }

    this.eye.elements[0] += s.elements[0]; this.eye.elements[1] += s.elements[1]; this.eye.elements[2] += s.elements[2];
    this.at.elements[0]  += s.elements[0]; this.at.elements[1]  += s.elements[1]; this.at.elements[2]  += s.elements[2];

    this.updateView();
  }

  moveRight(speed) {
    // f = at - eye
    let f = new Vector3();
    f.elements[0] = this.at.elements[0] - this.eye.elements[0];
    f.elements[1] = this.at.elements[1] - this.eye.elements[1];
    f.elements[2] = this.at.elements[2] - this.eye.elements[2];

    // s = f x up
    let s = new Vector3();
    s.elements[0] = f.elements[1] * this.up.elements[2] - f.elements[2] * this.up.elements[1];
    s.elements[1] = f.elements[2] * this.up.elements[0] - f.elements[0] * this.up.elements[2];
    s.elements[2] = f.elements[0] * this.up.elements[1] - f.elements[1] * this.up.elements[0];
    let len = Math.hypot(s.elements[0], s.elements[1], s.elements[2]);
    if (len > 0) { s.elements[0] /= len; s.elements[1] /= len; s.elements[2] /= len; }
    s.elements[0] *= speed; s.elements[1] *= speed; s.elements[2] *= speed;

    // Calculate new position
    let newX = this.eye.elements[0] + s.elements[0];
    let newZ = this.eye.elements[2] + s.elements[2];
    
    // Check collision before moving
    if (typeof checkCollision !== 'undefined' && checkCollision(newX, newZ)) {
      return; // Don't move if collision
    }

    this.eye.elements[0] += s.elements[0]; this.eye.elements[1] += s.elements[1]; this.eye.elements[2] += s.elements[2];
    this.at.elements[0]  += s.elements[0]; this.at.elements[1]  += s.elements[1]; this.at.elements[2]  += s.elements[2];

    this.updateView();
  }

  panLeft(alpha) {
    // f = at - eye
    let f = new Vector3();
    f.elements[0] = this.at.elements[0] - this.eye.elements[0];
    f.elements[1] = this.at.elements[1] - this.eye.elements[1];
    f.elements[2] = this.at.elements[2] - this.eye.elements[2];

    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(
      alpha,
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2]
    );

    let f_prime = rotationMatrix.multiplyVector3(f);

    // at = eye + f_prime
    this.at.elements[0] = this.eye.elements[0] + f_prime.elements[0];
    this.at.elements[1] = this.eye.elements[1] + f_prime.elements[1];
    this.at.elements[2] = this.eye.elements[2] + f_prime.elements[2];

    this.updateView();
  }

  panRight(alpha) {
    // f = at - eye
    let f = new Vector3();
    f.elements[0] = this.at.elements[0] - this.eye.elements[0];
    f.elements[1] = this.at.elements[1] - this.eye.elements[1];
    f.elements[2] = this.at.elements[2] - this.eye.elements[2];

    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(
      -alpha,
      this.up.elements[0],
      this.up.elements[1],
      this.up.elements[2]
    );

    let f_prime = rotationMatrix.multiplyVector3(f);

    // at = eye + f_prime
    this.at.elements[0] = this.eye.elements[0] + f_prime.elements[0];
    this.at.elements[1] = this.eye.elements[1] + f_prime.elements[1];
    this.at.elements[2] = this.eye.elements[2] + f_prime.elements[2];

    this.updateView();
  }

  panUp(alpha) {
    // f = at - eye (forward vector)
    let f = new Vector3();
    f.elements[0] = this.at.elements[0] - this.eye.elements[0];
    f.elements[1] = this.at.elements[1] - this.eye.elements[1];
    f.elements[2] = this.at.elements[2] - this.eye.elements[2];

    // Calculate right vector (cross product of f and up)
    let right = new Vector3();
    right.elements[0] = f.elements[1] * this.up.elements[2] - f.elements[2] * this.up.elements[1];
    right.elements[1] = f.elements[2] * this.up.elements[0] - f.elements[0] * this.up.elements[2];
    right.elements[2] = f.elements[0] * this.up.elements[1] - f.elements[1] * this.up.elements[0];

    // Normalize right vector
    let len = Math.hypot(right.elements[0], right.elements[1], right.elements[2]);
    if (len > 0) {
      right.elements[0] /= len;
      right.elements[1] /= len;
      right.elements[2] /= len;
    }

    // Rotate f around the right vector
    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(alpha, right.elements[0], right.elements[1], right.elements[2]);

    let f_prime = rotationMatrix.multiplyVector3(f);

    // Limit vertical look angle to prevent flipping 
    let newY = f_prime.elements[1] / Math.hypot(f_prime.elements[0], f_prime.elements[1], f_prime.elements[2]);
    if (newY > 0.95 || newY < -0.95) {
      return; // do not rotate if we'd flip over
    }

    // at = eye + f_prime
    this.at.elements[0] = this.eye.elements[0] + f_prime.elements[0];
    this.at.elements[1] = this.eye.elements[1] + f_prime.elements[1];
    this.at.elements[2] = this.eye.elements[2] + f_prime.elements[2];

    this.updateView();
  }

  panDown(alpha) {
    this.panUp(-alpha);
  }
}
