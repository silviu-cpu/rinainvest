import type * as ThreeTypes from 'three';

type ThreeModule = typeof ThreeTypes;

export class HeroScene {
  private THREE!: ThreeModule;
  private renderer!: ThreeTypes.WebGLRenderer;
  private scene!: ThreeTypes.Scene;
  private camera!: ThreeTypes.PerspectiveCamera;
  private platform!: ThreeTypes.Group;
  private vehicleRing!: ThreeTypes.Group;
  private vehicles: ThreeTypes.Group[] = [];
  private rafId = 0;
  private startTime = performance.now();
  private dragVelocity = 0;
  private isDragging = false;
  private lastDragX = 0;
  private mouseX = 0;
  private reducedMotion = false;
  private resizeObserver!: ResizeObserver;
  private intersectionObserver!: IntersectionObserver;
  private isVisible = true;

  private discMaterial!: ThreeTypes.MeshStandardMaterial;
  private vehicleMat!: ThreeTypes.MeshStandardMaterial;
  private ambientLight!: ThreeTypes.AmbientLight;
  private rimLight!: ThreeTypes.DirectionalLight;
  private hemiLight!: ThreeTypes.HemisphereLight;
  private lineMaterials: ThreeTypes.LineBasicMaterial[] = [];

  async init(canvas: HTMLCanvasElement, theme: 'dark' | 'light', three: ThreeModule): Promise<void> {
    this.THREE = three;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.buildRenderer(canvas);
    this.buildLights();
    this.buildPlatform();
    await this.loadVehicles();
    this.buildContactShadow();
    this.setupInteraction(canvas);
    this.setupResizeObserver(canvas);
    this.setupIntersectionObserver(canvas);
    this.setTheme(theme);
    this.animate();
  }

  // ── Renderer ──────────────────────────────────────────────────────────────

  private buildRenderer(canvas: HTMLCanvasElement): void {
    const T = this.THREE;
    this.renderer = new T.WebGLRenderer({ antialias: true, alpha: true, canvas });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    const parent = canvas.parentElement;
    const w = parent ? parent.clientWidth : canvas.clientWidth;
    const h = parent ? parent.clientHeight : canvas.clientHeight;
    this.renderer.setSize(w, h, false);

    this.scene = new T.Scene();
    this.camera = new T.PerspectiveCamera(32, w / h, 0.1, 100);
    this.camera.position.set(0, 8, 17);
    this.camera.lookAt(0, 1.0, 0);
  }

  // ── Lights ────────────────────────────────────────────────────────────────

  private buildLights(): void {
    const T = this.THREE;
    this.ambientLight = new T.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    const key = new T.DirectionalLight(0xfff1d0, 1.2);
    key.position.set(8, 12, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0005;
    this.scene.add(key);

    this.rimLight = new T.DirectionalLight(0x4a76c8, 0.6);
    this.rimLight.position.set(-8, 6, -6);
    this.scene.add(this.rimLight);

    this.hemiLight = new T.HemisphereLight(0xc8a560, 0x07101f, 0.2);
    this.scene.add(this.hemiLight);
  }

  // ── Platform ──────────────────────────────────────────────────────────────

  private buildPlatform(): void {
    const T = this.THREE;
    this.platform = new T.Group();
    this.vehicleRing = new T.Group();
    this.platform.add(this.vehicleRing);

    this.discMaterial = new T.MeshStandardMaterial({
      color: 0x0e1a2e,
      roughness: 0.4,
      metalness: 0.5,
      transparent: true,
      opacity: 0.9,
    });
    const disc = new T.Mesh(new T.CylinderGeometry(7.5, 7.5, 0.12, 96), this.discMaterial);
    disc.receiveShadow = true;
    this.platform.add(disc);

    const goldMat = new T.MeshStandardMaterial({
      color: 0xc8a560,
      roughness: 0.25,
      metalness: 0.95,
      emissive: new T.Color(0x3a2d12),
      emissiveIntensity: 0.5,
    });

    const outerRing = new T.Mesh(new T.TorusGeometry(7.45, 0.05, 16, 120), goldMat);
    outerRing.rotation.x = Math.PI / 2;
    outerRing.position.y = 0.07;
    this.platform.add(outerRing);

    const midRing = new T.Mesh(new T.TorusGeometry(5.5, 0.025, 16, 100), goldMat);
    midRing.rotation.x = Math.PI / 2;
    midRing.position.y = 0.07;
    this.platform.add(midRing);

    const innerRing = new T.Mesh(new T.TorusGeometry(3.8, 0.015, 12, 80), goldMat);
    innerRing.rotation.x = Math.PI / 2;
    innerRing.position.y = 0.07;
    this.platform.add(innerRing);

    const dot = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.3, 16), goldMat);
    dot.position.y = 0.15;
    this.platform.add(dot);

