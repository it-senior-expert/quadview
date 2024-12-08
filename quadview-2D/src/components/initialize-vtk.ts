import { MutableRefObject } from "react";
import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";
import vtkOpenGLRenderWindow from "@kitware/vtk.js/Rendering/OpenGL/RenderWindow";
// import vtkColorTransferFunction from "@kitware/vtk.js/Rendering/Core/ColorTransferFunction";
import vtkPiecewiseFunction from "@kitware/vtk.js/Common/DataModel/PiecewiseFunction";
import vtkImageSlice from "@kitware/vtk.js/Rendering/Core/ImageSlice";
import vtkImageMapper from "@kitware/vtk.js/Rendering/Core/ImageMapper";
import vtkRenderWindow from "@kitware/vtk.js/Rendering/Core/RenderWindow";
import vtkRenderWindowInteractor from "@kitware/vtk.js/Rendering/Core/RenderWindowInteractor";
import vtkRenderer from "@kitware/vtk.js/Rendering/Core/Renderer";
import { SlicingMode } from "@kitware/vtk.js/Rendering/Core/ImageMapper/Constants";
import vtkOpenGLHardwareSelector from "@kitware/vtk.js/Rendering/OpenGL/HardwareSelector";
import { FieldAssociations } from "@kitware/vtk.js/Common/DataModel/DataSet/Constants";
import vtkMouseCameraTrackballZoomManipulator from "@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballZoomManipulator";
import vtkMouseCameraTrackballRotateManipulator from "@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballRotateManipulator";
import vtkMouseCameraTrackballPanManipulator from "@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballPanManipulator";
import vtkInteractorStyleManipulator from "@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator";
import vtkFullScreenRenderWindow from "@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow";
import vtkVolumeMapper from "@kitware/vtk.js/Rendering/Core/VolumeMapper";
import CustomInteractorStyleImage from "./custom-interactor-style";
import { useViewportsStore } from "./state/viewports";
import { useMeshesStore } from "./state/meshes";
import { useVolumeStore } from "./state/volume";
import { usePointCloudsStore } from "./state/point-clouds";
import vtkColorTransferFunction from "../utils/vtk-extended-color-transfer-function";
import vtkVolume from "@kitware/vtk.js/Rendering/Core/Volume";
export type Bounds = [number, number, number, number, number, number];
// Define labels and their associated colors
export const labels: {
  id: number;
  name: string;
  color: [number, number, number];
}[] = [
  { id: 1, name: "Bone 1", color: [1, 0, 0] }, // Red
  { id: 2, name: "Bone 2", color: [0, 1, 0] }, // Green
  { id: 3, name: "Bone 3", color: [0, 0, 1] }, // Blue
  { id: 4, name: "Bone 4", color: [1, 1, 0] }, // Yellow
];

/**
 * Initializes all four VTK render windows: sagittal, coronal, axial, and volume.
 * @param options - Configuration object containing all necessary refs and containers.
 */
export const initializeVtk = (options: {
  sagittalViewRef: React.RefObject<HTMLDivElement>;
  coronalViewRef: React.RefObject<HTMLDivElement>;
  axialViewRef: React.RefObject<HTMLDivElement>;
  volumeViewRef: React.RefObject<HTMLDivElement>;
}) => {
  const { sagittalViewRef, coronalViewRef, axialViewRef, volumeViewRef } =
    options;

  initializeViewport({
    container: axialViewRef.current,
    key: "axial",
  });

  initializeViewport({
    container: coronalViewRef.current,
    key: "coronal",
  });

  initializeViewport({
    container: sagittalViewRef.current,
    key: "sagittal",
  });

  initializeViewport({
    container: volumeViewRef.current,
    key: "volume",
  });
};

function createCustomInteractorStyle() {
  const interactorStyle = vtkInteractorStyleManipulator.newInstance();

  const rotateManipulator =
    vtkMouseCameraTrackballRotateManipulator.newInstance();
  rotateManipulator.setButton(3);
  interactorStyle.addMouseManipulator(rotateManipulator);

  const panManipulator = vtkMouseCameraTrackballPanManipulator.newInstance();
  panManipulator.setButton(3);
  panManipulator.setShift(true);
  interactorStyle.addMouseManipulator(panManipulator);

  const zoomManipulator = vtkMouseCameraTrackballZoomManipulator.newInstance();
  zoomManipulator.setScrollEnabled(true);
  zoomManipulator.setDragEnabled(false);
  interactorStyle.addMouseManipulator(zoomManipulator);

  return interactorStyle;
}

