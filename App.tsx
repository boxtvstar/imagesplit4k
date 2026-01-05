
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import ImageUploader from './components/ImageUploader';
import TileCard from './components/TileCard';
import Lightbox from './components/Lightbox';
import KeyManagerModal from './components/KeyManagerModal';
import { ImageTile, AspectRatio } from './types';
import { splitImage, downloadAllAsZip } from './services/imageService';
import { enhanceImageWithGemini as enhanceFn } from './services/geminiService';
import { 
  Grid3X3, Download, RefreshCw, Layers, 
  Zap, ArrowRight, Settings2, Key as KeyIcon,
  LayoutGrid
} from 'lucide-react';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rows, setRows] = useState<number>(3);
  const [cols, setCols] = useState<number>(3);
  const [tiles, setTiles] = useState<ImageTile[]>([]);
  const [isSplitting, setIsSplitting] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [lightboxTile, setLightboxTile] = useState<ImageTile | null>(null);

  const checkKeyStatus = useCallback(() => {
    const saved = localStorage.getItem('custom_gemini_api_key');
    setHasKey(!!saved);
  }, []);

  useEffect(() => {
    checkKeyStatus();
  }, [checkKeyStatus]);

  const handleSplit = async () => {
    if (!selectedFile) return;
    setIsSplitting(true);
    try {
      const result = await splitImage(selectedFile, rows, cols);
      setTiles(result);
    } catch (err) {
      alert('이미지 분할 중 오류가 발생했습니다.');
    } finally {
      setIsSplitting(false);
    }
  };

  const handleEnhance = async (id: string) => {
    if (!hasKey) {
      setShowKeyModal(true);
      return;
    }

    const target = tiles.find(t => t.id === id);
    if (!target) return;

    // 품질 선택을 없앴으므로 기본 '1K'로 내부 처리
    const defaultSize = '1K';

    setTiles(prev => prev.map(t => t.id === id ? { ...t, isEnhancing: true, hasError: false, enhancingQuality: defaultSize } : t));
    if (lightboxTile?.id === id) {
      setLightboxTile(prev => prev ? { ...prev, isEnhancing: true, hasError: false, enhancingQuality: defaultSize } : null);
    }

    try {
      const enhancedUrl = await enhanceFn(target.originalUrl, defaultSize);
      
      setTiles(prev => prev.map(t => t.id === id ? { 
        ...t, 
        enhancedUrl, 
        isEnhancing: false, 
        hasError: false,
        enhancedQuality: defaultSize,
        enhancingQuality: undefined 
      } : t));
      
      if (lightboxTile?.id === id) {
        setLightboxTile(prev => prev ? { ...prev, enhancedUrl, isEnhancing: false, hasError: false, enhancedQuality: defaultSize, enhancingQuality: undefined } : null);
      }
    } catch (err: any) {
      console.error("Enhance error:", err);
      
      let alertMsg = "AI 개선 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      if (err.message === "MODEL_ACCESS_DENIED") {
        alertMsg = "API 키에 이미지 개선 모델 접근 권한이 없습니다. 키 설정을 다시 확인해주세요.";
      }

      alert(alertMsg);

      setTiles(prev => prev.map(t => t.id === id ? { ...t, isEnhancing: false, hasError: true, enhancingQuality: undefined } : t));
      if (lightboxTile?.id === id) {
        setLightboxTile(prev => prev ? { ...prev, isEnhancing: false, hasError: true, enhancingQuality: undefined } : null);
      }
    }
  };

  return (
    <Layout>
      {!hasKey && (
        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-amber-100/50">
            <div className="bg-amber-500 p-5 rounded-3xl shadow-lg shadow-amber-200">
              <KeyIcon className="w-10 h-10 text-white" />
            </div>
            <div className="flex-grow text-center md:text-left">
              <h2 className="text-2xl font-black text-amber-900 mb-2 tracking-tight">AI 엔진 연결이 필요합니다</h2>
              <p className="text-amber-700 font-medium leading-relaxed">
                현재 연결된 AI 엔진이 없습니다. <strong>자신의 Gemini API 키를 등록</strong>하면 고화질 개선 및 텍스트 제거 기능을 사용할 수 있습니다.
              </p>
            </div>
            <button 
              onClick={() => setShowKeyModal(true)}
              className="whitespace-nowrap px-8 py-5 bg-amber-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl shadow-amber-200 active:scale-95 flex items-center gap-3"
            >
              API 키 등록하기 <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-10 ${!hasKey ? 'opacity-60 grayscale-[0.5] pointer-events-none' : 'transition-all duration-700'}`}>
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-6 right-6 z-10 pointer-events-auto">
              <button 
                onClick={() => setShowKeyModal(true)} 
                className={`p-3 rounded-2xl transition-all shadow-sm border ${hasKey ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100' : 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700 animate-bounce'}`}
                title="API 키 설정"
              >
                <Settings2 className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-100">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">이미지 구성</h2>
            </div>

            <ImageUploader 
              onImageSelect={setSelectedFile} 
              selectedFile={selectedFile} 
              onClear={() => { setSelectedFile(null); setTiles([]); }}
            />

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">행 (Rows)</label>
                <input 
                  type="number" min="1" max="10" value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-700 text-lg shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">열 (Cols)</label>
                <input 
                  type="number" min="1" max="10" value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-700 text-lg shadow-inner"
                />
              </div>
            </div>

            <button
              onClick={handleSplit}
              disabled={!selectedFile || isSplitting}
              className={`w-full mt-8 py-5 rounded-2xl font-black text-lg shadow-2xl transition-all active:scale-95
                ${!selectedFile || isSplitting 
                  ? 'bg-slate-100 text-slate-300 shadow-none cursor-not-allowed' 
                  : 'bg-slate-900 text-white hover:bg-black transform hover:-translate-y-1'
                }
              `}
            >
              {isSplitting ? '이미지 분할 중...' : '이미지 분할하기'}
            </button>
          </section>
        </div>

        <div className="lg:col-span-8">
          <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm min-h-[700px]">
            <div className="flex flex-col gap-8 mb-12">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-slate-900 rounded-2xl shadow-lg">
                    <Layers className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">분할 이미지 보관함</h2>
                    {hasKey && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Connection</span>
                        <span className="w-1 h-1 rounded-full bg-green-500"></span>
                        <span className="text-xs text-green-600 font-black">AI 엔진 온라인</span>
                      </div>
                    )}
                  </div>
                </div>
                {tiles.length > 0 && (
                  <button
                    onClick={() => downloadAllAsZip(tiles)}
                    className="flex items-center gap-3 py-4 px-8 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 transition-all shadow-2xl shadow-blue-100 active:scale-95"
                  >
                    <Download className="w-5 h-5" /> 전체 압축 다운로드
                  </button>
                )}
              </div>

              {/* 우측 분할 보관함 상단으로 이동한 화면비 선택 UI */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
                    <LayoutGrid className="w-4 h-4" /> 타일 화면비 설정
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['1:1', '4:3', '16:9', '3:4', '9:16', '21:9'] as AspectRatio[]).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`px-5 py-2.5 rounded-xl text-[11px] font-black transition-all border-2
                          ${aspectRatio === ratio 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                            : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                          }
                        `}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {tiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {tiles.map((tile) => (
                  <TileCard 
                    key={tile.id} 
                    tile={tile} 
                    aspectRatio={aspectRatio}
                    onEnhance={handleEnhance}
                    onOpenLightbox={setLightboxTile}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-56">
                <div className="bg-slate-50 p-12 rounded-[3rem] mb-8 border border-slate-100">
                  <Grid3X3 className="w-24 h-24 text-slate-200" />
                </div>
                <p className="font-black text-slate-300 text-2xl uppercase tracking-tighter">Ready for Selection</p>
                <p className="text-slate-400 text-sm mt-2 font-medium">이미지를 업로드하고 분할을 시작하세요.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {showKeyModal && (
        <KeyManagerModal 
          isConnected={hasKey}
          onKeyUpdated={checkKeyStatus}
          onClose={() => setShowKeyModal(false)}
        />
      )}

      {lightboxTile && (
        <Lightbox 
          tile={lightboxTile} 
          onClose={() => setLightboxTile(null)} 
          onEnhance={handleEnhance}
        />
      )}
    </Layout>
  );
};

export default App;
