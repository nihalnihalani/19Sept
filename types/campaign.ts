/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CampaignMedia {
  id: string;
  title: string;
  description?: string;
  mediaUrl: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  createdAt: string;
  fileSize?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  campaignId?: string;
  tags?: string[];
}

export interface CampaignGalleryProps {
  media: CampaignMedia[];
  onPlayMedia: (media: CampaignMedia) => void;
  onEditMedia?: (media: CampaignMedia) => void;
  onDeleteMedia?: (media: CampaignMedia) => void;
}

export interface MediaCardProps {
  media: CampaignMedia;
  onPlay: (media: CampaignMedia) => void;
  onEdit?: (media: CampaignMedia) => void;
  onDelete?: (media: CampaignMedia) => void;
}

export interface MediaGridProps {
  media: CampaignMedia[];
  onPlayMedia: (media: CampaignMedia) => void;
  onEditMedia?: (media: CampaignMedia) => void;
  onDeleteMedia?: (media: CampaignMedia) => void;
}
