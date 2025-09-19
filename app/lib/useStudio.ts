"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { StudioSharedState, WorkflowStep } from "@/lib/types";

const STORAGE_KEY = "alchemy_studio_state_v1";

const defaultState: StudioSharedState = {
  prompt: "",
  lastImage: undefined,
  lastVideo: undefined,
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


  const pushWorkflow = useCallback((step: WorkflowStep) => {
    persist({ ...state, workflow: [...state.workflow, step] });
  }, [persist, state]);

  const clear = useCallback(() => {
    persist({ ...defaultState });
  }, [persist]);

  const value = useMemo(
    () => ({ state, setPrompt, setImage, setVideo, pushWorkflow, clear }),
    [state, setPrompt, setImage, setVideo, pushWorkflow, clear]
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
