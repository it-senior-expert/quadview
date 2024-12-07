import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";
import vtkCamera from "@kitware/vtk.js/Rendering/Core/Camera";
import vtkFullScreenRenderWindow from "@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow";
import vtkRenderer from "@kitware/vtk.js/Rendering/Core/Renderer";
import vtkOpenGLRenderWindow from "@kitware/vtk.js/Rendering/OpenGL/RenderWindow";
import vtkRenderWindow from "@kitware/vtk.js/Rendering/Core/RenderWindow";
import vtkOpenGLHardwareSelector from "@kitware/vtk.js/Rendering/OpenGL/HardwareSelector";
import vtkRenderWindowInteractor from "@kitware/vtk.js/Rendering/Core/RenderWindowInteractor";
import vtkMouseCameraTrackballZoomManipulator from "@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballZoomManipulator";
import vtkMouseCameraTrackballRotateManipulator from "@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballRotateManipulator";
import vtkMouseCameraTrackballPanManipulator from "@kitware/vtk.js/Interaction/Manipulators/MouseCameraTrackballPanManipulator";
import vtkInteractorStyleManipulator from "@kitware/vtk.js/Interaction/Style/InteractorStyleManipulator";
import vtkInteractorStyleImage from "@kitware/vtk.js/Interaction/Style/InteractorStyleImage";
import { FieldAssociations } from "@kitware/vtk.js/Common/DataModel/DataSet/Constants";

export type Bounds = [number, number, number, number, number, number];

export type ViewportKey = "axial" | "coronal" | "sagittal" | "volume";

type VtkClasses = {
  camera: vtkCamera | undefined;
  interactor: vtkRenderWindowInteractor | undefined;
  selector: vtkOpenGLHardwareSelector | undefined;
  renderer: vtkRenderer | undefined;
  renderWindow: vtkRenderWindow | undefined;
  openGLRenderWindow: vtkOpenGLRenderWindow | undefined;
};

type VtkHelperMethods = {
  addActor: (actor: vtkActor) => void;
  addActors: (actors: vtkActor[]) => void;
  removeActor: (actor: vtkActor) => void;
  removeActors: (actors: vtkActor[]) => void;
  render: () => void;
};

export type VtkViewport = VtkClasses &
  VtkHelperMethods & {
    container: HTMLDivElement | undefined;
    isInitialized: boolean;
    setIsInitialized: (isInitialized: boolean) => void;
    isMaximized: boolean;
    setIsMaximized: (isMaximized: boolean) => void;
  };

type State = {
  areCornerstoneViewportsInitialized: boolean;
  centerCamera: ((bounds: Bounds) => void) | undefined;
  isVtkInitialized: boolean;
  viewports: Record<ViewportKey, VtkViewport>;
  bounds: Bounds | undefined;
};

type Actions = {
  setIsVtkInitialized: (isInitialized: boolean) => void;
  setCenterCamera: (centerCamera: (bounds: Bounds) => void) => void;
  setVtkViewport: (key: ViewportKey, viewport: VtkViewport) => void;
  setBounds: (bounds: Bounds) => void;
};

const initializeVtkViewport = () => {
  return {
    camera: undefined,
    interactor: undefined,
    selector: undefined,
    renderer: undefined,
    renderWindow: undefined,
    openGLRenderWindow: undefined,
    addActor: () => {},
    addActors: () => {},
    removeActor: () => {},
    removeActors: () => {},
    render: () => {},
    container: undefined,
    isInitialized: false,
    setIsInitialized: () => {},
    isMaximized: false,
    setIsMaximized: () => {},
  };
};

export const useViewportsStore = create<State & Actions>()(
  immer((set, get) => ({
    areCornerstoneViewportsInitialized: false,
    centerCamera: undefined,
    isVtkInitialized: false,
    bounds: undefined,
    setIsVtkInitialized(isInitialized) {
      set((state) => {
        state.isVtkInitialized = isInitialized;
      });
    },
    setVtkViewport(key, viewport) {
      set((state) => {
        if (state.viewports[key]) {
          // @ts-expect-error -- https://github.com/immerjs/immer/issues/710https://github.com/immerjs/immer/issues/710
          state.viewports[key] = viewport;
        }
      });
    },
    setBounds(bounds) {
      set((state) => {
        state.bounds = bounds;
      });
    },
    setCenterCamera(centerCamera) {
      set((state) => {
        state.centerCamera = centerCamera;
      });
    },
    viewports: {
      axial: initializeVtkViewport(),
      coronal: initializeVtkViewport(),
      sagittal: initializeVtkViewport(),
      volume: initializeVtkViewport(),
    },
  }))
);

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

