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

const enterButton = document.getElementById('enter-button');
const settingsButton = document.getElementById('settings-button');
const inputMenuButton = document.getElementById('input-menu-button');
const reloadSizeButton = document.getElementById('reload-button-size');
const reloadResButton = document.getElementById('reload-button-res');
const reloadColorButton = document.getElementById('reload-button-color');
const functionText = document.getElementById('function-textbox');
const gridSizeText = document.getElementById('gridsize-textbox');
const resolutionText = document.getElementById('resolution-textbox');
const menuColorInput = document.getElementById('menu-color-input');
const settings = document.getElementById('settings-menu');
const inputs = document.getElementById('input-menu');
const inputContainer = document.getElementById('input-container');

if(('serviceWorker') in navigator) {
    window.addEventListener('load', (event) => {
        navigator.serviceWorker.register(
        '/service-worker.js'
    );
    });
}

const defaultGridSize = 8;
const defaultResolution = 64;
const defaultMainColor = '#261f30';

document.documentElement.style.setProperty('--main-color', localStorage.getItem('mainColor'));
if(localStorage.getItem('mainColor')!=null) {
    menuColorInput.value = localStorage.getItem('mainColor');
}
else {
     menuColorInput.value = defaultMainColor;
}

let gridSize = defaultGridSize;
let resolution = defaultResolution;
let mainColor = menuColorInput.value;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

let gridHelper = new THREE.GridHelper(gridSize, gridSize);
const gridName = 'GridHelper';
gridHelper.name = gridName;
scene.add(gridHelper);

const controls = new OrbitControls(camera, renderer.domElement);

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0f0d0f, 1);
document.getElementById('canvas-container').appendChild(renderer.domElement);
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

const textGeometry = new THREE.PlaneGeometry(1.2, 1.2, 1, 1);
const texLoader = new THREE.TextureLoader();
const reTex = texLoader.load('assets/re.png');
const imTex = texLoader.load('assets/im.png');
const reMaterial = new THREE.MeshBasicMaterial({map: reTex, side: THREE.DoubleSide, transparent: true});
const imMaterial = new THREE.MeshBasicMaterial({map: imTex, side: THREE.DoubleSide, transparent: true});
const re = new THREE.Mesh(textGeometry, reMaterial);
const im = new THREE.Mesh(textGeometry, imMaterial);
scene.add(re, im);
re.rotateX(-Math.PI/2);
re.position.setX(gridSize/2+1);
im.rotateX(-Math.PI/2);
im.position.setZ(-(gridSize/2+1));



const loadedPlanes = [];
const scope = new Map();
const planeFunctions = new Map();   
const planeColors = new Map();     
let planeCounter = 0;


function storeInput(planeCounter, expression, colorScheme) {
    const box = document.createElement('div');
    
    box.id = planeCounter;
    box.className = 'input-box';

    const colorInputNeg = document.createElement('input');
    colorInputNeg.type = 'color';
    colorInputNeg.value = colorScheme[0];
    colorInputNeg.className = 'color-input';
    const minus = document.createElement('span');
    minus.className = 'material-icons';
    minus.id = 'minus-icon';
    minus.textContent = 'remove';
    box.appendChild(colorInputNeg);
    box.appendChild(minus);
    colorInputNeg.addEventListener('change', (event) => {
        planeColors.set(planeCounter, [colorInputNeg.value, colorInputPos.value]);
        tempReload(planeCounter);
    });

    const colorInputPos = document.createElement('input');
    colorInputPos.type = 'color';
    colorInputPos.value = colorScheme[1];
    colorInputPos.className = 'color-input';
    const plus = document.createElement('span');
    plus.className = 'material-icons';
    plus.id = 'plus-icon';
    plus.textContent = 'add';
    box.appendChild(colorInputPos);
    box.appendChild(plus);
    colorInputPos.addEventListener('change', (event) => {
        planeColors.set(planeCounter, [colorInputNeg.value, colorInputPos.value]);
        tempReload(planeCounter);
    });

    const text = document.createElement('label');
    text.textContent = ` ${String.fromCharCode(96+planeCounter)}(z) = ${expression} `;
    box.appendChild(text);

    const hideButton = document.createElement('button');
    hideButton.className = 'hide-button';
    const eye = document.createElement('span');
    eye.className = 'material-icons';
    eye.textContent = 'visibility';
    hideButton.addEventListener('click', (event) => {
        const plane = scene.getObjectByName(`ComplexPlane${planeCounter}`);
        if(plane.visible) {
            eye.textContent = 'visibility_off';
            plane.visible = false;
        }
        else {
            eye.textContent = 'visibility';
            plane.visible = true;
        }
    });
    hideButton.appendChild(eye);
    box.appendChild(hideButton);

    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    const cross = document.createElement('span');
    cross.className = 'material-icons';
    cross.textContent = 'close';
    closeButton.addEventListener('click', (event) => {
        removePlane(planeCounter);
    });
    closeButton.appendChild(cross);
    box.appendChild(closeButton);

    return box;
}


