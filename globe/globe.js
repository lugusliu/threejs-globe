var DAT = DAT || {};

DAT.Globe = function(container, opts) {
  opts = opts || {};

  var earthColor = new THREE.Color(0x66ccff);
  var earthColor1 = new THREE.Color(0x66ffcc);

  var params = { opacity: 0.1 };

  var camera, scene, renderer, w, h;
  var mesh, point;

  var mouseOnDown = { x: 0, y: 0 };
  var target = { x: Math.PI*3/2, y: Math.PI / 6.0 },
      targetOnDown = { x: 0, y: 0 };

  var padding = 40;

  function init() {
    var material;
    w = container.offsetWidth || window.innerWidth;
    h = container.offsetHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
    camera.position.z = 250;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x215b71, 160, 300 );

    var geometry = new THREE.SphereBufferGeometry(50, 40, 100);
    var geometry1 = new THREE.RingGeometry( 66, 67, 100 );

    material = new THREE.MeshStandardMaterial({
      opacity: params.opacity,
      transparent: true
    });

    material1 = new THREE.MeshBasicMaterial({
      color: 0x6699cc,
      side: THREE.DoubleSide
    });

    mesh = new THREE.Mesh(geometry, material);
    ring = new THREE.Mesh(geometry1, material1);
    ring.rotation.x = -Math.PI / 2;
    scene.add(mesh);
    scene.add(ring);

    scene.position.set(30, 0, 0);
    scene.rotation.x = Math.PI / 6;

    geometry = new THREE.BoxGeometry(0.35, 0.35, 1);
    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -0.25));

    point = new THREE.Mesh(geometry);

    renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    renderer.setSize(w, h);
    renderer.setClearColor( 0x000000, 0.0 );
    container.appendChild(renderer.domElement);

    container.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('resize', onWindowResize, false);
  }

  function addData(data, opts) {
    var lat, lng, color, color1, i;
    opts.animated = opts.animated || false;
    this.is_animated = opts.animated;
    if (opts.animated) {
      if (this._baseGeometry === undefined) {
        this._baseGeometry = new THREE.Geometry();
        for (i = 0; i < data.length; i += 3) {
          lat = data[i];
          lng = data[i + 1];
          color = earthColor;
          addPoint(lat, lng, color, this._baseGeometry); 
        }
      }
    }
    var subgeo = new THREE.Geometry();
    for (i = 0; i < data.length; i += 3) {
      lat = data[i];
      lng = data[i + 1];
      color = earthColor;
      addPoint(lat, lng, color, subgeo);
    }
  };

  function createPoints() {
    if (this._baseGeometry !== undefined) {
      this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
        color: 0x99cccc,
        vertexColors: THREE.FaceColors,
        morphTargets: true
      }));
      scene.add(this.points);
    }
  }

  function addPoint(lat, lng, color, subgeo) {
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (180 - lng) * Math.PI / 180;

    point.position.x = 55 * Math.sin(phi) * Math.cos(theta);
    point.position.y = 55 * Math.cos(phi);
    point.position.z = 55 * Math.sin(phi) * Math.sin(theta);

    point.lookAt(mesh.position);

    point.scale.z = 0.25;
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
    if (scene.rotation.x > Math.PI / 4) {
      scene.rotation.x -= Math.PI / 5400;
    } else {
      scene.rotation.x += Math.PI / 5400;
    }
    scene.rotation.y += Math.PI / 1800;
    renderer.render(scene, camera);
  }

  init();
  this.animate = animate;
  this.addData = addData;
  this.createPoints = createPoints;
  this.renderer = renderer;
  this.scene = scene;

  return this;
};

