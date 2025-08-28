// Code buat page utama yang file export

"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/component/ui/card";
import { Button } from "@/component/ui/button";
import { Calendar } from "@/component/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/component/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/component/ui/select";
import { DateRange } from "react-day-picker";
import DokumenCard from "@/component/Fileup/addDocs";
import { Label } from "@/component/ui/label"

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// helper: format tanggal lokal (bukan UTC)
function formatLocalDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function TimePicker({ label, time, setTime }: { label: string; time: string; setTime: (t: string) => void }) {
  const [hour, minute] = time.split(":");
  const updateTime = (newHour: string, newMinute: string) => {
    setTime(`${newHour}:${newMinute}`);
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] md:text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Select value={hour} onValueChange={(val) => updateTime(val, minute)}>
          <SelectTrigger className="w-[72px] md:w-[80px]">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent>
            {hours.map((h) => (
              <SelectItem key={h} value={h}>{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={minute} onValueChange={(val) => updateTime(hour, val)}>
          <SelectTrigger className="w-[72px] md:w-[80px]">
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

export default function FilterCard() {
  // STATE untuk export T-500/T-700 (existing)
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [dropdown1, setDropdown1] = React.useState<string>();
  const [startTime, setStartTime] = React.useState("00:01");
  const [endTime, setEndTime] = React.useState("23:59");

  // STATE untuk export TASKS (baru)
  const [taskRange, setTaskRange] = React.useState<DateRange | undefined>(undefined);

  // EXPORT T-500/T-700 (existing)
  const handleExport = () => {
    if (!dateRange?.from || !dateRange?.to || !dropdown1) {
      alert("Mohon lengkapi semua filter terlebih dahulu.");
      return;
    }
    const from = dateRange.from < dateRange.to ? dateRange.from : dateRange.to;
    const to   = dateRange.from < dateRange.to ? dateRange.to   : dateRange.from;

    const start = `${formatLocalDate(from)} ${startTime}:00`;
    const end   = `${formatLocalDate(to)} ${endTime}:59`;

    const table = `t${dropdown1}`;
    const url = `/api/export?table=${table}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    window.open(url, "_blank");
  };

  // EXPORT log tasks
  const handleExportTasks = () => {
    if (!taskRange?.from || !taskRange?.to) {
      alert("Pilih rentang tanggal due terlebih dahulu.");
      return;
    }
    const from = taskRange.from < taskRange.to ? taskRange.from : taskRange.to;
    const to   = taskRange.from < taskRange.to ? taskRange.to   : taskRange.from;

    const start = formatLocalDate(from); // YYYY-MM-DD
    const end   = formatLocalDate(to);   // YYYY-MM-DD

    const url = `/api/tasks/export?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    window.open(url, "_blank");
  };

  return (
    <div className='mx-auto w-full max-w-[1280px] px-3 md:px-4 mt-2'>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Card Export T-500/T-700 (existing) */}
      <Card className="w-full h-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg">Ekspor Data Kualitas Air</CardTitle>
          <CardDescription className="text-xs md:text-sm">Pilih rentang tanggal, waktu, dan jenis tank untuk mengekspor data kualitas air.</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">Pilih Rentang</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-[640px] p-4 sm:p-6 bg-card text-black">
              <DialogHeader>
                <DialogTitle>Ekspor Data Kualitas Air</DialogTitle>
                  <DialogDescription className="sr-only">
                    Pilih tanggal, waktu, dan tank untuk ekspor data.
                  </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-[60%] flex flex-col items-center">
                  <h4 className="text-sm font-medium mb-1 text-center items-center">Rentang Tanggal</h4>
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    className="rounded-md border"
                  />
                </div>
                <div className="w-full md:w-[40%] md:pl-4">
                  {/* HP: 3 kolom (Tank | Jam Awal | Jam Akhir), md+: stacked */}
                  <div className="grid grid-cols-2 gap-3 md:block">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Opsi Tank</h4>
                      <Select value={dropdown1} onValueChange={setDropdown1}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih Tank" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="500">T-500</SelectItem>
                          <SelectItem value="700">T-700</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-rows-2 gap-3 md:mt-2">
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="startTime" className="text-[11px] md:text-xs font-medium text-black opacity-80">
                          Jam Awal
                        </Label>
                        <input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} step={60} className="border rounded-md border-background px-2 py-2 text-xs md:text-sm w-full"/>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="endTime" className="text-[11px] md:text-xs font-medium text-black opacity-80">
                          Jam Akhir
                        </Label>
                        <input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} step={60} className="border rounded-md border-background px-2 py-2 text-xs md:text-sm w-full"/>
                      </div>
                    </div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-6 md:self-end">
                    <Button variant="destructive" onClick={handleExport} className="w-full bg-background md:w-auto hover:bg-foreground">
                      Export
                    </Button>
                  </div>
                </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Card Export log tasks */}
      <Card className="w-full h-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg">Ekspor Log Maintenance</CardTitle>
          <CardDescription className="text-xs md:text-sm">Pilih rentang tanggal untuk mengekspor log maintenance.</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">Pilih Rentang</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-[640px] p-4 sm:p-6 bg-card text-black">
              <DialogHeader>
                <DialogTitle>Ekspor Log Maintenance</DialogTitle>
                <DialogDescription className="sr-only">Pilih tanggal log maintenance</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-[60%] flex flex-col items-center">
                  <h4 className="text-sm font-medium mb-2 text-center">Rentang Tanggal</h4>
                  <Calendar
                    mode="range"
                    selected={taskRange}
                    onSelect={setTaskRange}
                    className="rounded-md border"
                  />
                </div>
                <div className="w-full md:w-[40%] md:pl-4 text-xs md:text-sm text-black">
                  <p>• Menggunakan tanggal yang tertera pada kolom "due"</p>
                  <p>• Tanpa jam — hanya tanggal awal & akhir.</p>
                  <p>• Urutan: Tugas-tugas yang belum diselesaikan akan berada di baris awal</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="destructive" onClick={handleExportTasks} className="bg-background hover:bg-foreground">
                  Export
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
      <div className="w-full">
        <DokumenCard />
      </div>
    </div>
    </div>
  );
}
