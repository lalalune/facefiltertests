// Copyright (c) 2019 XZIMG Limited , All Rights Reserved
// No part of this software and related documentation may be used, copied,
// modified, distributed and transmitted, in any form or by any means,
// without the prior written permission of XZIMG Limited
// contact@xzimg.com, www.xzimg.com
// DO NOT SHARE - DO NOT REPRODUCE
// DO NOT USE IN ANYCOMMERCIAL PROJECTS WITHOUT EXPLICIT AUTHORIZATION FROM XZIMG LIMITED

'use strict';

// import adapter from './adapter';
import {initThreejs, createFaceGeometry, renderThreejs, renderScene, addObj} from './render.js';
import {isVideoReady, getVideoCanvas, getVideo, initVideoCapture} from './camera.js';
// import * as THREE from 'three';

const progressBar = document.getElementById('progress-bar');


const xzimgMagicFace = new xzimg.MagicFace();
let xzimgMagicFaceInitialized = false;
const magicFaceConfig = {
    libPath: 'xzimg',
    fovY: 50,
};



function init() {

    initThreejs(magicFaceConfig.fovY, getVideo(), getVideoCanvas());

    // Initialize Magic Face
    xzimgMagicFace.initialize(
        magicFaceConfig,
        () => {
            createFaceGeometry(xzimgMagicFace);
            xzimgMagicFaceInitialized = true;
        },
        error => console.log('Error initializing Magic Face: ' + error),
        progress => {
            progressBar.value = progress * 100;
        }
    );

    // -- Initialize Video capture
    initVideoCapture();

}

function processFrame() {

    // Draw video in canvas for Magic Face to use
    getVideoCanvas().getContext('2d').drawImage(
        getVideo(),
        0,
        0,
        getVideoCanvas().width,
        getVideoCanvas().height
    );

    //if (videoReady && xzimgMagicFaceInitialized) {
    if (isVideoReady() && xzimgMagicFaceInitialized) {

        // Track
        xzimgMagicFace.track(getVideoCanvas());
        renderThreejs(xzimgMagicFace);
    }

    renderScene();
    requestAnimationFrame(processFrame);
}



init();

setTimeout(() => {
    init();
}, 20000);
processFrame();