function getColor(im, colorScheme) {
    const color = new THREE.Color();
    const colorNeg = new THREE.Color();
    const colorPos = new THREE.Color();
    colorNeg.set(colorScheme[0]);
    colorPos.set(colorScheme[1]);
    
    const c = 1;
    colorNeg.set(colorNeg.r*c*-im/gridSize, colorNeg.g*c*-im/gridSize, colorNeg.b*c*-im/gridSize);
    colorPos.set(colorPos.r*c*im/gridSize, colorPos.g*c*im/gridSize, colorPos.b*c*im/gridSize);
    return im <= 0 ? color.set(colorNeg) : color.set(colorPos);
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
    if(planeCounter===1) {
        inputContainer.style.visibility = "visible";
    }
    const planeGeometry = new THREE.PlaneGeometry(gridSize, gridSize, resolution, resolution);
    const planeMaterial = new THREE.MeshBasicMaterial({vertexColors: true, wireframe: false, side: THREE.DoubleSide});
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    const planeName = `ComplexPlane${planeCounter}`;
    plane.name = planeName;
    scene.add(plane);
    loadedPlanes.push(plane);

    const expression = functionText.value;

    let colorNeg = '#0000ff';
    let colorPos = '#ff0000';
    /*let modulus = ((planeCounter-1 % 4) + 4) % 4;
    
    if(modulus===0) {
        colorNeg = '#0000ff';
        colorPos = '#ff0000';
    } else if(modulus===1) {
        colorNeg = '#ffff00';
        colorPos = '#ff00ff';
    } else if(modulus===2) {
        colorNeg = '#00ffff';
        colorPos = '#ff8800';
    } else {
        colorNeg = '#00ff00';
        colorPos = '#aa00ff';
    }*/
    let colorScheme = [colorNeg, colorPos];
    planeColors.set(planeCounter, colorScheme);
    
    const newBox = storeInput(planeCounter, expression, colorScheme);
    inputs.appendChild(newBox);

    planeFunctions.set(planeCounter, expression);
    
    
    plane.rotation.x = -Math.PI/2;
    const positionAttribute = planeGeometry.getAttribute('position');
    const vertex = new THREE.Vector3();
    const colors = [];
    let colorIndex = 0;
    for (let i = 0; i < positionAttribute.count; i++) {
	    vertex.fromBufferAttribute(positionAttribute, i);
        const z = math.complex(vertex.x, vertex.y);
        const func = math.evaluate(String.fromCodePoint(96+planeCounter).concat('(z) = ').concat(expression));
        scope.set('z', z);
        scope.set(String.fromCodePoint(96+planeCounter), func);
        const result = math.evaluate(expression, scope);
	    vertex.z = math.re(result);
        const color = getColor(math.im(result), colorScheme);
        colors[colorIndex++] = color.r;
        colors[colorIndex++] = color.g;
        colors[colorIndex++] = color.b;

	    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        planeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }
    functionText.value = "";
}

function reloadAll() {
    const oldPlanes = loadedPlanes;
    oldPlanes.forEach(element => {
        const id = parseInt(element.name.replace(/[^\d]/g, ''));
        reload(id);
    });
}

