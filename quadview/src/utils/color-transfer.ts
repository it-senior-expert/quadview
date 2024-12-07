import vtkColorTransferFunction from "./vtk-extended-color-transfer-function";

function addRgbPoint(
  lut: any,
  range: { max: number; min: number },
  colorScheme: PointCloudColorScheme = getPointCloudColorScheme({
    id: "principalDensityAnalysis",
  })
) {
  for (const { percentage, color } of colorScheme.colors) {
    if (percentage >= 0 && percentage <= 1) {
      const { max, min } = range;
      const pointOfReference = percentage * Math.abs(max - min) + min;

      lut.addRGBPoint(pointOfReference, ...color);
    }
  }
}

export function makeLut(
  range: { max: number; min: number },
  colorScheme?: PointCloudColorScheme
) {
  const lut = vtkColorTransferFunction.newInstance();

  lut.setUseBelowRangeColor(true);
  lut.setUseAboveRangeColor(true);
  lut.setNanColor(0, 0, 0, 0);
  lut.setAboveRangeColor(0, 0, 0, 0);
  lut.setBelowRangeColor(0, 0, 0, 0);

  addRgbPoint(lut, range, colorScheme);
  lut.setThresholdRange(range.min, range.max);

  return lut;
}

type ColorStop = {
  percentage: number;
  color: [number, number, number];
};

export type PointCloudColorScheme = {
  colors: ColorStop[];
  id: string;
  label: string;

  /**
   * Set to `true` to re-map the colors when the applied threshold changes, so
   * that the full color scheme range is used for the applied (visible)
   * threshold.
   *
   * Set to `false` to keep the color scheme range mapped to the full threshold
   * range, so that the applied (visible) threshold will only use a subset of
   * the available color range
   */
  mapColorsToThreshold: boolean;
};

export const pointCloudColorSchemes: PointCloudColorScheme[] = [
  {
    id: "nativeBone",
    label: "Native Bone",
    colors: [
      { percentage: 0, color: [0.42, 0.149, 0.047] },
      { percentage: 0.15, color: [0.3922, 0.0275, 0.0275] },
      { percentage: 0.3, color: [0.722, 0.608, 0.514] },
      { percentage: 1, color: [0.988, 0.949, 0.906] },
    ],
    mapColorsToThreshold: false,
  },
  {
    // https://coolors.co/gradient-maker/0000ff-00ff00-ffff00-ff0000?position=0,33,67,100&opacity=100,100,100,100&type=linear&rotation=90
    id: "principalDensityAnalysis",
    label: "Principal Density Analysis",
    colors: [
      { percentage: 0, color: [0, 0, 1] },
      { percentage: 0.333_333_333_333, color: [0, 1, 0] },
      { percentage: 0.666_666_666_667, color: [1, 1, 0] },
      { percentage: 1, color: [1, 0, 0] },
    ],
    mapColorsToThreshold: true,
  },
];

export function getPointCloudColorScheme({
  id,
}: {
  id: string;
}): PointCloudColorScheme {
  const colorScheme = pointCloudColorSchemes.find((scheme) => scheme.id === id);

  if (!colorScheme) throw new Error(`Failed to find color scheme. [id=${id}]`);

  return colorScheme;
}
