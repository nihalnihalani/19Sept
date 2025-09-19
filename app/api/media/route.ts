import { NextResponse } from "next/server";
import { 
  insertMedia, 
  getAllMedia, 
  deleteMedia, 
  getMediaById,
  searchMedia,
  updateMedia 
} from "@/lib/database";
import type { MediaMetadata } from "@/lib/types";

export const runtime = "nodejs";

function validate(body: any): { ok: true; data: MediaMetadata } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid JSON body" };
  const { id, url, type } = body;
  if (!id || typeof id !== "string") return { ok: false, error: "Field 'id' is required (string)" };
  if (!url || typeof url !== "string") return { ok: false, error: "Field 'url' is required (string)" };
  if (!type || !["image", "video", "audio", "other"].includes(type)) return { ok: false, error: "Field 'type' must be one of: image, video, audio, other" };
  return { ok: true, data: body as MediaMetadata };
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    let url = searchParams.get("url");
    
    // Try reading JSON body too (optional)
    try {
      const body = await request.json().catch(() => null);
      if (body && typeof body === "object") {
        id = (body as any).id ?? id;
        url = (body as any).url ?? url;
      }
    } catch {}

    if (!id && !url) {
      return NextResponse.json({ error: "Provide 'id' or 'url' to delete" }, { status: 400 });
    }

    let deleted = 0;
    
    if (id) {
      const success = await deleteMedia(id);
      deleted = success ? 1 : 0;
    } else if (url) {
      // For URL-based deletion, we need to find the media first
      const allMedia = await getAllMedia(1000); // Get a large batch to search
      const mediaToDelete = allMedia.find(m => m.url === url);
      if (mediaToDelete) {
        const success = await deleteMedia(mediaToDelete.id);
        deleted = success ? 1 : 0;
      }
    }

    return NextResponse.json({ deleted });
  } catch (err: any) {
    console.error("/api/media DELETE error:", err);
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // image | video | audio | other
    const tag = searchParams.get("tag");
    const query = searchParams.get("q"); // search query
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let media: MediaMetadata[];

    if (query) {
      // Use search functionality
      media = await searchMedia(query, limit);
      // Apply offset manually for search results
      media = media.slice(offset, offset + limit);
    } else {
      // Get all media with pagination
      media = await getAllMedia(limit, offset);
    }

    // Filter by type if specified
    if (type) {
      media = media.filter(m => m.type === type);
    }

    // Filter by tag if specified
    if (tag) {
      media = media.filter(m => m.tags && m.tags.includes(tag));
    }

    return NextResponse.json({ 
      media, 
      page: { limit, offset, count: media.length } 
    });
  } catch (err: any) {
    console.error("/api/media GET error:", err);
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const validation = validate(json);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const data = validation.data;

    // Check if media already exists (for upsert behavior)
    const existingMedia = await getMediaById(data.id);
    
    let media: MediaMetadata;
    
    if (existingMedia) {
      // Update existing media (excluding id and createdAt)
      const { id, createdAt, ...updateData } = data;
      media = await updateMedia(data.id, updateData) || existingMedia;
    } else {
      // Insert new media
      media = await insertMedia(data);
    }

    return NextResponse.json({ media }, { status: existingMedia ? 200 : 201 });
  } catch (err: any) {
    console.error("/api/media POST error:", err);
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}
