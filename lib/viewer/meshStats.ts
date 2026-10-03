import * as THREE from "three";

export type ModelMeshStats = {
  vertices: number;
  faces: number;
  topology: string;
  isWatertight: boolean;
  meshCount: number;
  edgeCount?: number;
};

export function calculateMeshStats(root: THREE.Object3D): ModelMeshStats {
  const acc = {
    vertices: 0,
    faces: 0,
    meshCount: 0,
    boundaryEdges: 0,
    nonManifoldEdges: 0,
    totalEdgesChecked: 0,
  };

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return;
    }
    const geom = child.geometry;
    if (!geom) {
      return;
    }

    acc.meshCount += 1;

    const pos = geom.attributes.position;
    if (!pos) {
      return;
    }
    acc.vertices += pos.count;

    const index = geom.index;
    const triangleCount = index
      ? Math.floor(index.count / 3)
      : Math.floor(pos.count / 3);
    acc.faces += triangleCount;

    // Topology edge analysis if within reasonable size (< 250,000 triangles)
    if (triangleCount > 0 && triangleCount <= 250000) {
      const edgeMap = new Map<string, number>();

      const getIdx = (vertexOffset: number): string => {
        if (index) {
          return String(index.getX(vertexOffset));
        }
        const x = Math.round(pos.getX(vertexOffset) * 1000);
        const y = Math.round(pos.getY(vertexOffset) * 1000);
        const z = Math.round(pos.getZ(vertexOffset) * 1000);
        return `${x},${y},${z}`;
      };

      const loop = { t: 0 };
      while (loop.t < triangleCount) {
        const i0 = getIdx(loop.t * 3);
        const i1 = getIdx(loop.t * 3 + 1);
        const i2 = getIdx(loop.t * 3 + 2);

        const addEdge = (a: string, b: string) => {
          const key = a < b ? `${a}_${b}` : `${b}_${a}`;
          const currentCount = edgeMap.get(key) ?? 0;
          edgeMap.set(key, currentCount + 1);
        };

        addEdge(i0, i1);
        addEdge(i1, i2);
        addEdge(i2, i0);

        loop.t += 1;
      }

      edgeMap.forEach((count) => {
        acc.totalEdgesChecked += 1;
        if (count === 1) {
          acc.boundaryEdges += 1;
        } else if (count > 2) {
          acc.nonManifoldEdges += 1;
        }
      });
    }
  });

  const isWatertight =
    acc.faces > 0 &&
    acc.totalEdgesChecked > 0 &&
    acc.boundaryEdges === 0 &&
    acc.nonManifoldEdges === 0;

  const topology = isWatertight ? "Watertight Triangles" : "Triangles";

  return {
    vertices: acc.vertices,
    faces: acc.faces,
    topology,
    isWatertight,
    meshCount: acc.meshCount,
    edgeCount: acc.totalEdgesChecked,
  };
}

export function formatStatCount(num: number): string {
  return num.toLocaleString();
}
