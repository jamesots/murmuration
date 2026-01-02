import * as THREE from 'three';
import { MovementInput, MovementOutput } from '../types';

/**
 * Calculate entity movement based on current state, nearby entities, and terrain
 *
 * This is the function you will implement to control how entities move.
 *
 * @param input - Contains:
 *   - currentState: The entity's current position, velocity, and random variables
 *   - nearbyEntities: Array of nearby entities with their position, velocity, and distance
 *   - terrainAhead: Array of terrain samples in front of the entity
 *   - deltaTime: Time elapsed since last frame (in seconds)
 *
 * @returns MovementOutput with:
 *   - acceleration: A THREE.Vector3 representing the acceleration to apply
 *   - shouldUpdateRandomVariables: Optional Map of random variable updates
 *
 * Example implementation (simple forward movement with collision avoidance):
 *
 * const acceleration = new THREE.Vector3(0, 0, 0);
 *
 * // Apply forward force
 * if (input.currentState.velocity.length() < 20) {
 *   acceleration.add(new THREE.Vector3(0, 0, -5));
 * }
 *
 * // Avoid nearby entities
 * input.nearbyEntities.forEach(nearby => {
 *   if (nearby.distance < 10) {
 *     const avoidance = input.currentState.position.clone()
 *       .sub(nearby.position)
 *       .normalize()
 *       .multiplyScalar(20 / nearby.distance);
 *     acceleration.add(avoidance);
 *   }
 * });
 *
 * return { acceleration };
 */
export function calculateMovement(_input: MovementInput): MovementOutput {
  // TODO: Implement your movement logic here

  const acceleration = new THREE.Vector3(0, 0, 0);

  // Your code here
  // Example access to input data:
  // const position = _input.currentState.position;
  // const velocity = _input.currentState.velocity;
  // const nearby = _input.nearbyEntities;

  return {
    acceleration,
    // shouldUpdateRandomVariables: new Map([['example', Math.random()]])
  };
}
