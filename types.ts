
export interface ImageTile {
  id: string;
  originalUrl: string;
  enhancedUrl?: string;
  isEnhancing: boolean;
  hasError?: boolean; // 에러 발생 여부 추가
  enhancingQuality?: ImageSize;
  enhancedQuality?: ImageSize;
  row: number;
  col: number;
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';

export type ImageSize = '1K' | '2K' | '4K';

export const ASPECT_RATIO_CLASSES: Record<AspectRatio, string> = {
  '1:1': 'aspect-square',
  '3:4': 'aspect-[3/4]',
  '4:3': 'aspect-[4/3]',
  '9:16': 'aspect-[9/16]',
  '16:9': 'aspect-[16/9]',
  '21:9': 'aspect-[21/9]'
};
