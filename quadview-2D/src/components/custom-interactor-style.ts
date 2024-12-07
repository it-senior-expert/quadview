// custom-interactor-style.ts
import vtkInteractorStyleImage from "@kitware/vtk.js/Interaction/Style/InteractorStyleImage";
import vtkImageSlice from "@kitware/vtk.js/Rendering/Core/ImageSlice";
import macro from "@kitware/vtk.js/macros";
import { Vector2, Vector3 } from "@kitware/vtk.js/types";

// Define the interface for initial values
interface IInteractorStyleImageInitialValues {
  windowLevelStartPosition: Vector2;
  windowLevelCurrentPosition: Vector2;
  lastSlicePosition: number;
  windowLevelInitial: Vector2;
  currentImageNumber: number;
  interactionMode: "IMAGE2D" | "IMAGE3D" | "IMAGE_SLICING";
  xViewRightVector: Vector3;
  xViewUpVector: Vector3;
  yViewRightVector: Vector3;
  yViewUpVector: Vector3;
  zViewRightVector: Vector3;
  zViewUpVector: Vector3;
}

// Define the custom interactor style
function CustomInteractorStyleImage(publicAPI: any, model: any) {
  // Define the initial values
  const initialValues: IInteractorStyleImageInitialValues = {
    windowLevelStartPosition: [0, 0],
    windowLevelCurrentPosition: [0, 0],
    lastSlicePosition: 0,
    windowLevelInitial: [1.0, 0.5],
    currentImageNumber: 0,
    interactionMode: "IMAGE2D",
    xViewRightVector: [1, 0, 0],
    xViewUpVector: [0, 1, 0],
    yViewRightVector: [1, 0, 0],
    yViewUpVector: [0, 0, 1],
    zViewRightVector: [0, 1, 0],
    zViewUpVector: [1, 0, 0],
  };

  // Extend vtkInteractorStyleImage with the necessary initial values
  vtkInteractorStyleImage.extend(publicAPI, model, initialValues);

  // Store the main image slice actor
  let mainImageSliceActor: vtkImageSlice | null = null;

  // Method to set the main image slice actor
  publicAPI.setMainImageSliceActor = (actor: vtkImageSlice) => {
    mainImageSliceActor = actor;
  };

  // Render callback
  let renderCallback: (() => void) | null = null;

  // Method to set the render callback
  publicAPI.setRenderCallback = (callback: () => void) => {
    renderCallback = callback;
  };

  // Override the handleMouseWheel method
  publicAPI.handleMouseWheel = (callData: any) => {
    if (mainImageSliceActor) {
      const property = mainImageSliceActor.getProperty();
      let colorWindow = property.getColorWindow();
      let colorLevel = property.getColorLevel();

      // Determine the direction of the wheel scroll
      const delta = callData.delta > 0 ? -10 : 10;

      // Adjust color window and level
      colorWindow = Math.max(10, colorWindow + delta);
      colorLevel = Math.max(0, colorLevel + delta / 2);

      // Apply the new color window and level
      property.setColorWindow(colorWindow);
      property.setColorLevel(colorLevel);

      // Call the render callback if set
      if (renderCallback) {
        renderCallback();
      }
    }

    // Prevent further processing
    return;
  };

  // Optionally, override handleKeyPress if needed
  publicAPI.handleKeyPress = (callData: any) => {
    // Implement custom key press handling if necessary
    // For example, resetting brightness/contrast
  };
}

// Factory method without type arguments
const newInstance = macro.newInstance(
  CustomInteractorStyleImage,
  "CustomInteractorStyleImage"
);

const defaultExport = { newInstance };
export default defaultExport;
