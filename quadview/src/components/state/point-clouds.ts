import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";
import vtkMapper from "@kitware/vtk.js/Rendering/Core/Mapper";
import { vtkPolyData } from "@kitware/vtk.js/Common/DataModel/PolyData";

export interface PointCloud {
  id: string;
  color: [number, number, number];
  actor: vtkActor;
  polyData: vtkPolyData;
  mapper: vtkMapper;
}

interface PointCloudsState {
  pointClouds: PointCloud[];
}

interface PointCloudsActions {
  setPointClouds: (pointClouds: PointCloud[]) => void;
}

export const usePointCloudsStore = create(
  immer<PointCloudsState & PointCloudsActions>((set) => ({
    pointClouds: [],
    setPointClouds: (pointClouds) =>
      set((state) => {
        state.pointClouds = pointClouds;
      }),
  }))
);
