// Connects directly to a nearby Bluetooth Low Energy device from the browser
// and streams its heart rate - no vendor app, account or cloud API involved.
// This works for any device (smartwatch, fitness band, or chest strap) that
// implements the standard BLE Heart Rate service most fitness hardware
// supports (Garmin, Polar, Wahoo, many Android watches, and others). It
// deliberately does NOT claim to integrate with Apple Health, Fitbit's or
// Google's cloud APIs - those need a native app or a server-side OAuth
// integration this web app doesn't have.
//
// Browser support: Web Bluetooth only exists in Chromium-based browsers
// (Chrome/Edge) on desktop and Android, over HTTPS, and only after the
// person explicitly picks a device from the browser's own picker UI - there
// is no way to scan or connect silently. It is not available in Safari or
// Firefox. Callers should check isWebBluetoothSupported() first.

export const HEART_RATE_SERVICE = "heart_rate";
const HEART_RATE_MEASUREMENT_CHARACTERISTIC = "heart_rate_measurement";

export const isWebBluetoothSupported = (): boolean =>
  typeof navigator !== "undefined" && !!navigator.bluetooth;

// Parses the Heart Rate Measurement characteristic's value per the Bluetooth
// SIG spec: byte 0 is a flags bitfield whose lowest bit says whether the
// heart rate value is 8-bit or 16-bit; the value follows immediately after.
export const parseHeartRateMeasurement = (value: DataView): number => {
  const flags = value.getUint8(0);
  const is16Bit = (flags & 0x1) !== 0;
  return is16Bit ? value.getUint16(1, /* littleEndian */ true) : value.getUint8(1);
};

export interface HeartRateSession {
  deviceName: string;
  disconnect: () => void;
}

// Opens the browser's native "choose a device" picker filtered to devices
// advertising the Heart Rate service, connects, and subscribes to live
// readings. Rejects if the person cancels the picker, no compatible device
// is nearby, or the connection drops before subscribing.
export const connectHeartRateMonitor = async (
  onReading: (bpm: number) => void,
  onDisconnected: () => void
): Promise<HeartRateSession> => {
  if (!navigator.bluetooth) {
    throw new Error("Web Bluetooth isn't supported in this browser.");
  }

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [HEART_RATE_SERVICE] }],
  });

  const handleGattDisconnected = () => onDisconnected();
  device.addEventListener("gattserverdisconnected", handleGattDisconnected);

  if (!device.gatt) throw new Error("This device doesn't support a GATT connection.");
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(HEART_RATE_SERVICE);
  const characteristic = await service.getCharacteristic(HEART_RATE_MEASUREMENT_CHARACTERISTIC);

  const handleValueChanged = () => {
    if (characteristic.value) onReading(parseHeartRateMeasurement(characteristic.value));
  };
  characteristic.addEventListener("characteristicvaluechanged", handleValueChanged);
  await characteristic.startNotifications();

  const disconnect = () => {
    characteristic.removeEventListener("characteristicvaluechanged", handleValueChanged);
    device.removeEventListener("gattserverdisconnected", handleGattDisconnected);
    characteristic.stopNotifications().catch(() => {});
    device.gatt?.disconnect();
  };

  return { deviceName: device.name || "Bluetooth heart rate monitor", disconnect };
};
