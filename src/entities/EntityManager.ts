import * as THREE from 'three';
import { Entity } from './Entity';
import { MovementInput, MovementOutput, NearbyEntity, TerrainInfo } from '../types';

/**
 * Type definition for the user-defined movement function
 */
export type MovementFunction = (input: MovementInput) => MovementOutput;

/**
 * Manages all entities in the simulation
 * Uses instanced rendering for performance with thousands of entities
 */
export class EntityManager {
  private entities: Entity[] = [];
  private movementFunction: MovementFunction;
  private perceptionRadius: number;
  private instancedMesh: THREE.InstancedMesh | null = null;
  private terrainSize: number;
  private maxEntityPerception: number;

  constructor(
    movementFunction: MovementFunction,
    perceptionRadius: number = 50,
    maxEntityPerception: number = 7,
    terrainSize: number = 1000
  ) {
    this.movementFunction = movementFunction;
    this.perceptionRadius = perceptionRadius;
    this.maxEntityPerception = maxEntityPerception;
    this.terrainSize = terrainSize;
  }

  /**
   * Creates multiple entities with random positions and velocities
   */
  public createEntities(count: number): void {
    for (let i = 0; i < count; i++) {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * this.terrainSize * 0.8,
        20 + Math.random() * 80,
        (Math.random() - 0.5) * this.terrainSize * 0.8
      );

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 10
      );

      const entity = new Entity(position, velocity);
      this.entities.push(entity);
    }

    this.createInstancedMesh();
  }

  /**
   * Creates an instanced mesh for efficient rendering of many entities
   */
  private createInstancedMesh(): void {
    if (this.entities.length === 0) return;

    const geometry = new THREE.ConeGeometry(0.5, 2, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff6b35,
      emissive: 0xff6b35,
      emissiveIntensity: 0.2
    });

    this.instancedMesh = new THREE.InstancedMesh(
      geometry,
      material,
      this.entities.length
    );
    this.instancedMesh.castShadow = true;

    this.updateInstancedMesh();
  }

  /**
   * Updates the instanced mesh with current entity positions
   */
  private updateInstancedMesh(): void {
    if (!this.instancedMesh) return;

    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);

    this.entities.forEach((entity, index) => {
      const position = entity.getPosition();
      const velocity = entity.getVelocity();

      if (velocity.length() > 0.1) {
        const direction = velocity.clone().normalize();
        quaternion.setFromUnitVectors(up, direction);
      } else {
        quaternion.identity();
      }

      matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1));
      this.instancedMesh!.setMatrixAt(index, matrix);
    });

    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Finds entities within perception radius of a given position
   * Uses two-tier system: close neighbors + distant flock awareness
   */
  private findNearbyEntities(position: THREE.Vector3, excludeIndex: number): NearbyEntity[] {
    const allNearby: NearbyEntity[] = [];
    const closeNeighbors: NearbyEntity[] = [];
    const distantBirds: NearbyEntity[] = [];

    const closeRange = 20; // Close neighbors within 20m

    // Find all entities within perception radius
    for (let i = 0; i < this.entities.length; i++) {
      if (i === excludeIndex) continue;

      const otherEntity = this.entities[i];
      const otherPosition = otherEntity.getPosition();
      const distance = position.distanceTo(otherPosition);

      if (distance <= this.perceptionRadius) {
        const nearbyEntity = {
          position: otherPosition,
          velocity: otherEntity.getVelocity(),
          distance
        };

        if (distance <= closeRange) {
          closeNeighbors.push(nearbyEntity);
        } else {
          distantBirds.push(nearbyEntity);
        }
      }
    }

    // Sort both groups by distance
    closeNeighbors.sort((a, b) => a.distance - b.distance);
    distantBirds.sort((a, b) => a.distance - b.distance);

    // Take nearest 7 close neighbors (immediate flock-mates)
    const maxCloseNeighbors = Math.min(this.maxEntityPerception, 7);
    allNearby.push(...closeNeighbors.slice(0, maxCloseNeighbors));

    // Add distant birds up to total maxEntityPerception
    const remainingSlots = this.maxEntityPerception - allNearby.length;
    if (remainingSlots > 0) {
      allNearby.push(...distantBirds.slice(0, remainingSlots));
    }

    return allNearby;
  }

  /**
   * Gets terrain information ahead of the entity
   * This is a placeholder - implement based on your terrain system
   */
  private getTerrainAhead(_position: THREE.Vector3, _velocity: THREE.Vector3): TerrainInfo[] {
    const terrainInfo: TerrainInfo[] = [];
    const sampleCount = 5;

    // Future: use position, velocity to query actual terrain height and type
    // const sampleDistance = 10;
    // const direction = velocity.clone().normalize();
    // const samplePos = position.clone().add(direction.clone().multiplyScalar(i * sampleDistance));

    for (let i = 1; i <= sampleCount; i++) {
      terrainInfo.push({
        height: 0,
        type: 'field',
        normal: new THREE.Vector3(0, 1, 0)
      });
    }

    return terrainInfo;
  }

  /**
   * Updates all entities for the current frame
   */
  public update(deltaTime: number): void {
    this.entities.forEach((entity, index) => {
      const state = entity.getState();
      const nearbyEntities = this.findNearbyEntities(state.position, index);
      const terrainAhead = this.getTerrainAhead(state.position, state.velocity);

      const input: MovementInput = {
        currentState: state,
        nearbyEntities,
        terrainAhead,
        deltaTime
      };

      const output = this.movementFunction(input);

      entity.update(output.acceleration, deltaTime);

      if (output.shouldUpdateRandomVariables) {
        entity.updateRandomVariables(output.shouldUpdateRandomVariables);
      }
    });

    this.updateInstancedMesh();
  }

  /**
   * Adds the instanced mesh to the scene
   */
  public addToScene(scene: THREE.Scene): void {
    if (this.instancedMesh) {
      scene.add(this.instancedMesh);
    }
  }

  /**
   * Gets all entities
   */
  public getEntities(): Entity[] {
    return this.entities;
  }

  /**
   * Gets the count of entities
   */
  public getEntityCount(): number {
    return this.entities.length;
  }
}
