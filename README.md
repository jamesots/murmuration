# 3D Fly Simulation

A TypeScript-based 3D simulation environment where entities can fly around a 1km² landscape with fields, lakes, hedgerows, and trees.

## Features

- **1km × 1km terrain** with procedurally generated features:
  - Fields with varying colors
  - Small lakes
  - Hedgerows
  - Trees (using instanced meshes for performance)

- **Flying entities system** optimized for thousands of entities:
  - Instanced rendering for high performance
  - Customizable movement behavior
  - Perception system to detect nearby entities
  - Random variables per entity

- **Interactive camera controls**:
  - **Right mouse button**: Rotate camera around the scene
  - **Scroll wheel**: Zoom in/out
  - **Middle mouse button**: Pan camera up/down/left/right

## Getting Started

### Installation

```bash
pnpm install
```

### Development

Start the development server:

```bash
pnpm run dev
```

Then open your browser to the URL shown (typically `http://localhost:5173`).

### Build

Build for production:

```bash
pnpm run build
```

Preview the production build:

```bash
pnpm run preview
```

## Project Structure

```
src/
├── types/              # TypeScript type definitions
│   └── index.ts        # Core interfaces (EntityState, MovementInput, etc.)
├── terrain/            # Terrain generation
│   └── TerrainGenerator.ts
├── entities/           # Entity system
│   ├── Entity.ts       # Individual entity class
│   ├── EntityManager.ts # Manages all entities
│   └── movementFunction.ts # YOUR MOVEMENT LOGIC GOES HERE
├── camera/             # Camera controls
│   └── CameraController.ts
├── scene/              # Scene setup and rendering
│   └── Simulation.ts
├── main.ts             # Application entry point
└── style.css           # Styles
```

## Implementing Movement Logic

The key file you'll work with is [src/entities/movementFunction.ts](src/entities/movementFunction.ts).

This function receives:
- **currentState**: Entity's position, velocity, and random variables
- **nearbyEntities**: Array of nearby entities with their positions and velocities
- **terrainAhead**: Array of terrain samples in the direction of movement
- **deltaTime**: Time elapsed since last frame

It should return:
- **acceleration**: A `THREE.Vector3` representing the acceleration to apply
- **shouldUpdateRandomVariables** (optional): Map of random variable updates

### Example Implementation

```typescript
export function calculateMovement(input: MovementInput): MovementOutput {
  const acceleration = new THREE.Vector3(0, 0, 0);

  // Maintain forward movement
  if (input.currentState.velocity.length() < 20) {
    acceleration.add(new THREE.Vector3(0, 0, -5));
  }

  // Avoid nearby entities
  input.nearbyEntities.forEach(nearby => {
    if (nearby.distance < 10) {
      const avoidance = input.currentState.position.clone()
        .sub(nearby.position)
        .normalize()
        .multiplyScalar(20 / nearby.distance);
      acceleration.add(avoidance);
    }
  });

  return { acceleration };
}
```

## Configuration

Edit [src/main.ts](src/main.ts#L14-L18) to adjust simulation parameters:

```typescript
const config: SimulationConfig = {
  terrainSize: 1000,              // Size of terrain (meters)
  entityCount: 100,               // Number of flying entities
  entityPerceptionRadius: 50      // How far entities can "see"
};
```

For thousands of entities, increase `entityCount`. The system uses instanced rendering for efficient performance.

## Performance Optimization

The project is designed to handle several thousand entities:

- **Instanced rendering**: All entities share a single mesh instance
- **Spatial optimization**: Only nearby entities are considered for movement
- **Delta time clamping**: Prevents physics issues during lag spikes

## Technologies Used

- **Three.js**: 3D rendering engine
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server

## Controls Reference

| Control | Action |
|---------|--------|
| Right Mouse Button | Rotate camera |
| Scroll Wheel | Zoom in/out |
| Middle Mouse Button | Pan camera |

## License

ISC
