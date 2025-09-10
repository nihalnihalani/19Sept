# Alchemy Studio

A modern, AI-powered creative studio built with Next.js that transforms your ideas into stunning images and videos using Google's cutting-edge AI models. Experience the magic of AI creativity with Veo 3, Imagen 4, and Gemini 2.5 Flash in a beautiful, intuitive interface.

![Alchemy Studio](https://img.shields.io/badge/Next.js-15.3.5-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🎨 **AI Image Generation**
- **Create Images**: Generate stunning visuals from text prompts using Imagen 4 or Gemini 2.5 Flash
- **Edit Images**: Transform existing images with AI-powered editing using Gemini 2.5 Flash
- **Compose Images**: Combine multiple images into creative compositions

### 🎬 **AI Video Generation**
- **Create Videos**: Generate dynamic videos from text prompts or images using Veo 3
- **Video Editing**: Built-in video trimming and editing tools
- **Multiple Formats**: Support for various aspect ratios and video formats

### 🖼️ **Product Gallery**
- **Video Library**: Browse and manage your generated videos
- **Interactive Player**: Full-screen video playback with controls
- **Edit & Remix**: Modify video descriptions and metadata

### 🎭 **Modern UI/UX**
- **Dark Theme**: Sophisticated dark interface with vibrant accents
- **Smooth Animations**: Framer Motion powered transitions and interactions
- **Responsive Design**: Works seamlessly across all devices
- **Glassmorphism**: Modern glass-like UI elements with backdrop blur effects

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- **GEMINI_API_KEY**: Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

> ⚠️ **Important**: Veo 3, Imagen 4, and Gemini 2.5 Flash require a paid Gemini API tier.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/alchemy-studio.git
   cd alchemy-studio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy the example environment file and edit it with your API key:
   ```bash
   cp .env.example .env
   # Then edit .env with your actual API key
   ```
   
   Or create a `.env` file manually in the project root:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   FRONTEND_PORT=3000
   ```

4. **Start the development server**
   Use the convenient run script:
   ```bash
   ./run.sh
   ```
   
   Or use npm directly:
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000` and start creating!

## 🏗️ Project Structure

```
alchemy-studio/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── gemini/              # Gemini API endpoints
│   │   ├── imagen/              # Imagen API endpoints
│   │   └── veo/                 # Veo API endpoints
│   ├── globals.css              # Global styles and animations
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main studio interface
├── components/                   # React components
│   ├── gallery/                 # Product gallery components
│   └── ui/                      # UI components
│       ├── Composer.tsx          # Main creative interface
│       ├── VideoPlayer.tsx      # Video player with editing
│       ├── ModelSelector.tsx    # AI model selection
│       ├── Animation.tsx        # Framer Motion wrappers
│       ├── Button.tsx           # Reusable button component
│       ├── Header.tsx           # Application header
│       └── Logo.tsx             # Alchemy Studio logo
├── lib/                         # Utility functions
└── public/                      # Static assets
```

## 🎯 How It Works

### Image Generation Flow
1. **Select Mode**: Choose between Create, Edit, or Compose
2. **Input Prompt**: Describe your vision in natural language
3. **Upload Assets**: Add images for editing or composition
4. **Generate**: AI creates your content using selected model
5. **Download**: Save your creations in high quality

### Video Generation Flow
1. **Create Video**: Enter your video prompt
2. **Optional Image**: Upload a starting image for image-to-video
3. **Configure**: Set aspect ratio and other parameters
4. **Generate**: Veo 3 creates your video (this may take several minutes)
5. **Edit**: Trim and refine your video in the built-in editor
6. **Download**: Export your final video

### Gallery Management
- **Browse**: View all your generated videos
- **Play**: Full-screen video playback
- **Edit**: Modify video descriptions and metadata
- **Organize**: Keep your creations organized

## 🛠️ Technologies

- **[Next.js 15.3.5](https://nextjs.org/)** - React framework with App Router
- **[React 19.0.0](https://reactjs.org/)** - Modern React with concurrent features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 4.0](https://tailwindcss.com/)** - Utility-first styling
- **[Framer Motion](https://www.framer.com/motion/)** - Smooth animations
- **[Google Gemini API](https://ai.google.dev/gemini-api/docs)** - AI models:
  - **Veo 3** - Advanced video generation
  - **Imagen 4** - High-quality image generation
  - **Gemini 2.5 Flash** - Fast image generation and editing

## 🎨 Design Philosophy

Alchemy Studio embraces a **dark, sophisticated aesthetic** with:
- **Vibrant Gradients**: Dynamic background animations
- **Glassmorphism**: Translucent UI elements with backdrop blur
- **Smooth Animations**: Framer Motion powered transitions
- **Intuitive UX**: Clean, minimal interface focused on creativity

## 📚 API Documentation

### Image Generation
- `POST /api/imagen/generate` - Generate images with Imagen 4
- `POST /api/gemini/generate` - Generate images with Gemini 2.5 Flash
- `POST /api/gemini/edit` - Edit images with Gemini 2.5 Flash

### Video Generation
- `POST /api/veo/generate` - Start video generation with Veo 3
- `POST /api/veo/operation` - Check generation status
- `POST /api/veo/download` - Download completed videos

## 🤝 Contributing

We welcome contributions! Please feel free to:
- Open issues for bugs or feature requests
- Submit pull requests for improvements
- Share your creations made with Alchemy Studio

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google AI** for providing the amazing Gemini API
- **Next.js Team** for the incredible framework
- **Framer Motion** for smooth animations
- **Tailwind CSS** for beautiful styling

---

**Made with ❤️ by the Alchemy Studio team**

*Transform your ideas into reality with the power of AI*