function reload(id) {
    removePlane(id);
    const planeGeometry = new THREE.PlaneGeometry(gridSize, gridSize, resolution, resolution);
    const planeMaterial = new THREE.MeshBasicMaterial({vertexColors: true, wireframe: false, side: THREE.DoubleSide});
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    const planeName = `ComplexPlane${id}`;
    plane.name = planeName;
    scene.add(plane);
    loadedPlanes.splice(id-1, 0, plane);
    

    const expression = planeFunctions.get(id);
        
    let colorScheme = planeColors.get(id);
    
    const newBox = storeInput(id, expression, colorScheme);
    inputs.appendChild(newBox);
    
    plane.rotation.x = -Math.PI/2;
    const positionAttribute = planeGeometry.getAttribute('position');
    const vertex = new THREE.Vector3();
    const colors = [];
    let colorIndex = 0;
    for (let i = 0; i < positionAttribute.count; i++) {
	    vertex.fromBufferAttribute(positionAttribute, i);
        const z = math.complex(vertex.x, vertex.y);
        const func = math.evaluate(String.fromCodePoint(96+planeCounter).concat('(z) = ').concat(expression));
        scope.set('z', z);
        scope.set(String.fromCodePoint(96+id), func);
        const result = math.evaluate(expression, scope);
	    vertex.z = math.re(result);
        const color = getColor(math.im(result), colorScheme);
        colors[colorIndex++] = color.r;
        colors[colorIndex++] = color.g;
        colors[colorIndex++] = color.b;
	    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        planeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }
}

function tempReload(id) {
    const removedPlane = scene.getObjectByName(`ComplexPlane${id}`);
    if(removedPlane) {
        scene.remove(removedPlane);
        removedPlane.geometry.dispose();
        loadedPlanes.splice(loadedPlanes.indexOf(removedPlane), 1);
    }
    const planeGeometry = new THREE.PlaneGeometry(gridSize, gridSize, resolution, resolution);
    const planeMaterial = new THREE.MeshBasicMaterial({vertexColors: true, wireframe: false, side: THREE.DoubleSide});
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    const planeName = `ComplexPlane${id}`;
    plane.name = planeName;
    scene.add(plane);
    loadedPlanes.splice(id-1, 0, plane);
    

    const expression = planeFunctions.get(id);
        
    let colorScheme = planeColors.get(id);
    
    plane.rotation.x = -Math.PI/2;
    const positionAttribute = planeGeometry.getAttribute('position');
    const vertex = new THREE.Vector3();
    const colors = [];
    let colorIndex = 0;
    for (let i = 0; i < positionAttribute.count; i++) {
	    vertex.fromBufferAttribute(positionAttribute, i);
        const z = math.complex(vertex.x, vertex.y);
        const func = math.evaluate(String.fromCodePoint(96+planeCounter).concat('(z) = ').concat(expression));
        scope.set('z', z);
        scope.set(String.fromCodePoint(96+id), func);
        const result = math.evaluate(expression, scope);
	    vertex.z = math.re(result);
        const color = getColor(math.im(result), colorScheme);
        colors[colorIndex++] = color.r;
        colors[colorIndex++] = color.g;
        colors[colorIndex++] = color.b;
	    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        planeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }
}

enterButton.addEventListener('click', load);
functionText.addEventListener('keyup', (event) => {
    if(event.key == 'Enter') {
        functionText.blur();
        enterButton.click();
    }
});

gridSizeText.addEventListener('blur', (event) => {
    if(gridSize != gridSizeText.value) {
        if(gridSizeText.value==defaultGridSize) {
            reloadSizeButton.style.visibility = 'hidden';
        }
        else {
            reloadSizeButton.style.visibility = 'visible';
        } 
        gridSize = gridSizeText.value;
        scene.remove(xAxis, zAxis, gridHelper);
        axisGeometry = new THREE.CylinderGeometry(0.02, 0.02, gridSize, 10, 1, false);
        xAxis = new THREE.Mesh(axisGeometry, axisMaterial);
        zAxis = new THREE.Mesh(axisGeometry, axisMaterial);
        xAxis.rotateZ(Math.PI/2);
        zAxis.rotateX(Math.PI/2);
        re.position.setX(gridSize/2+1);
        im.position.setZ(-(gridSize/2+1));
        gridHelper = new THREE.GridHelper(gridSize, gridSize);
        scene.add(xAxis, zAxis, gridHelper);
        reloadAll();
    }
});
gridSizeText.addEventListener('keyup', (event) => {
    if(event.key === 'Enter') {
        gridSizeText.blur();
    }
});


