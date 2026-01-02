import * as THREE from 'three';

/**
 * Handles camera controls for the simulation
 * - Right mouse button: Rotate
 * - Scroll wheel: Zoom in/out
 * - Middle mouse button: Pan (move up/down/left/right)
 */
export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;

  private isRightMouseDown = false;
  private isMiddleMouseDown = false;

  private lastMouseX = 0;
  private lastMouseY = 0;

  private spherical = new THREE.Spherical(500, Math.PI / 3, 0);
  private target = new THREE.Vector3(0, 0, 0);

  private rotationSpeed = 0.005;
  private panSpeed = 0.5;
  private zoomSpeed = 50;

  private minDistance = 50;
  private maxDistance = 1500;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.setupEventListeners();
    this.updateCameraPosition();
  }

  /**
   * Sets up mouse and wheel event listeners
   */
  private setupEventListeners(): void {
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.domElement.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Handles mouse down events
   */
  private onMouseDown(event: MouseEvent): void {
    if (event.button === 2) {
      this.isRightMouseDown = true;
    } else if (event.button === 1) {
      this.isMiddleMouseDown = true;
      event.preventDefault();
    }

    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  /**
   * Handles mouse movement
   */
  private onMouseMove(event: MouseEvent): void {
    const deltaX = event.clientX - this.lastMouseX;
    const deltaY = event.clientY - this.lastMouseY;

    if (this.isRightMouseDown) {
      this.rotate(deltaX, deltaY);
    } else if (this.isMiddleMouseDown) {
      this.pan(deltaX, deltaY);
    }

    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  /**
   * Handles mouse up events
   */
  private onMouseUp(event: MouseEvent): void {
    if (event.button === 2) {
      this.isRightMouseDown = false;
    } else if (event.button === 1) {
      this.isMiddleMouseDown = false;
    }
  }

  /**
   * Handles mouse wheel events for zooming
   */
  private onWheel(event: WheelEvent): void {
    event.preventDefault();

    const delta = event.deltaY;
    this.zoom(delta);
  }

  /**
   * Rotates the camera around the target
   */
  private rotate(deltaX: number, deltaY: number): void {
    this.spherical.theta -= deltaX * this.rotationSpeed;
    this.spherical.phi -= deltaY * this.rotationSpeed;

    this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));

    this.updateCameraPosition();
  }

  /**
   * Pans the camera (moves the target point)
   */
  private pan(deltaX: number, deltaY: number): void {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    const right = new THREE.Vector3();
    right.crossVectors(direction, this.camera.up).normalize();

    const up = new THREE.Vector3(0, 1, 0);

    const distance = this.spherical.radius;
    const panFactor = this.panSpeed * distance * 0.001;

    this.target.add(right.multiplyScalar(-deltaX * panFactor));
    this.target.add(up.multiplyScalar(deltaY * panFactor));

    this.updateCameraPosition();
  }

  /**
   * Zooms the camera in or out
   */
  private zoom(delta: number): void {
    this.spherical.radius += delta * this.zoomSpeed * 0.01;
    this.spherical.radius = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.spherical.radius)
    );

    this.updateCameraPosition();
  }

  /**
   * Updates the camera position based on spherical coordinates
   */
  private updateCameraPosition(): void {
    const position = new THREE.Vector3().setFromSpherical(this.spherical);
    position.add(this.target);

    this.camera.position.copy(position);
    this.camera.lookAt(this.target);
  }

  /**
   * Sets the camera target position
   */
  public setTarget(target: THREE.Vector3): void {
    this.target.copy(target);
    this.updateCameraPosition();
  }

  /**
   * Gets the current target position
   */
  public getTarget(): THREE.Vector3 {
    return this.target.clone();
  }

  /**
   * Cleanup event listeners
   */
  public dispose(): void {
    this.domElement.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.domElement.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.domElement.removeEventListener('wheel', this.onWheel.bind(this));
  }
}
