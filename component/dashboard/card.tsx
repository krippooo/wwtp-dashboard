import { Card, CardContent } from "@/component/ui/card"

interface DashboardCardProps {
  title: "COD" | "Suhu" | "TSS" | "pH" | string;
  count: number;
  unit?: string;
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/** kembalikan 0..1: 0 = hijau (bagus), 1 = merah (buruk) */
function getSeverityPercent(title: string, value: number): number {
  switch (title) {
    // Semakin tinggi semakin buruk
    case "COD": {
      const min = 0, max = 100;        // sesuaikan: contoh 0–200 mg/L
      return clamp((value - min) / (max - min), 0, 1);
    }
    case "TSS": {
      const min = 0, max = 50;        // contoh 0–100 NTU
      return clamp((value - min) / (max - min), 0, 1);
    }

    // Two-sided (ada rentang ideal)
    case "Temperature": {
      // ideal 20–35°C; di bawah 10 atau di atas 45 dianggap “merah” penuh
      const hardMin = 10, idealLow = 20, idealHigh = 30, hardMax = 40;
      if (value >= idealLow && value <= idealHigh) return 0; // hijau
      if (value < idealLow) {
        return clamp((idealLow - value) / (idealLow - hardMin), 0, 1);
      } else {
        return clamp((value - idealHigh) / (hardMax - idealHigh), 0, 1);
      }
    }
    case "pH": {
      // ideal 7–8; di bawah 6 atau di atas 9 = “merah” penuh
      const hardMin = 6, idealLow = 7, idealHigh = 8, hardMax = 9;
      if (value >= idealLow && value <= idealHigh) return 0; // hijau
      if (value < idealLow) {
        return clamp((idealLow - value) / (idealLow - hardMin), 0, 1);
      } else {
        return clamp((value - idealHigh) / (hardMax - idealHigh), 0, 1);
      }
    }

    default: {
      // fallback linear 0–100
      const min = 0, max = 100;
      return clamp((value - min) / (max - min), 0, 1);
    }
  }
}

/** warna HSL: 0 → hijau; 1 → merah  */
function percentToHsl(percent: number) {
  const hue = 120 - percent * 120;       // 120(hijau) → 0(merah)
  const sat = 80;                        // tweak kalau mau lebih/kurang jenuh
  const light = 45;                      // 45% aman untuk kontras dengan teks putih
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

const DashboardCard = ({ title, count, unit }: DashboardCardProps) => {
  const severity = getSeverityPercent(title, count);
  const bgColor = percentToHsl(severity);

  // Supaya teks selalu kebaca, pakai text-white + drop shadow ringan
  return (
    <Card
      style={{ backgroundColor: bgColor }}
      className="p-4 pb-0 shadow-xs dark:brightness-90"
    >
      <CardContent>
        <h3 className="text-2xl text-center mb-4 font-bold text-white drop-shadow-sm">
          {title}
        </h3>
        <div className="flex gap-3 justify-center items-center mb-3">
          <h3 className="text-3xl font-semibold text-white drop-shadow-sm">
            {count}
            {unit && <span className="text-lg font-normal ml-1">{unit}</span>}
          </h3>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;