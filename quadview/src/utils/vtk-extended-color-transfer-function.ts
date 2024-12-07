// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import vtkColorTransferFunction from "@kitware/vtk.js/Rendering/Core/ColorTransferFunction";
import vtkScalarsToColors from "@kitware/vtk.js/Common/Core/ScalarsToColors";
import Constants from "@kitware/vtk.js/Rendering/Core/ColorTransferFunction/Constants";
import macro from "@kitware/vtk.js/macros";

const { ColorSpace, Scale } = Constants;
const { ScalarMappingTarget } = vtkScalarsToColors;
// eslint-enable
const { vtkWarningMacro } = macro;

// ----------------------------------------------------------------------------
// vtkColorTransferFunction methods
// ----------------------------------------------------------------------------

function vtkExtendedColorTransferFunction(publicAPI, model) {
  // Set our className
  model.classHierarchy.push("vtkExtendedColorTransferFunction");

  publicAPI.setThresholdRange = (lower, upper) => {
    model.thresholdRange = [lower, upper];

    publicAPI.modified();
  };

  //----------------------------------------------------------------------------
  publicAPI.mapData = (input, output, outFormat, inputOffset: number) => {
    if (publicAPI.getSize() === 0) {
      vtkWarningMacro("Transfer Function Has No Points!");
      return;
    }

    const alpha = Math.floor(publicAPI.getAlpha() * 255 + 0.5);
    const length = input.getNumberOfTuples();
    const inIncr = input.getNumberOfComponents();

    const outputV = output.getData();
    const inputV = input.getData();
    const rgb = [];

    if (outFormat === ScalarMappingTarget.RGBA) {
      const { thresholdRange } = model;

      const lowerRange = thresholdRange[0];
      const upperRange = thresholdRange[1];

      for (let index = 0; index < length; index++) {
        const x = inputV[index * inIncr + inputOffset];
        publicAPI.getColor(x, rgb);
        outputV[index * 4] = Math.floor(rgb[0] * 255 + 0.5);
        outputV[index * 4 + 1] = Math.floor(rgb[1] * 255 + 0.5);
        outputV[index * 4 + 2] = Math.floor(rgb[2] * 255 + 0.5);
        if (x > upperRange || x < lowerRange) {
          outputV[index * 4 + 3] = 0;
        } else {
          outputV[index * 4 + 3] = alpha;
        }
      }
    }

    if (outFormat === ScalarMappingTarget.RGB) {
      for (let index = 0; index < length; index++) {
        const x = inputV[index * inIncr + inputOffset];
        publicAPI.getColor(x, rgb);
        outputV[index * 3] = Math.floor(rgb[0] * 255 + 0.5);
        outputV[index * 3 + 1] = Math.floor(rgb[1] * 255 + 0.5);
        outputV[index * 3 + 2] = Math.floor(rgb[2] * 255 + 0.5);
      }
    }

    if (outFormat === ScalarMappingTarget.LUMINANCE) {
      for (let index = 0; index < length; index++) {
        const x = inputV[index * inIncr + inputOffset];
        publicAPI.getColor(x, rgb);
        outputV[index] = Math.floor(
          rgb[0] * 76.5 + rgb[1] * 150.45 + rgb[2] * 28.05 + 0.5
        );
      }
    }

    if (outFormat === ScalarMappingTarget.LUMINANCE_ALPHA) {
      for (let index = 0; index < length; index++) {
        const x = inputV[index * inIncr + inputOffset];
        publicAPI.getColor(x, rgb);
        outputV[index * 2] = Math.floor(
          rgb[0] * 76.5 + rgb[1] * 150.45 + rgb[2] * 28.05 + 0.5
        );
        outputV[index * 2 + 1] = alpha;
      }
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  clamping: true,
  colorSpace: ColorSpace.RGB,
  hSVWrap: true,
  scale: Scale.LINEAR,

  nanColor: undefined,
  belowRangeColor: undefined,
  aboveRangeColor: undefined,
  useAboveRangeColor: false,
  useBelowRangeColor: false,

  allowDuplicateScalars: false,

  table: undefined,
  tableSize: 0,
  buildTime: undefined,

  nodes: undefined,

  discretize: false,
  numberOfValues: 256,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkColorTransferFunction.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkExtendedColorTransferFunction(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  "vtkExtendedColorTransferFunction"
);

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...Constants };
