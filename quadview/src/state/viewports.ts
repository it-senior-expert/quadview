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
import { FieldAssociations } from "@kitware/vtk.js/Common/DataModel/DataSet/Constants";

export type Bounds = [number, number, number, number, number, number];

type ViewportName = "axial" | "sagittal" | "coronal" | "volume";

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
    isMaximized: boolean;
    setIsMaximized: (isMaximized: boolean) => void;
  };

type State = {
  areCornerstoneViewportsInitialized: boolean;
  centerCamera: ((bounds: Bounds) => void) | undefined;
  isVtkInitialized: boolean;
  viewports: Partial<Record<ViewportName, VtkViewport>>;
  bounds: Bounds | undefined;
};

type Actions = {
  setAreCornerstoneViewportsInitialized: (areInitialized: boolean) => void;
  setIsVtkInitialized: (isInitialized: boolean) => void;
  setCenterCamera: (centerCamera: (bounds: Bounds) => void) => void;
  setViewport: (key: ViewportName, viewport: VtkViewport) => void;
  setBounds: (bounds: Bounds) => void;
};

export const useViewportsStore = create<State & Actions>()(
  immer((set, get) => ({
    areCornerstoneViewportsInitialized: false,
    centerCamera: undefined,
    isVtkInitialized: false,
    viewports: {
      volume: {
        addActor: (actor) =>
          set((state) => {
            state.viewports.volume!.renderer!.addActor(actor);
          }),
        addActors: (actors) =>
          set((state) => {
            for (const actor of actors) {
              state.viewports.volume!.renderer!.addActor(actor);
            }
          }),
        removeActor: (actor) =>
          set((state) => {
            state.viewports.volume!.renderer?.removeActor(actor);
          }),
        removeActors: (actors) =>
          set((state) => {
            for (const actor of actors) {
              state.viewports.volume!.renderer?.removeActor(actor);
            }
          }),
        render() {
          const {
            viewports: { volume },
          } = get();

          volume!.renderWindow?.render();
        },
        camera: undefined,
        container: undefined,
        interactor: undefined,
        isMaximized: false,
        setIsMaximized(isMaximized) {
          set((state) => {
            state.viewports.volume!.isMaximized = isMaximized;
          });
        },
        openGLRenderWindow: undefined,
        renderWindow: undefined,
        renderer: undefined,
        selector: undefined,
      },
    },
    bounds: undefined,
    setAreCornerstoneViewportsInitialized(areInitialized) {
      set((state) => {
        state.areCornerstoneViewportsInitialized = areInitialized;
      });
    },
    setIsVtkInitialized(isInitialized) {
      set((state) => {
        state.isVtkInitialized = isInitialized;
      });
    },
    setViewport(key: ViewportName, viewport) {
      set((state) => {
        // @ts-expect-error -- https://github.com/immerjs/immer/issues/710https://github.com/immerjs/immer/issues/710
        state.viewports[key] = viewport;
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

export function initializeVolumeViewport(container: HTMLDivElement): {
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
  store.setViewport("volume", {
    container,
    ...vtkClasses,
    ...helperMethods,
    isMaximized: false,
    setIsMaximized: store.viewports.volume!.setIsMaximized,
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
    store.viewports.volume!.render();
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

export function getViewports() {
  const store = useViewportsStore.getState();
  if (!store.isVtkInitialized) {
    throw new Error(
      "VTK components not initialized. Call initializeVolumeViewport() first."
    );
  }

  return {
    volume: store.viewports.volume!,
  };
}

export function renderVtk() {
  const store = useViewportsStore.getState();
  if (!store.isVtkInitialized) {
    throw new Error(
      "VTK components not initialized. Call initializeVolumeViewport() first."
    );
  }

  store.viewports.volume!.render();
}
