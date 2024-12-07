// App.tsx
import React, { Component, ReactNode, useEffect, useState } from "react";
import VTKViewer from "../VTKViewer"; // Ensure the correct path
import vtkXMLImageDataReader from "@kitware/vtk.js/IO/XML/XMLImageDataReader";
import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";
import vtkMapper from "@kitware/vtk.js/Rendering/Core/Mapper";
import { vtkPolyData } from "@kitware/vtk.js/Common/DataModel/PolyData";

import { useVolumeStore } from "../state/volume";
import { useBoneMasksStore } from "../state/bone-masks";
import { usePointCloudsStore } from "../state/point-clouds";
import { useMeshesStore } from "../state/meshes";
import { loadVTP } from "../../utils/load-vtp"; // Ensure the correct path

// ErrorBoundary Component
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

// App Component
const App: React.FC = () => {
  const { volume, setVolume } = useVolumeStore.getState();
  const { boneMasks, setBoneMasks } = useBoneMasksStore.getState();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch and parse VTI files
  const fetchVTIData = async (url: string): Promise<any> => {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/xml",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const reader = vtkXMLImageDataReader.newInstance();
    reader.parseAsArrayBuffer(arrayBuffer);
    const data = reader.getOutputData();

    return data;
  };

  const handleLoadVTP = async () => {
    setLoading(true);
    setError(null);
    try {
      const meshUrls = [
        "/femur_mesh.vtp",
        "/tibia_mesh.vtp",
        "/patella_mesh.vtp",
        "/fibula_mesh.vtp",
      ];
      const pointCloudUrls = [
        "/femur_pointcloud.vtp",
        "/tibia_pointcloud.vtp",
        "/patella_pointcloud.vtp",
        "/fibula_pointcloud.vtp",
      ];
      const meshes = await Promise.all(
        meshUrls.map(async (url, index) => {
          const vtp = await loadVTP(url);
          const { actor } = vtp;
          const id = `bone_${index + 1}`;
          actor.set({ name: id }); // Assign custom properties
          const color: [number, number, number] = [1, 0, 0];
          return { ...vtp, id, color };
        })
      );

      const pointClouds = await Promise.all(
        pointCloudUrls.map(async (url, index) => {
          const vtp = await loadVTP(url);
          const { actor } = vtp;
          const id = `bone_${index + 1}`;
          actor.set({ name: id }); // Assign custom properties
          const color: [number, number, number] = [1, 0, 0];
          return { ...vtp, id, color };
        })
      );

      const { setPointClouds } = usePointCloudsStore.getState();
      setPointClouds(pointClouds);
      const { setMeshes } = useMeshesStore.getState();
      setMeshes(meshes);

      console.log({ meshes, pointClouds });
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Fetch main volume data and segmentation mask in parallel
        const [volumeImage, boneMasks] = await Promise.all([
          fetchVTIData("/dicom_image.vti"),
          fetchVTIData("/segmentation_mask.vti"),
        ]);

        await handleLoadVTP();

        if (isMounted) {
          setVolume(volumeImage);
          setBoneMasks(boneMasks);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Error fetching VTI data:", err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          width: "100vw",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f0f0f0",
        }}
      >
        <h2>Loading data...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          width: "100vw",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f8d7da",
          color: "#721c24",
        }}
      >
        <h2>Error: {error}</h2>
      </div>
    );
  }

  return (
    <div>
      <ErrorBoundary>
        {volume && boneMasks && <VTKViewer />}
        {!volume || !boneMasks ? (
          <div
            style={{
              display: "flex",
              height: "100vh",
              width: "100vw",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#f0f0f0",
            }}
          >
            <h2>No Data Available</h2>
          </div>
        ) : null}
      </ErrorBoundary>
    </div>
  );
};

export default App;
