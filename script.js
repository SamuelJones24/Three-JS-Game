
// Import Three.js
import * as THREE from "./three.module.js";
// Create the scene
const scene = new THREE.Scene();

// Create the player car object and add it to the scene
const vehicleColors = [0xa52523, 0xbdb638, 0x78b14b]

const playerCar = Car();
const playerAngleInitial = Math.PI;
let ready;
let playerAngleMoved;
let score;
const scoreElement = document.getElementById("score");
let otherVehicles = [];
let lastTimeStamp;
let accelerate = false;
let decelerate = false;
const speed = 0.0017;

function movePlayerCar(timeDelta) {
    const playerSpeed = getPlayerSpeed();
    playerAngleMoved -= playerSpeed * timeDelta;

    const totalPlayerAngle = playerAngleInitial + playerAngleMoved

    const playerX = Math.cos(totalPlayerAngle) * trackRadius - arcCenterX;
    const playerY = Math.sin(totalPlayerAngle) * trackRadius;

    playerCar.position.x = playerX;
    playerCar.position.y = playerY;

    playerCar.rotation.z = totalPlayerAngle - Math.PI / 2;




}

function getPlayerSpeed() {
    if (accelerate) return speed * 2;
    if (decelerate) return speed * 0.5;
    return speed
}




scene.add(playerCar);

// Set up lights (the ambient light is white with an intestity ofm 0.6)
const ambientLights = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLights);

/* Add directional light
The position is misleading, it doesnt mean where it will be shining
we defin the direction of the light rays
we can determine which side will be bightest and which side will remain in the dark
In this case we are shining directly on top of the car*/
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(100, -300, 400);
scene.add(dirLight);


// Now it is time to add the cameras
// We must first define the view
const aspectRatio = window.innerWidth / window.innerHeight;
const cameraWidth = 960;
const cameraHeight = cameraWidth / aspectRatio;

const camera = new THREE.OrthographicCamera(
    cameraWidth / -2, // Left
    cameraWidth / 2, // Right
    cameraHeight / 2, // Top
    cameraHeight / -2, // Bottom
    0, // Near plane
    1000 // Far plane
);
camera.position.set(0, -300, 300);

camera.lookAt(0, 0, 0);

const trackRadius = 225;
const trackWidth = 45;
const innerTrackRadius = trackRadius - trackWidth;
const outerTrackRadius = trackRadius + trackWidth;

const arcAngle1 = ( 1 / 3) * Math.PI;
const deltaY = Math.sin(arcAngle1) * innerTrackRadius;
const arcAngle2 = Math.asin(deltaY / outerTrackRadius);

const arcCenterX =
    (
        Math.cos(arcAngle1) * innerTrackRadius +
        Math.cos(arcAngle2) * outerTrackRadius
    ) / 2;

const arcAngle3 = Math.acos(arcCenterX / innerTrackRadius);

const arcAngle4 = Math.acos(arcCenterX / outerTrackRadius);


