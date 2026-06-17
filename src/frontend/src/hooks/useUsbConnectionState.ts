import { useEffect, useState } from "react";

/**
 * Custom React hook that dynamically detects whether a specific USB device
 * (by its serial number) or ANY authorized USB device is physically connected to the computer.
 */
export function useUsbConnectionState(
  deviceSerialNumber: string,
  initialStatus: string,
) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("usb" in navigator)) {
      setIsConnected(false);
      return;
    }

    const usb = (navigator as any).usb;

    const checkConnection = async () => {
      try {
        const devices = await usb.getDevices();
        const connected = deviceSerialNumber
          ? devices.some((d: any) => d.serialNumber === deviceSerialNumber)
          : devices.length > 0;
        setIsConnected(connected);
      } catch (err) {
        console.warn("Failed to check USB connection status:", err);
        setIsConnected(false);
      }
    };

    checkConnection();

    const handleConnect = (e: any) => {
      if (
        !deviceSerialNumber ||
        (e.device && e.device.serialNumber === deviceSerialNumber)
      ) {
        setIsConnected(true);
      }
    };

    const handleDisconnect = async (e: any) => {
      if (deviceSerialNumber) {
        if (e.device && e.device.serialNumber === deviceSerialNumber) {
          setIsConnected(false);
        }
      } else {
        try {
          const devices = await usb.getDevices();
          setIsConnected(devices.length > 0);
        } catch (err) {
          setIsConnected(false);
        }
      }
    };

    usb.addEventListener("connect", handleConnect);
    usb.addEventListener("disconnect", handleDisconnect);

    return () => {
      usb.removeEventListener("connect", handleConnect);
      usb.removeEventListener("disconnect", handleDisconnect);
    };
  }, [deviceSerialNumber]);

  return isConnected;
}
