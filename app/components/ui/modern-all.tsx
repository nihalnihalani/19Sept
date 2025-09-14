"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useStudio } from "@/lib/useStudio";
import { Loader2, Upload, Wand2, Play, CheckCircle2, AlertTriangle } from "lucide-react";

interface AudiencePlan {
  key: "jp_genz_tech" | "bedouin_genz_whiteblue";
  title: string;
  description: string;
}

const audiences: AudiencePlan[] = [
  {
    key: "jp_genz_tech",
    title: "Japanese Gen Z (Tech-forward)",
    description: "Urban, tech-savvy Gen Z in Japan; emphasize innovation, neon, minimal yet playful composition, anime/cyberpunk influences."
  },
  {
    key: "bedouin_genz_whiteblue",
    title: "Bedouin Gen Z (White/Blue Traditional)",
    description: "Desert-dwelling Bedouin Gen Z; cool white and blue attire, sand/sky palette, cultural pride, tradition-meets-modern."
  }
];

export function ModernAll() {
  const studio = useStudio();

  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState<
    | "idle"
    | "analyze"
    | "cultural"
    | "gen_images"
    | "gen_videos"
    | "done"
    | "error"
  >("idle");
  const [log, setLog] = useState<string[]>([]);
  const [insights, setInsights] = useState<any | null>(null);
  const [results, setResults] = useState<{
    images: Record<string, { url: string } | null>;
    videos: Record<string, { url: string } | null>;
  }>({ images: { jp_genz_tech: null, bedouin_genz_whiteblue: null }, videos: { jp_genz_tech: null, bedouin_genz_whiteblue: null } });
  const [audiencePrompts, setAudiencePrompts] = useState<Record<string, string>>({});
  const [videoBusy, setVideoBusy] = useState<Record<string, boolean>>({});

  const appendLog = useCallback((line: string) => setLog((l) => [...l, line]), []);

  const handleFile = (f: File) => {
    setFile(f);
    const objectUrl = URL.createObjectURL(f);
    setImageUrl(objectUrl);
  };

  const runFlow = async () => {
    if (!file && !imageUrl) return;
    setRunning(true);
    setStep("analyze");
    setLog([]);

    try {
      // 1) Analyze image via OpenAI Vision proxy
      appendLog("Analyzing image...");
      const form = new FormData();
      if (file) form.append("image", file);
      if (!file && imageUrl) {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        form.append("image", new File([blob], "input.png", { type: blob.type || "image/png" }));
      }
      const analyze = await fetch("/api/vision/analyze", { method: "POST", body: form });
      if (!analyze.ok) throw new Error(await analyze.text());
      const analyzed = await analyze.json();
      setInsights(analyzed.insights);

      // 2) Cultural targeting via existing Cultural API to seed prompts (can reuse city/country if desired)
      setStep("cultural");
      appendLog("Fetching cultural signals for both audiences...");
      // We call cultural intelligence for a neutral location to get structures; then tailor audiences below
      const culturalResp = await fetch("/api/cultural/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: "Tokyo", country: "Japan", analysisDepth: "basic" })
      });
      const cultural = culturalResp.ok ? await culturalResp.json() : { analysis: {} };
      try { if (cultural?.analysis) studio.setCulturalContext(cultural.analysis); } catch {}

      // Build prompts for each audience
      const baseSummary = summarizeInsights(analyzed.insights);
      const promptA = buildAudiencePrompt(baseSummary, cultural.analysis, audiences[0]);
      const promptB = buildAudiencePrompt(baseSummary, cultural.analysis, audiences[1]);
      setAudiencePrompts({ [audiences[0].key]: promptA, [audiences[1].key]: promptB });

      // 3) Generate two images (edit if file exists; else generate)
      setStep("gen_images");
      appendLog("Generating audience-specific images...");

      const imageA = await generateOrEditImage(promptA, file);
      setResults((r) => ({ ...r, images: { ...r.images, [audiences[0].key]: imageA ? { url: imageA } : null } }));
      if (imageA) try { studio.setImage({ url: imageA }); } catch {}

      const imageB = await generateOrEditImage(promptB, file);
      setResults((r) => ({ ...r, images: { ...r.images, [audiences[1].key]: imageB ? { url: imageB } : null } }));
      if (imageB) try { studio.setImage({ url: imageB }); } catch {}

      // 4) Generate two videos (prompt can re-use audience prompt; optionally include image URLs if your video API supports it)
      setStep("gen_videos");
      appendLog("Generating audience-specific videos...");

      const videoA = await generateVideoFromPrompt(promptA, { onLog: (m) => appendLog(m) });
      setResults((r) => ({ ...r, videos: { ...r.videos, [audiences[0].key]: videoA ? { url: videoA } : null } }));
      if (videoA) {
        appendLog("Video A ready.");
        try { studio.setVideo({ url: videoA }); } catch {}
      } else {
        appendLog("Video A not ready (timed out or failed). You can retry with the button below.");
      }

      const videoB = await generateVideoFromPrompt(promptB, { onLog: (m) => appendLog(m) });
      setResults((r) => ({ ...r, videos: { ...r.videos, [audiences[1].key]: videoB ? { url: videoB } : null } }));
      if (videoB) {
        appendLog("Video B ready.");
        try { studio.setVideo({ url: videoB }); } catch {}
      } else {
        appendLog("Video B not ready (timed out or failed). You can retry with the button below.");
      }

      const bothVideosReady = !!(videoA && videoB);
      setStep("done");
      appendLog(bothVideosReady ? "Flow complete. Two images and two videos produced." : "Flow complete. Images produced. One or more videos pending/failed – you can retry per audience.");
    } catch (e: any) {
      console.error(e);
      appendLog(`Error: ${e?.message || e}`);
      setStep("error");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500">
            <Wand2 className="h-5 w-5 text-white" />
          </div>
          <Badge variant="secondary" className="text-xs">All-in-One Pipeline</Badge>
        </div>
        <h1 className="text-2xl font-semibold">Upload → Analyze → Target → 2 Images → 2 Videos</h1>
        <p className="text-muted-foreground">Runs the full pipeline for two cultural audiences using OpenAI Vision + Qloo + your existing generators.</p>
      </motion.div>

      {/* Upload */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const files = Array.from((e.target as HTMLInputElement).files || []);
                  if (files[0]) handleFile(files[0]);
                };
                input.click();
              }}
            >
              <Upload className="h-4 w-4 mr-2" /> Upload Image
            </Button>
            {file && <span className="text-sm text-muted-foreground">{file.name}</span>}
          </div>
          {imageUrl && (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="input" className="max-h-64 rounded border" />
            </div>
          )}
          <div className="pt-2">
            <Button onClick={runFlow} disabled={running || (!file && !imageUrl)}>
              {running ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running Flow...</>) : (<>Run Full Flow</>)}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress / Logs */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            {step === "done" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : step === "error" ? <AlertTriangle className="h-4 w-4 text-yellow-500" /> : <Loader2 className="h-4 w-4 animate-spin" />}
            <span className="text-sm">Step: {step}</span>
          </div>
          <pre className="text-xs whitespace-pre-wrap text-muted-foreground max-h-48 overflow-auto">{log.join("\n")}</pre>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {audiences.map((a) => {
          const img = results.images[a.key];
          const vid = results.videos[a.key];
          const prompt = audiencePrompts[a.key] || '';
          return (
            <Card key={a.key} className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  </div>
                </div>
                {img?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img.url} className="w-full rounded border" alt={a.title} />
                ) : (
                  <div className="text-xs text-muted-foreground">Image pending...</div>
                )}
                {/* Video Row: show prompt with Generate Video button and the resulting video */}
                <div className="mt-2 space-y-2">
                  <div>
                    <p className="text-xs font-medium">Video Prompt (inspired by Qloo + image understanding)</p>
                    <pre className="text-[11px] whitespace-pre-wrap text-muted-foreground max-h-32 overflow-auto border rounded p-2 bg-muted/30">
                      {prompt || 'Prompt will appear after analysis'}
                    </pre>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!prompt || videoBusy[a.key]) return;
                        setVideoBusy((vb) => ({ ...vb, [a.key]: true }));
                        try {
                          setStep('gen_videos');
                          appendLog(`Generating video for ${a.title}...`);
                          const videoUrl = await generateVideoFromPrompt(prompt, { onLog: (m) => appendLog(m) });
                          setResults((r) => ({ ...r, videos: { ...r.videos, [a.key]: videoUrl ? { url: videoUrl } : null } }));
                          if (videoUrl) try { studio.setVideo({ url: videoUrl }); } catch {}
                        } finally {
                          setVideoBusy((vb) => ({ ...vb, [a.key]: false }));
                        }
                      }}
                      disabled={running || !prompt || !!videoBusy[a.key]}
                    >
                      Generate Video
                    </Button>
                  </div>
                  {vid?.url ? (
                    <video src={vid.url} className="w-full rounded border" controls />
                  ) : (
                    <div className="text-xs text-muted-foreground">Video pending...</div>
                  )}
                </div>
                <div className="pt-1 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { if (img?.url) { try { studio.setImage({ url: img.url }); } catch {} window.history.pushState({}, '', '/edit'); window.dispatchEvent(new PopStateEvent('popstate')); }}}>Open in Edit</Button>
                  <Button variant="outline" size="sm" onClick={() => { if (img?.url) { try { studio.setImage({ url: img.url }); } catch {} window.history.pushState({}, '', '/video'); window.dispatchEvent(new PopStateEvent('popstate')); }}}>
                    <Play className="h-4 w-4 mr-1" /> Use for Video
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function summarizeInsights(ins: any): string {
  try {
    const parts: string[] = [];
    if (ins?.subjects) parts.push(`subjects: ${JSON.stringify(ins.subjects)}`);
    if (ins?.styles) parts.push(`styles: ${JSON.stringify(ins.styles)}`);
    if (ins?.colors) parts.push(`colors: ${JSON.stringify(ins.colors)}`);
    if (ins?.composition) parts.push(`composition: ${JSON.stringify(ins.composition)}`);
    if (ins?.mood) parts.push(`mood: ${JSON.stringify(ins.mood)}`);
    if (ins?.brands || ins?.logos) parts.push(`brands: ${JSON.stringify(ins.brands || ins.logos)}`);
    if (ins?.cultural || ins?.demographic) parts.push(`cultural: ${JSON.stringify(ins.cultural || ins.demographic)}`);
    return parts.join("; ");
  } catch {
    return "";
  }
}