/**
 * Initializes a viewport
 * @param options - Configuration object containing all necessary parameters.
 */
/**
 * Initializes a viewport
 * @param options - Configuration object containing all necessary parameters.
 */
export const initializeViewport = (options: {
  container: HTMLDivElement | null;
  key: "sagittal" | "coronal" | "axial" | "volume";
}) => {
  const { container, key } = options;

  if (!container) return;

  const isVolume = key === "volume";

  // Create OpenGL Render Window
  const openGLRenderWindow = vtkOpenGLRenderWindow.newInstance();
  openGLRenderWindow.setContainer(container);
  openGLRenderWindow.setSize(container.clientWidth, container.clientHeight);

  // Create Render Window
  const renderWindow = vtkRenderWindow.newInstance();
  renderWindow.addView(openGLRenderWindow);

  // Create Renderer
  const renderer = vtkRenderer.newInstance();
  renderWindow.addRenderer(renderer);

  const camera = renderer.getActiveCamera();

  // Create Interactor
  const interactorStyle = isVolume
    ? createCustomInteractorStyle()
    : CustomInteractorStyleImage.newInstance();
  const interactor = vtkRenderWindowInteractor.newInstance();
  interactor.setView(openGLRenderWindow);
  interactor.setInteractorStyle(interactorStyle);
  interactor.initialize();
  interactor.bindEvents(container);

  const selector = vtkOpenGLHardwareSelector.newInstance({
    captureZValues: true,
  });
  selector.setFieldAssociation(FieldAssociations.FIELD_ASSOCIATION_POINTS);
  selector.attach(openGLRenderWindow, renderer);

  // Start rendering
  renderWindow.render();

  const vtkClasses = {
    camera,
    interactor,
    selector,
    renderer,
    renderWindow,
    openGLRenderWindow,
  };

  const helperMethods = {
    addActor: (actor: vtkActor) => renderer.addActor(actor),
    addActors(actors: vtkActor[]) {
      for (const actor of actors) {
        renderer.addActor(actor);
      }
    },
    removeActor: (actor: vtkActor) => renderer.removeActor(actor),
    removeActors(actors: vtkActor[]) {
      for (const actor of actors) {
        renderer.removeActor(actor);
      }
    },
    render: renderWindow.render,
  };

  const store = useViewportsStore.getState();
  store.setVtkViewport(key, {
    container,
    ...vtkClasses,
    ...helperMethods,
  });
};

// Function to create color and piecewise functions
const createTransferFunctions = () => {
  // Color transfer function for main volume
  const ctf = vtkColorTransferFunction.newInstance();
  ctf.addRGBPoint(0, 0, 0.25, 0.15);
  ctf.addRGBPoint(600, 0.5, 0.5, 0.5);
  ctf.addRGBPoint(3120, 0.2, 0, 0.1);

  // Piecewise function for opacity
  const pf = vtkPiecewiseFunction.newInstance();
  pf.addPoint(0, 0.0);
  pf.addPoint(100, 0.0);
  pf.addPoint(3120, 1.0);

  return { ctf, pf };
};



// Function to create color and piecewise functions
const createTransferFunctions1 = () => {
  // Color transfer function for main volume
  const ctf = vtkColorTransferFunction.newInstance();
  ctf.addRGBPoint(0, 0.8, 0.0, 0.0);
  ctf.addRGBPoint(600, 0.2, 0.8, 0.0);
  ctf.addRGBPoint(3120, 0.0, 0.0, 0.8);

  // Piecewise function for opacity
  const pf = vtkPiecewiseFunction.newInstance();
  pf.addPoint(100, 0.);
  pf.addPoint(100, 0.);
  pf.addPoint(3120, 1.0);

  return { ctf, pf };
};
/**
 * Sets up a 2D viewport for a specific view.
 * @param options - Configuration object containing all necessary parameters.
 * @returns The vtkImageSlice actor.
 */
