import { useEffect } from "react";
import { ForensicPipeline } from "./ForensicPipeline";

interface ExtractionProgressProps {
  progress: number;
  currentStepIndex: number;
  onComplete?: () => void;
  deviceModel?: string;
  serialNumber?: string;
  smsCount?: number;
  callCount?: number;
  appCount?: number;
  mediaCount?: number;
  browserCount?: number;
  isRealDevice?: boolean;
}

export function ExtractionProgress({
  progress,
  currentStepIndex,
  onComplete,
  deviceModel,
  serialNumber,
  smsCount,
  callCount,
  appCount,
  mediaCount,
  browserCount,
  isRealDevice,
}: ExtractionProgressProps) {
  useEffect(() => {
    if (progress >= 100 && onComplete) {
      const timer = setTimeout(onComplete, 800);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  return (
    <div className="w-full">
      <ForensicPipeline
        progress={progress}
        currentStepIndex={currentStepIndex}
        deviceModel={deviceModel}
        serialNumber={serialNumber}
        smsCount={smsCount}
        callCount={callCount}
        appCount={appCount}
        mediaCount={mediaCount}
        browserCount={browserCount}
        isRealDevice={isRealDevice}
      />
    </div>
  );
}