renderMap(cameraWidth, cameraHeight * 2)
// Set up renderer
const renderer = new THREE.WebGLRenderer({ antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);



reset();

function reset() {
    // Reset position and score
    playerAngleMoved = 0;
    movePlayerCar(0);
    score = 0;
    scoreElement.innerText = score;
    lastTimeStamp = undefined;

    otherVehicles.forEach((vehicle) => {
        scene.remove(vehicle.mesh);
    });
    otherVehicles = [];

    renderer.render(scene, camera);
    ready = true;

}


function startGame() {
    if (ready) {
        ready = false;
        renderer.setAnimationLoop(animation);
    }
}



window.addEventListener("keydown", function (event) {
    if (event.key == "W" || event.key == "w") {
        startGame();
        accelerate = true;
        return;
    }

    if (event.key == "S" || event.key == "s") {
        decelerate = true;
        return;
    }

    if (event.key == "R" || event.key == "r") {
        reset();
        return
    } 
});


window.addEventListener("keyup", function (event) {
    if (event.key == "W" || event.key == "w") {
        accelerate = false;
        return;
    }
    if (event.key == "S" || event.key == "s") {
        decelerate = false;
        return;
    }
});


function animation(timestamp) {
    if (!lastTimeStamp) {
        lastTimeStamp = timestamp;
        return;
    }

    const timeDelta = timestamp - lastTimeStamp;

    movePlayerCar(timeDelta);

    const laps = Math.floor(Math.abs(playerAngleMoved) / (Math.PI * 2));


    //update score if changed

    if (laps != score) {
        score = laps;
        scoreElement.innerText = score;
    }

    if (otherVehicles.length < (laps + 1) / 5) addVehicle();


    moveOtherVehicles(timeDelta);

    hitDetection();



    renderer.render(scene, camera);
    lastTimeStamp = timestamp;
}

function addVehicle() {
    const mesh = Car();
    scene.add(mesh)



    const clockwise = Math.random() >= 0.5;
    const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;

    const speed = getVehicleSpeed();
    otherVehicles.push({ mesh, clockwise, angle, speed });
}


function getVehicleSpeed() {
    const minimumSpeed = 1;
    const maximumSpeed = 2;
    return minimumSpeed + Math.random() * (maximumSpeed - minimumSpeed);

}

function moveOtherVehicles(timeDelta) {
    otherVehicles.forEach((vehicle) => {
        if (vehicle.clockwise) {
            vehicle.angle -= speed * timeDelta * vehicle.speed;
        }
        else {
            vehicle.angle += speed * timeDelta * vehicle.speed;
        }
        const vehicleX =  Math.cos(vehicle.angle) * trackRadius + arcCenterX;
        const vehicleY = Math.sin(vehicle.angle) * trackRadius;
        const rotation =
            vehicle.angle + (vehicle.clockwise ? -Math.PI / 2 : Math.pi / 2);
        vehicle.mesh.position.x = vehicleX;
        vehicle.mesh.position.y = vehicleY;
        vehicle.mesh.rotation.z = rotation;

    });
}

function getHitZonePosition(center, angle, clockwise, distance) {
    const directionAngle = angle + clockwise ? -Math.PI / 2 : +Math.PI / 2;
    return {
        x : center.x + Math.cos(directionAngle) * distance,
        y: center.y + Math.sin(directionAngle) * distance,
    };
}


function hitDetection() {

    const playerHitZone1 = getHitZonePosition(
        playerCar.position,
        playerAngleInitial + playerCar.angle,
        true,
        15
    );
    const playerHitZone2 = getHitZonePosition(
        playerCar.position,
        playerAngleInitial + playerCar.angle,
        true,
        -15
    );
    const hit = otherVehicles.some((vehicle) => {
        const vehicleHitZone1 = getHitZonePosition(
            vehicle.mesh.position,
            vehicle.angle,
            vehicle.clockwise,
            15
        );
        const vehicleHitZone2 = getHitZonePosition(
            vehicle.mesh.position,
            vehicle.angle,
            vehicle.clockwise,
            -15
        );
        
        if (getDistance(playerHitZone1, vehicleHitZone1) < 40) return true;
        if (getDistance(playerHitZone1, vehicleHitZone2) < 40) return true;

        if (getDistance(playerHitZone2, vehicleHitZone1) < 40) return true;


    });

    if (hit) renderer.setAnimationLoop(null);
}

function getDistance(coordinate1, coordinate2) {
    return Math.sqrt((coordinate2.x - coordinate1.x) ** 2 + (coordinate2.y - coordinate1.y) ** 2);
}

document.body.appendChild(renderer.domElement);

function Car() {
    const car = new THREE.Group();
    var color;
    color = pickRandom(vehicleColors)
    const main = new THREE.Mesh(
        new THREE.BoxGeometry(60, 30, 15),
        new THREE.MeshLambertMaterial({color})
    );
    main.position.z = 12;
    car.add(main);
    
    const carFrontTexture = getCarFrontTexture();
    carFrontTexture.center = new THREE.Vector2(0.5, 0.5);
    carFrontTexture.rotation = Math.PI / 2;


    const carBackTexture = getCarFrontTexture();
    carBackTexture.center = new THREE.Vector2(0.5, 0.5);
    carBackTexture.rotation = -Math.PI / 2;
    

    const carRightSideTexture = getCarSideTexture();


    const carLeftSideTexture = getCarSideTexture();
    carLeftSideTexture.flipY = false;


    const cabin = new THREE.Mesh(new THREE.BoxGeometry(33, 24, 12), [
            new THREE.MeshLambertMaterial({ map: carFrontTexture}),
            new THREE.MeshLambertMaterial({map: carBackTexture}),
            new THREE.MeshLambertMaterial({map: carLeftSideTexture}),
            new THREE.MeshLambertMaterial({map: carRightSideTexture}),
            new THREE.MeshLambertMaterial({color: 0xffffff}),
            new THREE.MeshLambertMaterial({color: 0xffffff})
        ]);
    cabin.position.x = -6;
    cabin.position.z = 25.5;
    car.add(cabin);

    const backWheel = Wheel();
    backWheel.position.x = -18;
    car.add(backWheel);

    const frontWheel = Wheel();
    frontWheel.position.x = 18;
    car.add(frontWheel);

    return car;
}

function pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function Wheel() {
    const wheel = new THREE.Mesh(
        new THREE.BoxGeometry(12, 33, 12),
        new THREE.MeshLambertMaterial({ color: 0x333333})
    );

    wheel.position.z = 6;
    return wheel
}

function getCarFrontTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 32;
    const context = canvas.getContext('2d');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, 64, 32);

    context.fillStyle = "#66666";
    context.fillRect = (8, 8, 48 ,24);

    return new THREE.CanvasTexture(canvas);
}

function getCarSideTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 32;
    const context = canvas.getContext('2d');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, 128, 32);

    context.fillStyle = "#66666";
    context.fillRect = (10, 8, 38, 24)
    context.fillRect = (58, 8, 60 ,24);

    return new THREE.CanvasTexture(canvas);
}

function renderMap(mapWidth, mapHeight) {
    //Plane with line markings
    const lineMarkingsTexture = getLineMarkings(mapWidth, mapHeight);

    const planeGeometry = new THREE.PlaneGeometry(mapWidth, mapHeight);
    const planeMaterial = new THREE.MeshLambertMaterial({
        map: lineMarkingsTexture,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(plane);

    // Extruded Geometry
    const islandLeft = getLeftIsland();
    const islandRight = getRightIsland();
    const islandMiddle = getMiddleIsland();
    const outerField = getOuterField(mapWidth, mapHeight);


    const fieldGeometry = new THREE.ExtrudeGeometry(
        [islandLeft, islandMiddle, islandRight, outerField],
        { depth: 6, bevelEnabled: false}
    );

    const fieldMesh = new THREE.Mesh(fieldGeometry, [
        new THREE.MeshLambertMaterial({ color: 0x67c240}),
        new THREE.MeshLambertMaterial({ color: 0x23311c}),
    ]);
    scene.add(fieldMesh);
}

function getLeftIsland() {
    const islandLeft = new THREE.Shape();

    islandLeft.absarc(
        -arcCenterX,
        0,
        innerTrackRadius,
        arcAngle1,
        -arcAngle1,
        false
    );

    islandLeft.absarc(
        arcCenterX,
        0,
        outerTrackRadius,
        Math.PI + arcAngle2,
        Math.PI - arcAngle2,
        true
    );

    return islandLeft
}

function getMiddleIsland() {
    const islandMiddle = new THREE.Shape();

    islandMiddle.absarc(
        -arcCenterX,
        0,
        innerTrackRadius,
        arcAngle3,
        -arcAngle3,
        true
    );

    islandMiddle.absarc(
        arcCenterX,
        0,
        innerTrackRadius,
        Math.PI + arcAngle3,
        Math.PI - arcAngle3,
        true
    );

    return islandMiddle
}

function getRightIsland() {
    const islandRight = new THREE.Shape();

    islandRight.absarc(
        arcCenterX,
        0,
        innerTrackRadius,
        Math.PI - arcAngle1,
        Math.PI + arcAngle1,
        true
    );

    islandRight.absarc(
        -arcCenterX,
        0,
        outerTrackRadius,
        -arcAngle2,
        arcAngle2,
        false
    );

    return islandRight
}

function getOuterField(mapWidth, mapHeight) {
    const field = new THREE.Shape();

    field.moveTo(-mapWidth / 2, -mapHeight / 2);
    field.lineTo(0, -mapHeight / 2);

    field.absarc(
        -arcCenterX,
        0,
        outerTrackRadius,
        -arcAngle4,
        arcAngle4,
        true
    );
    field.absarc(
        arcCenterX,
        0,
        outerTrackRadius,
        Math.PI - arcAngle4,
        Math.PI + arcAngle4,
        true
    );

    field.lineTo(0, -mapHeight / 2);
    field.lineTo(mapWidth / 2, -mapHeight /2);
    field.lineTo(mapWidth / 2, mapHeight / 2);
    field.lineTo(-mapWidth / 2, mapHeight / 2);

    return field;

}

function getLineMarkings(mapWidth, mapHeight) {
    const canvas = document.createElement("canvas");
    canvas.width = mapWidth;
    canvas.height = mapHeight;
    const context = canvas.getContext("2d");

    context.fillStyle = "#546E90";
    context.fillRect(0, 0, mapWidth, mapHeight);

    context.lineWidth = 2;
    context.strokeStyle = "#E0FFFF";
    context.setLineDash([10, 14]);

    // Left Circle
    context.beginPath();
    context.arc(
        mapWidth /2 - arcCenterX,
        mapHeight / 2,
        trackRadius,
        0,
        Math.PI * 2
    );
    context.stroke();

    // Right Circle
    context.beginPath();
    context.arc(
        mapWidth /2 + arcCenterX,
        mapHeight / 2,
        trackRadius,
        0,
        Math.PI * 2
    );
    context.stroke();


    return new THREE.CanvasTexture(canvas);
}