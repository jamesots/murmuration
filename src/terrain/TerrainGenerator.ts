import * as THREE from 'three';

export interface TerrainFeature {
  type: 'field' | 'lake' | 'hedgerow' | 'tree';
  position: THREE.Vector3;
  mesh: THREE.Mesh | THREE.InstancedMesh;
}

/**
 * Generates and manages the terrain for the simulation
 */
export class TerrainGenerator {
  private terrainSize: number;
  private features: TerrainFeature[] = [];
  private groundMesh: THREE.Mesh;

  constructor(terrainSize: number = 1000) {
    this.terrainSize = terrainSize;
    this.groundMesh = this.createGround();
  }

  /**
   * Creates the base ground plane
   */
  private createGround(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.terrainSize, this.terrainSize, 50, 50);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3a5f0b,
      roughness: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;

    return mesh;
  }

  /**
   * Generates fields across the terrain
   */
  private generateFields(): void {
    const fieldCount = 15;

    for (let i = 0; i < fieldCount; i++) {
      const size = 50 + Math.random() * 100;
      const x = (Math.random() - 0.5) * (this.terrainSize - size);
      const z = (Math.random() - 0.5) * (this.terrainSize - size);

      const geometry = new THREE.PlaneGeometry(size, size);
      const hue = 0.15 + Math.random() * 0.1;
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(hue, 0.5, 0.4)
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.1, z);
      mesh.receiveShadow = true;

      this.features.push({
        type: 'field',
        position: new THREE.Vector3(x, 0, z),
        mesh
      });
    }
  }

  /**
   * Generates small lakes
   */
  private generateLakes(): void {
    const lakeCount = 5;

    for (let i = 0; i < lakeCount; i++) {
      const radius = 20 + Math.random() * 30;
      const x = (Math.random() - 0.5) * (this.terrainSize - radius * 2);
      const z = (Math.random() - 0.5) * (this.terrainSize - radius * 2);

      const geometry = new THREE.CircleGeometry(radius, 32);
      const material = new THREE.MeshStandardMaterial({
        color: 0x2a5f8f,
        roughness: 0.1,
        metalness: 0.3
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.2, z);

      this.features.push({
        type: 'lake',
        position: new THREE.Vector3(x, 0, z),
        mesh
      });
    }
  }

  /**
   * Generates hedgerows using instanced meshes for performance
   */
  private generateHedgerows(): void {
    const hedgerowCount = 10;
    const segmentsPerHedgerow = 20;

    const geometry = new THREE.BoxGeometry(2, 3, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0x1a3f0a });

    const instancedMesh = new THREE.InstancedMesh(
      geometry,
      material,
      hedgerowCount * segmentsPerHedgerow
    );
    instancedMesh.castShadow = true;

    const matrix = new THREE.Matrix4();
    let index = 0;

    for (let i = 0; i < hedgerowCount; i++) {
      const startX = (Math.random() - 0.5) * this.terrainSize * 0.8;
      const startZ = (Math.random() - 0.5) * this.terrainSize * 0.8;
      const angle = Math.random() * Math.PI * 2;
      const length = 50 + Math.random() * 100;

      for (let j = 0; j < segmentsPerHedgerow; j++) {
        const t = j / segmentsPerHedgerow;
        const x = startX + Math.cos(angle) * length * t;
        const z = startZ + Math.sin(angle) * length * t;

        matrix.setPosition(x, 1.5, z);
        instancedMesh.setMatrixAt(index++, matrix);
      }
    }

    instancedMesh.instanceMatrix.needsUpdate = true;

    this.features.push({
      type: 'hedgerow',
      position: new THREE.Vector3(0, 0, 0),
      mesh: instancedMesh
    });
  }

  /**
   * Generates trees using instanced meshes for performance
   */
  private generateTrees(): void {
    const treeCount = 200;

    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
    const foliageGeometry = new THREE.SphereGeometry(3, 8, 8);

    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3520 });
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016 });

    const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, treeCount);
    const foliage = new THREE.InstancedMesh(foliageGeometry, foliageMaterial, treeCount);

    trunks.castShadow = true;
    foliage.castShadow = true;

    const trunkMatrix = new THREE.Matrix4();
    const foliageMatrix = new THREE.Matrix4();

    for (let i = 0; i < treeCount; i++) {
      const x = (Math.random() - 0.5) * this.terrainSize * 0.9;
      const z = (Math.random() - 0.5) * this.terrainSize * 0.9;

      trunkMatrix.setPosition(x, 2, z);
      foliageMatrix.setPosition(x, 5, z);

      trunks.setMatrixAt(i, trunkMatrix);
      foliage.setMatrixAt(i, foliageMatrix);
    }

    trunks.instanceMatrix.needsUpdate = true;
    foliage.instanceMatrix.needsUpdate = true;

    this.features.push({
      type: 'tree',
      position: new THREE.Vector3(0, 0, 0),
      mesh: trunks
    });

    this.features.push({
      type: 'tree',
      position: new THREE.Vector3(0, 0, 0),
      mesh: foliage
    });
  }

  /**
   * Generates all terrain features
   */
  public generate(): void {
    this.generateFields();
    this.generateLakes();
    this.generateHedgerows();
    this.generateTrees();
  }

  /**
   * Adds all terrain meshes to a scene
   */
  public addToScene(scene: THREE.Scene): void {
    scene.add(this.groundMesh);
    this.features.forEach(feature => scene.add(feature.mesh));
  }

  /**
   * Gets terrain height at a specific x, z location
   */
  public getHeightAt(_x: number, _z: number): number {
    // Future: implement terrain height lookup
    return 0;
  }

  /**
   * Gets terrain type at a specific location
   */
  public getTerrainTypeAt(_x: number, _z: number): 'field' | 'lake' | 'hedgerow' | 'tree' | 'ground' {
    // Future: implement terrain type lookup
    return 'ground';
  }
}
