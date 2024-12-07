import vtkXMLImageDataReader from "@kitware/vtk.js/IO/XML/XMLImageDataReader";

export async function loadVTI(url: string): Promise<any> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const reader = vtkXMLImageDataReader.newInstance();
  reader.parseAsArrayBuffer(arrayBuffer);
  const imageData = reader.getOutputData();
  return imageData;
}
