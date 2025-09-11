'use client';

import { useCallback, useMemo } from 'react';
import { StudioState, StudioActions } from './useStudio';

interface GenerationHooks {
  // Loading state
  isLoadingUI: boolean;
  canStart: boolean;
  
  // Model information
  modelLabel: string;
  
  // Placeholder text
  placeholderText: string;
  
  // Generation functions
  startGeneration: () => Promise<void>;
  generateWithImagen: () => Promise<void>;
  generateWithGemini: () => Promise<void>;
  editWithGemini: () => Promise<void>;
  composeWithGemini: () => Promise<void>;
}

export function useGeneration(state: StudioState & StudioActions): GenerationHooks {
  // Computed loading state
  const isLoadingUI = useMemo(
    () => state.isGenerating || state.imagenBusy || state.geminiBusy,
    [state.isGenerating, state.imagenBusy, state.geminiBusy]
  );
  
  // Friendly model label for UI
  const modelLabel = useMemo(() => {
    const cleaned = state.selectedModel
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/preview/gi, '')
      .trim();
    return cleaned || state.selectedModel;
  }, [state.selectedModel]);
  
  // Dynamic placeholder text
  const placeholderText = useMemo(() => {
    switch (state.mode) {
      case 'create-image':
        return 'Describe the image to create...';
      case 'edit-image':
        return 'Describe how to edit the image...';
      case 'compose-image':
        return 'Describe how to combine the images...';
      case 'create-video':
        return 'Generate a video with text and frames...';
      default:
        return 'Enter your prompt...';
    }
  }, [state.mode]);
  
  // Check if generation can start
  const canStart = useMemo(() => {
    const currentPrompt = state.getCurrentPrompt();
    
    if (state.mode === 'create-video') {
      return currentPrompt.trim() !== '';
    } else if (state.mode === 'create-image') {
      return currentPrompt.trim() !== '' && !state.imagenBusy && !state.geminiBusy;
    } else if (state.mode === 'edit-image') {
      return currentPrompt.trim() !== '' && (state.imageFile || state.generatedImage) && !state.geminiBusy;
    } else if (state.mode === 'compose-image') {
      const hasExistingImage = state.imageFile || state.generatedImage;
      const hasNewImages = state.multipleImageFiles.length > 0;
      return (
        currentPrompt.trim() !== '' &&
        (hasExistingImage || hasNewImages) &&
        !state.geminiBusy
      );
    }
    return false;
  }, [state]);
  
  // Imagen generation
  const generateWithImagen = useCallback(async () => {
    console.log('Starting Imagen generation');
    state.setImagenBusy(true);
    state.setGeneratedImage(null);
    try {
      const resp = await fetch('/api/imagen/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: state.imagePrompt }),
      });

      if (!resp.ok) {
        console.error('Imagen API error:', resp.status, resp.statusText);
        throw new Error(`API error: ${resp.status}`);
      }

      const json = await resp.json();
      console.log('Imagen API response:', json);

      if (json?.image?.imageBytes) {
        const dataUrl = `data:${json.image.mimeType};base64,${json.image.imageBytes}`;
        state.setGeneratedImage(dataUrl);
      } else if (json?.error) {
        console.error('Imagen API returned error:', json.error);
        throw new Error(json.error);
      }
    } catch (e: unknown) {
      console.error('Error in generateWithImagen:', e);
      const message = e instanceof Error ? e.message : 'Unknown error';
      alert(`Failed to generate image: ${message}`);
    } finally {
      console.log('Resetting Imagen busy state');
      state.setImagenBusy(false);
    }
  }, [state]);
  
  // Gemini image generation
  const generateWithGemini = useCallback(async () => {
    console.log('Starting Gemini image generation');
    state.setGeminiBusy(true);
    state.setGeneratedImage(null);
    try {
      const resp = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: state.imagePrompt }),
      });

      if (!resp.ok) {
        console.error('Gemini API error:', resp.status, resp.statusText);
        throw new Error(`API error: ${resp.status}`);
      }

      const json = await resp.json();
      console.log('Gemini API response:', json);

      if (json?.image?.imageBytes) {
        const dataUrl = `data:${json.image.mimeType};base64,${json.image.imageBytes}`;
        state.setGeneratedImage(dataUrl);
      } else if (json?.error) {
        console.error('Gemini API returned error:', json.error);
        throw new Error(json.error);
      }
    } catch (e: unknown) {
      console.error('Error in generateWithGemini:', e);
      const message = e instanceof Error ? e.message : 'Unknown error';
      alert(`Failed to generate image: ${message}`);
    } finally {
      console.log('Resetting Gemini busy state');
      state.setGeminiBusy(false);
    }
  }, [state]);
  
  // Gemini image edit
  const editWithGemini = useCallback(async () => {
    console.log('Starting Gemini image edit');
    state.setGeminiBusy(true);
    state.setGeneratedImage(null);
    try {
      const form = new FormData();
      form.append('prompt', state.editPrompt);

      if (state.imageFile) {
        form.append('imageFile', state.imageFile);
      } else if (state.generatedImage) {
        const [meta, b64] = state.generatedImage.split(',');
        const mime = meta?.split(';')?.[0]?.replace('data:', '') || 'image/png';
        form.append('imageBase64', b64);
        form.append('imageMimeType', mime);
      }

      const resp = await fetch('/api/gemini/edit', {
        method: 'POST',
        body: form,
      });

      if (!resp.ok) {
        console.error('Gemini edit API error:', resp.status, resp.statusText);
        throw new Error(`API error: ${resp.status}`);
      }

      const json = await resp.json();
      console.log('Gemini edit API response:', json);

      if (json?.image?.imageBytes) {
        const dataUrl = `data:${json.image.mimeType};base64,${json.image.imageBytes}`;
        state.setGeneratedImage(dataUrl);
      } else if (json?.error) {
        console.error('Gemini edit API returned error:', json.error);
        throw new Error(json.error);
      }
    } catch (e: unknown) {
      console.error('Error in editWithGemini:', e);
      const message = e instanceof Error ? e.message : 'Unknown error';
      alert(`Failed to edit image: ${message}`);
    } finally {
      console.log('Resetting Gemini busy state after edit');
      state.setGeminiBusy(false);
    }
  }, [state]);
  
  // Gemini image compose
  const composeWithGemini = useCallback(async () => {
    state.setGeminiBusy(true);
    state.setGeneratedImage(null);
    try {
      const form = new FormData();
      form.append('prompt', state.composePrompt);

      // Add newly uploaded images first
      for (const file of state.multipleImageFiles) {
        form.append('imageFiles', file);
      }

      // Include existing image last (if any)
      if (state.imageFile) {
        form.append('imageFiles', state.imageFile);
      } else if (state.generatedImage) {
        // Convert base64 to blob and add as file
        const [meta, b64] = state.generatedImage.split(',');
        const mime = meta?.split(';')?.[0]?.replace('data:', '') || 'image/png';
        const byteCharacters = atob(b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });

        // Create a File object from the blob
        const existingImageFile = new File([blob], 'existing-image.png', {
          type: mime,
        });
        form.append('imageFiles', existingImageFile);
      }

      const resp = await fetch('/api/gemini/edit', {
        method: 'POST',
        body: form,
      });

      if (!resp.ok) {
        console.error('Gemini compose API error:', resp.status, resp.statusText);
        throw new Error(`API error: ${resp.status}`);
      }

      const json = await resp.json();
      console.log('Gemini compose API response:', json);

      if (json?.image?.imageBytes) {
        const dataUrl = `data:${json.image.mimeType};base64,${json.image.imageBytes}`;
        state.setGeneratedImage(dataUrl);
      } else if (json?.error) {
        console.error('Gemini compose API returned error:', json.error);
        throw new Error(json.error);
      }
    } catch (e: unknown) {
      console.error('Error in composeWithGemini:', e);
      const message = e instanceof Error ? e.message : 'Unknown error';
      alert(`Failed to compose images: ${message}`);
    } finally {
      console.log('Resetting Gemini busy state after compose');
      state.setGeminiBusy(false);
    }
  }, [state]);
  
  // Start generation based on current mode
  const startGeneration = useCallback(async () => {
    if (!canStart) return;

    if (state.mode === 'create-video') {
      state.setIsGenerating(true);
      state.setVideoUrl(null);

      const form = new FormData();
      form.append('prompt', state.videoPrompt);
      form.append('model', state.selectedModel);
      if (state.negativePrompt) form.append('negativePrompt', state.negativePrompt);
      if (state.aspectRatio) form.append('aspectRatio', state.aspectRatio);

      if (state.imageFile || state.generatedImage) {
        if (state.imageFile) {
          form.append('imageFile', state.imageFile);
        } else if (state.generatedImage) {
          const [meta, b64] = state.generatedImage.split(',');
          const mime = meta?.split(';')?.[0]?.replace('data:', '') || 'image/png';
          form.append('imageBase64', b64);
          form.append('imageMimeType', mime);
        }
      }

      try {
        const resp = await fetch('/api/veo/generate', {
          method: 'POST',
          body: form,
        });
        const json = await resp.json();
        state.setOperationName(json?.name || null);
      } catch (e) {
        console.error(e);
        state.setIsGenerating(false);
      }
    } else if (state.mode === 'create-image') {
      // Use selected model (Imagen or Gemini)
      if (state.selectedModel.includes('imagen')) {
        await generateWithImagen();
      } else {
        await generateWithGemini();
      }
    } else if (state.mode === 'edit-image') {
      await editWithGemini();
    } else if (state.mode === 'compose-image') {
      await composeWithGemini();
    }
  }, [
    canStart,
    state,
    generateWithImagen,
    generateWithGemini,
    editWithGemini,
    composeWithGemini,
  ]);
  
  return {
    isLoadingUI,
    canStart,
    modelLabel,
    placeholderText,
    startGeneration,
    generateWithImagen,
    generateWithGemini,
    editWithGemini,
    composeWithGemini,
  };
}