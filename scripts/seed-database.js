#!/usr/bin/env node

/**
 * Seed script to add sample media to the database
 * Run with: node scripts/seed-database.js
 */

const path = require('path');

// Add the app directory to the module path
process.env.NODE_PATH = path.join(__dirname, '../app');
require('module').Module._initPaths();

async function seedDatabase() {
  try {
    // Import the database functions
    const { insertMedia } = require('../app/lib/database');
    
    console.log('🌱 Seeding database with sample media...');
    
    const sampleMedia = [
      {
        id: 'sample-video-1',
        url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        type: 'video',
        title: 'Sample Video 1',
        description: 'A sample video for testing the gallery',
        width: 1280,
        height: 720,
        duration: 30,
        tags: ['sample', 'test', 'video']
      },
      {
        id: 'sample-image-1',
        url: 'https://picsum.photos/800/600?random=1',
        type: 'image',
        title: 'Sample Image 1',
        description: 'A beautiful sample image from Lorem Picsum',
        width: 800,
        height: 600,
        tags: ['sample', 'test', 'image']
      },
      {
        id: 'sample-image-2',
        url: 'https://picsum.photos/800/600?random=2',
        type: 'image',
        title: 'Sample Image 2',
        description: 'Another beautiful sample image',
        width: 800,
        height: 600,
        tags: ['sample', 'test', 'image']
      },
      {
        id: 'sample-audio-1',
        url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        type: 'audio',
        title: 'Sample Audio',
        description: 'A sample audio file for testing',
        duration: 5,
        tags: ['sample', 'test', 'audio']
      }
    ];
    
    for (const media of sampleMedia) {
      try {
        await insertMedia(media);
        console.log(`✅ Added: ${media.title} (${media.type})`);
      } catch (error) {
        console.error(`❌ Failed to add ${media.title}:`, error.message);
      }
    }
    
    console.log('🎉 Database seeding completed!');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase();
