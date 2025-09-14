"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CulturalContext, StudioSharedState, WorkflowStep } from "@/lib/types";

const STORAGE_KEY = "alchemy_studio_state_v1";

const defaultState: StudioSharedState = {
  prompt: "",
  lastImage: undefined,
  lastVideo: undefined,
  culturalContext: undefined,
  workflow: [],
};

function loadFromStorage(): StudioSharedState {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return { ...defaultState };
    const parsed = JSON.parse(raw);
    return {
      prompt: typeof parsed?.prompt === "string" ? parsed.prompt : "",
      lastImage: parsed?.lastImage || undefined,
      lastVideo: parsed?.lastVideo || undefined,
      culturalContext: parsed?.culturalContext || undefined,
      workflow: Array.isArray(parsed?.workflow) ? parsed.workflow : [],
    } as StudioSharedState;
  } catch {
    return { ...defaultState };
  }
}

function saveToStorage(state: StudioSharedState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const StudioCtx = createContext<{
  state: StudioSharedState;
  setPrompt: (p: string) => void;
  setImage: (img: { url: string; mimeType?: string; id?: string; imageBytes?: string }) => void;
  setVideo: (vid: { url: string; mimeType?: string; id?: string }) => void;
  setCulturalContext: (ctx: CulturalContext) => void;
  applyCulturalToPrompt: (modeHint?: "create" | "edit" | "video") => void;
  pushWorkflow: (step: WorkflowStep) => void;
  clear: () => void;
} | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StudioSharedState>(() => loadFromStorage());
  const saveTimer = useRef<number | null>(null);

  // Debounced persistence
  const persist = useCallback((next: StudioSharedState) => {
    setState(next);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => saveToStorage(next), 150);
  }, []);

  const setPrompt = useCallback((p: string) => {
    persist({ ...state, prompt: p });
  }, [persist, state]);

  const setImage = useCallback((img: { url: string; mimeType?: string; id?: string; imageBytes?: string }) => {
    const step: WorkflowStep = { mode: "create-image", action: "generate", payload: { url: img.url, id: img.id }, at: new Date().toISOString() };
    persist({ ...state, lastImage: img, workflow: [...state.workflow, step] });
  }, [persist, state]);

  const setVideo = useCallback((vid: { url: string; mimeType?: string; id?: string }) => {
    const step: WorkflowStep = { mode: "create-video", action: "video-complete", payload: { url: vid.url, id: vid.id }, at: new Date().toISOString() };
    persist({ ...state, lastVideo: vid, workflow: [...state.workflow, step] });
  }, [persist, state]);

  const setCulturalContext = useCallback((ctx: CulturalContext) => {
    const step: WorkflowStep = { mode: "cultural", action: "apply-culture", payload: { hasContext: true }, at: new Date().toISOString() };
    persist({ ...state, culturalContext: ctx, workflow: [...state.workflow, step] });
  }, [persist, state]);

  const synthesizePromptFromCulture = (ctx?: CulturalContext) => {
    if (!ctx) return "";
    const themes = Array.isArray((ctx as any)?.themes?.current_obsessions)
      ? (ctx as any).themes.current_obsessions.map((t: any) => (t.topic ? t.topic : t)).slice(0, 5).join(", ")
      : "";
    const tone = Array.isArray((ctx as any)?.communication?.tone_preferences)
      ? (ctx as any).communication.tone_preferences[0]
      : "";
    const aesthetics = Array.isArray((ctx as any)?.aesthetics?.visual_styles)
      ? (ctx as any).aesthetics.visual_styles[0]
      : "";
    const brands = Array.isArray((ctx as any)?.brands?.loved_brands)
      ? (ctx as any).brands.loved_brands.slice(0, 3).join(", ")
      : "";
    const fragments = [
      themes && `themes: ${themes}`,
      tone && `tone: ${tone}`,
      aesthetics && `style: ${aesthetics}`,
      brands && `inspired by: ${brands}`,
    ].filter(Boolean);
    return fragments.join("; ");
  };

  const applyCulturalToPrompt = useCallback((modeHint?: "create" | "edit" | "video") => {
    const add = synthesizePromptFromCulture(state.culturalContext);
    const nextPrompt = [state.prompt || "", add].filter(Boolean).join("\n").trim();
    persist({
      ...state,
      prompt: nextPrompt,
      workflow: [
        ...state.workflow,
        {
          mode: modeHint === "edit" ? "edit-image" : modeHint === "video" ? "create-video" : "create-image",
          action: "apply-culture",
          at: new Date().toISOString(),
        },
      ],
    });
  }, [persist, state]);

  const pushWorkflow = useCallback((step: WorkflowStep) => {
    persist({ ...state, workflow: [...state.workflow, step] });
  }, [persist, state]);

  const clear = useCallback(() => {
    persist({ ...defaultState });
  }, [persist]);

  const value = useMemo(
    () => ({ state, setPrompt, setImage, setVideo, setCulturalContext, applyCulturalToPrompt, pushWorkflow, clear }),
    [state, setPrompt, setImage, setVideo, setCulturalContext, applyCulturalToPrompt, pushWorkflow, clear]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const fresh = loadFromStorage();
      setState((prev) => (!prev.workflow?.length && fresh.workflow?.length ? fresh : prev));
    }
  }, []);

  return <StudioCtx.Provider value={value}>{children}</StudioCtx.Provider>;
}

export function useStudio() {
  const ctx = useContext(StudioCtx);
  if (!ctx) throw new Error("useStudio must be used within a StudioProvider");
  return ctx;
}
