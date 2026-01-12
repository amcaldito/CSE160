// DrawRectangle.js
function main() {
// Retrieve <canvas> element <- (1)
    var canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    // Get the rendering context for 2DCG <- (2)
    var ctx = canvas.getContext('2d');
    // Draw a blue rectangle <- (3)
    ctx.fillStyle = 'rgba(0, 0, 0, 1)'; // Set a blue color
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill a rectangle with the color

    var v1 = new Vector3([2.25, 2.25, 0]);
    drawVector(v1, "red");
}

function drawVector(v, color) {
    var canvas = document.getElementById('example');
    var ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    
    // called before beginning of each path-block of code
    ctx.beginPath();
    // center of grid
    ctx.moveTo(200, 200); 

    // using 'let' --> variable only exists inside drawVector fx
    let endX = 200 + v.elements[0] * 20; // move right from center
    let endY = 200 - v.elements[1] * 20; // move up from center

    ctx.lineTo(endX, endY);
    ctx.stroke();
}

function handleDrawEvent() {
    // reset canvas:
    var canvas = document.getElementById('example');
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // read values from the input fields for red v1
    let x = parseFloat(document.getElementById('v1x').value);
    let y = parseFloat(document.getElementById('v1y').value);
    var v1 = new Vector3([x, y, 0]);
    // drawVector for v1
    drawVector(v1, "red");

    // read values from the input fields for blue v2
    let x2 = parseFloat(document.getElementById('v2x').value);
    let y2 = parseFloat(document.getElementById('v2y').value);
    var v2 = new Vector3([x2, y2, 0]);
    // drawVector for v2
    drawVector(v2, "blue");
}

function handleDrawOperationEvent() {
    // Clear the canvas.
    // Read the values of the text boxes to create v1 and call drawVector(v1, "red") .  
    // Read the values of the text boxes to create v2 and call drawVector(v2, "blue") .  
    // Read the value of the selector and call the respective Vector3 function. For add and sub operations, draw a green vector v3 = v1 + v2  or v3 = v1 - v2. For mul and div operations, draw two green vectors v3 = v1 * s and v4 = v2 * s.
    
    // reset canvas:
    var canvas = document.getElementById('example');
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // read values from the input fields for red v1
    let x = parseFloat(document.getElementById('v1x').value);
    let y = parseFloat(document.getElementById('v1y').value);
    var v1 = new Vector3([x, y, 0]);
    // drawVector for v1
    drawVector(v1, "red");

    // read values from the input fields for blue v2
    let x2 = parseFloat(document.getElementById('v2x').value);
    let y2 = parseFloat(document.getElementById('v2y').value);
    var v2 = new Vector3([x2, y2, 0]);
    // drawVector for v2
    drawVector(v2, "blue");

    let scalar = parseFloat(document.getElementById('Scalar').value);
    let op =(document.getElementById('Operation').value);
    if (op == "add") {
        let v3 = new Vector3(v1.elements); // Copy v1
        v3.add(v2);                        // Use your library function
        drawVector(v3, "green");
    } else if (op == "sub") {
        let v3 = new Vector3(v1.elements);
        v3.sub(v2);
        drawVector(v3, "green");
    } else if (op == "mul") {
        // v3 = v1 * s
        let v3 = new Vector3(v1.elements); // copy of V1
        let v4 = new Vector3(v2.elements); // copy of v2
        v3.mul(scalar); // scale v3 by scalar
        v4.mul(scalar); // scale v4 by scalar

        drawVector(v3, "green"); // Draw scaled v1 
        drawVector(v4, "green"); // Draw scaled v2
    } else if (op == "div") {
        let v3 = new Vector3(v1.elements); // copy of V1
        let v4 = new Vector3(v2.elements); // copy of v2
        v3.div(scalar); // scale v3 by scalar
        v4.div(scalar); // scale v4 by scalar

        drawVector(v3, "green"); // Draw scaled v1 
        drawVector(v4, "green"); // Draw scaled v2
    } else if (op == "mag") {
        let v3 = new Vector3(v1.elements); // copy of V1
        let v4 = new Vector3(v2.elements); // copy of v2
        
        mag1 = v3.magnitude(scalar);
        console.log("Magnitude v1: ",mag1);
        mag2 = v4.magnitude(scalar); 
        console.log("Magnitude v2: ",mag2);
    } else if (op == "norm") {
        let v3 = new Vector3(v1.elements); // copy of V1
        let v4 = new Vector3(v2.elements); // copy of v2

        v3.normalize();
        v4.normalize();

        drawVector(v3, "green");
        drawVector(v4, "green");
    } else if (op == "ang") {
        // let v3 = new Vector3(v1.elements); // copy of V1
        // let v4 = new Vector3(v2.elements); // copy of v2
        let angle = angleBetween(v1, v2);
        //let angle = angleBetween(v3, v4);
        console.log("Angle: ", angle);
    } else if (op == "area") {
        let area = areaTriangle(v1, v2);
        console.log("Area of the triangle: ", area);
    }
}

function angleBetween(v1, v2) {
    // cos(a) = dot / mag(v1) * mag(v2)
    let d = Vector3.dot(v1, v2);
    let mag1 = v1.magnitude();
    let mag2 = v2.magnitude();
    let cosAlpha = d / (mag1 * mag2)
    radians = Math.acos(cosAlpha)
    let angleDeg = radians * (180 / Math.PI);
    return angleDeg;
}

function areaTriangle(v1, v2) {
    let v3 = Vector3.cross(v1, v2);
    let area = v3.magnitude();
    return area / 2;
}
