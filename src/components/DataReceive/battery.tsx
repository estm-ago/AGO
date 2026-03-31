import { Battery, BatteryMedium, BatteryFull, BatteryCharging } from "lucide-react";

export function BatteryIcon({ level, charging }: { level: number; charging: boolean }) {
  // level: 0~100
  if (charging) {
    return <BatteryCharging className="w-6 h-6 text-green-500" />;
  }

  if (level > 80) return <BatteryFull className="w-6 h-6 text-green-500" />;
  if (level > 40) return <BatteryMedium className="w-6 h-6 text-yellow-500" />;
  return <Battery className="w-6 h-6 text-red-500" />;
}
