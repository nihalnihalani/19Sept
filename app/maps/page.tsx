"use client";

import React from "react";

// Fixed host: always load GeoTaste from localhost:5000
const GEOTASTE_URL = "http://localhost:5000";

export default function MapsHostPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Maps</span>
            <span className="text-xs text-muted-foreground">GeoTaste hosted at localhost:5000</span>
          </div>
          <div className="flex items-center gap-2">
            <a className="text-xs underline text-blue-600" href="/">Back to Studio</a>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <iframe
          src={GEOTASTE_URL}
          className="w-full h-[calc(100dvh-56px)]"
          style={{ border: 0 }}
          allow="geolocation *; microphone *; camera *; clipboard-read *; clipboard-write *;"
        />
      </main>
    </div>
  );
}
