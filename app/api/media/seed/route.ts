import { NextResponse } from "next/server";
import { insertMedia } from "@/lib/database";

export const runtime = "nodejs";

export async function POST() {
  try {
    console.log('🌱 Seeding database with sample media...');
    
    const sampleMedia = [
      {
        id: `sample-video-${Date.now()}`,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        type: 'video' as const,
        title: 'Big Buck Bunny',
        description: 'A classic open-source animated short film',
        width: 1920,
        height: 1080,
        duration: 596,
        tags: ['animation', 'sample', 'open-source']
      },
      {
        id: `sample-image-${Date.now()}-1`,
        url: 'https://picsum.photos/800/600?random=1',
        type: 'image' as const,
        title: 'Random Landscape',
        description: 'A beautiful random landscape image',
        width: 800,
        height: 600,
        tags: ['landscape', 'sample', 'nature']
      },
      {
        id: `sample-image-${Date.now()}-2`,
        url: 'https://picsum.photos/800/600?random=2',
        type: 'image' as const,
        title: 'Random Architecture',
        description: 'A stunning architectural photograph',
        width: 800,
        height: 600,
        tags: ['architecture', 'sample', 'urban']
      },
      {
        id: `sample-image-${Date.now()}-3`,
        url: 'https://picsum.photos/800/600?random=3',
        type: 'image' as const,
        title: 'Random Portrait',
        description: 'An artistic portrait photograph',
        width: 800,
        height: 600,
        tags: ['portrait', 'sample', 'people']
      }
    ];
    
    const results = [];
    
    for (const media of sampleMedia) {
      try {
        const inserted = await insertMedia(media);
        results.push({ success: true, media: inserted });
        console.log(`✅ Added: ${media.title} (${media.type})`);
      } catch (error) {
        console.error(`❌ Failed to add ${media.title}:`, error);
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          media: media.title 
        });
      }
    }
    
    console.log('🎉 Database seeding completed!');
    
    return NextResponse.json({ 
      message: 'Database seeding completed',
      results,
      summary: {
        total: sampleMedia.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    return NextResponse.json(
      { 
        error: 'Database seeding failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
