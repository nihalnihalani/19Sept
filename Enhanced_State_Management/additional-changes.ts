// 1. Update the types.ts to include new interfaces (ADD THIS):

export interface WorkflowHistoryItem {
  mode: StudioMode;
  prompt: string;
  result: string;
  timestamp: Date;
}

export interface SharedContent {
  lastGeneratedImage: string | null;
  lastGeneratedVideo: string | null;
  culturalContext: string | null;
  basePrompt: string | null;
}

// 2. Update useGeneration.ts to track results in shared state (ADD THESE LINES):

// After successful generation in each function, add:
// For images:
if (json?.image?.imageBytes) {
  const dataUrl = `data:${json.image.mimeType};base64,${json.image.imageBytes}`;
  state.setGeneratedImage(dataUrl);
  // ADD THIS LINE:
  state.addToWorkflowHistory({
    mode: state.mode,
    prompt: state.getCurrentPrompt(),
    result: 'Image generated successfully'
  });
}

// For videos (in video completion polling):
if (url) {
  setState(prev => ({
    ...prev,
    generatedContent: { type: 'video', url },
    isGenerating: false
  }));
  setVideoUrl(url);
  // ADD THIS LINE:
  state.addToWorkflowHistory({
    mode: state.mode,
    prompt: state.getCurrentPrompt(),
    result: 'Video generated successfully'
  });
  await loadGallery();
}

// 3. No changes needed to API endpoints - they work as-is

// 4. Update package.json scripts (OPTIONAL - for better development):
{
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start",
    "lint": "next lint",
    "clean:media": "rm -f public/generated_* public/edited_image_* public/*.mp4 public/*.webm public/*.ogv public/*.png public/*.jpg public/*.jpeg public/*.webp || true",
    "clean:cache": "rm -rf .next && rm -rf node_modules/.cache || true",
    // ADD THIS:
    "reset:workflow": "echo 'Workflow state reset on next app start'"
  }
}