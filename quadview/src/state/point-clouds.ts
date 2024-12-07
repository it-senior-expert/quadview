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
  pointClouds: Record<string, PointCloud>;
}

interface PointCloudsActions {
  setPointCloud: (pointCloud: PointCloud) => void;
  setPointClouds: (pointClouds: PointCloud[]) => void;
}

export const usePointCloudsStore = create(
  immer<PointCloudsState & PointCloudsActions>((set) => ({
    pointClouds: {},
    setPointCloud: (pointCloud) =>
      set((state) => {
        state.pointClouds[pointCloud.id] = pointCloud;
      }),
    setPointClouds: (pointClouds) =>
      set((state) => {
        pointClouds.forEach((pointCloud) => {
          state.pointClouds[pointCloud.id] = pointCloud;
        });
      }),
  }))
);
