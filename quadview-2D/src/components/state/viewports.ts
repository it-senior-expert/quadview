import {create} from "zustand";
import { immer } from "zustand/middleware/immer";

import vtkCamera from "@kitware/vtk.js/Rendering/Core/Camera";
import vtkOpenGLHardwareSelector from "@kitware/vtk.js/Rendering/OpenGL/HardwareSelector";
import vtkRenderWindowInteractor from "@kitware/vtk.js/Rendering/Core/RenderWindowInteractor";
import vtkRenderer from "@kitware/vtk.js/Rendering/Core/Renderer";
import vtkRenderWindow from "@kitware/vtk.js/Rendering/Core/RenderWindow";
import vtkOpenGLRenderWindow from "@kitware/vtk.js/Rendering/OpenGL/RenderWindow";
import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";

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
  removeActor: (actor: vtkActor) => void;
  render: () => void;
};

export type VtkViewport = VtkClasses &
  VtkHelperMethods & {
    container: HTMLDivElement | undefined;
  };

export type State = {
  areCornerstoneViewportsInitialized: boolean;
  centerCamera: ((bounds: Bounds) => void) | undefined;
  isVtkInitialized: boolean;
  viewports: Record<ViewportKey, VtkViewport>;
  bounds: Bounds | undefined;
};

export type Actions = {
  setAreCornerstoneViewportsInitialized: (areInitialized: boolean) => void;
  setIsVtkInitialized: (isInitialized: boolean) => void;
  setCenterCamera: (centerCamera: (bounds: Bounds) => void) => void;
  setVtkViewport: (key: ViewportKey, viewport: VtkViewport) => void;
  setBounds: (bounds: Bounds) => void;
};

const initializeVtkViewport = (): VtkViewport => ({
  camera: undefined,
  interactor: undefined,
  selector: undefined,
  renderer: undefined,
  renderWindow: undefined,
  openGLRenderWindow: undefined,
  addActor: () => {},
  removeActor: () => {},
  render: () => {},
  container: undefined,
});

export const useViewportsStore = create<State & Actions>()(
  immer((set, get) => ({
    areCornerstoneViewportsInitialized: false,
    centerCamera: undefined,
    isVtkInitialized: false,
    bounds: undefined,
    viewports: {
      axial: initializeVtkViewport(),
      coronal: initializeVtkViewport(),
      sagittal: initializeVtkViewport(),
      volume: initializeVtkViewport(),
    },
    setAreCornerstoneViewportsInitialized: (areInitialized) =>
      set((state) => {
        state.areCornerstoneViewportsInitialized = areInitialized;
      }),
    setIsVtkInitialized: (isInitialized) =>
      set((state) => {
        state.isVtkInitialized = isInitialized;
      }),
    setCenterCamera: (centerCamera) =>
      set((state) => {
        state.centerCamera = centerCamera;
      }),
    setVtkViewport: (key: ViewportKey, viewport: VtkViewport) =>
      set((state) => {
        // @ts-ignore-next-line
        state.viewports[key] = viewport;
      }),
    setBounds: (bounds) =>
      set((state) => {
        state.bounds = bounds;
      }),
  }))
);

export function getViewports() {
  const store = useViewportsStore.getState();
  // if (!store.isVtkInitialized) {
  //   throw new Error(
  //     "VTK components not initialized. Call initializeVtk() first."
  //   );
  // }

  // if (!store.viewports.volume.isInitialized) {
  //   throw new Error("Volume viewport not initialized.");
  // }

  return {
    axial: store.viewports.axial,
    coronal: store.viewports.coronal,
    sagittal: store.viewports.sagittal,
    volume: store.viewports.volume,
  };
}
