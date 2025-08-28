const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/component/ui/popover";
import { Button } from "@/component/ui/button";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/component/ui/select";

function TimePicker({
  label,
  time,
  setTime,
}: {
  label: string;
  time: string;
  setTime: (t: string) => void;
}) {
  const [hour, minute] = time.split(':');

  const updateTime = (newHour: string, newMinute: string) => {
    setTime(`${newHour}:${newMinute}`);
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Select value={hour} onValueChange={(val) => updateTime(val, minute)}>
          <SelectTrigger className="w-[80px]">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent>
            {hours.map((h) => (
              <SelectItem key={h} value={h}>{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={minute} onValueChange={(val) => updateTime(hour, val)}>
          <SelectTrigger className="w-[80px]">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent>
            {minutes.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
