#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { GoogleGenerativeAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const ai = new GoogleGenerativeAI({ apiKey: GEMINI_API_KEY });

class StandaloneAlchemyMCP {
  private server: Server;

  constructor() {
    this.server = new Server(
      { name: 'alchemy-studio', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'generate_image',
          description: 'Generate an image using Imagen 4 or Gemini 2.5 Flash',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: { type: 'string', description: 'Image description' },
              model: { type: 'string', enum: ['imagen', 'gemini'], default: 'gemini' },
              aspect_ratio: { type: 'string', enum: ['16:9', '9:16', '1:1'], default: '16:9' },
            },
            required: ['prompt']
          }
        },
        {
          name: 'edit_image',
          description: 'Edit an existing image using AI',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: { type: 'string', description: 'Edit instructions' },
              image_url: { type: 'string', description: 'Image URL or base64 data URL' }
            },
            required: ['prompt', 'image_url']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'generate_image':
            return await this.generateImage(request.params.arguments as any);
          case 'edit_image':
            return await this.editImage(request.params.arguments as any);
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error?.message || String(error)}` }] };
      }
    });
  }

  private async generateImage(args: any) {
    const { prompt, model = 'gemini', aspect_ratio = '16:9' } = args || {};
    if (!prompt) throw new Error('Missing prompt');

    if (model === 'imagen') {
      // Imagen 4 text-to-image via @google/genai (generateImages)
      // Note: exact model id may vary by access; using a common public preview id
      const response: any = await (ai as any).models.generateImages({
        model: 'imagen-4.0-fast-generate-001',
        prompt,
        config: { aspectRatio: aspect_ratio }
      });

      const image = response?.generatedImages?.[0]?.image;
      if (!image?.imageBytes) throw new Error('No image generated');
      const dataUrl = `data:${image.mimeType || 'image/png'};base64,${image.imageBytes}`;
      return { content: [{ type: 'text', text: `✅ Imagen 4 image\n\nPrompt: ${prompt}\n\n${dataUrl}` }] };
    }

    // Gemini image generation (image preview model emits inline data)
    // We'll prompt and return the first inlineData found.
    const modelId = 'gemini-2.5-flash-image-preview';
    const modelInstance: any = (ai as any).getGenerativeModel({ model: modelId });
    const result = await modelInstance.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });

    const parts = result?.response?.candidates?.[0]?.content?.parts || [];
    let inlineData: any = null;
    for (const p of parts) {
      if (p?.inlineData?.data) { inlineData = p.inlineData; break; }
    }
    if (!inlineData?.data) throw new Error('No image generated');
    const dataUrl = `data:${inlineData.mimeType || 'image/png'};base64,${inlineData.data}`;
    return { content: [{ type: 'text', text: `✅ Gemini image\n\nPrompt: ${prompt}\n\n${dataUrl}` }] };
  }

  private async editImage(args: any) {
    const { prompt, image_url } = args || {};
    if (!prompt || !image_url) throw new Error('Missing prompt or image_url');

    // Normalize to base64 PNG
    let base64Data: string;
    let mimeType = 'image/png';
    if (String(image_url).startsWith('data:')) {
      const [header, b64] = String(image_url).split(',');
      base64Data = b64;
      const m = header.match(/data:([^;]+)/);
      if (m?.[1]) mimeType = m[1];
    } else {
      const res = await fetch(String(image_url));
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
      const buff = Buffer.from(await res.arrayBuffer());
      base64Data = buff.toString('base64');
      // keep default mimeType
    }

    const modelId = 'gemini-2.5-flash-image-preview';
    const modelInstance: any = (ai as any).getGenerativeModel({ model: modelId });
    const result = await modelInstance.generateContent({
      contents: [
        { role: 'user', parts: [ { text: prompt }, { inlineData: { mimeType, data: base64Data } } ] }
      ]
    });

    const parts = result?.response?.candidates?.[0]?.content?.parts || [];
    let inlineData: any = null;
    for (const p of parts) {
      if (p?.inlineData?.data) { inlineData = p.inlineData; break; }
    }
    if (!inlineData?.data) throw new Error('No edited image returned');

    const dataUrl = `data:${inlineData.mimeType || 'image/png'};base64,${inlineData.data}`;
    return { content: [{ type: 'text', text: `✅ Edited image\n\nInstructions: ${prompt}\n\n${dataUrl}` }] };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Standalone Alchemy MCP Server running');
  }
}

const server = new StandaloneAlchemyMCP();
server.run().catch(console.error);
