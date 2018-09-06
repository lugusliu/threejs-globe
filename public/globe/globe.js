/**
 * dat.globe Javascript WebGL Globe Toolkit
 * https://github.com/dataarts/webgl-globe
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var DAT = DAT || {};

DAT.Globe = function(container, opts) {
  opts = opts || {};

  var earthColor = new THREE.Color(0x3399ff);

  var params = { opacity: 0.10 };

  var camera, scene, renderer, w, h;
  var mesh, point;

  var overRenderer;

  var mouse = { x: 0, y: 0 }, 
      mouseOnDown = { x: 0, y: 0 };
  var rotation = { x: 0, y: 0 },
      target = { x: Math.PI*3/2, y: Math.PI / 6.0 },
      targetOnDown = { x: 0, y: 0 };

  var distance = 1000; // camera z axis postion

  var padding = 40;

  var PI_HALF = Math.PI / 2;

  function init() {
    var material;
    w = container.offsetWidth || window.innerWidth;
    h = container.offsetHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
    camera.position.z = distance;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x0099cc, -250, 250 );

    var geometry = new THREE.SphereBufferGeometry(200, 40, 100);

    material = new THREE.MeshStandardMaterial({
      opacity: params.opacity,
      transparent: true
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    geometry = new THREE.BoxGeometry(1, 1, 1);
    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -1.5));

    point = new THREE.Mesh(geometry);

    renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    renderer.setSize(w, h);
    renderer.setClearColor( 0x000000, 0.0 );
    container.appendChild(renderer.domElement);

    container.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('resize', onWindowResize, false);
  }

  function addData(data, opts) {
    var lat, lng, size, color, i, step, colorFnWrapper;

    opts.animated = opts.animated || false;
    this.is_animated = opts.animated;
    opts.format = opts.format || 'magnitude'; // other option is 'legend'
    if (opts.format === 'magnitude') {
      step = 3;
    } else if (opts.format === 'legend') {
      step = 4;
    } else {
      throw('error: format not supported: '+opts.format);
    }

    if (opts.animated) {
      if (this._baseGeometry === undefined) {
        this._baseGeometry = new THREE.Geometry();
        for (i = 0; i < data.length; i += step) {
          lat = data[i];
          lng = data[i + 1];
          size = data[i + 2];
          color = earthColor;
          size = 0;
          addPoint(lat, lng, 2, color, this._baseGeometry);
        }
      }
      if(this._morphTargetId === undefined) {
        this._morphTargetId = 0;
      } else {
        this._morphTargetId += 1;
      }
      opts.name = opts.name || 'morphTarget'+this._morphTargetId;
    }
    var subgeo = new THREE.Geometry();
    for (i = 0; i < data.length; i += step) {
      lat = data[i];
      lng = data[i + 1];
      color = earthColor;
      size = data[i + 2];
      size = size*200;
      addPoint(lat, lng, 10, color, subgeo);
    }
    if (opts.animated) {
      this._baseGeometry.morphTargets.push({'name': opts.name, vertices: subgeo.vertices});
    } else {
      this._baseGeometry = subgeo;
    }
  };

  function createPoints() {
    if (this._baseGeometry !== undefined) {
      if (this.is_animated === false) {
        this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
          color: 0xffffff,
          vertexColors: THREE.FaceColors,
          morphTargets: false
        }));
      } else {
        if (this._baseGeometry.morphTargets.length < 8) {
          var padding = 8-this._baseGeometry.morphTargets.length;
          for(var i=0; i<=padding; i++) {
            this._baseGeometry.morphTargets.push({'name': 'morphPadding'+i, vertices: this._baseGeometry.vertices});
          }
        }
        this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
          color: 0xffffff,
          vertexColors: THREE.FaceColors,
          morphTargets: true
        }));
      }
      scene.add(this.points);
    }
  }

  function addPoint(lat, lng, size, color, subgeo) {
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (180 - lng) * Math.PI / 180;

    point.position.x = 200 * Math.sin(phi) * Math.cos(theta);
    point.position.y = 200 * Math.cos(phi);
    point.position.z = 200 * Math.sin(phi) * Math.sin(theta);

    point.lookAt(mesh.position);

    point.scale.z = Math.max( size, 0.1 ); // avoid non-invertible matrix
    point.updateMatrix();

    for (var i = 0; i < point.geometry.faces.length; i++) {
      point.geometry.faces[i].color = color;
    }
    if(point.matrixAutoUpdate){
      point.updateMatrix();
    }
    subgeo.merge(point.geometry, point.matrix);
  }

  function onMouseDown(event) {
    event.preventDefault();

    console.log('clicked');

    mouseOnDown.x = - event.clientX;
    mouseOnDown.y = event.clientY;

    targetOnDown.x = target.x;
    targetOnDown.y = target.y;
    container.style.cursor = 'point';
  }

  function onWindowResize( event ) {
    var width = window.innerWidth;
    var height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize( width, height );
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }

  function render() {
    camera.lookAt(0, 0, 0);

    scene.position.set(200, 0, 0);
    scene.rotation.x = Math.PI / 12;

    scene.rotation.x += Math.PI / 1800;
    scene.rotation.y += Math.PI / 1800;

    renderer.render(scene, camera);
  }

  init();
  this.animate = animate;


  this.__defineGetter__('time', function() {
    return this._time || 0;
  });

  this.__defineSetter__('time', function(t) {
    var validMorphs = [];
    var morphDict = this.points.morphTargetDictionary;
    for(var k in morphDict) {
      if(k.indexOf('morphPadding') < 0) {
        validMorphs.push(morphDict[k]);
      }
    }
    validMorphs.sort();
    var l = validMorphs.length-1;
    var scaledt = t*l+1;
    var index = Math.floor(scaledt);
    for (i=0;i<validMorphs.length;i++) {
      this.points.morphTargetInfluences[validMorphs[i]] = 0;
    }
    var lastIndex = index - 1;
    var leftover = scaledt - index;
    if (lastIndex >= 0) {
      this.points.morphTargetInfluences[lastIndex] = 1 - leftover;
    }
    this.points.morphTargetInfluences[index] = leftover;
    this._time = t;
  });

  this.addData = addData;
  this.createPoints = createPoints;
  this.renderer = renderer;
  this.scene = scene;

  return this;

};