export function initializeVtk(container: HTMLDivElement): {
  centerCamera: (bounds: Bounds) => void;
  cleanup: () => void;
} {
  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    // @ts-expect-error -- types are wrong
    rootContainer: container,
    background: [0, 0, 0],
    views: [
      {
        background: [0, 0, 0],
        preserveDrawingBuffer: true,
      },
    ],
  });

  const renderer = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();
  const interactor = fullScreenRenderer.getInteractor();
  const customInteractorStyle = createCustomInteractorStyle();
  interactor.setInteractorStyle(customInteractorStyle);

  const openGLRenderWindow = fullScreenRenderer.getApiSpecificRenderWindow();

  const camera = renderer.getActiveCamera();

  const selector = vtkOpenGLHardwareSelector.newInstance({
    captureZValues: true,
  });
  selector.setFieldAssociation(FieldAssociations.FIELD_ASSOCIATION_POINTS);
  selector.attach(openGLRenderWindow, renderer);

  renderer.resetCamera();
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
  store.setVtkViewport("volume", {
    container,
    ...vtkClasses,
    ...helperMethods,
    isInitialized: true,
    setIsInitialized: store.viewports.volume.setIsInitialized,
    isMaximized: false,
    setIsMaximized: store.viewports.volume.setIsMaximized,
  });

  const centerCamera = (bounds: Bounds) => {
    const center = [
      (bounds[0] + bounds[1]) / 2,
      (bounds[2] + bounds[3]) / 2,
      (bounds[4] + bounds[5]) / 2,
    ] as [number, number, number];

    // Ensure we're using an orthographic projection
    camera.setParallelProjection(true);

    // Calculate the diagonal of the bounding box
    const diagonal = Math.hypot(
      bounds[1] - bounds[0],
      bounds[3] - bounds[2],
      bounds[5] - bounds[4]
    );

    // Set up a straight view (no rotation)
    const distance = diagonal * 0.3;

    // Position camera directly in front of the bone
    const x = center[0];
    const y = center[1];
    const z = center[2] + distance;

    camera.setPosition(x, y, z);
    camera.setFocalPoint(...center);
    camera.setViewUp(0, 1, 0);

    // Keep the same clipping range and parallel scale as before
    camera.setClippingRange(1, diagonal);
    camera.setParallelScale(diagonal / 10);

    customInteractorStyle.setCenterOfRotation(...center);

    // Force camera update and render
    camera.modified();
    store.viewports.volume.render();

    console.log("centered cacmera");
  };

  store.setCenterCamera(centerCamera);
  store.setIsVtkInitialized(true);

  const updateSize = () => {
    if (!openGLRenderWindow || !renderWindow || !container) return;
    const { width, height } = container.getBoundingClientRect();
    const devicePixelRatio = window.devicePixelRatio || 1;
    const scaledWidth = Math.floor(width * devicePixelRatio);
    const scaledHeight = Math.floor(height * devicePixelRatio);

    openGLRenderWindow.setSize(scaledWidth, scaledHeight);
    renderWindow.render();
  };

  updateSize();
  window.addEventListener("resize", updateSize);

  const cleanup = () => {
    window.removeEventListener("resize", updateSize);
    if (interactor) {
      interactor.unbindEvents();
      interactor.delete();
    }

    if (openGLRenderWindow) openGLRenderWindow.delete();
    if (renderWindow) renderWindow.delete();
    if (renderer) renderer.delete();

    store.setIsVtkInitialized(false);
  };

  // You might want to expose centerCamera through the store or as a separate function
  return { centerCamera, cleanup };
}