    this.scene.add(this.platform);
  }

  // ── Line Helpers ──────────────────────────────────────────────────────────

  private newLineMat(opacity = 0.9): ThreeTypes.LineBasicMaterial {
    const mat = new this.THREE.LineBasicMaterial({ color: 0xc8a560, transparent: true, opacity });
    this.lineMaterials.push(mat);
    return mat;
  }

  private ln(pts: [number, number, number][], mat: ThreeTypes.LineBasicMaterial): ThreeTypes.Line {
    const T = this.THREE;
    const geo = new T.BufferGeometry().setFromPoints(
      pts.map(([x, y, z]) => new T.Vector3(x, y, z)),
    );
    return new T.Line(geo, mat);
  }

  private wheel(
    cx: number, cy: number, cz: number,
    r: number,
    mat: ThreeTypes.LineBasicMaterial,
  ): ThreeTypes.Line {
    const N = 16;
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz]);
    }
    return this.ln(pts, mat);
  }

  // ── Vehicles — GLTF loader with wireframe fallback ───────────────────────

  private readonly VEHICLE_DEFS = [
    { path: 'assets/models/man-coach.glb',  targetLength: 4.2, build: () => this.buildMANCoach()  },
    { path: 'assets/models/vw-crafter.glb', targetLength: 2.7, build: () => this.buildVWCrafter() },
    { path: 'assets/models/vw-caddy.glb',   targetLength: 2.0, build: () => this.buildVWCaddy()   },
  ];

  private async loadVehicles(): Promise<void> {
    const T = this.THREE;
    const radius = 3.2;

    this.vehicleMat = new T.MeshStandardMaterial({
      color: 0xc8a560,
      metalness: 0.6,
      roughness: 0.35,
    });

    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    const loadOne = (def: (typeof this.VEHICLE_DEFS)[number]): Promise<ThreeTypes.Group> =>
      new Promise((resolve) => {
        loader.load(
          def.path,
          (gltf) => resolve(this.prepareGLTFModel(gltf.scene, def.targetLength)),
          undefined,
          () => resolve(def.build()),
        );
      });

    const results = await Promise.all(this.VEHICLE_DEFS.map(loadOne));

    // VW Crafter (index 1) and VW Caddy (index 2) rotated 40° extra to face forward
    const extraRot = (40 * Math.PI) / 180;

    results.forEach((vehicle, i) => {
      const angle = (i * Math.PI * 2) / 3;
      const group = new T.Group();
      group.position.set(Math.sin(angle) * radius, 0.08, Math.cos(angle) * radius);
      group.rotation.y = -angle + Math.PI / 2 + (i > 0 ? extraRot : 0);
      group.add(vehicle);
      this.vehicleRing.add(group);
      this.vehicles.push(group);
    });
  }

  private prepareGLTFModel(gltfScene: ThreeTypes.Group, targetLength: number): ThreeTypes.Group {
    const T = this.THREE;
    const box = new T.Box3().setFromObject(gltfScene);
    const size = box.getSize(new T.Vector3());
    const center = box.getCenter(new T.Vector3());
    const scale = targetLength / Math.max(size.x, size.z, 0.01);

    gltfScene.scale.setScalar(scale);
    gltfScene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

    gltfScene.traverse((child) => {
      const m = child as ThreeTypes.Mesh;
      if (!m.isMesh) return;
      (Array.isArray(m.material) ? m.material : [m.material]).forEach((mt) => {
        const mat = mt as ThreeTypes.MeshStandardMaterial;
        mat.map?.dispose();
        mat.dispose();
      });
      m.material = this.vehicleMat;
      m.castShadow = true;
      m.receiveShadow = true;
    });

    return gltfScene;
  }

  // ── MAN Lion's Coach ──────────────────────────────────────────────────────

  private buildMANCoach(): ThreeTypes.Group {
    const g = new this.THREE.Group();
    const m = this.newLineMat(0.92);
    const d = this.newLineMat(0.46);
    const W = 0.65;

    for (const z of [+W, -W]) {
      g.add(this.ln([
        [ 2.20, 0.50, z], [ 2.20, 1.68, z],
        [-2.20, 1.62, z], [-2.20, 0.50, z],
        [ 2.20, 0.50, z],
      ], m));
      g.add(this.ln([
        [ 1.72, 0.88, z], [-1.80, 0.88, z],
        [-1.80, 1.56, z], [ 1.72, 1.56, z],
        [ 1.72, 0.88, z],
      ], d));
      g.add(this.ln([[-2.10, 0.62, z], [2.10, 0.62, z]], d));
    }

    g.add(this.ln([[ 2.20, 1.68, -W], [ 2.20, 1.68, +W]], m));
    g.add(this.ln([[ 2.20, 0.50, -W], [ 2.20, 0.50, +W]], m));
    g.add(this.ln([[-2.20, 1.62, -W], [-2.20, 1.62, +W]], m));
    g.add(this.ln([[-2.20, 0.50, -W], [-2.20, 0.50, +W]], m));

    g.add(this.ln([
      [2.20, 0.86, -0.54], [2.20, 0.86, +0.54],
      [2.20, 1.64, +0.54], [2.20, 1.64, -0.54],
      [2.20, 0.86, -0.54],
    ], d));
    g.add(this.ln([
      [2.20, 1.52, -0.34], [2.20, 1.52, +0.34],
      [2.20, 1.66, +0.34], [2.20, 1.66, -0.34],
      [2.20, 1.52, -0.34],
    ], d));

    const wm = this.newLineMat(0.80);
    for (const ax of [1.60, -0.35, -1.55]) {
      g.add(this.wheel(ax, 0.25, +(W + 0.07), 0.25, wm));
      g.add(this.wheel(ax, 0.25, -(W + 0.07), 0.25, wm));
    }

    return g;
  }

  // ── Volkswagen Crafter ────────────────────────────────────────────────────

  private buildVWCrafter(): ThreeTypes.Group {
    const g = new this.THREE.Group();
    const m = this.newLineMat(0.92);
    const d = this.newLineMat(0.46);
    const W = 0.60;

    for (const z of [+W, -W]) {
      g.add(this.ln([
        [ 1.40, 0.46, z], [ 1.40, 1.88, z],
        [-1.40, 1.88, z], [-1.40, 0.46, z],
        [ 1.40, 0.46, z],
      ], m));
      g.add(this.ln([[-1.40, 0.78, z], [1.40, 0.78, z]], d));
      g.add(this.ln([
        [0.55, 1.00, z], [1.25, 1.00, z],
        [1.25, 1.72, z], [0.55, 1.72, z],
        [0.55, 1.00, z],
      ], d));
      g.add(this.ln([
        [-0.85, 1.00, z], [0.45, 1.00, z],
        [0.45, 1.72, z],  [-0.85, 1.72, z],
        [-0.85, 1.00, z],
      ], d));
      g.add(this.ln([[-0.18, 1.00, z], [-0.18, 1.72, z]], d));
      g.add(this.ln([[ 0.12, 1.00, z], [ 0.12, 1.72, z]], d));
    }

    g.add(this.ln([[ 1.40, 1.88, -W], [ 1.40, 1.88, +W]], m));
    g.add(this.ln([[ 1.40, 0.46, -W], [ 1.40, 0.46, +W]], m));
    g.add(this.ln([[-1.40, 1.88, -W], [-1.40, 1.88, +W]], m));
    g.add(this.ln([[-1.40, 0.46, -W], [-1.40, 0.46, +W]], m));

    g.add(this.ln([
      [1.40, 0.85, -0.50], [1.40, 0.85, +0.50],
      [1.40, 1.82, +0.50], [1.40, 1.82, -0.50],
      [1.40, 0.85, -0.50],
    ], d));

    const wm = this.newLineMat(0.80);
    for (const ax of [0.82, -0.82]) {
      g.add(this.wheel(ax, 0.24, +(W + 0.07), 0.24, wm));
      g.add(this.wheel(ax, 0.24, -(W + 0.07), 0.24, wm));
    }

    return g;
  }

  // ── Volkswagen Caddy ──────────────────────────────────────────────────────

  private buildVWCaddy(): ThreeTypes.Group {
    const g = new this.THREE.Group();
    const m = this.newLineMat(0.92);
    const d = this.newLineMat(0.46);
    const W = 0.55;

    for (const z of [+W, -W]) {
      g.add(this.ln([
        [ 1.00, 0.44, z], [ 1.00, 0.80, z],
        [ 0.52, 1.56, z], [-1.00, 1.56, z],
        [-1.00, 0.44, z], [ 1.00, 0.44, z],
      ], m));
      g.add(this.ln([[-1.00, 0.70, z], [1.00, 0.70, z]], d));
      g.add(this.ln([
        [0.54, 0.96, z], [0.88, 0.96, z],
        [0.88, 1.48, z], [0.54, 1.48, z],
        [0.54, 0.96, z],
      ], d));
    }

    g.add(this.ln([[ 1.00, 0.44, -W], [ 1.00, 0.44, +W]], m));
    g.add(this.ln([[ 1.00, 0.80, -W], [ 1.00, 0.80, +W]], m));
    g.add(this.ln([[ 0.52, 1.56, -W], [ 0.52, 1.56, +W]], m));
    g.add(this.ln([[-1.00, 1.56, -W], [-1.00, 1.56, +W]], m));
    g.add(this.ln([[-1.00, 0.44, -W], [-1.00, 0.44, +W]], m));

    g.add(this.ln([
      [1.00, 0.44, -0.44], [1.00, 0.44, +0.44],
      [1.00, 0.78, +0.44], [1.00, 0.78, -0.44],
      [1.00, 0.44, -0.44],
    ], d));

    g.add(this.ln([[-0.18, 0.44, +W], [-0.18, 1.56, +W]], d));

    const wm = this.newLineMat(0.80);
    for (const ax of [0.62, -0.62]) {
      g.add(this.wheel(ax, 0.21, +(W + 0.06), 0.21, wm));
      g.add(this.wheel(ax, 0.21, -(W + 0.06), 0.21, wm));
    }

    return g;
  }

  // ── Contact Shadow ────────────────────────────────────────────────────────

  private buildContactShadow(): void {
    const T = this.THREE;
    const size = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d')!;
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(0,0,0,0.35)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const shadowPlane = new T.Mesh(
      new T.PlaneGeometry(20, 20),
      new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), transparent: true, depthWrite: false }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.09;
    this.platform.add(shadowPlane);
  }

  // ── Interaction ───────────────────────────────────────────────────────────

  private setupInteraction(canvas: HTMLCanvasElement): void {
    canvas.style.cursor = 'grab';

    canvas.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.lastDragX = e.clientX;
      canvas.style.cursor = 'grabbing';
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', (e) => {
      if (this.isDragging) {
        this.dragVelocity += (e.clientX - this.lastDragX) * 0.0012;
        this.lastDragX = e.clientX;
      }
      const rect = canvas.getBoundingClientRect();
      this.mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    });

    const endDrag = () => {
      this.isDragging = false;
      canvas.style.cursor = 'grab';
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointerleave', endDrag);
  }

  private setupResizeObserver(canvas: HTMLCanvasElement): void {
    this.resizeObserver = new ResizeObserver(() => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w === 0 || h === 0) return;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    });
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
  }

  private setupIntersectionObserver(canvas: HTMLCanvasElement): void {
    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        this.isVisible = entry.isIntersecting;
        if (this.isVisible && this.rafId === 0) this.animate();
      },
      { threshold: 0.05 },
    );
    this.intersectionObserver.observe(canvas);
  }

  // ── Animation ─────────────────────────────────────────────────────────────

  private animate(): void {
    if (!this.isVisible) {
      this.rafId = 0;
      return;
    }
    this.rafId = requestAnimationFrame(() => this.animate());
    const t = performance.now() - this.startTime;

    if (!this.reducedMotion) {
      this.vehicleRing.rotation.y += -0.0028 + this.dragVelocity;
      this.platform.rotation.y += (-0.0028 + this.dragVelocity) * 0.5;
      this.dragVelocity *= 0.94;

      this.vehicles.forEach((v, i) => {
        v.position.y = 0.08 + Math.sin(t * 0.0008 + i * 1.2) * 0.018;
      });

      this.camera.position.x += (this.mouseX * 0.6 - this.camera.position.x) * 0.03;
      this.camera.position.y = 7.5 + Math.sin(t * 0.00021) * 0.3;
      this.camera.lookAt(0, 1.0, 0);
    }

    this.renderer.render(this.scene, this.camera);
  }

  // ── Theme ─────────────────────────────────────────────────────────────────

  setTheme(theme: 'dark' | 'light'): void {
    const isDark = theme === 'dark';
    const lineColor = isDark ? 0xc8a560 : 0x9a7d40;

    if (this.discMaterial) {
      this.discMaterial.color.setHex(isDark ? 0x0e1a2e : 0xe9e2d2);
    }
    if (this.vehicleMat) {
      this.vehicleMat.color.setHex(isDark ? 0xc8a560 : 0x9a7d40);
    }
    this.lineMaterials.forEach((m) => m.color.setHex(lineColor));

    if (this.ambientLight) this.ambientLight.intensity = isDark ? 0.4 : 0.65;
    if (this.rimLight) this.rimLight.intensity = isDark ? 0.6 : 0.35;
    if (this.hemiLight) this.hemiLight.intensity = isDark ? 0.2 : 0.3;
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.renderer?.dispose();
  }
}
