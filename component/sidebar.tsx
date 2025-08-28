'use client'

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/component/ui/command"
import { FileDown, Notebook, Grip, ChartNoAxesCombined, Wrench } from 'lucide-react'
import Link from "next/link";
import { useEffect, useState } from "react"

export default function Sidebar() {
  const [notes, setNotes] = useState<string>("");

  // Load dari localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebarNotes");
    if (saved) setNotes(saved);
  }, []);

  // Simpan otomatis tiap kali ada perubahan
  useEffect(() => {
    localStorage.setItem("sidebarNotes", notes);
  }, [notes]);

  return ( <div>
    <Command className="bg-foreground mt-5">
  <CommandList>
    <CommandGroup heading="Menu">
      <CommandItem>
        <Grip className="mr-2 h-8 w-8 text-white" />
        <Link href='/'>Dashboard</Link>
      </CommandItem>
      <CommandItem>
        <FileDown className="mr-2 h-8 w-8 text-white" />
        <Link href='/FileUp'>Ekspor File & Dokumen</Link>
      </CommandItem>
      <CommandItem>
        <ChartNoAxesCombined className="mr-2 h-8 w-8 text-white" />
        <Link href='/Graphic'>Data Trend</Link>
      </CommandItem>
      <CommandItem>
        <Wrench className="mr-2 h-8 w-8 text-white" />
        <Link href='/Notes'>Maintenance</Link>
      </CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
      <div className="mt-4 hidden md:block">
        <h4 className="text-sm font-medium mb-1 text-white">Catatan Maintenance</h4>
        <textarea
          className="w-full h-80 p-2 text-sm text-black border rounded-xl bg-card resize-none focus:outline-none"
          placeholder="Tulis catatan..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
</div>
 );
}
