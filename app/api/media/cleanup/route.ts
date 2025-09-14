import { NextResponse } from "next/server";
import { getSession } from "@/lib/neo4j";
import path from "path";
import { access } from "fs/promises";

export const runtime = "nodejs";

async function fileExists(absPath: string): Promise<boolean> {
  try {
    await access(absPath);
    return true;
  } catch {
    return false;
  }
}

export async function POST() {
  const session = getSession();
  try {
    // Pull a reasonable number of records to audit; adjust if you expect more
    const result = await session.run(
      `MATCH (m:Media)
       RETURN m { .* } AS media
       ORDER BY coalesce(m.createdAt, datetime('1970-01-01T00:00:00Z')) DESC, m.id DESC
       LIMIT 2000`
    );

    const mediaList: Array<{
      id?: string;
      url?: string;
      type?: string;
    }> = result.records.map((r) => r.get("media"));

    const missing: Array<{ id?: string; url?: string }> = [];
    for (const m of mediaList) {
      const url = (m.url || "").toString();
      if (!url || !url.startsWith("/")) continue;
      const rel = url.replace(/^\//, "");
      const abs = path.join(process.cwd(), "public", rel);
      // Only check local files we expect under public/
      const exists = await fileExists(abs);
      if (!exists) missing.push({ id: m.id, url });
    }

    let deleted = 0;
    if (missing.length > 0) {
      const toDelete = missing.map((m) => ({ id: m.id || null, url: m.url || null }));
      const delResult = await session.run(
        `UNWIND $items AS item
         MATCH (m:Media)
         WHERE (item.id IS NOT NULL AND m.id = item.id)
            OR (item.url IS NOT NULL AND m.url = item.url)
         DETACH DELETE m
         RETURN count(*) AS deleted`,
        { items: toDelete }
      );
      deleted = delResult.records[0]?.get("deleted") ?? 0;
    }

    return NextResponse.json({
      scanned: mediaList.length,
      missing: missing.length,
      deleted,
    });
  } catch (err: any) {
    console.error("/api/media/cleanup POST error:", err);
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  } finally {
    await session.close();
  }
}
