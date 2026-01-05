
import React from 'react';
import { Download, Wand2, Loader2, Maximize2, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { ImageTile, ASPECT_RATIO_CLASSES, AspectRatio } from '../types';
import { downloadSingleImage } from '../services/imageService';

interface TileCardProps {
  tile: ImageTile;
  aspectRatio: AspectRatio;
  onEnhance: (id: string) => void;
  onOpenLightbox: (tile: ImageTile) => void;
}

const TileCard: React.FC<TileCardProps> = ({ tile, aspectRatio, onEnhance, onOpenLightbox }) => {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = tile.enhancedUrl || tile.originalUrl;
    downloadSingleImage(url, `tile-${tile.row + 1}-${tile.col + 1}.png`);
  };

  const handleEnhance = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tile.isEnhancing) {
      onEnhance(tile.id);
    }
  };

  return (
    <div className={`bg-white rounded-[2rem] overflow-hidden border-2 transition-all duration-300 group flex flex-col shadow-sm
      ${tile.hasError ? 'border-red-100 bg-red-50/10' : 'border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50'}
    `}>
      <div 
        className={`relative w-full ${ASPECT_RATIO_CLASSES[aspectRatio]} bg-slate-100 cursor-pointer overflow-hidden`}
        onClick={() => onOpenLightbox(tile)}
      >
        <img 
          src={tile.enhancedUrl || tile.originalUrl} 
          alt={`Tile ${tile.row}-${tile.col}`}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110
            ${tile.isEnhancing ? 'opacity-50 blur-[2px]' : 'opacity-100'}
          `}
        />
        
        {/* Left Status Badge */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {tile.enhancedUrl && (
            <span className="px-3 py-1.5 bg-green-500 text-white text-[10px] font-black rounded-xl backdrop-blur-md flex items-center gap-1.5 shadow-lg shadow-green-200/50">
              <CheckCircle className="w-3.5 h-3.5" /> 개선 완료
            </span>
          )}
          {tile.isEnhancing && (
            <span className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-xl animate-pulse flex items-center gap-1.5 shadow-lg shadow-blue-200/50">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> AI 처리 중
            </span>
          )}
          {tile.hasError && !tile.isEnhancing && (
            <span className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-black rounded-xl flex items-center gap-1.5 shadow-lg shadow-red-200/50">
              <AlertCircle className="w-3.5 h-3.5" /> 실패
            </span>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white/90 p-4 rounded-3xl shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
            <Maximize2 className="w-6 h-6 text-slate-900" />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-50 flex gap-3">
        <button
          onClick={handleEnhance}
          disabled={tile.isEnhancing}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-[11px] font-black transition-all active:scale-95
            ${tile.enhancedUrl 
              ? 'bg-slate-50 text-slate-400 cursor-not-allowed' 
              : tile.hasError
                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
            }
          `}
        >
          {tile.isEnhancing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : tile.hasError ? (
            <RotateCcw className="w-4 h-4" />
          ) : tile.enhancedUrl ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          
          {tile.isEnhancing 
            ? `처리 중` 
            : tile.hasError
              ? '재시도'
              : tile.enhancedUrl 
                ? `개선 완료` 
                : `화질 개선 및 텍스트 제거`
          }
        </button>
        <button
          onClick={handleDownload}
          className="p-3.5 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all active:scale-95 shadow-lg"
          title="다운로드"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TileCard;
