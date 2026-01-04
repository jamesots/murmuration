import * as THREE from 'three';
import { MovementInput, MovementOutput } from '../types';

/**
 * Flocking behavior parameters that can be adjusted via UI
 */
export const flockingParams = {
  // Perception settings
  perceptionRadius: 100,
  maxEntityPerception: 30,

  // Flocking behavior strengths
  separationDistance: 3,
  separationStrength: 15,
  alignmentStrength: 1.5,
  cohesionStrength: 1.2,
  longRangeStrength: 5,

  // Height constraints
  minHeight: 0,
  maxHeight: 100,
  targetHeight: 50,

  // Movement
  forwardSpeed: 5,
  boundaryTurnStrength: 20,
};

/**
 * Example movement function implementing basic flocking behavior
 *
 * This demonstrates:
 * - Separation: Avoid crowding neighbors
 * - Alignment: Steer towards average heading of neighbors
 * - Cohesion: Steer towards average position of neighbors
 * - Height maintenance: Stay within a certain altitude range
 */
export function calculateMovement(input: MovementInput): MovementOutput {
  const acceleration = new THREE.Vector3(0, 0, 0);

  const { currentState, nearbyEntities } = input;
  const { position, velocity } = currentState;

  // === Separation: Avoid nearby entities ===
  // Only avoid very close neighbors to prevent collisions
  const separationForce = new THREE.Vector3(0, 0, 0);

  nearbyEntities.forEach(nearby => {
    if (nearby.distance < flockingParams.separationDistance && nearby.distance > 0) {
      const away = position.clone().sub(nearby.position);
      away.normalize();
      away.divideScalar(nearby.distance); // Stronger force when closer
      separationForce.add(away);
    }
  });

  if (separationForce.length() > 0) {
    separationForce.normalize().multiplyScalar(flockingParams.separationStrength);
    acceleration.add(separationForce);
  }

  // === Alignment: Match velocity with neighbors (distance-weighted) ===
  if (nearbyEntities.length > 0) {
    const averageVelocity = new THREE.Vector3(0, 0, 0);
    let totalWeight = 0;

    nearbyEntities.forEach(nearby => {
      // Weight by inverse distance - closer birds have more influence
      const weight = 1 / (nearby.distance + 1);
      averageVelocity.add(nearby.velocity.clone().multiplyScalar(weight));
      totalWeight += weight;
    });

    if (totalWeight > 0) {
      averageVelocity.divideScalar(totalWeight);
      const alignmentForce = averageVelocity.sub(velocity).multiplyScalar(flockingParams.alignmentStrength);
      acceleration.add(alignmentForce);
    }
  }

  // === Cohesion: Move towards center of nearby entities (distance-weighted) ===
  if (nearbyEntities.length > 0) {
    const centerOfMass = new THREE.Vector3(0, 0, 0);
    let totalWeight = 0;

    nearbyEntities.forEach(nearby => {
      // Weight by inverse distance - closer birds have more influence
      const weight = 1 / (nearby.distance + 1);
      centerOfMass.add(nearby.position.clone().multiplyScalar(weight));
      totalWeight += weight;
    });

    if (totalWeight > 0) {
      centerOfMass.divideScalar(totalWeight);
      const cohesionForce = centerOfMass.sub(position).multiplyScalar(flockingParams.cohesionStrength);
      acceleration.add(cohesionForce);
    }
  }

  // === Long-range attraction: Pull towards distant birds to merge flocks ===
  if (nearbyEntities.length > 0) {
    const longRangeForce = new THREE.Vector3(0, 0, 0);

    nearbyEntities.forEach(nearby => {
      // Only consider birds that are medium-to-far distance (20-80m)
      // These are likely in other flocks
      if (nearby.distance > 20 && nearby.distance < 80) {
        const attraction = nearby.position.clone().sub(position);
        // Normalize and scale by distance - pull harder toward mid-range birds
        const strength = (80 - nearby.distance) / 60; // 0 to 1
        attraction.normalize().multiplyScalar(strength * flockingParams.longRangeStrength);
        longRangeForce.add(attraction);
      }
    });

    acceleration.add(longRangeForce);
  }

  // === Height Maintenance: Stay between 20m and 100m ===
  // This needs to be STRONG to prevent going underground
  const groundBuffer = 5; // Start pulling up when within 5m of minimum

  if (position.y < flockingParams.minHeight + groundBuffer) {
    // Panic mode: very strong upward force when near ground
    // Scale force based on how close to ground (closer = stronger)
    const distanceFromMin = position.y - flockingParams.minHeight;
    const urgency = Math.max(0, 1 - (distanceFromMin / groundBuffer));
    const strongUpwardForce = 50 + urgency * 100; // 50-150 m/s² upward

    acceleration.add(new THREE.Vector3(0, strongUpwardForce, 0));

    // Also kill any downward velocity
    if (velocity.y < 0) {
      acceleration.add(new THREE.Vector3(0, -velocity.y * 5, 0));
    }
  } else if (position.y > flockingParams.maxHeight) {
    acceleration.add(new THREE.Vector3(0, -10, 0));
  } else if (Math.abs(position.y - flockingParams.targetHeight) > 5) {
    const heightCorrection = (flockingParams.targetHeight - position.y) * 0.5;
    acceleration.add(new THREE.Vector3(0, heightCorrection, 0));
  }

  // === Forward Movement: Maintain some forward speed ===
  if (velocity.length() < 10) {
    const currentDirection = velocity.length() > 0
      ? velocity.clone().normalize()
      : new THREE.Vector3(1, 0, 0);

    acceleration.add(currentDirection.multiplyScalar(flockingParams.forwardSpeed));
  }

  // === Boundary Avoidance: Gentle turn away from terrain edges ===
  const boundaryDistance = 100; // Start turning when 100m from edge
  const terrainSize = 1000;
  const halfSize = terrainSize / 2;

  // Calculate distance from center to edge on each axis
  const distanceFromEdgeX = halfSize - Math.abs(position.x);
  const distanceFromEdgeZ = halfSize - Math.abs(position.z);

  // Apply gradual turning force that increases as we get closer to edge
  if (distanceFromEdgeX < boundaryDistance) {
    const urgency = 1 - (distanceFromEdgeX / boundaryDistance);
    const turnForce = (position.x > 0 ? -1 : 1) * urgency * flockingParams.boundaryTurnStrength;
    acceleration.add(new THREE.Vector3(turnForce, 0, 0));
  }

  if (distanceFromEdgeZ < boundaryDistance) {
    const urgency = 1 - (distanceFromEdgeZ / boundaryDistance);
    const turnForce = (position.z > 0 ? -1 : 1) * urgency * flockingParams.boundaryTurnStrength;
    acceleration.add(new THREE.Vector3(0, 0, turnForce));
  }

  // Optional: Update random variables periodically
  const shouldUpdateRandomVariables = Math.random() < 0.01
    ? new Map([
        ['randomTurn', (Math.random() - 0.5) * 2],
        ['randomSpeed', Math.random()]
      ])
    : undefined;

  return {
    acceleration,
    shouldUpdateRandomVariables
  };
}
