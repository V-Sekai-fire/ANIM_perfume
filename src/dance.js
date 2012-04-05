var container, stats;

var camera, scene, renderer;

var cube, skeleton;

var targetRotation = 0;
var targetRotationOnMouseDown = 0;

var mouseX = 0;
var mouseY = 0;
var mouseXOnMouseDown = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var toRad = Math.PI / 180;
var sprite;
var startTime;
var frameNo = 9999;
var motionFrame;
var music;

// particle stroke
var PI2 = Math.PI * 2;
var programStroke = function ( context ) {
    context.lineWidth = 0.05;
    context.beginPath();
    context.arc( 0, 0, 1, 0, PI2, true );
    context.closePath();
    context.stroke();
}

var programFill = function ( context ) {
    context.beginPath();
    context.arc( 0, 0, 1, 0, PI2, true );
    context.closePath();
    context.fill();
}

//
init();
startTime = Date.now();
animate();



// BVH skeleton generate class
function BVHSkeleton(bvhObj) {
    this.frames =  bvhObj.frames;
    this.frameTime =  bvhObj.frameTime;
    this.motion = bvhObj.motion;
    this.object = BVHParse(bvhObj.root);
}

function BVHParse(obj) {
    var material, particle, geometry;
    
//     material = new THREE.ParticleBasicMaterial( { size: .1, map: sprite, vertexColors: true } );
//     material.color.setHSV( 1.0, 0.2, 0.8 );
//     particle = new THREE.Particle( material );
    
    particle = new THREE.Particle( new THREE.ParticleCanvasMaterial( { color: Math.random() * 0x808080 + 0x8F8F8F, program: programFill, size:50 } ) );
    
    particle.name = obj.name;
    particle.index = obj.index;
    particle.channels = obj.channels;
    var o = obj.offset;
    particle.position.x = o[0];
    particle.position.y = o[1];
    particle.position.z = o[2];
    particle.offset = particle.position.clone();
    particle.eulerOrder = 'YXZ';
    for (var i in obj.child) {
        particle.add(BVHParse(obj.child[i]));
    }
    return particle;
}

function BVHAnimParse(obj) {
    var channels = obj.channels;
    if (channels) {
        var index = obj.index;
        for (var i=0, len = channels.length; i<len; i++) {
            switch (channels[i]) {
            case 'xrot':
                obj.rotation.x = motionFrame[index+i] * toRad;
                break;
            case 'yrot':
                obj.rotation.y = motionFrame[index+i] * toRad;
                break;
            case 'zrot':
                obj.rotation.z = motionFrame[index+i] * toRad;
                break;
            case 'xpos':
                obj.position.x = obj.offset.x + motionFrame[index+i];
                break;
            case 'ypos':
                obj.position.y = obj.offset.y + motionFrame[index+i];
                break;
            case 'zpos':
                obj.position.z = obj.offset.z + motionFrame[index+i];
                break;
            }
        }
    }
    var a = obj.children;
    if (a) {
        for (var i in a) {
            BVHAnimParse(a[i]);
        }
    }
}


function BVHAnimation(skel) {
    var oldFrameNo = frameNo;
    frameNo = Math.round((Date.now() - startTime) / skel.frameTime / 1000) % skel.frames;
    if (oldFrameNo > frameNo) {
        music.play();
    }
    motionFrame = skel.motion[frameNo];
    BVHAnimParse(skel.object);
}

function init() {
    container = document.createElement( 'div' );
    document.body.appendChild( container );
    sprite = THREE.ImageUtils.loadTexture( "resource/ball.png" );
    if (Audio != undefined) {
        music = new Audio("resource/Perfume_globalsite_sound.wav");
        music.volume = 0.05;
        music.load();
    }

    var info = document.createElement( 'div' );
    info.style.position = 'absolute';
    info.style.top = '10px';
    info.style.width = '100%';
    info.style.textAlign = 'center';
    info.innerHTML = 'Perfume Global Project';
    container.appendChild( info );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 2, 1000 );
    camera.position.y = 300;
    camera.position.z = 500;
    scene.add( camera );

    // skeleton
    aachan = new BVHSkeleton(aachan_bvh);
    scene.add( aachan.object );
    nocchi = new BVHSkeleton(nocchi_bvh);
    scene.add( nocchi.object );
    kashiyuka = new BVHSkeleton(kashiyuka_bvh);
    scene.add( kashiyuka.object );
    
    renderer = new THREE.CanvasRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );

    container.appendChild( renderer.domElement );

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild( stats.domElement );

    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'touchstart', onDocumentTouchStart, false );
    document.addEventListener( 'touchmove', onDocumentTouchMove, false );
}

//

function onDocumentMouseDown( event ) {
    event.preventDefault();

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.addEventListener( 'mouseout', onDocumentMouseOut, false );

    mouseXOnMouseDown = event.clientX - windowHalfX;
    targetRotationOnMouseDown = targetRotation;
}

function onDocumentMouseMove( event ) {
    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;
    targetRotation = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.02;
}

function onDocumentMouseUp( event ) {
    document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
    document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}

function onDocumentMouseOut( event ) {
    document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
    document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}

function onDocumentTouchStart( event ) {
    if ( event.touches.length == 1 ) {
        event.preventDefault();
        mouseXOnMouseDown = event.touches[ 0 ].pageX - windowHalfX;
        targetRotationOnMouseDown = targetRotation;
    }
}

function onDocumentTouchMove( event ) {
    if ( event.touches.length == 1 ) {
        event.preventDefault();
        mouseX = event.touches[ 0 ].pageX - windowHalfX;
        targetRotation = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.05;
    }
}

//

function animate() {
    requestAnimationFrame( animate );
    BVHAnimation(aachan);
    BVHAnimation(nocchi);
    BVHAnimation(kashiyuka);
    render();
    stats.update();
}

function render() {
    var mat = new THREE.Matrix4;
    mat.setRotationY( -targetRotation * 0.05 );
    camera.position = mat.multiplyVector3( camera.position );
    camera.lookAt( scene.position );
    targetRotation *= 0.95;
    
    renderer.render( scene, camera );
}
