export enum ApiStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface ImageFile {
  base64: string;
  mimeType: string;
}

export interface RestoreOptions {
  basicRestore: boolean;
  colorize: boolean;
  upscale: boolean;
  adjustLighting: 'none' | 'increase' | 'decrease' | 'natural' | 'studio';
  backgroundAction: 'none' | 'remove' | 'blur' | 'replace';
  replaceBackgroundDescription: string;
  creativeMode: 'none' | 'vintage' | 'cinematic' | 'cartoon';
  outputColor: 'keep_bw' | 'auto_colorize' | 'studio_colorize';
}
