
import React from 'react';
import { Download, Wand2, Loader2, Maximize2, CheckCircle } from 'lucide-react';
import { ImageTile, ASPECT_RATIO_CLASSES, AspectRatio, ImageSize } from '../types';
import { downloadSingleImage } from '../services/imageService';

interface TileCardProps {
  tile: ImageTile;
  aspectRatio: AspectRatio;
  targetSize: ImageSize;
  onEnhance: (id: string) => void;
  onOpenLightbox: (tile: ImageTile) => void;
}

const TileCard: React.FC<TileCardProps> = ({ tile, aspectRatio, targetSize, onEnhance, onOpenLightbox }) => {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = tile.enhancedUrl || tile.originalUrl;
    downloadSingleImage(url, `tile-${tile.row + 1}-${tile.col + 1}.png`);
  };

  const handleEnhance = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tile.isEnhancing && !tile.enhancedUrl) {
      onEnhance(tile.id);
    }
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col">
      <div 
        className={`relative w-full ${ASPECT_RATIO_CLASSES[aspectRatio]} bg-gray-100 cursor-pointer overflow-hidden`}
        onClick={() => onOpenLightbox(tile)}
      >
        <img 
          src={tile.enhancedUrl || tile.originalUrl} 
          alt={`Tile ${tile.row}-${tile.col}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {tile.enhancedUrl && (
            <span className="px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded backdrop-blur-sm flex items-center gap-1 shadow-sm">
              <CheckCircle className="w-3 h-3" /> {tile.enhancedQuality} 개선됨
            </span>
          )}
          {tile.isEnhancing && (
            <span className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded animate-pulse flex items-center gap-1 shadow-sm">
              <Loader2 className="w-3 h-3 animate-spin" /> {tile.enhancingQuality} 처리 중
            </span>
          )}
        </div>

        {/* Hover overlay actions */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className="p-2 bg-white/90 rounded-full text-gray-900 shadow-lg hover:bg-white transform hover:scale-110 transition-transform">
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-3 border-t border-gray-100 flex gap-2">
        <button
          onClick={handleEnhance}
          disabled={tile.isEnhancing || !!tile.enhancedUrl}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors
            ${tile.enhancedUrl 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }
          `}
        >
          {tile.isEnhancing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : tile.enhancedUrl ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          {tile.isEnhancing 
            ? `${tile.enhancingQuality} 처리중` 
            : tile.enhancedUrl 
              ? `${tile.enhancedQuality} 개선 완료` 
              : `${targetSize} AI 화질 개선`
          }
        </button>
        <button
          onClick={handleDownload}
          className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          title="다운로드"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TileCard;
