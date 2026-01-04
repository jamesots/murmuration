import * as THREE from 'three';
import { EntityState } from '../types';

/**
 * Represents a single flying entity in the simulation
 */
export class Entity {
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private randomVariables: Map<string, number>;
  private mesh: THREE.Mesh;

  constructor(position: THREE.Vector3, initialVelocity?: THREE.Vector3) {
    this.position = position.clone();
    this.velocity = initialVelocity?.clone() || new THREE.Vector3(0, 0, 0);
    this.randomVariables = new Map();

    this.mesh = this.createMesh();
    this.mesh.position.copy(this.position);
  }

  /**
   * Creates the visual representation of the entity
   */
  private createMesh(): THREE.Mesh {
    const geometry = new THREE.ConeGeometry(0.5, 2, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff6b35,
      emissive: 0xff6b35,
      emissiveIntensity: 0.2
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
  }

  /**
   * Gets the current state of the entity
   */
  public getState(): EntityState {
    return {
      position: this.position.clone(),
      velocity: this.velocity.clone(),
      randomVariables: new Map(this.randomVariables)
    };
  }

  /**
   * Gets the Three.js mesh for rendering
   */
  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  /**
   * Gets the current position
   */
  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  /**
   * Gets the current velocity
   */
  public getVelocity(): THREE.Vector3 {
    return this.velocity.clone();
  }

  /**
   * Updates the entity's position and velocity based on acceleration
   */
  public update(acceleration: THREE.Vector3, deltaTime: number): void {
    this.velocity.add(acceleration.clone().multiplyScalar(deltaTime));

    const maxSpeed = 50;
    if (this.velocity.length() > maxSpeed) {
      this.velocity.normalize().multiplyScalar(maxSpeed);
    }

    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

    this.mesh.position.copy(this.position);

    if (this.velocity.length() > 0.1) {
      const direction = this.velocity.clone().normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
      this.mesh.quaternion.copy(quaternion);
    }
  }

  /**
   * Updates random variables for the entity
   */
  public updateRandomVariables(newVariables: Map<string, number>): void {
    newVariables.forEach((value, key) => {
      this.randomVariables.set(key, value);
    });
  }

  /**
   * Gets a random variable value
   */
  public getRandomVariable(key: string): number | undefined {
    return this.randomVariables.get(key);
  }

  /**
   * Sets a random variable value
   */
  public setRandomVariable(key: string, value: number): void {
    this.randomVariables.set(key, value);
  }

  /**
   * Sets the position directly (for randomization)
   */
  public setPosition(position: THREE.Vector3): void {
    this.position.copy(position);
  }

  /**
   * Sets the velocity directly (for randomization)
   */
  public setVelocity(velocity: THREE.Vector3): void {
    this.velocity.copy(velocity);
  }
}
