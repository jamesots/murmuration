import * as THREE from 'three';
import { TerrainGenerator } from '../terrain/TerrainGenerator';
import { EntityManager } from '../entities/EntityManager';
import { CameraController } from '../camera/CameraController';
import { SimulationConfig } from '../types';
import { MovementFunction } from '../entities/EntityManager';

/**
 * Main simulation class that orchestrates the 3D scene
 */
export class Simulation {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cameraController: CameraController;

  private terrainGenerator: TerrainGenerator;
  private entityManager: EntityManager;

  private clock: THREE.Clock;
  private stats: { fps: number; entityCount: number };

  constructor(
    canvas: HTMLCanvasElement,
    config: SimulationConfig,
    movementFunction: MovementFunction
  ) {
    this.clock = new THREE.Clock();
    this.stats = { fps: 0, entityCount: 0 };

    this.scene = this.createScene();
    this.camera = this.createCamera(canvas);
    this.renderer = this.createRenderer(canvas);
    this.cameraController = new CameraController(this.camera, canvas);

    this.terrainGenerator = new TerrainGenerator(config.terrainSize);
    this.entityManager = new EntityManager(
      movementFunction,
      config.entityPerceptionRadius,
      config.maxEntityPerception,
      config.terrainSize
    );

    this.initialize(config);
    this.setupLights();

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  /**
   * Creates the Three.js scene
   */
  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 500, 2000);
    return scene;
  }

  /**
   * Creates the perspective camera
   */
  private createCamera(canvas: HTMLCanvasElement): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60,
      canvas.clientWidth / canvas.clientHeight,
      1,
      3000
    );
    camera.position.set(0, 300, 500);
    return camera;
  }

  /**
   * Creates the WebGL renderer
   */
  private createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    return renderer;
  }

  /**
   * Sets up scene lighting
   */
  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;

    directionalLight.shadow.camera.left = -600;
    directionalLight.shadow.camera.right = 600;
    directionalLight.shadow.camera.top = 600;
    directionalLight.shadow.camera.bottom = -600;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;

    this.scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3a5f0b, 0.3);
    this.scene.add(hemisphereLight);
  }

  /**
   * Initializes terrain and entities
   */
  private initialize(config: SimulationConfig): void {
    this.terrainGenerator.generate();
    this.terrainGenerator.addToScene(this.scene);

    this.entityManager.createEntities(config.entityCount);
    this.entityManager.addToScene(this.scene);

    this.stats.entityCount = this.entityManager.getEntityCount();
  }

  /**
   * Handles window resize events
   */
  private onWindowResize(): void {
    const canvas = this.renderer.domElement;
    this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  }

  /**
   * Main animation loop
   */
  public animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    const deltaTime = this.clock.getDelta();
    const clampedDeltaTime = Math.min(deltaTime, 0.1);

    this.entityManager.update(clampedDeltaTime);

    this.renderer.render(this.scene, this.camera);

    this.stats.fps = Math.round(1 / deltaTime);
  }

  /**
   * Gets current simulation statistics
   */
  public getStats(): { fps: number; entityCount: number } {
    return this.stats;
  }

  /**
   * Starts the simulation
   */
  public start(): void {
    this.animate();
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.cameraController.dispose();
    this.renderer.dispose();
  }
}
