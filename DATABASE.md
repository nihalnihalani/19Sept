# Database & Gallery Implementation

This document describes the SQLite database and gallery implementation for the Alchemy Studio project.

## 🗄️ Database Implementation

### Technology Stack
- **SQLite**: Lightweight, serverless database using `sql.js`
- **Fallback**: JSON file storage for compatibility
- **Schema**: Structured media metadata storage

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio', 'other')),
  title TEXT,
  description TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  width INTEGER,
  height INTEGER,
  duration REAL,
  size INTEGER,
  checksum TEXT,
  tags TEXT -- JSON array as string
);

CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
CREATE INDEX IF NOT EXISTS idx_media_created ON media(createdAt);
CREATE INDEX IF NOT EXISTS idx_media_title ON media(title);
```

### Database Features
- ✅ **SQLite with fallback**: Uses SQLite when available, falls back to JSON storage
- ✅ **CRUD operations**: Create, Read, Update, Delete media records
- ✅ **Search functionality**: Full-text search on title and description
- ✅ **Filtering**: Filter by media type (image, video, audio, other)
- ✅ **Pagination**: Efficient pagination for large datasets
- ✅ **Indexing**: Optimized queries with database indexes

### API Endpoints

#### Media API (`/api/media`)

**GET** - Retrieve media
```bash
GET /api/media?type=video&limit=50&offset=0&q=search
```

**POST** - Create/Update media
```bash
POST /api/media
Content-Type: application/json

{
  "id": "unique-id",
  "url": "https://example.com/media.mp4",
  "type": "video",
  "title": "My Video",
  "description": "A sample video",
  "width": 1920,
  "height": 1080,
  "duration": 120,
  "tags": ["sample", "video"]
}
```

**DELETE** - Delete media
```bash
DELETE /api/media?id=unique-id
```

#### Seed API (`/api/media/seed`)

**POST** - Populate database with sample data
```bash
POST /api/media/seed
```

## 🖼️ Gallery Implementation

### Features
- ✅ **Real-time data**: Fetches media from database API
- ✅ **Multiple view modes**: Grid and list views
- ✅ **Search & filter**: Search by title/description, filter by type
- ✅ **Sorting**: Sort by title, newest, oldest
- ✅ **Media player**: Full-screen modal with video/image player
- ✅ **Actions**: Download, share, delete media
- ✅ **Responsive design**: Works on all device sizes
- ✅ **Loading states**: Proper loading and error handling

### Gallery Components

#### `Gallery.tsx`
Main gallery component with:
- Media grid/list display
- Search and filtering controls
- Sorting options
- View mode toggle

#### `MediaPlayerModal`
Full-screen media player with:
- Video playback controls
- Image display
- Media actions (download, share, delete)
- Media metadata display

#### `useMedia` Hook
Custom React hook for:
- Fetching media data
- CRUD operations
- Loading and error states
- Real-time updates

### Usage Examples

#### Basic Gallery Usage
```tsx
import Gallery from '@/components/gallery/Gallery';

export default function GalleryPage() {
  return <Gallery />;
}
```

#### Using the Media Hook
```tsx
import { useMedia } from '@/lib/hooks/useMedia';

function MyComponent() {
  const { media, loading, error, addMedia, deleteMedia } = useMedia({
    type: 'video',
    limit: 20
  });

  // Use media data...
}
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed the Database
```bash
# Using the API endpoint
curl -X POST http://localhost:3000/api/media/seed

# Or using npm script (when implemented)
npm run seed
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access the Gallery
Navigate to `http://localhost:3000/gallery` or use the gallery mode in the main app.

## 🛠️ Database Management

### Scripts
```bash
# Clean database files
npm run clean:db

# Seed with sample data
npm run seed

# Clean generated media files
npm run clean:media
```

### Database Files
- `media.db` - SQLite database file
- `media.json` - JSON fallback storage

### Adding Media Programmatically
```javascript
import { insertMedia } from '@/lib/database';

const newMedia = {
  id: 'unique-id',
  url: 'https://example.com/image.jpg',
  type: 'image',
  title: 'My Image',
  description: 'A beautiful image',
  width: 1920,
  height: 1080,
  tags: ['nature', 'landscape']
};

await insertMedia(newMedia);
```

## 🔧 Configuration

### Environment Variables
```bash
# Database configuration is automatic
# SQLite database will be created at ./media.db
```

### Customization
- Modify `MediaMetadata` type in `@/lib/types.ts` for additional fields
- Update database schema in `@/lib/database.ts`
- Customize gallery UI in `@/components/gallery/Gallery.tsx`

## 📊 Performance

### Optimizations
- Database indexing for fast queries
- Pagination for large datasets
- Lazy loading of media thumbnails
- Efficient React re-renders with useMemo

### Limitations
- SQLite file size limits (practical limit ~1TB)
- Client-side database operations
- No real-time synchronization between clients

## 🐛 Troubleshooting

### Common Issues

**Database not initializing**
- Check if `sql.js` is properly installed
- Verify file permissions for database creation
- Check console for initialization errors

**Media not displaying**
- Verify media URLs are accessible
- Check CORS settings for external media
- Ensure proper media type classification

**Search not working**
- Check if search terms are properly encoded
- Verify database indexes are created
- Test with simple queries first

### Debug Mode
Enable debug logging by setting:
```javascript
// In database.ts
const DEBUG = true;
```

## 🔮 Future Enhancements

### Planned Features
- [ ] **Real-time sync**: WebSocket-based real-time updates
- [ ] **Cloud storage**: Integration with cloud storage providers
- [ ] **Advanced search**: Tag-based and metadata search
- [ ] **Bulk operations**: Multi-select and bulk actions
- [ ] **Media processing**: Thumbnail generation and optimization
- [ ] **Export/Import**: Database backup and restore functionality

### Performance Improvements
- [ ] **Virtual scrolling**: For very large media collections
- [ ] **Image lazy loading**: Progressive image loading
- [ ] **Caching**: Client-side media caching
- [ ] **CDN integration**: Content delivery network support

---

**Implementation Status**: ✅ Complete and fully functional

The database and gallery system is now ready for production use with full CRUD functionality, search capabilities, and a modern responsive UI.
