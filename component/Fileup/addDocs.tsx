"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/component/ui/card";
import { ExternalLink } from "lucide-react";

type Doc = { label: string; url: string };

export default function DokumenCard() {
  const dokumen: Doc[] = [
    { label: "SOP Maintenance Monitoring Kualitas Air", url: "https://drive.google.com/file/d/1X_Z_wAcrKo7kdV0X46jawy3kWiOH3Vkt/view?usp=sharing" },
    { label: "User Manual Web Dashboard (Bahasa ver.)", url: "https://drive.google.com/file/d/1GlbSD9Ini6_t6tLt3ez0YA14zSS7RoTV/view?usp=sharing" },
    { label: "Manual book sensor COD", url: "https://drive.google.com/file/d/1sJ1PTFSaeyg9CyebEQajo_-VJQgwPKRS/view" },
    { label: "Manual book sensor TSS", url: "https://drive.google.com/file/d/1sCQJA7hS5pZjEn2YM7IzS45TmXv0FOzK/view" },
    { label: "Manual book sensor pH", url: "https://drive.google.com/file/d/1sESdGwTeL-EuvxV-NuUJEgmoODmVLgQ8/view" },

  ];

  return (
    <Card className="w-full border-2 bg-card">
      <CardHeader>
        <CardTitle>Dokumen</CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {dokumen.length === 0 ? (
          <div className="text-sm text-muted-foreground">Belum ada dokumen.</div>
        ) : (
          <ul className="space-y-2" role="list">
            {dokumen.map((d, i) => (
              <li key={i} role="listitem">
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-md border px-3 py-2 text-sm transition
                             hover:bg-[#0000002c] hover:text-black focus-visible:outline-none
                             focus-visible:ring-2 focus-visible:ring-ring"
                  title={d.label}
                >
                  <span className="truncate">{d.label}</span>
                  <ExternalLink className="h-4 w-4 opacity-40 group-hover:opacity-80" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
