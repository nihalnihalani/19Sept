import { motion } from 'framer-motion';
import React, { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";

type StudioMode =
  | "create-image"
  | "edit-image"
  | "compose-image"
  | "create-video";

interface ModelSelectorProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  mode: StudioMode;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  setSelectedModel,
  mode,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const getAvailableModels = (currentMode: StudioMode) => {
    if (currentMode === "create-video") {
      return [
        { name: "veo-3.0-generate-001", label: "Veo 3 - Generate" },
        { name: "veo-3.0-fast-generate-001", label: "Veo 3 - Fast Generate" },
        { name: "veo-2.0-generate-001", label: "Veo 2 - Generate" },
      ];
    } else {
      // For image modes
      return [
        { name: "gemini-2.5-flash-image-preview", label: "Gemini 2.5 Flash" },
        { name: "imagen-4.0-fast-generate-001", label: "Imagen 4.0 Fast" },
      ];
    }
  };

  const models = getAvailableModels(mode);

  const handleSelectModel = (model: string) => {
    setSelectedModel(model);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-gray-300 bg-gray-800/80 hover:bg-gray-700/90 px-3 py-2 rounded-md transition-colors border border-gray-700"
      >
        <Sparkles className="w-4 h-4 text-purple-400" />
        {selectedModel.replace(/-/g, ' ')}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-full mb-2 w-64 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-md shadow-lg z-10 overflow-hidden"
        >
          {models.map((model) => (
            <button
              key={model.name}
              onClick={() => handleSelectModel(model.name)}
              className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-purple-600/50 transition-colors"
            >
              {model.label}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default ModelSelector;
