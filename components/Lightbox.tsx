
import React from 'react';
import { X, Download, Wand2, Loader2 } from 'lucide-react';
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
            <h3 className="text-lg font-bold text-gray-900">상세 미리보기</h3>
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
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <p className="text-blue-600 font-bold bg-white/80 px-4 py-2 rounded-full backdrop-blur shadow-sm">AI 화질 개선 중...</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t flex items-center justify-between bg-white">
          <div className="flex gap-4">
            <button
              onClick={() => onEnhance(tile.id)}
              disabled={tile.isEnhancing || !!tile.enhancedUrl}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all
                ${tile.enhancedUrl 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200'
                }
                ${tile.isEnhancing ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {tile.isEnhancing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Wand2 className="w-5 h-5" />
              )}
              {tile.isEnhancing ? '처리 중' : tile.enhancedUrl ? '개선 완료' : 'AI 화질 개선'}
            </button>
          </div>

          <button
            onClick={() => downloadSingleImage(tile.enhancedUrl || tile.originalUrl, `tile-${tile.row+1}-${tile.col+1}.png`)}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gray-900 text-white hover:bg-black transition-colors font-semibold shadow-md"
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
