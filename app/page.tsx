"use client";

import React, { useState } from "react";
import CampaignWorkflow from "@/components/ui/CampaignWorkflow";
import CreatorStudio from "@/components/ui/CreatorStudio";

type AppMode = "campaign" | "creator";

const AlchemyStudio: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>("campaign");

  const handleSwitchToCreator = () => {
    setAppMode("creator");
  };

  const handleSwitchToCampaign = () => {
    setAppMode("campaign");
  };

  return (
    <>
      {appMode === "campaign" ? (
        <CampaignWorkflow onSwitchToCreator={handleSwitchToCreator} />
      ) : (
        <CreatorStudio onSwitchToCampaign={handleSwitchToCampaign} />
      )}
    </>
  );
};

export default AlchemyStudio;
