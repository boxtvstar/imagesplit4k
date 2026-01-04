
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ImageUploader from './components/ImageUploader';
import TileCard from './components/TileCard';
import Lightbox from './components/Lightbox';
import ApiKeyModal from './components/ApiKeyModal';
import { ImageTile, AspectRatio, ImageSize } from './types';
import { splitImage, downloadAllAsZip } from './services/imageService';
import { enhanceImageWithGemini } from './services/geminiService';
import { getApiKey, clearApiKey } from './services/cryptoService';
import { 
  Grid3X3, Download, RefreshCw, Layers, CheckCircle, 
  Zap, ShieldCheck, ArrowRight, Settings2, Info, AlertTriangle
} from 'lucide-react';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rows, setRows] = useState<number>(3);
  const [cols, setCols] = useState<number>(3);
  const [tiles, setTiles] = useState<ImageTile[]>([]);
  const [isSplitting, setIsSplitting] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [selectedSize, setSelectedSize] = useState<ImageSize>('1K');
  const [lightboxTile, setLightboxTile] = useState<ImageTile | null>(null);

  useEffect(() => {
    const savedKey = getApiKey();
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

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
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }

    const target = tiles.find(t => t.id === id);
    if (!target) return;

    const currentSize = selectedSize;

    setTiles(prev => prev.map(t => t.id === id ? { ...t, isEnhancing: true, enhancingQuality: currentSize } : t));
    if (lightboxTile?.id === id) {
      setLightboxTile(prev => prev ? { ...prev, isEnhancing: true, enhancingQuality: currentSize } : null);
    }

    try {
      const enhancedUrl = await enhanceImageWithGemini(target.originalUrl, currentSize, apiKey);
      
      setTiles(prev => prev.map(t => t.id === id ? { 
        ...t, 
        enhancedUrl, 
        isEnhancing: false, 
        enhancedQuality: currentSize,
        enhancingQuality: undefined 
      } : t));
      
      if (lightboxTile?.id === id) {
        setLightboxTile(prev => prev ? { 
          ...prev, 
          enhancedUrl, 
          isEnhancing: false, 
          enhancedQuality: currentSize,
          enhancingQuality: undefined 
        } : null);
      }
    } catch (err: any) {
      if (err.message === "PERMISSION_DENIED") {
        alert("선택된 API 키로 모델에 접근할 수 없습니다. 유료 티어 계정의 키인지 확인해주세요.");
        setShowKeyModal(true);
      } else {
        alert(`AI 개선 오류: ${err.message}`);
      }
      
      setTiles(prev => prev.map(t => t.id === id ? { ...t, isEnhancing: false, enhancingQuality: undefined } : t));
      if (lightboxTile?.id === id) {
        setLightboxTile(prev => prev ? { ...prev, isEnhancing: false, enhancingQuality: undefined } : null);
      }
    }
  };

  // 키 미설정 시 온보딩 화면
  if (!apiKey && !showKeyModal) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row animate-in fade-in zoom-in duration-500">
            <div className="md:w-1/2 bg-gradient-to-br from-slate-900 to-blue-900 p-12 text-white flex flex-col justify-between">
              <div>
                <div className="bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center mb-8">
                  <ShieldCheck className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-4xl font-black mb-6 leading-tight">전문가용<br/>AI 화질 개선</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-bold opacity-80">최대 4K 초고해상도 지원</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-bold opacity-80">워터마크 및 노이즈 자동 제거</span>
                  </div>
                </div>
              </div>
              <p className="text-xs opacity-50 font-medium">Standalone Vercel Edition</p>
            </div>

            <div className="md:w-1/2 p-12 bg-white flex flex-col justify-center">
              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">시작하기</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                화질 개선을 위해 Gemini API 키가 필요합니다. 
                입력하신 키는 사용자의 브라우저에만 암호화되어 저장됩니다.
              </p>
              
              <button
                onClick={() => setShowKeyModal(true)}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                API 키 입력하고 시작하기
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={() => setShowKeyModal(true)} 
                className="p-3 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-2xl transition-all shadow-sm"
                title="API 키 관리"
              >
                <Settings2 className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" /> 이미지 구성
            </h2>

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
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">열 (Cols)</label>
                <input 
                  type="number" min="1" max="10" value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                />
              </div>
            </div>

            <button
              onClick={handleSplit}
              disabled={!selectedFile || isSplitting}
              className={`w-full mt-8 py-5 rounded-[1.5rem] font-black text-lg shadow-2xl transition-all active:scale-95
                ${!selectedFile || isSplitting 
                  ? 'bg-slate-100 text-slate-300 shadow-none' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100 transform hover:-translate-y-1'
                }
              `}
            >
              {isSplitting ? '조각내는 중...' : '이미지 분할하기'}
            </button>

            <div className="mt-10 pt-8 border-t border-slate-50">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> 개선 품질 선택
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {(['1K', '2K', '4K'] as ImageSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-4 rounded-2xl text-xs font-black transition-all border-2
                      ${selectedSize === size 
                        ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-50' 
                        : 'bg-white text-slate-400 border-slate-100 hover:border-amber-200'
                      }
                    `}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <div className="mt-4 p-4 bg-slate-50 rounded-2xl flex items-start gap-3">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 leading-normal">
                  2K/4K 품질은 유료 API 키가 필요합니다. 설정 메뉴에서 키를 언제든 변경할 수 있습니다.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-8">
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[600px]">
            <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-2xl">
                  <Layers className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">분할 보관함</h2>
                  <p className="text-xs text-slate-400 font-bold">총 {tiles.length}개의 조각 이미지</p>
                </div>
              </div>
              {tiles.length > 0 && (
                <button
                  onClick={() => downloadAllAsZip(tiles)}
                  className="flex items-center gap-2 py-3.5 px-7 bg-slate-900 text-white rounded-[1.2rem] text-sm font-black hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95"
                >
                  <Download className="w-4 h-4" /> 전체 압축 다운로드
                </button>
              )}
            </div>

            {tiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {tiles.map((tile) => (
                  <TileCard 
                    key={tile.id} 
                    tile={tile} 
                    aspectRatio={aspectRatio}
                    targetSize={selectedSize}
                    onEnhance={handleEnhance}
                    onOpenLightbox={setLightboxTile}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-48 opacity-10">
                <div className="bg-slate-100 p-10 rounded-full mb-6">
                  <Grid3X3 className="w-20 h-20 text-slate-300" />
                </div>
                <p className="font-black text-slate-400 text-xl uppercase tracking-tighter">No Images Split Yet</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {showKeyModal && (
        <ApiKeyModal 
          initialKey={apiKey}
          onSave={setApiKey}
          onClose={() => setShowKeyModal(false)}
        />
      )}

      {lightboxTile && (
        <Lightbox 
          tile={lightboxTile} 
          targetSize={selectedSize}
          onClose={() => setLightboxTile(null)} 
          onEnhance={handleEnhance}
        />
      )}
    </Layout>
  );
};

export default App;
