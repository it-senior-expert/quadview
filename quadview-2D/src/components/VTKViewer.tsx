import React, { useEffect, useRef, useState } from "react";

import "@kitware/vtk.js/favicon";
import "@kitware/vtk.js/Rendering/Profiles/Volume";
import "@kitware/vtk.js/Rendering/Misc/RenderingAPIs";
import vtkImageSlice from "@kitware/vtk.js/Rendering/Core/ImageSlice";
import vtkImageMapper from "@kitware/vtk.js/Rendering/Core/ImageMapper";
import vtkRenderWindow from "@kitware/vtk.js/Rendering/Core/RenderWindow";
import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";

import { createQuadView, initializeVtk } from "./initialize-vtk";
import { useViewportsStore } from "./state/viewports";
import { usePointCloudsStore } from "./state/point-clouds";
import { useMeshesStore } from "./state/meshes";
import { useVolumeStore } from "./state/volume";
import { useBoneMasksStore } from "./state/bone-masks";

// Define labels and their associated colors
const labels = [
  { id: 1, name: "Bone 1", color: [1, 0, 0] }, // Red
  { id: 2, name: "Bone 2", color: [0, 1, 0] }, // Green
  { id: 3, name: "Bone 3", color: [0, 0, 1] }, // Blue
  { id: 4, name: "Bone 4", color: [1, 1, 0] }, // Yellow
];

