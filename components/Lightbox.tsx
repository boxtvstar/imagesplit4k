
import React from 'react';
import { X, Download, Wand2, Loader2, CheckCircle } from 'lucide-react';
import { ImageTile } from '../types';
import { downloadSingleImage } from '../services/imageService';

interface LightboxProps {
  tile: ImageTile;
  onClose: () => void;
  onEnhance: (id: string) => void;
}

const Lightbox: React.FC<LightboxProps> = ({ tile, onClose, onEnhance }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative max-w-5xl w-full max-h-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              상세 미리보기
              {tile.enhancedUrl && (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black uppercase">
                  AI ENHANCED
                </span>
              )}
              {tile.isEnhancing && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-black animate-pulse uppercase">
                  PROCESSING
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500">{tile.row + 1}행 {tile.col + 1}열 조각</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-auto p-4 flex items-center justify-center bg-gray-50 relative">
          <img 
            src={tile.enhancedUrl || tile.originalUrl} 
            alt="Tile Preview" 
            className={`max-w-full max-h-full object-contain shadow-lg transition-opacity duration-300 ${tile.isEnhancing ? 'opacity-40' : 'opacity-100'}`}
          />
          {tile.isEnhancing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="bg-white/90 p-8 rounded-[2rem] shadow-2xl flex flex-col items-center backdrop-blur-md border border-white">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
                <p className="text-blue-600 font-black text-xl tracking-tight">AI 화질 개선 중...</p>
                <p className="text-slate-400 text-xs mt-2 font-bold">노이즈 제거 및 텍스트 오버레이 제거 작업이 진행 중입니다.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t flex items-center justify-between bg-white">
          <div className="flex gap-4">
            <button
              onClick={() => onEnhance(tile.id)}
              disabled={tile.isEnhancing || !!tile.enhancedUrl}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-black transition-all
                ${tile.enhancedUrl 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200'
                }
                ${tile.isEnhancing ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {tile.isEnhancing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : tile.enhancedUrl ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Wand2 className="w-5 h-5" />
              )}
              {tile.isEnhancing 
                ? `처리 중` 
                : tile.enhancedUrl 
                  ? `개선 완료` 
                  : `화질 개선 및 텍스트 제거`
              }
            </button>
          </div>

          <button
            onClick={() => downloadSingleImage(tile.enhancedUrl || tile.originalUrl, `tile-${tile.row+1}-${tile.col+1}.png`)}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gray-900 text-white hover:bg-black transition-colors font-black shadow-md"
          >
            <Download className="w-5 h-5" />
            다운로드
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lightbox;
