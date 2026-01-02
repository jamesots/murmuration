import { Simulation } from './scene/Simulation';
import { calculateMovement } from './entities/movementFunction.example';
import { SimulationConfig } from './types';
import './style.css';

/**
 * Main entry point for the 3D simulation
 */
function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element not found');
  }

  const config: SimulationConfig = {
    terrainSize: 1000,
    entityCount: 1000,
    entityPerceptionRadius: 100,
    maxEntityPerception: 30, // Increased from 7 to allow awareness of nearby flocks
  };

  const simulation = new Simulation(canvas, config, calculateMovement);

  simulation.start();

  const statsElement = document.getElementById('stats');
  if (statsElement) {
    setInterval(() => {
      const stats = simulation.getStats();
      statsElement.textContent = `FPS: ${stats.fps} | Entities: ${stats.entityCount}`;
    }, 100);
  }

  console.log('3D Simulation started');
  console.log(`Terrain size: ${config.terrainSize}m x ${config.terrainSize}m`);
  console.log(`Entity count: ${config.entityCount}`);
  console.log('Controls:');
  console.log('  - Right mouse button: Rotate camera');
  console.log('  - Scroll wheel: Zoom in/out');
  console.log('  - Middle mouse button: Pan camera');
}

main();
