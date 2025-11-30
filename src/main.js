import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as math from 'mathjs';

/*class ComplexNumber {
    constructor(a, b) {
        this.a = a;
        this.b = b;
    }

    re() {
        return this.a;
    }

    im() {
        return this.b;
    }

    mod() {
        return Math.sqrt(this.re()*this.re()+this.im()*this.im());
    }

    arg() {
        return Math.atan2(this.im(), this.re());
    }

    conjugate() {
        return new ComplexNumber(x.re(), -x.im());
    }

    add(y) {
        return new ComplexNumber(this.re()+y.re(), this.im()+y.im());
    }

    subtract(y) {
        return new ComplexNumber(this.re()-y.re(), this.im()-y.im());
    }

    multiply(y) {
        return new ComplexNumber(this.re()*y.re()-this.im()*y.im(), this.re()*y.im()+this.im()*y.re());
    }

    divide(y) {
        return new ComplexNumber((this.re()*y.re()+this.im()*y.im())/(y.re()*y.re()+y.im()*y.im()), (-this.re()*y.im()+this.im()*y.re())/(y.re()*y.re()+y.im()*y.im()));
    }

    exp() {
        const ex = Math.exp(this.re());
        return new ComplexNumber(ex*Math.cos(this.im()), ex*Math.sin(this.im()));
    }

    ln() {
        return new ComplexNumber(Math.log(this.mod()), this.arg());
    }

    pow(w) {
        return w.multiply(this.ln()).exp();
    }

    sin() {
        return this.multiply(new ComplexNumber(0, 1)).exp().subtract(this.multiply(new ComplexNumber(0, -1)).exp()).divide(new ComplexNumber(0, 2));
    }

    cos() {
        return this.multiply(new ComplexNumber(0, 1)).exp().add(this.multiply(new ComplexNumber(0, -1)).exp()).divide(new ComplexNumber(2, 0));
    }

    tan() {
        return this.sin().divide(this.cos());
    }
}*/

const btn1 = document.getElementById('btn1');
const functionText = document.getElementById('function-textbox');
const gridSizeText = document.getElementById('gridsize-textbox');
const resolutionText = document.getElementById('resolution-textbox');
const settings = document.getElementById('settings-menu');
const inputs = document.getElementById('input-menu');

let gridSize = 8;
let resolution = 64;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
});

let gridHelper = new THREE.GridHelper(gridSize, gridSize);
const gridName = 'GridHelper';
gridHelper.name = gridName;
scene.add(gridHelper);

const controls = new OrbitControls(camera, renderer.domElement);

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0f0d0f, 1);
camera.position.setX(6);
camera.position.setY(6);
camera.position.setZ(6);


let axisGeometry = new THREE.CylinderGeometry(0.02, 0.02, gridSize, 10, 1, false);
const axisMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
let xAxis = new THREE.Mesh(axisGeometry, axisMaterial);
let zAxis = new THREE.Mesh(axisGeometry, axisMaterial);
scene.add(xAxis, zAxis);
xAxis.rotateZ(Math.PI/2);
zAxis.rotateX(Math.PI/2);

function storeInput(planeCounter, expression) {
    const box = document.createElement('div');
    box.textContent = String.fromCharCode(96+planeCounter).concat('(z) = ').concat(expression).concat(' ');
    box.id = planeCounter;
    box.className = 'input-box';
    const closeButton = document.createElement('button')
    closeButton.textContent = 'X';
    closeButton.className = 'close-button';
    closeButton.addEventListener('click', (event) => {
        removePlane(parseInt(box.id));
    });
    box.appendChild(closeButton);
    return box;
}

const loadedPlanes = [];
const scope = new Map();
const planeFunctions = new Map();
let planeCounter = 0;

function getColor(im, planeCounter) {
    const color = new THREE.Color();
    const colorneg = new THREE.Color(0x0000ff);
    const colorpos = new THREE.Color(0xff0000);
    /*let modulo = planeCounter % 2;
    switch(modulo) {
        case 0:
            colorneg.set(new THREE.Color(0x0000ff));
            colorpos.set(new THREE.Color(0xff0000));
        case 1:
            colorneg.set(new THREE.Color(0x00ffff));
            colorpos.set(new THREE.Color(0xffff00));
    }*/
    const c = 1;
    colorneg.set(colorneg.r*c*-im/gridSize, colorneg.g*c*-im/gridSize, colorneg.b*c*-im/gridSize);
    colorpos.set(colorpos.r*c*im/gridSize, colorpos.g*c*im/gridSize, colorpos.b*c*im/gridSize);
    return im <= 0 ? color.set(colorneg) : color.set(colorpos);
}

