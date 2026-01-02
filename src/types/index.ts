import * as THREE from 'three';

/**
 * Represents the state of a single entity
 */
export interface EntityState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  randomVariables: Map<string, number>;
}

/**
 * Information about nearby entities
 */
export interface NearbyEntity {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  distance: number;
}

/**
 * Terrain information at a specific location
 */
export interface TerrainInfo {
  height: number;
  type: 'field' | 'lake' | 'hedgerow' | 'tree';
  normal: THREE.Vector3;
}

/**
 * Input data for entity movement calculation
 */
export interface MovementInput {
  currentState: EntityState;
  nearbyEntities: NearbyEntity[];
  terrainAhead: TerrainInfo[];
  deltaTime: number;
}

/**
 * Output from entity movement calculation
 */
export interface MovementOutput {
  acceleration: THREE.Vector3;
  shouldUpdateRandomVariables?: Map<string, number>;
}

/**
 * Configuration for the simulation
 */
export interface SimulationConfig {
  terrainSize: number;
  entityCount: number;
  entityPerceptionRadius: number;
  maxEntityPerception: number;
}