export function initializeViewport(
  container: HTMLDivElement,
  key: ViewportKey
): VtkViewport {
  const store = useViewportsStore.getState();
  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    // @ts-expect-error -- types are wrong
    rootContainer: container,
    background: [0, 0, 0],
    containerStyle: { width: "100%", height: "100%", position: "relative" },
    autoResize: false,
  });

  const renderer = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();
  const interactor = fullScreenRenderer.getInteractor();
  const openGLRenderWindow = fullScreenRenderer.getApiSpecificRenderWindow();
  const camera = renderer.getActiveCamera();
  const customInteractorStyle = createCustomInteractorStyle();

  // Set up different interactor styles for 2D and 3D views
  if (key === "volume") {
    interactor.setInteractorStyle(customInteractorStyle);
  } else {
    // For 2D views (axial, coronal, sagittal)
    const interactorStyle = vtkInteractorStyleImage.newInstance();
    interactor.setInteractorStyle(interactorStyle);
    camera.setParallelProjection(true);
  }

  const selector = vtkOpenGLHardwareSelector.newInstance({
    captureZValues: true,
  });
  selector.setFieldAssociation(FieldAssociations.FIELD_ASSOCIATION_POINTS);
  selector.attach(openGLRenderWindow, renderer);

  renderer.resetCamera();
  renderWindow.render();

  const vtkClasses: VtkClasses = {
    camera,
    interactor,
    selector,
    renderer,
    renderWindow,
    openGLRenderWindow,
  };

  const helperMethods: VtkHelperMethods = {
    addActor: (actor: vtkActor) => renderer.addActor(actor),
    addActors(actors: vtkActor[]) {
      actors.forEach((actor) => renderer.addActor(actor));
    },
    removeActor: (actor: vtkActor) => renderer.removeActor(actor),
    removeActors(actors: vtkActor[]) {
      actors.forEach((actor) => renderer.removeActor(actor));
    },
    render: renderWindow.render,
  };

  const viewport: VtkViewport = {
    ...vtkClasses,
    ...helperMethods,
    container,
    isMaximized: false,
    isInitialized: true,
    setIsInitialized: (isInitialized: boolean) => {
      store.setVtkViewport(key, {
        ...store.viewports[key],
        isInitialized,
      });
    },
    setIsMaximized: (isMaximized: boolean) => {},
  };

  const centerCamera = (bounds: Bounds) => {
    const center = [
      (bounds[0] + bounds[1]) / 2,
      (bounds[2] + bounds[3]) / 2,
      (bounds[4] + bounds[5]) / 2,
    ] as [number, number, number];

    // Ensure we're using an orthographic projection
    camera.setParallelProjection(true);

    // Calculate the diagonal of the bounding box
    const diagonal = Math.hypot(
      bounds[1] - bounds[0],
      bounds[3] - bounds[2],
      bounds[5] - bounds[4]
    );

    // Set up a straight view (no rotation)
    const distance = diagonal * 0.3;

    // Position camera directly in front of the bone
    const x = center[0];
    const y = center[1];
    const z = center[2] + distance;

    camera.setPosition(x, y, z);
    camera.setFocalPoint(...center);
    camera.setViewUp(0, 1, 0);

    // Keep the same clipping range and parallel scale as before
    camera.setClippingRange(1, diagonal);
    camera.setParallelScale(diagonal / 10);

    customInteractorStyle.setCenterOfRotation(...center);

    // Force camera update and render
    camera.modified();
    store.viewports.volume.render();

    console.log("centered camera");
  };
  store.setCenterCamera(centerCamera);
  store.setVtkViewport(key, viewport);

  return viewport;
}

export function getViewports() {
  const store = useViewportsStore.getState();
  // if (!store.isVtkInitialized) {
  //   throw new Error(
  //     "VTK components not initialized. Call initializeVtk() first."
  //   );
  // }

  if (!store.viewports.volume.isInitialized) {
    throw new Error("Volume viewport not initialized.");
  }

  return {
    axial: store.viewports.axial,
    coronal: store.viewports.coronal,
    sagittal: store.viewports.sagittal,
    volume: store.viewports.volume,
  };
}

export function renderVtk() {
  const store = useViewportsStore.getState();
  if (!store.isVtkInitialized) {
    throw new Error(
      "VTK components not initialized. Call initializeVtk() first."
    );
  }

  store.viewports.volume.render();
}