resolutionText.addEventListener('blur', (event) => {
    if(resolution != resolutionText.value) {
        if(resolutionText.value==defaultResolution) {
            reloadResButton.style.visibility = 'hidden';
        }
        else {
            reloadResButton.style.visibility = 'visible';
        }
        resolution = resolutionText.value;
        reloadAll();
    }
});
resolutionText.addEventListener('keyup', (event) => {
    if(event.key === 'Enter') {
        resolutionText.blur();
    }
});

menuColorInput.addEventListener('input', (event) => {
    if(localStorage.getItem('mainColor') != menuColorInput.value) {
        if(menuColorInput.value===defaultMainColor) {
            reloadColorButton.style.visibility = 'hidden';
        }
        else {
            reloadColorButton.style.visibility = 'visible';
        }
        mainColor = menuColorInput.value;
        localStorage.setItem('mainColor', mainColor);
        document.documentElement.style.setProperty('--main-color', mainColor);
    }
});

function showSettings(){
    if(settings.style.visibility === "hidden") {
        settings.style.visibility = "visible";
        if(menuColorInput.value != defaultMainColor) {
            reloadColorButton.style.visibility = 'visible';
        }
        else {
            reloadColorButton.style.visibility = 'hidden';
        }
        if(gridSizeText.value != defaultGridSize) {
            reloadSizeButton.style.visibility = 'visible';
        }
        else {
            reloadSizeButton.style.visibility = 'hidden';
        }
        if(resolutionText.value != defaultResolution) {
            reloadResButton.style.visibility = 'visible';
        }
        else {
            reloadResButton.style.visibility = 'hidden';
        }
        
    }
    else {
        settings.style.visibility = "hidden";
        reloadSizeButton.style.visibility = 'hidden';
        reloadResButton.style.visibility = 'hidden';
        reloadColorButton.style.visibility = 'hidden';
    }
}

function showInputs(){
    if(inputContainer.style.visibility === "hidden") {
        inputContainer.style.visibility = "visible";
    }
    else {
        inputContainer.style.visibility = "hidden";
    }
}

settingsButton.addEventListener('click', showSettings);
inputMenuButton.addEventListener('click', showInputs);

reloadSizeButton.addEventListener('click', (event) => {
    reloadSizeButton.style.visibility = 'hidden';
    gridSize = defaultGridSize;
    gridSizeText.value = defaultGridSize;
    scene.remove(xAxis, zAxis, gridHelper);
    axisGeometry = new THREE.CylinderGeometry(0.02, 0.02, gridSize, 10, 1, false);
    xAxis = new THREE.Mesh(axisGeometry, axisMaterial);
    zAxis = new THREE.Mesh(axisGeometry, axisMaterial);
    xAxis.rotateZ(Math.PI/2);
    zAxis.rotateX(Math.PI/2);
    re.position.setX(gridSize/2+1);
    im.position.setZ(-(gridSize/2+1));
    gridHelper = new THREE.GridHelper(gridSize, gridSize);
    scene.add(xAxis, zAxis, gridHelper);
    reloadAll();
});

reloadResButton.addEventListener('click', (event) => {
    reloadResButton.style.visibility = 'hidden';
    resolution = defaultResolution;
    resolutionText.value = defaultResolution;
    reloadAll();
});

reloadColorButton.addEventListener('click', (event) => {
    reloadColorButton.style.visibility = 'hidden';
    mainColor = defaultMainColor;
    menuColorInput.value = defaultMainColor;
    localStorage.setItem('mainColor', mainColor);
    document.documentElement.style.setProperty('--main-color', mainColor);
});



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