"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Palette,
  Image as ImageIcon,
  Film,
  Upload,
  Sparkles,
  Target,
  Eye
} from "lucide-react";

interface CreatorStudioProps {
  onSwitchToCampaign: () => void;
}

const CreatorStudio: React.FC<CreatorStudioProps> = ({ onSwitchToCampaign }) => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d0d] to-[#121212]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Message */}
        <div className="text-center py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <div className="p-6 bg-gradient-to-r from-[#7e3ff2]/20 to-[#5a2db8]/20 rounded-3xl w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg">
              <Palette className="w-12 h-12 text-[#7e3ff2]" />
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#f5f5f5] to-[#a5a5a5] bg-clip-text text-transparent mb-4">
              Creator Studio
            </h1>
            
            <p className="text-[#a5a5a5] text-lg mb-8">
              Professional AI-powered creative tools for image and video generation
            </p>
            
            <div className="bg-[#2a2a2a]/30 border border-[#2a2a2a]/50 rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-[#f5f5f5] mb-4">Available Tools</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { icon: ImageIcon, label: "Create Image", color: "from-blue-500 to-cyan-500" },
                  { icon: Upload, label: "Edit Image", color: "from-green-500 to-emerald-500" },
                  { icon: Palette, label: "Compose", color: "from-purple-500 to-pink-500" },
                  { icon: Film, label: "Create Video", color: "from-orange-500 to-red-500" },
                  { icon: Target, label: "Gallery", color: "from-teal-500 to-blue-500" },
                  { icon: Eye, label: "Category", color: "from-pink-500 to-purple-500" }
                ].map((tool, index) => {
                  const Icon = tool.icon;
                  return (
                    <motion.div
                      key={tool.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-[#2a2a2a]/20 rounded-xl"
                    >
                      <div className={`p-2 bg-gradient-to-r ${tool.color} rounded-lg`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-[#f5f5f5] text-sm font-medium">{tool.label}</span>
                    </motion.div>
                  );
                })}
              </div>
              
              <p className="text-[#a5a5a5] text-sm mt-6">
                Use the sidebar to access all creator tools and start generating amazing content!
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CreatorStudio;