// hooks/useLoadVtpFiles.ts

import { useEffect, useState } from "react";
import { loadVTP } from "../utils/load-vtp"; // Adjust the path as necessary
import { usePointCloudsStore } from "../state/point-clouds";
import { useMeshesStore } from "../state/meshes";
import { getViewports, useViewportsStore } from "../state/viewports";

interface BoneUrls {
  pointCloudUrl: string;
  meshUrl: string;
}

interface LoadedMesh {
  id: string;
  color: [number, number, number];
  actor: any; // Replace with appropriate type
  polyData: any; // Replace with appropriate type
  mapper: any; // Replace with appropriate type
}

interface LoadedPointCloud {
  id: string;
  color: [number, number, number];
  actor: any; // Replace with appropriate type
  polyData: any; // Replace with appropriate type
  mapper: any; // Replace with appropriate type
}

const useLoadVtpFiles = ({ vtp }: { vtp: Record<string, BoneUrls> }) => {
  const { centerCamera, isVtkInitialized } = useViewportsStore.getState();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const setPointCloud = usePointCloudsStore((state) => state.setPointCloud);
  const setMesh = useMeshesStore((state) => state.setMesh);

  useEffect(() => {
    // Early return if VTK is not initialized or vtp data is missing
    if (!isVtkInitialized || !vtp) return;

    const loadFiles = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load Point Clouds
        const loadedPointClouds: LoadedPointCloud[] = await Promise.all(
          Object.entries(vtp).map(async ([boneName, urls]) => {
            const vtp = await loadVTP(urls.pointCloudUrl);
            const { actor, polyData, mapper } = vtp;

            // Set initial position if necessary
            actor.setPosition(0, 0, 0);
            const color: [number, number, number] = [1, 0, 0]; // Red color for point clouds

            const pointCloud = {
              id: boneName, // Use bone name as ID
              color,
              actor,
              polyData,
              mapper,
            };

            // Optional: Naming for debugging
            actor.set({ name: `pointcloud_${boneName}` });

            const { volume } = getViewports();
            if (!volume.renderer) {
              console.log({ volume });
              throw new Error("Renderer not found.");
            }
            volume.renderer.addActor(actor);

            return pointCloud;
          })
        );

        // Load Meshes
        const loadedMeshes: LoadedMesh[] = await Promise.all(
          Object.entries(vtp).map(async ([boneName, urls]) => {
            const vtp = await loadVTP(urls.meshUrl);
            const { actor, polyData, mapper } = vtp;

            // Set initial position if necessary
            actor.setPosition(0, 0, 0);

            const color: [number, number, number] = [0, 1, 0]; // Green color for meshes
            const mesh = {
              id: boneName, // Use bone name as ID
              color,
              actor,
              polyData,
              mapper,
            };

            // Optional: Naming for debugging
            actor.set({ name: `mesh_${boneName}` });

            const { volume } = getViewports();
            if (!volume.renderer) {
              throw new Error("Renderer not found.");
            }
            volume.renderer.addActor(actor);

            return mesh;
          })
        );

        // Update Global State
        loadedPointClouds.forEach((pc) => setPointCloud(pc));
        loadedMeshes.forEach((mesh) => setMesh(mesh));

        // Center the camera based on all loaded actors
        const allActors = [
          ...loadedPointClouds.map((pc) => pc.actor),
          ...loadedMeshes.map((mesh) => mesh.actor),
        ];

        // Compute Combined Bounds
        let bounds: [number, number, number, number, number, number] = [
          Infinity,
          -Infinity,
          Infinity,
          -Infinity,
          Infinity,
          -Infinity,
        ];

        allActors.forEach((actor) => {
          const actorBounds = actor.getBounds();
          if (!actorBounds) return;
          bounds[0] = Math.min(bounds[0], actorBounds[0]); // minX
          bounds[1] = Math.max(bounds[1], actorBounds[1]); // maxX
          bounds[2] = Math.min(bounds[2], actorBounds[2]); // minY
          bounds[3] = Math.max(bounds[3], actorBounds[3]); // maxY
          bounds[4] = Math.min(bounds[4], actorBounds[4]); // minZ
          bounds[5] = Math.max(bounds[5], actorBounds[5]); // maxZ
        });

        console.log("Computed Bounds:", bounds);

        if (!centerCamera) {
          throw new Error("centerCamera function not found.");
        }

        centerCamera(bounds);

        const { volume } = getViewports();
        volume.render();
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load VTP files.");
      } finally {
        setLoading(false);
      }
    };

    // Ensure there is at least one bone to load
    if (Object.keys(vtp).length > 0) {
      loadFiles();
    }
  }, [vtp, isVtkInitialized, setPointCloud, setMesh, centerCamera]);

  return { loading, error };
};

export default useLoadVtpFiles;
