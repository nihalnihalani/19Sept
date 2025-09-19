// All application types consolidated in one file

/**
 * Interface defining the structure of a video object for the gallery
 */
export interface Video {
  id: string;
  videoUrl: string;
  title: string;
  description: string;
}


/**
 * Workflow steps to keep a lightweight creation history
 */
export type WorkflowStep = {
  mode: StudioMode;
  action:
    | "generate"
    | "edit"
    | "compose"
    | "video-start"
    | "video-complete";
  payload?: Record<string, any>;
  at: string; // ISO timestamp
};

/**
 * Shared studio state persisted in localStorage
 */
export type StudioSharedState = {
  prompt?: string;
  lastImage?: {
    url: string;
    mimeType?: string;
    id?: string;
    imageBytes?: string;
  };
  lastVideo?: {
    url: string;
    mimeType?: string;
    id?: string;
  };
  workflow: WorkflowStep[];
};

/**
 * Studio modes for different AI generation types
 */
export type StudioMode =
  | "create-image"
  | "edit-image"
  | "compose-image"
  | "create-video"
  | "product-gallery";

/**
 * Model configuration interface
 */
export type Model = {
  name: string;
  label: string;
};

/**
 * Media metadata stored in Neo4j
 */
export interface MediaMetadata {
  id: string; // unique id for the media
  url: string; // storage URL
  type: "image" | "video" | "audio" | "other";
  title?: string;
  description?: string;
  createdAt?: string; // ISO string
  width?: number;
  height?: number;
  duration?: number; // seconds
  size?: number; // bytes
  checksum?: string; // optional integrity hash
  tags?: string[];
}