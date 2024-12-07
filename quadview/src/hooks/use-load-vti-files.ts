// hooks/useLoadVtiFiles.ts

import { useEffect, useState } from "react";
import vtkXMLImageDataReader from "@kitware/vtk.js/IO/XML/XMLImageDataReader";

import { useViewportsStore } from "../state/viewports";
import { useVolumeStore } from "../state/volume";
import { useBoneMasksStore } from "../state/bone-masks";

const useLoadVtiFiles = ({
  vtiUrls,
}: {
  vtiUrls?: {
    volumeUrl: string;
    boneMasksUrl: string;
  };
}): {
  volumeLoading: boolean;
  volumeError: string | null;
  boneMasksLoading: boolean;
  boneMasksError: string | null;
} => {
  const { isVtkInitialized } = useViewportsStore.getState();
  const { setVolume } = useVolumeStore.getState();
  const { setBoneMasks } = useBoneMasksStore.getState();

  const [volumeLoading, setVolumeLoading] = useState<boolean>(false);
  const [volumeError, setVolumeError] = useState<string | null>(null);
  const [boneMasksLoading, setBoneMasksLoading] = useState<boolean>(false);
  const [boneMasksError, setBoneMasksError] = useState<string | null>(null);

  // Function to fetch and parse a VTI file
  const fetchVTIData = async (url: string): Promise<any> => {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/xml",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const reader = vtkXMLImageDataReader.newInstance();
    reader.parseAsArrayBuffer(arrayBuffer);
    const data = reader.getOutputData();

    return data;
  };

  useEffect(() => {
    // Early return if VTK is not initialized or URLs are missing
    if (!isVtkInitialized || !vtiUrls) return;

    let isMounted = true;

    // Load Volume Image
    const loadVolume = async () => {
      setVolumeLoading(true);
      try {
        const volumeData = await fetchVTIData(vtiUrls.volumeUrl);
        setVolume(volumeData);
        console.log("Volume VTI file loaded successfully:", volumeData);
      } catch (err: any) {
        console.error("Error loading Volume VTI file:", err);
        if (isMounted) {
          setVolumeError(err.message);
        }
      } finally {
        if (isMounted) {
          setVolumeLoading(false);
        }
      }
    };

    // Load Bone Masks
    const loadBoneMasks = async () => {
      setBoneMasksLoading(true);
      try {
        const boneMasksData = await fetchVTIData(vtiUrls.boneMasksUrl);
        setBoneMasks(boneMasksData);
        console.log("Bone Masks VTI file loaded successfully:", boneMasksData);
      } catch (err: any) {
        console.error("Error loading Bone Masks VTI file:", err);
        if (isMounted) {
          setBoneMasksError(err.message);
        }
      } finally {
        if (isMounted) {
          setBoneMasksLoading(false);
        }
      }
    };

    // Initiate both loading processes concurrently
    loadVolume();
    loadBoneMasks();

    // Cleanup function to prevent state updates if component is unmounted
    return () => {
      isMounted = false;
    };
  }, [vtiUrls, isVtkInitialized, setVolume, setBoneMasks]);

  return { volumeLoading, volumeError, boneMasksLoading, boneMasksError };
};

export default useLoadVtiFiles;
