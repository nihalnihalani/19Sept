"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Target, Globe, Database, ArrowRight } from "lucide-react";
import { useStudio } from "@/lib/useStudio";

export function ModernCultural() {
  const studio = useStudio();
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [analysisDepth, setAnalysisDepth] = useState<"basic" | "comprehensive" | "competitive">("basic");
  const [includeRealTimeData, setIncludeRealTimeData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const canSubmit = useMemo(() => city.trim() && country.trim(), [city, country]);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const resp = await fetch("/api/cultural/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, country, businessType, targetAudience, analysisDepth, includeRealTimeData }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`API error: ${resp.status} ${text}`);
      }
      const json = await resp.json();
      setResult(json);
      try { if (json?.analysis) studio.setCulturalContext(json.analysis); } catch {}
    } catch (e: any) {
      setError(e?.message || "Failed to analyze culture");
    } finally {
      setLoading(false);
    }
  };

  const applyToPrompt = () => {
    try { studio.applyCulturalToPrompt(); } catch {}
  };

  const continueTo = (path: string, modeHint: "create" | "edit" | "video") => {
    try { studio.applyCulturalToPrompt(modeHint); } catch {}
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <Badge variant="secondary" className="text-xs">Cultural Intelligence</Badge>
        </div>
        <h1 className="text-2xl font-semibold">Understand the Cultural Landscape</h1>
        <p className="text-muted-foreground">Automatically gather and synthesize cultural insights for your target location using Qloo + OpenAI.</p>
      </motion.div>

      {/* Form */}
      <Card className="shadow-sm">
        <CardContent className="p-4 lg:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">City</label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="e.g. Dubai" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Country</label>
              <div className="relative mt-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="e.g. UAE" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Business Type</label>
              <div className="relative mt-1">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="e.g. Hospitality, Retail, Fintech" value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Target Audience</label>
              <div className="relative mt-1">
                <Database className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="e.g. Gen Z, Families, Luxury travelers" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Analysis Depth</label>
              <div className="mt-1">
                <Select value={analysisDepth} onValueChange={(v: any) => setAnalysisDepth(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select depth" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                    <SelectItem value="competitive">Competitive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-7">
              <Checkbox id="rt" checked={includeRealTimeData} onCheckedChange={(v: any) => setIncludeRealTimeData(Boolean(v))} />
              <label htmlFor="rt" className="text-sm text-muted-foreground">Include real-time data (where available)</label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleAnalyze} disabled={!canSubmit || loading}>
              {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>) : "Analyze Culture"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="lg:col-span-2">
            <CardContent className="p-4 flex flex-wrap gap-2 items-center">
              <Button onClick={applyToPrompt} size="sm" variant="default">
                Apply to Prompt
              </Button>
              <Button onClick={() => continueTo('/create', 'create')} size="sm" variant="outline">
                Continue in Create <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button onClick={() => continueTo('/edit', 'edit')} size="sm" variant="outline">
                Continue in Edit <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button onClick={() => continueTo('/video', 'video')} size="sm" variant="outline">
                Continue in Video <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold">Profile</h3>
              <pre className="text-xs whitespace-pre-wrap text-muted-foreground">{JSON.stringify(result.analysis?.profile, null, 2)}</pre>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold">Communication</h3>
              <pre className="text-xs whitespace-pre-wrap text-muted-foreground">{JSON.stringify(result.analysis?.communication, null, 2)}</pre>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold">Aesthetics</h3>
              <pre className="text-xs whitespace-pre-wrap text-muted-foreground">{JSON.stringify(result.analysis?.aesthetics, null, 2)}</pre>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold">Themes</h3>
              <pre className="text-xs whitespace-pre-wrap text-muted-foreground">{JSON.stringify(result.analysis?.themes, null, 2)}</pre>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold">Demographics</h3>
              <pre className="text-xs whitespace-pre-wrap text-muted-foreground">{JSON.stringify(result.analysis?.demographics, null, 2)}</pre>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold">Brands & Places</h3>
              <pre className="text-xs whitespace-pre-wrap text-muted-foreground">{JSON.stringify({ brands: result.raw?.qloo?.brands, places: result.raw?.qloo?.places }, null, 2)}</pre>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
