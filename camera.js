// Copyright (c) 2020 XZIMG Limited , All Rights Reserved
// No part of this software and related documentation may be used, copied,
// modified, distributed and transmitted, in any form or by any means,
// without the prior written permission of XZIMG Limited
// contact@xzimg.com, www.xzimg.com
// DO NOT SHARE - DO NOT REPRODUCE
// DO NOT USE IN ANYCOMMERCIAL PROJECTS WITHOUT EXPLICIT AUTHORIZATION FROM XZIMG LIMITED

'use strict';

// import adapter from 'webrtc-adapter';
import { updateSize } from './render.js';


const videoSourceSelect = document.getElementById('video-source');
const video = document.getElementById('xzimg-sdk-video');
const videoCanvas = document.createElement('canvas');
videoCanvas.style.display = 'none';

let videoReady = false;
let currentVideoSource = '';

navigator.mediaDevices.ondevicechange = onMediaDeviceChange;
videoSourceSelect.onchange = onVideoSelectionChanged;
video.oncanplay = onVideoCanPlay;

export function initVideoCapture() {
    // -- Initialize Video capture
    window.addEventListener('orientationchange', () => {
        updateSize(video, videoCanvas);
    });

    // Start front facing camera if possible
    navigator.mediaDevices
        .getUserMedia({
            audio: false,
            video: { facingMode: 'face' },
        })
        .then(stream => {
            video.srcObject = stream;

            // Populate devices list
            // To get the correct labels, this can only be
            // done after user has given permissions
            onMediaDeviceChange();
        })
        .catch(e => console.error('Unable to get video stream: ', e));
}

export function onMediaDeviceChange() {
    navigator.mediaDevices
        .enumerateDevices()
        .then(devices => {
            for (let i = videoSourceSelect.options.length - 1; i >= 1; i--) {
                videoSourceSelect.remove(i);
            }

            let selectedDeviceFound = false;
            devices.filter(device => device.kind === 'videoinput').map(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `camera ${videoSourceSelect.options.length}`;
                videoSourceSelect.appendChild(option);
                if (device.deviceId === currentVideoSource) {
                    selectedDeviceFound = true;
                }
            });

            if (!selectedDeviceFound) {
                currentVideoSource = '';
            }

            videoSourceSelect.value = currentVideoSource
        })
        .catch(e => console.error('Unable to enumerate devices: ', e));
}

export function onVideoSelectionChanged(event) {
    const videoSource = event.target.value;
    if (videoSource === '' || videoSource === currentVideoSource) {
        return;
    }


    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }

    currentVideoSource = videoSource;
    navigator.mediaDevices
        .getUserMedia({
            audio: false,
            video: {
                deviceId: { exact: videoSource }
            },
        })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(e => console.error('Unable to get video stream: ', e));
}

export function onVideoCanPlay() {
    videoReady = true;
    updateSize(video, videoCanvas);
}

export function isVideoReady() {
    return videoReady;
}

export function getVideoCanvas() { return videoCanvas; }
export function getVideo() { return video; }