function removePlane(id) {
    const box = document.getElementById(id);
    box.remove();
    const removedPlane = scene.getObjectByName(`ComplexPlane${id}`);
    const name = String.fromCodePoint(96 + id);
    if(removedPlane) {
        scope.delete(name); 
        scene.remove(removedPlane);
        removedPlane.geometry.dispose();
        loadedPlanes.splice(loadedPlanes.indexOf(removedPlane), 1);
    }
}

function load() {
    planeCounter++;
    const planeGeometry = new THREE.PlaneGeometry(gridSize, gridSize, resolution, resolution);
    const planeMaterial = new THREE.MeshBasicMaterial({vertexColors: true, wireframe: false, side: THREE.DoubleSide});
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    const planeName = `ComplexPlane${planeCounter}`;
    plane.name = planeName;
    scene.add(plane);
    loadedPlanes.push(plane);
    alert(planeCounter);
    
    const newBox = storeInput(planeCounter, functionText.value);
    inputs.appendChild(newBox);

    planeFunctions.set(planeCounter, functionText.value);
    
    
    plane.rotation.x = -Math.PI/2;
    const positionAttribute = planeGeometry.getAttribute('position');
    const vertex = new THREE.Vector3();
    const colors = [];
    let colorIndex = 0;
    for (let i = 0; i < positionAttribute.count; i++) {
	    vertex.fromBufferAttribute(positionAttribute, i);
        const z = math.complex(vertex.x, vertex.y);
        const func = math.evaluate(String.fromCodePoint(96+planeCounter).concat('(z) = ').concat(functionText.value))
        scope.set('z', z);
        scope.set(String.fromCodePoint(96+planeCounter), func);
        const result = math.evaluate(functionText.value, scope);
	    vertex.z = math.re(result);
        const color = getColor(math.im(result), planeCounter);
        colors[colorIndex++] = color.r;
        colors[colorIndex++] = color.g;
        colors[colorIndex++] = color.b;

	    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        planeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }
    functionText.value = "";
}

function reload() {
    const oldPlanes = loadedPlanes;
    alert('length:'.concat(oldPlanes.length));
    oldPlanes.forEach(element => {
        const id = parseInt(element.name.replace(/[^\d]/g, ''));
        removePlane(id);
        const planeGeometry = new THREE.PlaneGeometry(gridSize, gridSize, resolution, resolution);
        const planeMaterial = new THREE.MeshBasicMaterial({vertexColors: true, wireframe: false, side: THREE.DoubleSide});
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        const planeName = element.name;
        plane.name = planeName;
        scene.add(plane);
        loadedPlanes.splice(id-1, 0, plane);
        const func = planeFunctions.get(id);
    
        const newBox = storeInput(id, func);
        inputs.appendChild(newBox);
    
        plane.rotation.x = -Math.PI/2;
        const positionAttribute = planeGeometry.getAttribute('position');
        const vertex = new THREE.Vector3();
        const colors = [];
        let colorIndex = 0;
        for (let i = 0; i < positionAttribute.count; i++) {
	        vertex.fromBufferAttribute(positionAttribute, i);
            const z = math.complex(vertex.x, vertex.y);
            scope.set('z', z);
            const result = math.evaluate(func, scope);
	        vertex.z = math.re(result);
            const color = getColor(math.im(result), id);
            colors[colorIndex++] = color.r;
            colors[colorIndex++] = color.g;
            colors[colorIndex++] = color.b;

	        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
            planeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }
    });
}

btn1.addEventListener('click', load);
functionText.addEventListener('keyup', (event) => {
    if(event.key=='Enter') {
        functionText.blur();
        btn1.click();
    }
});

gridSizeText.addEventListener('blur', (event) => {
    gridSize = gridSizeText.value;
    scene.remove(xAxis, zAxis, gridHelper);
    axisGeometry = new THREE.CylinderGeometry(0.02, 0.02, gridSize, 10, 1, false);
    xAxis = new THREE.Mesh(axisGeometry, axisMaterial);
    zAxis = new THREE.Mesh(axisGeometry, axisMaterial);
    xAxis.rotateZ(Math.PI/2);
    zAxis.rotateX(Math.PI/2);
    gridHelper = new THREE.GridHelper(gridSize, gridSize);
    scene.add(xAxis, zAxis, gridHelper);
    reload();
});
gridSizeText.addEventListener('keyup', (event) => {
    if(event.key=='Enter') {
        gridSizeText.blur();
    }
});


resolutionText.addEventListener('blur', (event) => {
    resolution = resolutionText.value;
    reload();
});
resolutionText.addEventListener('keyup', (event) => {
    if(event.key=='Enter') {
        resolutionText.blur();
    }
});


function showSettings(){
    settings.hidden = !settings.hidden;
}

btn2.addEventListener('click', showSettings);



window.addEventListener('resize', (event) => {
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

function animate() {
    requestAnimationFrame(animate);

    controls.update();
    renderer.render(scene, camera);
}
animate();