function setup2DViewport(options: {
  renderer: vtkRenderer;
  imageData: any;
  view: "sagittal" | "coronal" | "axial";
  initialSlice: number;
  colorWindow: number;
  colorLevel: number;
}): vtkImageSlice {
  const { renderer, imageData, view, initialSlice, colorWindow, colorLevel } =
    options;

  const mapper = vtkImageMapper.newInstance();
  mapper.setInputData(imageData);

  // Set slicing mode based on the view
  switch (view) {
    case "sagittal":
      mapper.setSlicingMode(SlicingMode.I);
      break;
    case "coronal":
      mapper.setSlicingMode(SlicingMode.J);
      break;
    case "axial":
      mapper.setSlicingMode(SlicingMode.K);
      break;
    default:
      mapper.setSlicingMode(SlicingMode.NONE);
  }

  // Set the initial slice
  mapper.setSlice(initialSlice);

  const actor = vtkImageSlice.newInstance();
  actor.setMapper(mapper);
  actor.getProperty().setColorWindow(colorWindow);
  actor.getProperty().setColorLevel(colorLevel);

  renderer.addActor(actor);

  // Configure the camera based on the view
  const camera = renderer.getActiveCamera();

  switch (view) {
    case "sagittal":
      // View along the X-axis (Sagittal View)
      camera.setPosition(imageData.getBounds()[1], 0, 0); // (max X, 0, 0)
      camera.setFocalPoint(imageData.getBounds()[0], 0, 0); // (min X, 0, 0)
      camera.setViewUp(0, 0, 1); // Z-up
      break;
    case "coronal":
      // View along the Y-axis (Coronal View)
      camera.setPosition(0, imageData.getBounds()[3], 0); // (0, max Y, 0)
      camera.setFocalPoint(0, imageData.getBounds()[2], 0); // (0, min Y, 0)
      camera.setViewUp(0, 0, 1); // Z-up
      break;
    case "axial":
      // View along the Z-axis (Axial View)
      camera.setPosition(0, 0, imageData.getBounds()[5]); // (0, 0, max Z)
      camera.setFocalPoint(0, 0, imageData.getBounds()[4]); // (0, 0, min Z)
      camera.setViewUp(0, 1, 0); // Y-up
      break;
    default:
      // Default camera settings
      camera.setPosition(0, 0, 1);
      camera.setFocalPoint(0, 0, 0);
      camera.setViewUp(0, 1, 0);
  }

  renderer.resetCameraClippingRange();
  renderer.resetCamera();

  return actor;
}

/**
 * Creates a slice view with segmentation overlays for each label.
 * @param options - Configuration object containing all necessary parameters.
 */
const createSliceView = (options: {
  renderer: vtkRenderer;
  imageData: any;
  segmentationData: any;
  view: "sagittal" | "coronal" | "axial";
  initialSlice: number;
  sliceActorsByViewRef: MutableRefObject<{
    sagittal?: vtkImageSlice;
    coronal?: vtkImageSlice;
    axial?: vtkImageSlice;
  }>;
  segmentationActorsByLabelRef: MutableRefObject<{
    [labelId: number]: {
      sagittal?: vtkImageSlice;
      coronal?: vtkImageSlice;
      axial?: vtkImageSlice;
    };
  }>;
  labelVisibility: { [labelId: number]: boolean };
}) => {
  const {
    renderer,
    imageData,
    segmentationData,
    view,
    initialSlice,
    sliceActorsByViewRef,
    segmentationActorsByLabelRef,
    labelVisibility,
  } = options;

  // Setup main image slice
  const sliceActor = setup2DViewport({
    renderer,
    imageData,
    view,
    initialSlice,
    colorWindow: 1000,
    colorLevel: 500,
  });
  sliceActorsByViewRef.current[view] = sliceActor;

  // Setup segmentation mask slices for each label
  labels.forEach((label) => {
    const segMapper = vtkImageMapper.newInstance();
    segMapper.setInputData(segmentationData);
    segMapper.setSlicingMode(
      view === "sagittal"
        ? SlicingMode.I
        : view === "coronal"
        ? SlicingMode.J
        : SlicingMode.K
    );
    segMapper.setSlice(initialSlice);

    const segActor = vtkImageSlice.newInstance();
    segActor.setMapper(segMapper);

    // Create a color transfer function for this label
    const labelCTF = vtkColorTransferFunction.newInstance();
    // Map the current label to its color
    labelCTF.addRGBPoint(label.id - 0.5, ...label.color); // Below label ID
    labelCTF.addRGBPoint(label.id, ...label.color); // At label ID
    labelCTF.addRGBPoint(label.id + 0.5, ...label.color); // Above label ID

    // Create a piecewise function for opacity
    const labelPF = vtkPiecewiseFunction.newInstance();
    labelPF.addPoint(label.id - 0.5, 0.0); // Below label ID
    labelPF.addPoint(label.id, 1.0); // At label ID
    labelPF.addPoint(label.id + 0.5, 0.0); // Above label ID

    segActor.getProperty().setRGBTransferFunction(0, labelCTF);
    segActor.getProperty().setScalarOpacity(0, labelPF);
    segActor.getProperty().setColorWindow(1); // Single label
    segActor.getProperty().setColorLevel(0.5); // Center
    segActor.getProperty().setInterpolationTypeToLinear();
    segActor.getProperty().setOpacity(0.5);

    // Initially set segmentation visibility based on state
    segActor.setVisibility(labelVisibility[label.id]);

    renderer.addActor(segActor);
    segmentationActorsByLabelRef.current[label.id][
      view as "sagittal" | "coronal" | "axial"
    ] = segActor;
  });
};

