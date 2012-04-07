if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

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
var trailMax = 5;
var trailIndex = 0;
var trails;
var trailPointParticles = [];
var musicStarted = false;


// particle stroke
var PI2 = Math.PI * 2;

function generateSprite() {
    var canvas = document.createElement( 'canvas' );
    canvas.width = 20;
    canvas.height = 20;

    var context = canvas.getContext( '2d' );
    var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );
    gradient.addColorStop( 0, 'rgba(255,255,255,1)' );
    gradient.addColorStop( 0.3, 'rgba(0,255,255,1)' );
    gradient.addColorStop( 0.5, 'rgba(0,0,64,1)' );
    gradient.addColorStop( 1, 'rgba(0,0,0,1)' );

    context.fillStyle = gradient;
    context.fillRect( 0, 0, canvas.width, canvas.height );

    return canvas;
}

function generateTrailSprite() {
    var canvas = document.createElement( 'canvas' );
    canvas.width = 10;
    canvas.height = 10;

    var context = canvas.getContext( '2d' );
    var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );
    gradient.addColorStop( 0, 'rgba(0,128,256,1)' );
    gradient.addColorStop( 1, 'rgba(0,0,0,1)' );

    context.fillStyle = gradient;
    context.fillRect( 0, 0, canvas.width, canvas.height );

    return canvas;
}

var boneMat = new THREE.ParticleBasicMaterial( {
            map: new THREE.Texture( generateSprite() ),
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true
} );


//
init();
startTime = Date.now();
animate();



// BVH skeleton generate class
function BVHSkeleton(bvhObj) {
    this.frames =  bvhObj.frames;
    this.frameTime =  bvhObj.frameTime;
    this.motion = bvhObj.motion;
    this.mat = new THREE.ParticleBasicMaterial( {
                map: new THREE.Texture( generateSprite() ),
                blending: THREE.AdditiveBlending,
                depthTest: false,
                transparent: true
    } );
    this.object = BVHParse(bvhObj.root);
}


function BVHParse(obj) {
    var material, particle, geometry;
    
    particle = new THREE.Particle( this.mat );

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
    trailPointParticles.push( particle );
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
    frameNo = (frameNo == 0) ? 1 : frameNo;
    if (oldFrameNo > frameNo) {
        music.play();
    }
    // if (frameNo > 2375) { }
    motionFrame = skel.motion[frameNo];
    BVHAnimParse(skel.object);
}

function initBVHanime() {
    var a = [ aachan, nocchi, kashiyuka ];
    for (var i in a) {
        var skel = a[i];
        motionFrame = skel.motion[1];
        BVHAnimParse(skel.object);
    }
}

function initTrail() {
    var mat = new THREE.ParticleBasicMaterial(
        {
            map: new THREE.Texture( generateTrailSprite() ),
            size:10,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true
        } );
    
    trails = [];
    for (var i=0; i<trailMax; i++) {
        trails[i] = [];
    }
    for (var i=0, len=trailPointParticles.length; i<len; i++) {
        for (var j=0; j<trailMax; j++ ) {
            var pa = new THREE.Particle( mat );
            pa.visible = false;
            trails[j][i] = pa;
            scene.add( pa );
        }
    }
}

function trailAnimation() {
    var ta = trails[trailIndex];
    for (var i=0, len=trailPointParticles.length; i<len; i++) {
        var pa = ta[i];
        pa.position = trailPointParticles[i].matrixWorld.getPosition().clone();
        pa.visible = true;
    }
    trailIndex = (trailIndex + 1) % trailMax;
}


//
//  main start point
//
function init() {
    container = document.createElement( 'div' );
    document.body.appendChild( container );
    sprite = THREE.ImageUtils.loadTexture( "resource/ball.png" );
    if (Audio != undefined) {
        music = new Audio("resource/Perfume_globalsite_sound.wav");
        music.volume = 0.05;
        if (music.oncanplaythrough == undefined) {
//             musicStarted = true;
        } else {
            music.oncanplaythrough = function() {
                musicStarted = true;
                startTime = Date.now();
            };
        }
        music.load();
    } else {
        musicStarted = true;
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
    initBVHanime();
    initTrail();
    
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
    if (! musicStarted ) {
        if (music.readystate < 4) {
            return;
        }
        musicStarted = true;
        return;
    }
    BVHAnimation(aachan);
    BVHAnimation(nocchi);
    BVHAnimation(kashiyuka);
    trailAnimation();
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
