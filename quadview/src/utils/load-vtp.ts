import vtkXMLPolyDataReader from "@kitware/vtk.js/IO/XML/XMLPolyDataReader";
import vtkMapper from "@kitware/vtk.js/Rendering/Core/Mapper";
import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";
import { vtkPolyData } from "@kitware/vtk.js/Common/DataModel/PolyData";

import { makeLut } from "./color-transfer";

/**
 * Interface representing the loaded VTP data.
 */
export interface LoadedVTP {
  actor: vtkActor;
  polyData: vtkPolyData;
  mapper: vtkMapper;
}

/**
 * Common helper function to load and parse a VTP file,
 * create a mapper and actor, and add the actor to the renderer.
 * @param url - The URL of the VTP file to load.
 * @returns A promise that resolves to the loaded actor, polyData, and mapper.
 */
async function loadVTPCommon(url: string): Promise<LoadedVTP> {
  console.log(`Fetching VTP file from: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch VTP file from ${url}: ${response.statusText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const reader = vtkXMLPolyDataReader.newInstance();

  console.log(`Parsing VTP file: ${url}`);
  reader.parseAsArrayBuffer(arrayBuffer);

  const polyData = reader.getOutputData(0) as vtkPolyData;

  const numPoints = polyData.getPoints()?.getNumberOfPoints() || 0;
  console.log(`VTP file "${url}" contains ${numPoints} points`);

  if (numPoints === 0) {
    throw new Error(`No points found in the VTP file: ${url}`);
  }

  const mapper = vtkMapper.newInstance();
  mapper.setInputData(polyData);

  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);

  return { actor, polyData, mapper };
}

/**
 * Loads a VTP file and configures it as a mesh.
 * @param url - The URL of the VTP file to load.
 * @returns A promise that resolves to the loaded actor, polyData, and mapper.
 */
export async function loadMeshVTP(url: string): Promise<LoadedVTP> {
  const { actor, polyData, mapper } = await loadVTPCommon(url);

  // Configure actor for mesh rendering
  actor.getProperty().setRepresentationToSurface(); // Ensure surface representation
  actor.getProperty().setEdgeVisibility(true); // Show edges for mesh
  actor.getProperty().setOpacity(1.0); // Fully opaque

  console.log(`Mesh actor configured for file: ${url}`);

  return { actor, polyData, mapper };
}

/**
 * Loads a VTP file and configures it as a point cloud.
 * @param url - The URL of the VTP file to load.
 * @returns A promise that resolves to the loaded actor, polyData, and mapper.
 */
export async function loadPointCloudVTP(url: string): Promise<LoadedVTP> {
  const { actor, polyData, mapper } = await loadVTPCommon(url);

  // Configure actor for point cloud rendering
  actor.getProperty().setRepresentationToPoints(); // Set representation to points
  actor.getProperty().setPointSize(5); // Adjust point size as needed
  actor.getProperty().setOpacity(0.9); // Set desired opacity
  actor.getProperty().setEdgeVisibility(false); // Hide edges for point cloud

  // Apply color lookup table based on scalar data
  const scalars = polyData.getPointData().getScalars();
  if (scalars) {
    const dataRange = scalars.getRange();
    const lut = makeLut({ min: dataRange[0], max: dataRange[1] });
    mapper.setLookupTable(lut);
    mapper.setScalarRange(dataRange);
    mapper.setScalarModeToUsePointData();
  } else {
    console.warn(
      `No scalar data found in point cloud VTP file: ${url}. Skipping color mapping.`
    );
  }

  console.log(`Point cloud actor configured for file: ${url}`);

  return { actor, polyData, mapper };
}

/**
 * Determines the type of VTP file based on the URL and uses the appropriate loader.
 * @param url - The URL of the VTP file to load.
 * @returns A promise that resolves to the loaded actor, polyData, and mapper.
 */
export async function loadVTP(url: string): Promise<LoadedVTP> {
  const lowerCaseUrl = url.toLowerCase();

  if (lowerCaseUrl.includes("mesh")) {
    return loadMeshVTP(url);
  } else if (
    lowerCaseUrl.includes("pointcloud") ||
    lowerCaseUrl.includes("point_cloud")
  ) {
    return loadPointCloudVTP(url);
  } else {
    throw new Error(
      `Unknown VTP type for URL: ${url}. Unable to determine loader.`
    );
  }
}