const VTKViewer = () => {
  // Refs for each viewport container
  const sagittalViewRef = useRef<HTMLDivElement>(null);
  const coronalViewRef = useRef<HTMLDivElement>(null);
  const axialViewRef = useRef<HTMLDivElement>(null);
  const volumeViewRef = useRef<HTMLDivElement>(null);

  const { volume: imageData } = useVolumeStore.getState();
  const { boneMasks: segmentationData } = useBoneMasksStore.getState();

  const { viewports } = useViewportsStore.getState();

  const [imageExtent, setImageExtent] = useState<number[]>([
    0, 100, 0, 100, 0, 100,
  ]);
  const [currentSlices, setCurrentSlices] = useState({
    sagittal: 30,
    coronal: 30,
    axial: 30,
  });

  // Update ref types to allow undefined instead of null
  const sliceActorsByViewRef = useRef<{
    sagittal?: vtkImageSlice;
    coronal?: vtkImageSlice;
    axial?: vtkImageSlice;
  }>({});

  const segmentationActorsByLabelRef = useRef<{
    [labelId: number]: {
      sagittal?: vtkImageSlice;
      coronal?: vtkImageSlice;
      axial?: vtkImageSlice;
    };
  }>({
    1: {},
    2: {},
    3: {},
    4: {},
  });

  // Ref to store slice and extent for handlers
  const currentSlicesRef = useRef(currentSlices);
  currentSlicesRef.current = currentSlices;

  const imageExtentRef = useRef(imageExtent);
  imageExtentRef.current = imageExtent;

  const [segmentationLabelVisibility, setSegmentationLabelVisibility] =
    useState<{
      [labelId: number]: boolean;
    }>({
      1: true,
      2: true,
      3: true,
      4: true,
    });

  // Ref to store slice3DActors with optional properties
  const volumeSliceActorsRef = useRef<{
    sagittal?: vtkImageSlice;
    coronal?: vtkImageSlice;
    axial?: vtkImageSlice;
  }>({});

  // New State for 3D Slice Visibility
  const [slice3DVisibility, setSlice3DVisibility] = useState<{
    sagittal: boolean;
    coronal: boolean;
    axial: boolean;
  }>({
    sagittal: true,
    coronal: true,
    axial: true,
  });

  // Handler for slice changes
  const handleSliceChange = (
    view: "sagittal" | "coronal" | "axial",
    value: number
  ) => {
    const actor = sliceActorsByViewRef.current[view];
    if (actor) {
      const mapper = actor.getMapper() as vtkImageMapper;
      mapper.setSlice(value); // Only one argument

      const renderer = viewports[view].renderer;
      const renderWindow = viewports[view].renderWindow;

      if (renderer && renderWindow) {
        renderer.resetCameraClippingRange();
        renderer.resetCamera();
        renderWindow.render();
      }

      setCurrentSlices((prev) => ({ ...prev, [view]: value }));
    }

    // Update segmentation slices if exists
    labels.forEach((label) => {
      const segActor = segmentationActorsByLabelRef.current[label.id][view];
      if (segActor) {
        const mapper = segActor.getMapper() as vtkImageMapper;
        mapper.setSlice(value);
        // Render all relevant render windows
        viewports.sagittal.render();
        viewports.coronal.render();
        viewports.axial.render();
      }
    });

    // Update 3D slice actors
    const slice3DActor = volumeSliceActorsRef.current[view];
    if (slice3DActor) {
      const mapper = slice3DActor.getMapper() as vtkImageMapper;
      mapper.setSlice(value);
      viewports.volume.render();
    }
  };

  // Handler for toggling label visibility
  const toggleSegmentationLabelVisibility = (
    labelId: number,
    visible: boolean
  ) => {
    setSegmentationLabelVisibility((prev) => ({ ...prev, [labelId]: visible }));
    labels.forEach((label) => {
      if (label.id === labelId) {
        // Toggle visibility across all viewports
        ["sagittal", "coronal", "axial"].forEach((view) => {
          const actor =
            segmentationActorsByLabelRef.current[label.id][
              view as "sagittal" | "coronal" | "axial"
            ];
          if (actor) {
            actor.setVisibility(visible);
          }
        });
      }
    });

    // Render all render windows to reflect changes
    viewports.axial.render();
    viewports.sagittal.render();
    viewports.coronal.render();
    viewports.volume.render();
  };

  // New Handler for 3D Slice Visibility Toggle
  const toggleSlice3DVisibility = (
    slice: "axial" | "sagittal" | "coronal",
    visible: boolean
  ) => {
    setSlice3DVisibility((prev) => ({ ...prev, [slice]: visible }));
    const actor = volumeSliceActorsRef.current[slice];
    if (actor) {
      actor.setVisibility(visible);
      viewports.volume.render();
    }
  };

  useEffect(() => {
    initializeVtk({
      axialViewRef,
      sagittalViewRef,
      coronalViewRef,
      volumeViewRef,
    });

    const { pointClouds } = usePointCloudsStore.getState();
    const { meshes } = useMeshesStore.getState();

    // If imageData and segmentationData are provided via props, set up the view
    if (imageData && segmentationData && pointClouds && meshes) {
      // Get image data extent
      console.log({ imageData });
      const imgExtent = imageData.getExtent();
      setImageExtent(imgExtent);

      // Compute center slices for each axis
      const centerAxial = Math.floor((imgExtent[4] + imgExtent[5]) / 2);
      const centerSagittal = Math.floor((imgExtent[0] + imgExtent[1]) / 2);
      const centerCoronal = Math.floor((imgExtent[2] + imgExtent[3]) / 2);
      const centerSlices = {
        axial: centerAxial,
        sagittal: centerSagittal,
        coronal: centerCoronal,
      };

      // Update slices state to center slices
      setCurrentSlices(centerSlices);

      // Create the quad view with center slices and segmentation data
      createQuadView({
        imageData,
        segmentationData,
        initialSlices: centerSlices,
        slicesRef: currentSlicesRef,
        sliceActorsByViewRef,
        volumeSliceActorsRef,
        segmentationActorsByLabelRef,
        segmentationLabelVisibility,
        volumeViewRef,
      });
    }

    // Cleanup on unmount
    return () => {
      // Function to cleanup render windows
      const cleanupRenderWindow = (
        renderWindowRef: vtkRenderWindow,
        interactorRef: any,
        containerRef: React.MutableRefObject<HTMLDivElement | null>
      ) => {
        interactorRef.unbindEvents();
        interactorRef.delete();

        renderWindowRef.delete();

        if (containerRef.current) {
          // Clear the container
          while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild);
          }
        }
      };

      // Cleanup all render windows
      if (
        viewports.axial.renderWindow &&
        viewports.axial.interactor &&
        viewports.sagittal.renderWindow &&
        viewports.sagittal.interactor &&
        viewports.coronal.renderWindow &&
        viewports.coronal.interactor &&
        viewports.volume.renderWindow &&
        viewports.volume.interactor
      ) {
        cleanupRenderWindow(
          viewports.axial.renderWindow,
          viewports.axial.interactor,
          axialViewRef
        );
        cleanupRenderWindow(
          viewports.sagittal.renderWindow,
          viewports.sagittal.interactor,
          sagittalViewRef
        );
        cleanupRenderWindow(
          viewports.coronal.renderWindow,
          viewports.coronal.interactor,
          coronalViewRef
        );
        cleanupRenderWindow(
          viewports.volume.renderWindow,
          viewports.volume.interactor,
          volumeViewRef
        );

        // Cleanup 3D slice actors
        if (viewports.volume.renderer) {
          ["axial", "sagittal", "coronal"].forEach((view) => {
            const actor =
              volumeSliceActorsRef.current[
                view as "axial" | "sagittal" | "coronal"
              ];
            if (
              actor &&
              viewports.volume.renderer &&
              volumeSliceActorsRef.current
            ) {
              viewports.volume.removeActor(actor as any);
              actor.delete();
              volumeSliceActorsRef.current[
                view as "axial" | "sagittal" | "coronal"
              ] = undefined;
            }
          });
        }
      }
    };
  }, [imageData, segmentationData]); // Run effect when imageData or segmentationData changes

  // Handler functions to update slices via wheel events
  const handleWheel = (
    view: "axial" | "sagittal" | "coronal",
    delta: number
  ) => {
    const currentSlice = currentSlicesRef.current[view];
    const min =
      imageExtentRef.current[
        view === "sagittal" ? 0 : view === "coronal" ? 2 : 4
      ];
    const max =
      imageExtentRef.current[
        view === "sagittal" ? 1 : view === "coronal" ? 3 : 5
      ];
    let newSlice = currentSlice + delta;

    // Clamp the new slice within the valid extent
    newSlice = Math.max(min, Math.min(newSlice, max));

    handleSliceChange(view, newSlice);
  };

  // Attach wheel event listeners to containers
  useEffect(() => {
    const attachWheelListener = (
      container: HTMLDivElement | null,
      view: "axial" | "sagittal" | "coronal" | null
    ) => {
      if (!container || !view) return;
      const onWheel = (event: WheelEvent) => {
        event.preventDefault();
        const delta = Math.sign(event.deltaY);
        handleWheel(view, delta);
      };

      container.addEventListener("wheel", onWheel);

      return () => {
        container.removeEventListener("wheel", onWheel);
      };
    };

    const cleanupAxial = attachWheelListener(axialViewRef.current, "axial");
    const cleanupSagittal = attachWheelListener(
      sagittalViewRef.current,
      "sagittal"
    );
    const cleanupCoronal = attachWheelListener(
      coronalViewRef.current,
      "coronal"
    );

    return () => {
      cleanupAxial && cleanupAxial();
      cleanupSagittal && cleanupSagittal();
      cleanupCoronal && cleanupCoronal();
    };
  }, [handleSliceChange]);

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
        {/* Overlay Controls */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            padding: "10px",
            borderRadius: "5px",
            zIndex: 1, // Ensure the controls are above the VTK canvas
          }}
        >
          <div>
            <label>
              Axial Slice:
              <input
                type="range"
                min={imageExtent[4]}
                max={imageExtent[5]}
                value={currentSlices.axial}
                onChange={(e) =>
                  handleSliceChange("axial", Number(e.target.value))
                }
              />
              {currentSlices.axial}
            </label>
          </div>
          <div>
            <label>
              Sagittal Slice:
              <input
                type="range"
                min={imageExtent[0]}
                max={imageExtent[1]}
                value={currentSlices.sagittal}
                onChange={(e) =>
                  handleSliceChange("sagittal", Number(e.target.value))
                }
              />
              {currentSlices.sagittal}
            </label>
          </div>
          <div>
            <label>
              Coronal Slice:
              <input
                type="range"
                min={imageExtent[2]}
                max={imageExtent[3]}
                value={currentSlices.coronal}
                onChange={(e) =>
                  handleSliceChange("coronal", Number(e.target.value))
                }
              />
              {currentSlices.coronal}
            </label>
          </div>
        </div>

        {/* Viewport Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: "0.5rem",
            height: "100%",
            padding: "1rem",
            boxSizing: "border-box",
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
              backgroundColor: "#000", // Background color for VTK renderers
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
          {/* Example Side Panel Content */}
          <h2>Side Panel</h2>

          {/* Segmentation Overlay Controls */}
          <div style={{ marginTop: "20px" }}>
            <h3>Segmentation Overlays</h3>
            {labels.map((label) => (
              <div key={label.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={segmentationLabelVisibility[label.id]}
                    onChange={(e) =>
                      toggleSegmentationLabelVisibility(
                        label.id,
                        e.target.checked
                      )
                    }
                  />
                  {label.name}
                </label>
              </div>
            ))}
          </div>

          {/* New 3D Slice Visibility Controls */}
          <div style={{ marginTop: "20px" }}>
            <h3>3D Slice Overlays</h3>
            {["axial", "sagittal", "coronal"].map((slice) => (
              <div key={slice}>
                <label>
                  <input
                    type="checkbox"
                    checked={
                      slice3DVisibility[
                        slice as "axial" | "sagittal" | "coronal"
                      ]
                    }
                    onChange={(e) =>
                      toggleSlice3DVisibility(
                        slice as "axial" | "sagittal" | "coronal",
                        e.target.checked
                      )
                    }
                  />
                  {`${slice.charAt(0).toUpperCase() + slice.slice(1)} Slice`}
                </label>
              </div>
            ))}
          </div>
          {/* You can replace this with your actual side panel components */}
        </div>
      </div>
    </div>
  );
};

export default VTKViewer;
