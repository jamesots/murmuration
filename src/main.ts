import { Simulation } from './scene/Simulation';
import { calculateMovement, flockingParams } from './entities/movementFunction.example';
import { SimulationConfig } from './types';
import './style.css';

const STORAGE_KEY = 'murmuration-flocking-params';

/**
 * Load saved parameters from localStorage
 */
function loadSavedParameters(): void {
  const savedParams = localStorage.getItem(STORAGE_KEY);
  if (savedParams) {
    try {
      const parsed = JSON.parse(savedParams);
      Object.keys(parsed).forEach(key => {
        if (key in flockingParams) {
          (flockingParams as any)[key] = parsed[key];
        }
      });
    } catch (e) {
      console.error('Failed to load saved parameters:', e);
    }
  }
}

/**
 * Save parameters to localStorage
 */
function saveParameters(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flockingParams));
  } catch (e) {
    console.error('Failed to save parameters:', e);
  }
}

/**
 * Setup slider event listeners to update flocking parameters
 */
function setupSliders(simulation: Simulation) {
  const sliderIds: (keyof typeof flockingParams)[] = [
    'perceptionRadius',
    'maxEntityPerception',
    'separationDistance',
    'separationStrength',
    'alignmentStrength',
    'cohesionStrength',
    'longRangeStrength',
    'minHeight',
    'maxHeight',
    'targetHeight',
    'forwardSpeed',
    'boundaryTurnStrength'
  ];

  sliderIds.forEach(id => {
    const slider = document.getElementById(id) as HTMLInputElement;
    const valueDisplay = document.getElementById(`${id}-value`);

    if (slider && valueDisplay) {
      // Set initial value from loaded parameters
      const initialValue = flockingParams[id];
      slider.value = initialValue.toString();
      valueDisplay.textContent = initialValue.toString();

      slider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        valueDisplay.textContent = value.toString();

        // Update the flocking parameters
        flockingParams[id] = value;

        // Save to localStorage
        saveParameters();

        // Update EntityManager perception settings
        if (id === 'perceptionRadius') {
          simulation.getEntityManager().setPerceptionRadius(value);
        } else if (id === 'maxEntityPerception') {
          simulation.getEntityManager().setMaxEntityPerception(value);
        }
      });
    }
  });
}

/**
 * Main entry point for the 3D simulation
 */
function main() {
  // Load saved parameters from localStorage
  loadSavedParameters();

  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element not found');
  }

  const config: SimulationConfig = {
    terrainSize: 1000,
    entityCount: 1000,
    entityPerceptionRadius: flockingParams.perceptionRadius,
    maxEntityPerception: flockingParams.maxEntityPerception,
  };

  const simulation = new Simulation(canvas, config, calculateMovement);

  simulation.start();

  // Setup parameter sliders
  setupSliders(simulation);

  // Setup randomize button
  const randomizeButton = document.getElementById('randomize-birds');
  if (randomizeButton) {
    randomizeButton.addEventListener('click', () => {
      simulation.getEntityManager().randomizeEntities();
    });
  }

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
