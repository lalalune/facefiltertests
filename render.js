

'use strict';
// import * as THREE from 'three';

// // -- Object loader imports
// import { OBJLoader2 } from 'three/examples/jsm/loaders/OBJLoader2.js';
// import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
// import {MtlObjBridge} from 'three/examples/jsm/loaders/obj2/bridge/MtlObjBridge.js';

let mirror = true;
let renderer;
let camera2D;
let camera3D;
let scene2D;
let scene3D;
let objects = [];
let objects_pivot_poses = [];

let videoTexture;
let videoSprite;

let faceMask;
let faceMaterial;
var mascaraMat;

const lipstickRange = document.getElementById('myRange');
const mascaraRange = document.getElementById('myMascara');


const redbutton = document.getElementById('red-button');
const greenButton = document.getElementById('green-button');


redbutton.onclick = () => {
    faceMaterial.color.set('#e73636');

}
greenButton.onclick = () => {
    faceMaterial.color.set('#12ff00');

}


lipstickRange.onchange = (e) => {
    faceMaterial.opacity = lipstickRange.value / 100;
}
mascaraRange.onchange = (e) => {
    mascaraMat.opacity = mascaraRange.value / 100;
}

export function initThreejs(fovy, video, videoCanvas) {

    // Setup renderer
    const defaultWidth = "100%";
    const defaultHeight = "100%";
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('xzimg-sdk-canvas'),
        alpha: true,
    });
    renderer.setSize(defaultWidth, defaultHeight);
    renderer.setClearColor(0x000000, 1);
    renderer.autoClear = false;

    // Create scene
    scene2D = new THREE.Scene();
    scene3D = new THREE.Scene();

    // Setup cameras
    camera2D = new THREE.OrthographicCamera(
        -defaultWidth / 2,
        defaultWidth / 2,
        defaultHeight / 2,
        -defaultHeight / 2, 1, 10);
    camera2D.position.z = 10;
    scene2D.add(camera2D);

    camera3D = new THREE.PerspectiveCamera(fovy, defaultWidth / defaultHeight, 0.1, 100);
    camera3D.position.set(0, 0, 0);
    scene3D.add(camera3D);

    // Create lights
    const ambientLight = new THREE.AmbientLight(0x101030);
    // scene3D.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffeedd);
    directionalLight.position.set(0, 0, 1);

    scene3D.add(directionalLight);

    // Create texture to apply on face
    const texture = new THREE.TextureLoader().load('lipstick.png');
    faceMaterial = new THREE.MeshStandardMaterial({ map: texture, transparent: true });
    faceMaterial.opacity = .6;
    faceMaterial.roughness = .8;
    faceMaterial.blending = THREE.AdditiveBlending;

    faceMaterial.color.set('#e73636');

    // Create video texture
    videoTexture = new THREE.Texture(videoCanvas);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    const videoMaterial = new THREE.MeshBasicMaterial(
        { map: videoTexture, depthWrite: false, side: THREE.DoubleSide });

    // Create video plane
    videoSprite = new THREE.Sprite(videoMaterial);
    videoSprite.center.set(0.5, 0.5);
    if (video.videoWidth > 0 && video.videoHeight > 0)
        videoSprite.scale.set(
            mirror ? -video.videoWidth : video.videoWidth,
            video.videoHeight, 1);


    videoSprite.position.set(0, 0, 1);
    scene2D.add(videoSprite);

}

var faceGeometryForEyes;

export function createFaceGeometry(xzimgMagicFace) {
    // Create face mesh
    const faceGeometry = new THREE.BufferGeometry();
    faceGeometry.setAttribute('position', new THREE.BufferAttribute(xzimgMagicFace.faceModelObj.vertices, 3));
    faceGeometry.setAttribute('uv', new THREE.BufferAttribute(xzimgMagicFace.faceModelObj.uvs, 2));
    faceGeometry.setIndex(new THREE.BufferAttribute(xzimgMagicFace.faceModelObj.faces, 1));

    faceGeometry.computeBoundingSphere();
    faceGeometry.computeBoundingBox();
    faceGeometry.computeFaceNormals();
    faceGeometry.computeVertexNormals();

    faceMask = new THREE.Mesh(faceGeometry, faceMaterial);
    faceGeometryForEyes = faceMask.clone();
    const texture = new THREE.TextureLoader().load('eyebrows.png');

    mascaraMat = new THREE.MeshStandardMaterial({ map: texture, transparent: true });
    faceGeometryForEyes.material = mascaraMat;
    scene3D.add(faceMask);

    scene3D.add(faceGeometryForEyes);
}

export function updateSize(video, videoCanvas) {
    // setTimeout for iOS to get correct video size
    setTimeout(() => {
        // Update cameras and renderer
        camera2D.left = -video.videoWidth / 2;
        camera2D.right = video.videoWidth / 2;
        camera2D.top = video.videoHeight / 2;
        camera2D.bottom = -video.videoHeight / 2;
        camera2D.updateProjectionMatrix();

        camera3D.aspect = video.videoWidth / video.videoHeight;
        camera3D.updateProjectionMatrix();

        renderer.setSize(video.videoWidth, video.videoHeight);

        // Update video canvas size
        videoCanvas.width = video.videoWidth;
        videoCanvas.height = video.videoHeight;

        videoSprite.scale.set(
            mirror ? -video.videoWidth : video.videoWidth,
            video.videoHeight, 1);
    });
}

