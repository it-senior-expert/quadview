// hooks/useScanData.ts

import { useState, useEffect } from "react";

interface BoneData {
  pointCloudUrl: string;
  meshUrl: string;
}

interface VtiData {
  volumeUrl: string;
  boneMasksUrl: string;
}

interface ScanData {
  vtp: Record<string, BoneData>;
  vti: VtiData;
}

interface UseScanDataReturn {
  data: ScanData | null;
  loading: boolean;
  error: string | null;
}

const useScanData = (): UseScanDataReturn => {
  const [data, setData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScanData = async () => {
      setLoading(true);
      try {
        // Replace this static data with an API call if needed
        const vtp: Record<string, BoneData> = {
          femur: {
            pointCloudUrl: "/femur_pointcloud.vtp",
            meshUrl: "/femur_mesh.vtp",
          },
          tibia: {
            pointCloudUrl: "/tibia_pointcloud.vtp",
            meshUrl: "/tibia_mesh.vtp",
          },
          patella: {
            pointCloudUrl: "/patella_pointcloud.vtp",
            meshUrl: "/patella_mesh.vtp",
          },
          fibula: {
            pointCloudUrl: "/fibula_pointcloud.vtp",
            meshUrl: "/fibula_mesh.vtp",
          },
        };

        const vti: VtiData = {
          volumeUrl: "/dicom_image.vti",
          boneMasksUrl: "/segmentation_mask.vti",
        };

        setData({ vtp, vti });
      } catch (err: any) {
        setError(err.message || "Failed to fetch scan data.");
      } finally {
        setLoading(false);
      }
    };

    fetchScanData();
  }, []);

  return { data, loading, error };
};

export default useScanData;
