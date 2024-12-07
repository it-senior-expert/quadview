import { useEffect, RefObject } from "react";
import {
  initializeVolumeViewport,
  useViewportsStore,
} from "../state/viewports";

function useInitializeVtk(vtkContainerRef: RefObject<HTMLDivElement>) {
  const { isVtkInitialized, setIsVtkInitialized } = useViewportsStore();

  useEffect(() => {
    if (!vtkContainerRef.current || isVtkInitialized) {
      return;
    }

    const initialize = async () => {
      try {
        const { centerCamera } = initializeVolumeViewport(
          vtkContainerRef.current!
        );
        useViewportsStore.getState().setCenterCamera(centerCamera);
        setIsVtkInitialized(true);
      } catch (error) {
        console.error("Error initializing VTK:", error);
      }
    };

    initialize();
  }, [vtkContainerRef, isVtkInitialized, setIsVtkInitialized]);
}

export default useInitializeVtk;