function buildAudiencePrompt(baseSummary: string, culture: any, audience: AudiencePlan): string {
  const cultureHints = culture ? JSON.stringify({ aesthetics: culture?.aesthetics, communication: culture?.communication, themes: culture?.themes }) : "";
  return [
    `Base image analysis: ${baseSummary}`,
    `Target audience: ${audience.title}`,
    `Audience description: ${audience.description}`,
    cultureHints && `Relevant cultural cues: ${cultureHints}`,
    `Goal: produce a high-quality visual that resonates with this audience while staying tasteful and brand-safe.`
  ].filter(Boolean).join("\n");
}

async function generateOrEditImage(prompt: string, uploaded?: File | null): Promise<string | null> {
  try {
    if (uploaded) {
      // Try edit route first
      const form = new FormData();
      form.append('prompt', prompt);
      form.append('imageFile', uploaded);
      const edit = await fetch('/api/gemini/edit', { method: 'POST', body: form });
      if (edit.ok) {
        const json = await edit.json();
        if (json?.image?.imageBytes) {
          return `data:${json.image.mimeType};base64,${json.image.imageBytes}`;
        } else if (json?.image?.url) {
          return json.image.url as string;
        }
      }
    }
    // fallback: pure generate
    const gen = await fetch('/api/imagen/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
    if (!gen.ok) return null;
    const gjson = await gen.json();
    if (gjson?.image?.imageBytes) return `data:${gjson.image.mimeType};base64,${gjson.image.imageBytes}`;
    if (gjson?.image?.url) return gjson.image.url as string;
    return null;
  } catch {
    return null;
  }
}

async function generateVideoFromPrompt(prompt: string, opts?: { onLog?: (m: string) => void }): Promise<string | null> {
  try {
    const form = new FormData();
    form.append('prompt', prompt);
    form.append('model', 'veo-3.0-generate-001');
    const resp = await fetch('/api/veo/generate', { method: 'POST', body: form });
    if (!resp.ok) return null;
    const gen = await resp.json();
    const name = gen?.name as string | undefined;
    if (!name) return null;

    // poll operation
    let attempts = 0;
    let delay = 2000; // start at 2s
    let fileUri: string | null = null;
    const maxAttempts = 36; // hard limit (~3–7 mins depending on backoff)
    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, delay));
      const op = await fetch('/api/veo/operation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      if (op.ok) {
        const fresh = await op.json();
        const done = fresh?.done;
        if (done) {
          const primary = fresh?.response?.candidates?.[0]?.content?.parts?.[0]?.file_data?.file_uri;
          const alt = fresh?.response?.candidates?.[0]?.content?.parts?.find((p: any) => p?.video_metadata?.file_uri)?.video_metadata?.file_uri;
          const fromList = Array.isArray(fresh?.uris) && fresh.uris.length > 0 ? fresh.uris[0] : null;
          fileUri = primary || alt || fromList || null;
          break;
        } else {
          opts?.onLog?.(`Video operation pending... (${attempts + 1})`);
        }
      } else {
        opts?.onLog?.(`Operation check failed (attempt ${attempts + 1})`);
      }
      // exponential backoff up to 8s
      delay = Math.min(delay + 1000, 8000);
      attempts++;
    }

    if (!fileUri) {
      opts?.onLog?.('Timed out waiting for video operation to complete.');
      return null;
    }
    const dl = await fetch('/api/veo/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uri: fileUri, save: true }) });
    if (!dl.ok) {
      opts?.onLog?.(`Download/save failed: ${dl.status}`);
      return null;
    }
    const saved = await dl.json();
    if (!saved?.url) {
      opts?.onLog?.('Download succeeded but no URL returned by server.');
    } else {
      opts?.onLog?.(`Saved video URL: ${saved.url}`);
    }
    return saved?.url || null;
  } catch {
    return null;
  }
}
