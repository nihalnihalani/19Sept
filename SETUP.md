# Alchemy Studio Setup Guide

## Environment Variables Setup

To use the AI features in Alchemy Studio, you need to set up your API keys.

### 1. Create Environment File

Create a `.env.local` file in the root directory of the project:

```bash
# Google Gemini API Key
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 2. Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Replace `your_actual_gemini_api_key_here` in your `.env.local` file

### 3. Restart the Development Server

After setting up your environment variables:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

## Features Available

### ✅ Product Category Detection
- Upload product images (sneakers, skincare, beverages, etc.)
- AI automatically detects product category
- Supports 11 categories with visual feedback

### ✅ Image Generation
- Create images from text prompts
- Edit existing images
- Compose multiple images

### ✅ Video Generation
- Generate videos from text and images
- Video editing and trimming capabilities

## Troubleshooting

### "API key not configured" Error
- Make sure you've created the `.env.local` file
- Verify your API key is correct
- Restart the development server after adding the environment variable

### "Failed to detect product category" Error
- Check your internet connection
- Verify your Gemini API key has sufficient quota
- Try with a different image format (PNG, JPG, WEBP)

## Support

If you encounter any issues, check the browser console for detailed error messages.
