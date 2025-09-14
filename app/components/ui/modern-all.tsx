"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useStudio } from "@/lib/useStudio";
import { Loader2, Upload, Wand2, Play, CheckCircle2, AlertTriangle } from "lucide-react";

interface DemographicPlan {
  key: string; // unique key, e.g., "1-japan"
  title: string; // e.g., "Japan"
  description: string; // free-form extra details
  city?: string;
  country?: string;
}

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
  }>({ images: {}, videos: {} });
  const [audiencePrompts, setAudiencePrompts] = useState<Record<string, string>>({});
  const [videoBusy, setVideoBusy] = useState<Record<string, boolean>>({});
  const [imageBusy, setImageBusy] = useState<Record<string, boolean>>({});

  // Chat-driven campaign planning
  const [chatInput, setChatInput] = useState<string>(
    `Generate ad campaign variants for:
1. Japan (Tokyo) <tech-forward Gen Z, neon, anime/cyberpunk influences>
2. India (Bengaluru) <college students, vibrant colors, festival mood>
3. Norway (Oslo) <eco-conscious millennials, minimal, nature aesthetics>`
  );
  const [demographics, setDemographics] = useState<DemographicPlan[]>([]);

  // Live progress via SSE
  const sessionRef = useRef<string>(`sess_${Math.random().toString(36).slice(2)}`);
  const sseReadyRef = useRef<boolean>(false);
  useEffect(() => {
    try {
      const es = new EventSource(`/api/progress?session=${encodeURIComponent(sessionRef.current)}`);
      es.onmessage = (ev) => {
        if (!ev?.data) return;
        try {
          const parsed = JSON.parse(ev.data);
          if (parsed?.text) {
            if (String(parsed.text).startsWith('SSE connected')) {
              sseReadyRef.current = true;
            } else {
              setLog((l) => [...l, parsed.text]);
            }
          }
        } catch {
          setLog((l) => [...l, String(ev.data)]);
        }
      };
      es.onerror = () => {
        // silently ignore; client still appends locally
      };
      return () => es.close();
    } catch {
      // ignore
    }
  }, []);

  const appendLog = useCallback(async (line: string) => {
    if (!sseReadyRef.current) {
      // Before SSE connection established, append locally for immediate feedback
      setLog((l) => [...l, line]);
    }
    try {
      await fetch('/api/progress/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: sessionRef.current, message: line })
      });
    } catch {
      // ignore push errors
    }
  }, []);

  const handleFile = (f: File) => {
    setFile(f);
    const objectUrl = URL.createObjectURL(f);
    setImageUrl(objectUrl);
  };

  const runFlow = async () => {
    if (!file && !imageUrl) return;
    // Determine demographics to use for this run
    let currentDemographics = demographics && demographics.length > 0 ? demographics : parseCampaignPlan(chatInput);
    if ((!currentDemographics) || currentDemographics.length === 0) {
      await appendLog("Please define at least one demographic in the chat panel.");
      return;
    }
    // Ensure UI reflects parsed values
    if (demographics.length === 0) setDemographics(currentDemographics);
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

      // 2) Cultural targeting via Cultural API per demographic
      setStep("cultural");
      appendLog(`Fetching cultural signals for default campaign + ${currentDemographics.length} demographics...`);

      const baseSummary = summarizeInsights(analyzed.insights);
      const perAudiencePrompt: Record<string, string> = {};

      for (const d of currentDemographics) {
        const city = d.city || d.title;
        const country = d.country || d.title;
        const culturalResp = await fetch("/api/cultural/intelligence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ city, country, analysisDepth: "basic" })
        });
        const cultural = culturalResp.ok ? await culturalResp.json() : { analysis: {} };
        try { if (cultural?.analysis) studio.setCulturalContext(cultural.analysis); } catch {}
        perAudiencePrompt[d.key] = buildAudiencePrompt(baseSummary, cultural.analysis, d);
      }
      setAudiencePrompts(perAudiencePrompt);

      // 3) Generate images sequentially
      setStep("gen_images");
      appendLog("Generating images one-by-one for default campaign + demographics...");
      for (const d of currentDemographics) {
        const prompt = perAudiencePrompt[d.key];
        appendLog(`Generating image for ${d.title}...`);
        const url = await generateOrEditImage(prompt, file);
        setResults((r) => ({ ...r, images: { ...r.images, [d.key]: url ? { url } : null } }));
        if (url) try { studio.setImage({ url }); } catch {}
      }

      // 4) Generate videos sequentially
      setStep("gen_videos");
      appendLog("Generating videos one-by-one for default campaign + demographics...");
      let allVideos = true;
      for (const d of currentDemographics) {
        const prompt = perAudiencePrompt[d.key];
        appendLog(`Generating video for ${d.title}...`);
        const vurl = await generateVideoFromPrompt(prompt, { onLog: (m) => appendLog(m) });
        setResults((r) => ({ ...r, videos: { ...r.videos, [d.key]: vurl ? { url: vurl } : null } }));
        if (vurl) {
          try { studio.setVideo({ url: vurl }); } catch {}
        } else {
          allVideos = false;
          appendLog(`${d.title} video pending/failed – you can retry from its card.`);
        }
      }

      setStep("done");
      appendLog(allVideos ? `Flow complete. ${currentDemographics.length} demographic images and videos produced.` : `Flow complete. Images produced. One or more videos pending/failed – retry per demographic.`);
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
        <h1 className="text-2xl font-semibold">Upload → Analyze → Target (Chat) → N Images → N Videos</h1>
        <p className="text-muted-foreground">Define demographics in the chat panel. We analyze your image, fetch Qloo cultural signals per demographic, then generate images and videos sequentially.</p>
      </motion.div>

      {/* Top Split: Image (left) + Chat (right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload + Preview */}
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
              <Button onClick={runFlow} disabled={running || (!file && !imageUrl) || demographics.length === 0}>
                {running ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running Flow...</>) : (<>Run Full Flow</>)}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chat Panel */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Chat your campaign plan</h3>
              <Badge variant="secondary">Configurable</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Describe demographics as a list. Format examples:
              <br />
              1. Japan (Tokyo) &lt;Gen Z tech-forward, neon&gt;
              <br />
              2. India (Bengaluru) &lt;college students, festival vibe&gt;
            </p>
            <textarea
              className="w-full min-h-36 text-sm rounded border bg-muted/30 p-2"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const parsed = parseCampaignPlan(chatInput);
                  setDemographics(parsed);
                  appendLog(`Planned ${parsed.length} demographics.`);
                }}
                disabled={running}
              >
                Plan Campaigns
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const resp = await fetch('/api/demographics/expand', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ input: chatInput })
                    });
                    if (!resp.ok) throw new Error(await resp.text());
                    const data = await resp.json();
                    const list = Array.isArray(data?.demographics) ? data.demographics : [];
                    const parsed = list.map((d: any, idx: number) => ({
                      key: `${idx + 1}-${String(d.title || d.country || 'untitled').toLowerCase().replace(/\s+/g, '-')}`,
                      title: String(d.title || d.country || 'Untitled'),
                      description: String(d.description || ''),
                      city: d.city || undefined,
                      country: d.country || undefined,
                    }));
                    setDemographics(parsed);
                    appendLog(`Auto-filled ${parsed.length} demographics using AI.`);
                  } catch (e: any) {
                    appendLog(`Auto-fill failed: ${e?.message || e}`);
                  }
                }}
                disabled={running}
              >
                Auto-fill (AI)
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const parsed = parseCampaignPlan(chatInput);
                  setDemographics(parsed);
                  runFlow();
                }}
                disabled={running || (!file && !imageUrl)}
              >
                Plan + Run
              </Button>
            </div>
            {demographics.length > 0 && (
              <div className="text-xs">
                <p className="font-medium">Planned demographics:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  {demographics.map((d) => (
                    <li key={d.key}>
                      <span className="font-medium">{d.title}</span>
                      {d.city || d.country ? (
                        <span className="text-muted-foreground"> {`(`}{[d.city, d.country].filter(Boolean).join(', ')}{`)`}</span>
                      ) : null}
                      {d.description ? (
                        <span className="block text-muted-foreground">{d.description}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
        {demographics.map((a) => {
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
                {/* Action Row: per-demographic image retry + video */}
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
                        if (!prompt || imageBusy[a.key]) return;
                        setImageBusy((ib) => ({ ...ib, [a.key]: true }));
                        try {
                          setStep('gen_images');
                          await appendLog(`Regenerating image for ${a.title}...`);
                          const url = await generateOrEditImage(prompt, file);
                          setResults((r) => ({ ...r, images: { ...r.images, [a.key]: url ? { url } : null } }));
                          if (url) try { studio.setImage({ url }); } catch {}
                        } finally {
                          setImageBusy((ib) => ({ ...ib, [a.key]: false }));
                        }
                      }}
                      disabled={running || !prompt || !!imageBusy[a.key]}
                    >
                      {imageBusy[a.key] ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...</> : 'Generate Image'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!prompt || videoBusy[a.key]) return;
                        setVideoBusy((vb) => ({ ...vb, [a.key]: true }));
                        try {
                          setStep('gen_videos');
                          await appendLog(`Generating video for ${a.title}...`);
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

function buildAudiencePrompt(baseSummary: string, culture: any, audience: DemographicPlan): string {
  const cultureHints = culture ? JSON.stringify({ aesthetics: culture?.aesthetics, communication: culture?.communication, themes: culture?.themes }) : "";
  return [
    `Base image analysis: ${baseSummary}`,
    `Target demographic: ${audience.title}${audience.city || audience.country ? ` (${[audience.city, audience.country].filter(Boolean).join(', ')})` : ''}`,
    audience.description && `Demographic details: ${audience.description}`,
    cultureHints && `Relevant cultural cues: ${cultureHints}`,
    `Goal: produce a high-quality visual that resonates with this demographic while staying tasteful and brand-safe.`
  ].filter(Boolean).join("\n");
}

// Parse user chat into a list of demographics
function parseCampaignPlan(input: string): DemographicPlan[] {
  const lines = input
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    // filter out obvious headers or control text
    .filter(l => !/^generate\s+ad\s+campaign\s+variants\s+for\s*:?/i.test(l))
    .filter(l => !/^plan\s*\+\s*run$/i.test(l))
    .filter(l => !/^plan\s+campaigns$/i.test(l));
  const items: DemographicPlan[] = [];
  for (const raw of lines) {
    // Expect patterns like: "1. Japan (Tokyo) <details here>" or "Japan <details>"
    const line = raw.replace(/^\d+\.?\s*/, "");
    // Extract details in angle brackets
    const detailsMatch = line.match(/<([^>]*)>/);
    let description = detailsMatch ? detailsMatch[1].trim() : "";
    let withoutDetails = line.replace(/<[^>]*>/g, "").trim();
    // If there is trailing text after a ) and no <...>, treat it as description
    if (!description) {
      const afterParen = withoutDetails.match(/\)(.*)$/);
      if (afterParen && afterParen[1]) {
        const tail = afterParen[1].trim();
        if (tail) description = tail;
      }
      // strip the tail we just captured from withoutDetails
      withoutDetails = withoutDetails.replace(/\)(.*)$/, ")").trim();
    }
    // Extract location in parentheses
    const locMatch = withoutDetails.match(/^(.*?)\s*\(([^)]*)\)/);
    let title = withoutDetails;
    let city: string | undefined;
    let country: string | undefined;
    if (locMatch) {
      title = (locMatch[1] || "").trim() || "Unknown";
      const parts = (locMatch[2] || "").split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length === 1) {
        // Could be city or country; we will treat it as city and use title as country
        city = parts[0];
        country = title;
      } else if (parts.length >= 2) {
        city = parts[0];
        country = parts[1];
      }
    } else {
      // No parentheses: treat entire token before first space or dash as country/title
      const basic = withoutDetails.replace(/[-–].*$/, '').trim();
      title = basic || "Unknown";
      country = title;
    }
    const key = `${items.length + 1}-${title.toLowerCase().replace(/\s+/g, '-')}`;
    items.push({ key, title, description, city, country });
  }
  return items;
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