export function renderThreejs(xzimgMagicFace) {
    objects.forEach(obj => {
        if (obj)
            obj.visible = false;
    });
    faceMask.visible = false;
    faceGeometryForEyes.visible = false;

    if (xzimgMagicFace.isFaceDetected) {
        //let idx = xzimgMagicFace.getDetectedObjectID(0);

        // Prepare position
        let t = xzimgMagicFace.getObjectPosition()

        // Prepare orientation
        let R = xzimgMagicFace.getObjectRotation()
        const pos = new THREE.Vector3();
        const quat = new THREE.Quaternion;
        const scale = new THREE.Vector3();
        var l_transfMatrix = new THREE.Matrix4();
        l_transfMatrix.set(
            R[0][0], R[0][1], R[0][2], 0,
            -R[1][0], -R[1][1], -R[1][2], 0,
            -R[2][0], -R[2][1], -R[2][2], 0,
            0.0, 0.0, 0.0, 1.0
        );
        if (mirror) {
            l_transfMatrix.decompose(pos, quat, scale);

            // Mirror rotation transformation
            quat.y = -quat.y;
            quat.z = -quat.z;
            l_transfMatrix.compose(pos, quat, scale);
        }

        // -- Set to objects
        objects.forEach((obj, i) => {
            if (obj) {
                obj.position.set(
                    mirror ? -t[0] : t[0],    // x mirror
                    -t[1],
                    -t[2]
                );


                obj.matrix = l_transfMatrix;
                obj.rotation.setFromRotationMatrix(l_transfMatrix);
                obj.visible = true;

                // -- pivot translation and rotation
                obj.translateX(objects_pivot_poses[i][0]);
                obj.translateY(objects_pivot_poses[i][1]);
                obj.translateZ(objects_pivot_poses[i][2]);
                obj.rotateX(THREE.Math.degToRad(objects_pivot_poses[i][3]));
                obj.rotateY(THREE.Math.degToRad(objects_pivot_poses[i][4]));
                obj.rotateZ(THREE.Math.degToRad(objects_pivot_poses[i][5]));
                console.log(objects_pivot_poses[i][3]);
                // console.log(i)
            }
        });

        // -- Set the face mesh (uv textured face object)
        faceMask.position.set(
            mirror ? -t[0] : t[0],    // x mirror
            -t[1],
            -t[2]);
        faceGeometryForEyes.position.set(mirror ? -t[0] : t[0],    // x mirror
            -t[1],
            -t[2]);
        faceMask.matrix = l_transfMatrix;
        faceGeometryForEyes.matrix = l_transfMatrix;
        faceGeometryForEyes.rotation.setFromRotationMatrix(l_transfMatrix);

        faceMask.rotation.setFromRotationMatrix(l_transfMatrix);
        faceGeometryForEyes.visible = true;
        faceMask.visible = true;

        // Update vertices positions
        for (let i = 0; i < 730 * 3;) {
            faceMask.geometry.attributes.position.array[i] = -xzimgMagicFace.faceVertices[i++];   // x mirror
            faceMask.geometry.attributes.position.array[i] = xzimgMagicFace.faceVertices[i++];    // y
            faceMask.geometry.attributes.position.array[i] = xzimgMagicFace.faceVertices[i++];    // z
        }
        
        faceMask.geometry.attributes.position.needsUpdate = true;
        faceMask.visible = true;


    }
}

export function renderScene() {

    videoTexture.needsUpdate = true;
    renderer.clear();
    renderer.render(scene2D, camera2D);
    renderer.render(scene3D, camera3D);
}


export function addCube(scalex = 1, scaley = 1, scalez = 1) {

    // Prepare a cube and add to the scene
    var geometry = new THREE.BoxGeometry(scalex, scaley, scalez);
    var material = new THREE.MeshLambertMaterial({ transparent: true });
    let cube = new THREE.Mesh(geometry, material);
    scene3D.add(cube);
    cube.scale.x = 1;
    cube.scale.y = 1;
    cube.scale.z = 1;
    cube.visible = false;
    objects.push(cube);
    objects_pivot_poses.push([0, 0, scalez / 2, 0, 0, 0]);
}

export function addObj(obj_fn, mtl_fn,
    piv_scale = 1,
    pivot_pose = [0, 0, 0, 90, 90, 0]) {

    // -- Load obj_fn and add it
    let object_root = null;
    let objLoader = new OBJLoader2();
    if (mtl_fn != null) {
        const mtlLoader = new MTLLoader();
        mtlLoader.load(mtl_fn, (mtlParseResult) => {
            const materials = MtlObjBridge.addMaterialsFromMtlLoader(mtlParseResult);
            // objLoader.addMaterials(materials);
            objLoader.load(obj_fn, (object_root) => {
                //cube = object_root;
                scene3D.add(object_root);
                object_root.scale.x = piv_scale;
                object_root.scale.y = piv_scale;
                object_root.scale.z = piv_scale;
                object_root.visible = false;
                objects.push(object_root);
                objects_pivot_poses.push(pivot_pose);
            });
        });
    }
    else {
        objLoader.load(obj_fn, (object_root) => {
            //cube = object_root;
            var material = new THREE.MeshLambertMaterial({ transparent: false });
            object_root.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.material = material;
                }
            });
            scene3D.add(object_root);
            object_root.scale.x = piv_scale;
            object_root.scale.y = piv_scale;
            object_root.scale.z = piv_scale;
            object_root.visible = false;
            objects.push(object_root);
            objects_pivot_poses.push(pivot_pose);
            obj.translateZ(0.15);
        });
    }
    return object_root;
}