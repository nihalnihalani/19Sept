"use client";

import React, { useMemo, useState } from "react";

// This page hosts the external GeoTaste app (running separately) inside an iframe
// and provides quick controls to point to a configurable URL.
// Configure default via env NEXT_PUBLIC_GEOTASTE_URL or fall back to localhost:4000

const DEFAULT_URL = process.env.NEXT_PUBLIC_GEOTASTE_URL || "http://localhost:4000";

export default function MapsHostPage() {
  const [url, setUrl] = useState<string>(DEFAULT_URL);
  const safeUrl = useMemo(() => {
    try {
      const u = new URL(url);
      return u.toString();
    } catch {
      try { return new URL(DEFAULT_URL).toString(); } catch { return "http://localhost:4000"; }
    }
  }, [url]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Maps</span>
            <span className="text-xs text-muted-foreground">Hosting external GeoTaste app</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              className="border rounded px-2 py-1 text-sm w-[360px]"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:4000"
            />
            <a
              className="text-xs underline text-blue-600"
              href="/"
            >
              Back to Studio
            </a>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <iframe
          key={safeUrl}
          src={safeUrl}
          className="w-full h-[calc(100dvh-56px)]"
          style={{ border: 0 }}
          allow="geolocation *; microphone *; camera *; clipboard-read *; clipboard-write *;"
        />
      </main>
    </div>
  );
}
