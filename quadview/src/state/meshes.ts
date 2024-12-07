import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";
import vtkMapper from "@kitware/vtk.js/Rendering/Core/Mapper";
import { vtkPolyData } from "@kitware/vtk.js/Common/DataModel/PolyData";

export interface Mesh {
  id: string;
  color: [number, number, number];
  actor: vtkActor;
  polyData: vtkPolyData;
  mapper: vtkMapper;
}

interface MeshesState {
  meshes: Record<string, Mesh>;
}

interface MeshesActions {
  setMesh: (mesh: Mesh) => void;
  setMeshes: (meshes: Mesh[]) => void;
}

export const useMeshesStore = create(
  immer<MeshesState & MeshesActions>((set) => ({
    meshes: {},
    setMesh: (mesh) =>
      set((state) => {
        state.meshes[mesh.id] = mesh;
      }),
    setMeshes: (meshes) =>
      set((state) => {
        meshes.forEach((mesh) => {
          state.meshes[mesh.id] = mesh;
        });
      }),
  }))
);