/**
 * Creates a quad view consisting of sagittal, coronal, axial slice views and a volume view.
 * @param options - Configuration object containing all necessary parameters.
 */
export const createQuadView = (options: {
  imageData: any;
  segmentationData: any;
  initialSlices: { sagittal: number; coronal: number; axial: number };
  slicesRef: MutableRefObject<{
    sagittal?: number;
    coronal?: number;
    axial?: number;
  }>;
  sliceActorsByViewRef: MutableRefObject<{
    sagittal?: vtkImageSlice;
    coronal?: vtkImageSlice;
    axial?: vtkImageSlice;
  }>;
  volumeSliceActorsRef: MutableRefObject<{
    sagittal?: vtkImageSlice;
    coronal?: vtkImageSlice;
    axial?: vtkImageSlice;
  }>;
  segmentationActorsByLabelRef: MutableRefObject<{
    [labelId: number]: {
      sagittal?: vtkImageSlice;
      coronal?: vtkImageSlice;
      axial?: vtkImageSlice;
    };
  }>;
  segmentationLabelVisibility: { [labelId: number]: boolean };
  volumeViewRef: React.RefObject<HTMLDivElement>;
}) => {
  const {
    imageData,
    segmentationData,
    initialSlices,
    sliceActorsByViewRef,
    segmentationActorsByLabelRef,
    segmentationLabelVisibility,
    volumeViewRef,
  } = options;

  const { viewports } = useViewportsStore.getState();

  // Create sliceViewRef views for sagittal, coronal, axial axes
  if (
    viewports.axial.renderer &&
    viewports.coronal.renderer &&
    viewports.sagittal.renderer
  ) {
    createSliceView({
      renderer: viewports.axial.renderer,
      imageData,
      segmentationData,
      view: "axial",
      initialSlice: initialSlices.axial,
      sliceActorsByViewRef,
      segmentationActorsByLabelRef,
      labelVisibility: segmentationLabelVisibility,
    });
    createSliceView({
      renderer: viewports.coronal.renderer,
      imageData,
      segmentationData,
      view: "coronal",
      initialSlice: initialSlices.coronal,
      sliceActorsByViewRef,
      segmentationActorsByLabelRef,
      labelVisibility: segmentationLabelVisibility,
    });
    createSliceView({
      renderer: viewports.sagittal.renderer,
      imageData,
      segmentationData,
      view: "sagittal",
      initialSlice: initialSlices.sagittal,
      sliceActorsByViewRef,
      segmentationActorsByLabelRef,
      labelVisibility: segmentationLabelVisibility,
    });
  }


 // Volume rendering
const { ctf, pf } = createTransferFunctions1();
 const volumeMapper = vtkVolumeMapper.newInstance();
 volumeMapper.setSampleDistance(1.1);
 volumeMapper.setInputData(imageData);

 const volume = vtkVolume.newInstance();
 volume.setMapper(volumeMapper);
 volume.getProperty().setRGBTransferFunction(0, ctf);
 volume.getProperty().setScalarOpacity(0, pf);
 viewports.volume.renderer?.addVolume(volume);
 viewports.volume.renderer?.resetCamera();
//  viewports.volume.renderWindow?.render();


  // Render all render windows
  viewports.axial.renderWindow?.render();
  viewports.coronal.renderWindow?.render();
  viewports.sagittal.renderWindow?.render();
  viewports.volume.renderWindow?.render();
};
