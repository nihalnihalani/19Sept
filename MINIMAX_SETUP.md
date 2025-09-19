# MiniMax Video Generation Setup

This guide will help you set up MiniMax video generation in your Alchemy Studio project.

## Prerequisites

1. **MiniMax API Account**: Sign up at [MiniMax](https://www.minimax.com) to get your API key
2. **Node.js**: Ensure you have Node.js installed (version 20.17.0 or higher)

## Installation

The MiniMax-MCP-JS library has been installed. You can verify this by checking your `package.json`:

```bash
npm list minimax-mcp-js
```

## Configuration

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# MiniMax API Configuration for video generation
MINIMAX_API_KEY=your_minimax_api_key_here
MINIMAX_BASE_URL=https://api.minimax.com
MINIMAX_MODEL=MiniMax-Hailuo-02
MINIMAX_DURATION=10
MINIMAX_RESOLUTION=1080P
MINIMAX_OUTPUT_DIR=public/generated-videos
MINIMAX_ASYNC_MODE=false
MINIMAX_MAX_RETRIES=3
MINIMAX_TIMEOUT=30000
```

### 2. API Key Setup

1. Go to [MiniMax Console](https://console.minimax.com)
2. Create a new project or select an existing one
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the API key and replace `your_minimax_api_key_here` in your `.env.local` file

### 3. Output Directory

The generated videos will be saved to `public/generated-videos/`. This directory has been created automatically.

## Usage

### Single Video Generation

```javascript
// API endpoint: POST /api/minimax/generate
{
  "prompt": "A serene beach at sunset with gentle waves",
  "model": "MiniMax-Hailuo-02",
  "duration": 10,
  "resolution": "1080P",
  "asyncMode": false
}
```

### Multiple Video Generation

```javascript
// API endpoint: POST /api/minimax/generate-multiple
{
  "category": "shoes",
  "topBrands": ["Nike", "Adidas"],
  "customPrompts": [
    "Create a 15-second shoes advertisement video with modern motion graphics",
    "Generate a lifestyle shoes video ad showing the product in action"
  ]
}
```

### Query Video Status

```javascript
// API endpoint: GET /api/minimax/generate?taskId=your-task-id
```

## Integration with Campaign Workflow

The MiniMax video generation is now integrated into the Campaign Workflow:

1. **Step 1**: Upload product image
2. **Step 2**: Detect product category
3. **Step 3**: Analyze competition using Apify
4. **Step 4**: Generate 5 images + 2 videos using MiniMax

### Video Generation Process

1. **Competitive Analysis**: The system analyzes competitor ads and market trends
2. **Prompt Generation**: Creates video prompts based on the detected category and competitive insights
3. **Video Creation**: Uses MiniMax to generate 2 different video styles:
   - Modern motion graphics with dynamic transitions
   - Lifestyle video showing product in action
4. **Download**: Users can download the generated videos

## Supported Models

- **MiniMax-Hailuo-02**: Latest model with improved quality and performance
- **Duration**: 10 seconds (configurable)
- **Resolution**: 1080P (configurable)
- **Format**: MP4

## Error Handling

The system includes comprehensive error handling:

- API key validation
- Network timeout handling
- Retry mechanisms
- User-friendly error messages

## Testing

To test the MiniMax integration:

1. Start your development server: `npm run dev`
2. Navigate to the Campaign Workflow
3. Upload a product image
4. Complete the competitive analysis
5. Click "Generate 5 Images + 2 Videos"
6. Wait for the videos to be generated
7. Download the generated content

## Troubleshooting

### Common Issues

1. **API Key Error**: Ensure your MiniMax API key is correctly set in `.env.local`
2. **Timeout Error**: Increase `MINIMAX_TIMEOUT` value if videos take longer to generate
3. **Output Directory Error**: Ensure `public/generated-videos` directory exists and is writable

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

This will show detailed logs in the console for troubleshooting.

## Performance Optimization

- **Parallel Generation**: Videos are generated in parallel for faster processing
- **Caching**: Generated videos are cached in the output directory
- **Async Mode**: Can be enabled for non-blocking video generation

## Security Notes

- Never commit your API keys to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your API keys
- Monitor API usage to avoid unexpected charges

## Support

For issues related to:
- **MiniMax API**: Contact MiniMax support
- **Integration**: Check the console logs and error messages
- **Configuration**: Verify your environment variables

## Next Steps

1. Set up your MiniMax API key
2. Test the video generation functionality
3. Customize video prompts based on your needs
4. Monitor performance and adjust settings as needed
