export type PresentationMode = 'model' | 'object';

export interface WorkflowOption {
  id: string;
  name: string;
  thumbnail: string;
  description: string;
  promptFragment: string; // The specific prompt part for consistency
}

export interface ModelOption extends WorkflowOption {
  type: PresentationMode;
  gender?: 'male' | 'female' | 'neutral';
  isCustom?: boolean; // Flag to identify user uploaded models
}

export interface PoseOption extends WorkflowOption {
  allowedModes: PresentationMode[];
}

export interface SettingOption extends WorkflowOption {
  category: 'indoor' | 'outdoor' | 'studio' | 'abstract';
}

export interface StyleOption extends WorkflowOption {
  intensity: 'natural' | 'cinematic' | 'minimalist';
}

export interface GenerationRequest {
  clothImageBase64: string;
  modelId: string;
  modelImageBase64?: string; // Optional custom model image
  poseIds: string[]; // User can select up to 3
  settingId: string;
  styleId: string;
}

export interface GeneratedImage {
  id: string;
  url: string; // Base64 data URL
  promptUsed: string;
  timestamp: number;
}