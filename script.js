  /*
   * AUTHOR: Iacopo Sassarini
   */

    //if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
    var PARTICLES;
    //var timer = document.getElementById('raid').currentTime;
    //var amplitude = Math.floor( timer * 30 - 1 );

    var VISUALS_VISIBLE = true;
    var PARAMS = 4;

    var SCALE_FACTOR = 1000;
    var CAMERA_BOUND = 200;

    var NUM_POINTS_SUBSET = 10000;
    var NUM_SUBSETS       = 2;
    var NUM_POINTS = NUM_POINTS_SUBSET * NUM_SUBSETS;

    var NUM_LEVELS = 5;
    var LEVEL_DEPTH = 500;

    var DEF_BRIGHTNESS = 1;
    var DEF_SATURATION = 0.8;

    var SPRITE_SIZE = Math.ceil(2 * window.innerWidth /1600);

    // Orbit parameters constraints
    var A_MIN = -30;
    var A_MAX = 30;
    var B_MIN = .2;
    var B_MAX = 1.8;
    var C_MIN = 5;
    var C_MAX = 17;
    var D_MIN = 0;
    var D_MAX = 10;
    var E_MIN = 0;
    var E_MAX = 12;

    // Orbit parameters

    var a, b, c, d, e;

    // Orbit data
    var orbit = {
        subsets: [],
        xMin: 0,
        xMax: 0,
        yMin: 0,
        yMax: 0,
        scaleX: 0,
        scaleY: 0
    }

    var fogColor = 0x071E30;
    // Initialize data points
    for (var i = 0; i < NUM_SUBSETS; i++){
        var subsetPoints = [];
        for (var j = 0; j < NUM_POINTS_SUBSET; j++){
            subsetPoints[j] = {
                x: 0,
                y: 0,
                vertex:  new THREE.Vector3(0,0,0)
            };
        }
        orbit.subsets.push(subsetPoints);
    }

    var container, stats;
    var camera, scene, renderer, composer, hueValues = [];

    var mouseX = 0, mouseY = 0;

    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;

    var speed = 1;
    var rotationSpeed = 0.005;

    init();
    animate();

    function init() {
        loadAudio();

        //sprite1 = THREE.TextureLoader( "galaxy.png" );
         sprite1 = THREE.ImageUtils.loadTexture( "galaxy.png" );

        container = document.createElement( 'div' );
        document.body.appendChild( container );

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3 * SCALE_FACTOR );
        camera.position.z = SCALE_FACTOR / 2;
        //camera.position.x = SCALE_FACTOR / 4;

        scene = new THREE.Scene();
        //scene.fog = new THREE.Fog( 0x071E30, 500, 1000);

        generateOrbit();

        for (var s = 0; s < NUM_SUBSETS; s++){hueValues[s] = Math.random();}

        // Create particle systems
        for (var k = 0; k < NUM_LEVELS; k++){
            for (var s = 0; s < NUM_SUBSETS; s++){
                var geometry = new THREE.Geometry();
                for (var i = 0; i < NUM_POINTS_SUBSET; i++){geometry.vertices.push( orbit.subsets[s][i].vertex);}
                var materials = new THREE.PointsMaterial( { size: (SPRITE_SIZE ),
                  map: sprite1, blending: THREE.AdditiveBlending,
                  depthTest: false, transparent : true } );
                  //THREE.PointsMaterial
                //materials.color.setHSL(Math.random(), Math.random(), Math.random());
                PARTICLES = new THREE.Points( geometry, materials );
                PARTICLES.myMaterial = materials;
                PARTICLES.myLevel = k;
                PARTICLES.mySubset = s;
                PARTICLES.position.x = 0;
                PARTICLES.position.y = 0;
                PARTICLES.position.z = - LEVEL_DEPTH * k - (s  * LEVEL_DEPTH / NUM_SUBSETS) + SCALE_FACTOR/2;
                PARTICLES.needsUpdate = 0;
                scene.add( PARTICLES );
            }
        }

        // Setup renderer and effects
        renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha: 0, antialias: false } );
        //renderer.setClearColor( fogColor, 1 );
        renderer.setSize( window.innerWidth, window.innerHeight );


        container.appendChild( renderer.domElement );

        stats = new Stats();
        clock = new THREE.Clock();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '5px';
        stats.domElement.style.right = '5px';
        //container.appendChild( stats.domElement );

        // Setup listeners
        /*document.addEventListener( 'mousemove', onDocumentMouseMove, false );
        document.addEventListener( 'touchstart', onDocumentTouchStart, false );
        document.addEventListener( 'touchmove', onDocumentTouchMove, false );
        document.addEventListener( 'keydown', onKeyDown, false );
        window.addEventListener( 'resize', onWindowResize, false );*/

        // Schedule orbit regeneration
        //setInterval(updateOrbit, 5000);

    //--------------------------------------------------------------------
        effect = new THREE.StereoEffect(renderer);
        //controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls = new THREE.DeviceOrientationControls(camera, renderer.domElement);

        function setOrientationControls(e) {
          if (!e.alpha) {
            return;
          }

          //controls = new THREE.DeviceOrientationControls(camera, renderer.domElement);
          controls.connect();
          controls.update();

          renderer.domElement.addEventListener('click', fullscreen, false);
          function fullscreen() {
            if (container.requestFullscreen) {
              container.requestFullscreen();
            } else if (container.msRequestFullscreen) {
              container.msRequestFullscreen();
            } else if (container.mozRequestFullScreen) {
              container.mozRequestFullScreen();
            } else if (container.webkitRequestFullscreen) {
              container.webkitRequestFullscreen();
            }
          };
          window.removeEventListener('deviceorientation', setOrientationControls, true);
        }
        window.addEventListener( 'resize', onWindowResize, false );
        window.addEventListener('deviceorientation', setOrientationControls, true);
        window.addEventListener('orientationchange', resize, false);
    //--------------------------------------------------------------------
    }

    function resize(e){
      var width = 0;
      var height = 0;

      switch(window.orientation)
       {
         case -90:
         case 90:
           width = window.innerHeight;
           height = window.innerWidth;
           break;
         default:
           width = window.innerWidth;
           height = window.innerHeight;
           break;
       }

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      effect.setSize(width, height);
    }


    function render(time) {
        time = time || 0;

        //renderer.setClearColor( Math.random() * 0xffffff, 1 );
        // if (camera.position.x >= - CAMERA_BOUND && camera.position.x <= CAMERA_BOUND){
        //     camera.position.x += ( mouseX - camera.position.x ) * 0.05;
        //     if (camera.position.x < - CAMERA_BOUND) camera.position.x = -CAMERA_BOUND;
        //     if (camera.position.x >  CAMERA_BOUND) camera.position.x = CAMERA_BOUND;
        // }
        // if (camera.position.y >= - CAMERA_BOUND && camera.position.y <= CAMERA_BOUND){
        //     camera.position.y += ( - mouseY - camera.position.y ) * 0.05;
        //     if (camera.position.y < - CAMERA_BOUND) camera.position.y = -CAMERA_BOUND;
        //     if (camera.position.y >  CAMERA_BOUND) camera.position.y = CAMERA_BOUND;
        // }

        camera.lookAt( scene.position );
        timer = source.context.currentTime;
        amplitude = Math.floor( timer * 60 - 1 );
        //console.log(data[amplitude] * .1)

            for( i = 0; i < scene.children.length; i++ ) {
              //var z = Math.abs(scene.children[i].position.z / 1600);

                //scene.children[i].position.z += speed;
                scene.children[i].rotation.z += rotationSpeed;

                scene.children[i].scale.y = data[amplitude] * .1;
                scene.children[i].scale.x = data[amplitude] * .1;
                var n = (data[amplitude] * .005) + 0.5;
                //console.log(n)
                scene.children[i].scale.x = scene.children[i].scale.y = scene.children[i].scale.y = Math.abs(n + Number.EPSILON);
                scene.children[i].material.color.setRGB( n, n, n);
                scene.children[i].position.z += n;
                generateOrbit();

                //scene.children[i].geometry.verticesNeedUpdate = true;
                //scene.children[i].myMaterial.color.setHSL( Math.random(), Math.random(), Math.random());
                //var col = freqByteData[PARAMS] / 256;
                //scene.children[i].material.color.setRGB( 0, n, 0);

                //scene.children[i].scale.setScalar(col + 0.9);

            if (scene.children[i].position.z > camera.position.z){
                generateOrbit();
                scene.children[i].geometry.verticesNeedUpdate = true;
                //scene.children[i].material.color.setRGB( Math.random(), Math.random(), Math.random());
                //scene.children[i].myMaterial.color.setHSL( Math.random(), Math.random(), Math.random());
                scene.children[i].position.z = - (NUM_LEVELS -1) * LEVEL_DEPTH;
            }
        }

        //renderer.render( scene, camera );
        controls.update(clock.getDelta());
        camera.updateProjectionMatrix();
        effect.render(scene, camera);
    }

    function animate(time) {

         analyser.getByteFrequencyData(freqByteData);
		     analyser.getByteTimeDomainData(timeByteData);
        for(var j = 0; j < LEVEL_DEPTH; j++) {
			       PARTICLES[0] = timeByteData[j]*2;//stretch by 2
		         }
        requestAnimationFrame( animate );
        render(time);
        stats.update();
    }

    ///////////////////////////////////////////////
    // Hopalong Orbit Generator
    ///////////////////////////////////////////////
    function updateOrbit(){
        generateOrbit();
        for (var s = 0; s < NUM_SUBSETS; s++){
            hueValues[s] = Math.random();
        }
         for( i = 0; i < scene.children.length; i++ ) {
             //scene.children[i].geometry.verticesNeedUpdate = true;
         }

    }

    function generateOrbit(){
        var x, y, z, x1;
        var idx = 0;

        prepareOrbit();

        // Using local vars should be faster
        var al = a;
        var bl = b;
        var cl = c;
        var dl = d;
        var el = e;
        var subsets = orbit.subsets;
        var num_points_subset_l = NUM_POINTS_SUBSET;
        var num_points_l = NUM_POINTS;
        var scale_factor_l = SCALE_FACTOR;

        var xMin = 0, xMax = 0, yMin = 0, yMax = 0;

        for (var s = 0; s < NUM_SUBSETS; s++){

            // Use a different starting point for each orbit subset

            //x = s * .005 * (0.5-Math.random());
            //y = s * .005 * (0.5-Math.random());

             x = 0;
             y = 0;

            var curSubset = subsets[s];

            for (var i = 0; i < num_points_subset_l; i++){

                // Iteration formula (generalization of the Barry Martin's original one)
                z = (dl + Math.sqrt(Math.abs(bl * x - cl)));
                if (x > 0) {x1 = y - z;}
                else if (x == 0) {x1 = y;}
                else {x1 = y + z;}
                y = al - x;
                x = x1 + el;

                curSubset[i].x = x;
                curSubset[i].y = y;

                if (x < xMin) {xMin = x;}
                else if (x > xMax) {xMax = x;}
                if (y < yMin) {yMin = y;}
                else if (y > yMax) {yMax = y;}

                idx++;
            }
        }

        var scaleX = 2 *scale_factor_l / (xMax - xMin);
        var scaleY = 2 * scale_factor_l / (yMax - yMin);

        orbit.xMin = xMin;
        orbit.xMax = xMax;
        orbit.yMin = yMin;
        orbit.yMax = yMax;
        orbit.scaleX = scaleX;
        orbit.scaleY = scaleY;

        // Normalize and update vertex data
        for (var s = 0; s < NUM_SUBSETS; s++){
            var curSubset = subsets[s];
            for (var i = 0; i < num_points_subset_l; i++){
                curSubset[i].vertex.x = scaleX * (curSubset[i].x - xMin) - scale_factor_l;
                curSubset[i].vertex.y = scaleY * (curSubset[i].y - yMin) - scale_factor_l;
            }
        }
    }

    function prepareOrbit(){
        shuffleParams();
        orbit.xMin = 0;
        orbit.xMax = 0;
        orbit.yMin = 0;
        orbit.yMax = 0;
    }

    function shuffleParams() {
      //PARAMS++;
      //default

        a = A_MIN + Math.random() * (A_MAX - A_MIN);
        b = B_MIN + Math.random() * (B_MAX - B_MIN);
        c = C_MIN + Math.random() * (C_MAX - C_MIN);
        d = D_MIN + Math.random() * (D_MAX - D_MIN);
        e = E_MIN + Math.random() * (E_MAX - E_MIN);

        //manual
        /*
        a = A_MIN + (freqByteData[PARAMS] / 255) * (A_MAX - A_MIN);
        b = B_MIN + (freqByteData[PARAMS] / 255) * (B_MAX - B_MIN);
        c = C_MIN + (freqByteData[PARAMS] / 255) * (C_MAX - C_MIN);
        d = D_MIN + (freqByteData[PARAMS] / 255) * (D_MAX - D_MIN);
        e = E_MIN + (freqByteData[PARAMS] / 255) * (E_MAX - E_MIN);
        */
        //auto
        // a = A_MIN + ((freqByteData[0] / 255) * (A_MAX - A_MIN)) / 1000;
        // b = B_MIN + ((freqByteData[6] / 255) * (B_MAX - B_MIN)) / 1000;
        // c = C_MIN + ((freqByteData[12] / 255) * (C_MAX - C_MIN)) / 1000;
        // d = D_MIN + ((freqByteData[18] / 255) * (D_MAX - D_MIN)) / 1000;
        // e = E_MIN + ((freqByteData[24] / 255) * (E_MAX - E_MIN)) / 1000;

    }

    ///////////////////////////////////////////////
    // Event listeners
    ///////////////////////////////////////////////
    function onDocumentMouseMove( event ) {
        mouseX = event.clientX - windowHalfX;
        mouseY = event.clientY - windowHalfY;
    }

    function onDocumentTouchStart( event ) {
        if ( event.touches.length == 1 ) {
            event.preventDefault();
            mouseX = event.touches[ 0 ].pageX - windowHalfX;
            mouseY = event.touches[ 0 ].pageY - windowHalfY;
        }
    }

    function onDocumentTouchMove( event ) {
        if ( event.touches.length == 1 ) {
            event.preventDefault();
            mouseX = event.touches[ 0 ].pageX - windowHalfX;
            mouseY = event.touches[ 0 ].pageY - windowHalfY;
        }
    }

    function onWindowResize( event ) {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );

    }

    function onKeyDown(event){
        if(event.keyCode == 38 && speed < 20) speed += .5;
        else if(event.keyCode == 40 && speed > 0) speed -= .5;
        else if(event.keyCode == 37) rotationSpeed += .001;
        else if(event.keyCode == 39) rotationSpeed -= .001;
        else if(event.keyCode == 72 || event.keyCode == 104) toggleVisuals();
    }

    function showHideAbout() {
        if (document.getElementById('about').style.display == "block") {
            document.getElementById('about').style.display = "none";
        } else {
            document.getElementById('about').style.display = "block";
        }
    }

    function toggleVisuals(){
        if(VISUALS_VISIBLE){
            document.getElementById('plusone').style.display = 'none';
            document.getElementById('tweet').style.display = 'none';
            document.getElementById('fb').style.display = 'none';
            document.getElementById('aboutlink').style.display = 'none';
            document.getElementById('about').style.display = 'none';
            document.getElementById('info').style.display = 'none';
            document.getElementById('chaosnebula').style.display = 'none';
            stats.domElement.style.display = 'none';
            renderer.domElement.style.cursor = "none";
            VISUALS_VISIBLE = false;
        }
        else {
            document.getElementById('plusone').style.display = 'block';
            document.getElementById('tweet').style.display = 'block';
            document.getElementById('fb').style.display = 'block';
            document.getElementById('aboutlink').style.display = 'block';
            document.getElementById('info').style.display = 'block';
            document.getElementById('chaosnebula').style.display = 'block';
            stats.domElement.style.display = 'block';
            renderer.domElement.style.cursor = "";
            VISUALS_VISIBLE = true;
        }
    }
