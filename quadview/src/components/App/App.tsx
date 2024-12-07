import React, { useRef } from "react";
import "@kitware/vtk.js/Rendering/Profiles/Geometry";

import useInitializeVtk from "../../hooks/use-initialize-vtk";
import useScanData from "../../hooks/use-scan-data";
import useLoadVtpFiles from "../../hooks/use-load-vtp-files";
import useLoadVtiFiles from "../../hooks/use-load-vti-files";
import { usePointCloudsStore } from "../../state/point-clouds";
import { useMeshesStore } from "../../state/meshes";

function App(): JSX.Element {
  // Define refs for all four viewports
  const axialViewRef = useRef<HTMLDivElement>(null);
  const sagittalViewRef = useRef<HTMLDivElement>(null);
  const coronalViewRef = useRef<HTMLDivElement>(null);
  const volumeViewRef = useRef<HTMLDivElement>(null);

  const {
    data: scanData,
    loading: scanLoading,
    error: scanError,
  } = useScanData();

  useInitializeVtk(volumeViewRef);

  const { volumeLoading, volumeError, boneMasksLoading, boneMasksError } =
    useLoadVtiFiles({
      vtiUrls: scanData?.vti,
    });

  const { loading: vtpLoading, error: vtpError } = useLoadVtpFiles({
    vtp: scanData?.vtp || {},
  });

  const pointClouds = usePointCloudsStore((state) => state.pointClouds);
  const meshes = useMeshesStore((state) => state.meshes);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        boxSizing: "border-box",
      }}
    >
      {/* Left Section: Viewports */}
      <div
        style={{
          width: "75%",
          height: "100%",
          position: "relative",
          paddingRight: "0.25rem",
          backgroundColor: "#303030", // Optional: Background color for contrast
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: "0.5rem",
            height: "100%",
          }}
        >
          {/* Axial View */}
          <div
            ref={axialViewRef}
            style={{
              border: "1px solid #000",
              position: "relative",
              width: "100%",
              height: "100%",
              backgroundColor: "#000",
            }}
          />

          {/* Sagittal View */}
          <div
            ref={sagittalViewRef}
            style={{
              border: "1px solid #000",
              position: "relative",
              width: "100%",
              height: "100%",
              backgroundColor: "#000",
            }}
          />

          {/* Coronal View */}
          <div
            ref={coronalViewRef}
            style={{
              border: "1px solid #000",
              position: "relative",
              width: "100%",
              height: "100%",
              backgroundColor: "#000",
            }}
          />

          {/* Volume View */}
          <div
            ref={volumeViewRef}
            style={{
              border: "1px solid #000",
              position: "relative",
              width: "100%",
              height: "100%",
              backgroundColor: "#000",
            }}
          />
        </div>
      </div>

      {/* Right Section: Side Panel */}
      <div
        style={{
          width: "400px",
          height: "100%",
          paddingLeft: "0.25rem",
          boxSizing: "border-box",
          backgroundColor: "#f0f0f0", // Optional: Background color for side panel
        }}
      >
        {/* Side Panel Content */}
        <div
          style={{
            borderRadius: "5px",
            height: "100%",
            overflow: "auto",
            padding: "20px",
            position: "relative",
          }}
        >
          <h2>Loaded Data</h2>
          <h3>Point Clouds</h3>
          <ul>
            {Object.keys(pointClouds).map((boneName) => (
              <li key={boneName}>{boneName}</li>
            ))}
          </ul>
          <h3>Meshes</h3>
          <ul>
            {Object.keys(meshes).map((boneName) => (
              <li key={boneName}>{boneName}</li>
            ))}
          </ul>
          {/* Add more controls or information as needed */}
        </div>

        {/* Loading Indicators */}
        {(scanLoading || volumeLoading || boneMasksLoading || vtpLoading) && (
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              zIndex: 1,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              padding: "10px",
              borderRadius: "5px",
            }}
          >
            Loading...
          </div>
        )}

        {/* Error Messages */}
        {(scanError || volumeError || boneMasksError || vtpError) && (
          <div
            style={{
              position: "absolute",
              top: 60,
              left: 20,
              color: "red",
              zIndex: 1,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              padding: "10px",
              borderRadius: "5px",
            }}
          >
            Error: {scanError || vtpError}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
