import API from "./api";
import type { WearableDevice } from "@/types";

export const getWearableDevice = async (): Promise<WearableDevice | null> => {
  const { data } = await API.get("/wearables");
  return data.device;
};

export const connectWearableDevice = async (deviceName: string): Promise<WearableDevice> => {
  const { data } = await API.post("/wearables", { deviceName });
  return data.device;
};

export const disconnectWearableDevice = async (): Promise<void> => {
  await API.delete("/wearables");
};

export interface WearableReading {
  heartRate: number;
  recordedAt?: string;
}

// Call with a small buffered batch (the frontend throttles this - see
// SmartwatchConnect - rather than firing one request per heartbeat).
export const syncWearableReadings = async (readings: WearableReading[]): Promise<WearableDevice> => {
  const { data } = await API.post("/wearables/sync", { readings });
  return data.device;
};
