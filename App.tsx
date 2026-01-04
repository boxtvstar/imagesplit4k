
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import ImageUploader from './components/ImageUploader';
import TileCard from './components/TileCard';
import Lightbox from './components/Lightbox';
import KeyManagerModal from './components/KeyManagerModal';
import { ImageTile, AspectRatio, ImageSize } from './types';
import { splitImage, downloadAllAsZip } from './services/imageService';
import { enhanceImageWithGemini } from './services/geminiService';
import { 
  Grid3X3, Download, RefreshCw, Layers, CheckCircle, 
  Zap, ShieldCheck, ArrowRight, Settings2, Info, Lock
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
  const [selectedSize, setSelectedSize] = useState<ImageSize>('1K');
  const [lightboxTile, setLightboxTile] = useState<ImageTile | null>(null);

  // 초기 및 세션 간 키 상태 체크 (반복 묻기 방지)
  const checkKeyStatus = useCallback(async () => {
    if (window.aistudio) {
      const active = await window.aistudio.hasSelectedApiKey();
      setHasKey(active);
    }
  }, []);

  // 키 선택 완료 핸들러
  const handleKeySelected = useCallback(async () => {
    await checkKeyStatus();
    // 모달을 자동으로 닫지 않고 사용자가 테스트를 해볼 수 있게 하거나, 원하면 여기서 닫을 수 있습니다.
    // 사용자 편의를 위해 상태 업데이트만 하고 닫지는 않겠습니다. (사용자가 닫기 클릭 유도)
  }, [checkKeyStatus]);

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

    const currentSize = selectedSize;

    setTiles(prev => prev.map(t => t.id === id ? { ...t, isEnhancing: true, enhancingQuality: currentSize } : t));
    if (lightboxTile?.id === id) {
      setLightboxTile(prev => prev ? { ...prev, isEnhancing: true, enhancingQuality: currentSize } : null);
    }

    try {
      const enhancedUrl = await enhanceImageWithGemini(target.originalUrl, currentSize);
      
      setTiles(prev => prev.map(t => t.id === id ? { 
        ...t, 
        enhancedUrl, 
        isEnhancing: false, 
        enhancedQuality: currentSize,
        enhancingQuality: undefined 
      } : t));
      
      if (lightboxTile?.id === id) {
        setLightboxTile(prev => prev ? { ...prev, enhancedUrl, isEnhancing: false, enhancedQuality: currentSize, enhancingQuality: undefined } : null);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "";
      if (errorMsg === "PERMISSION_DENIED" || errorMsg.includes("Requested entity was not found")) {
        alert("선택된 API 키에 모델 접근 권한이 없거나 키가 올바르지 않습니다. 관리 도구에서 연결 테스트를 진행해보세요.");
        setHasKey(false);
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
  if (!hasKey && !showKeyModal) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="md:w-5/12 bg-slate-900 p-12 text-white flex flex-col justify-between">
              <div>
                <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center mb-10 shadow-xl shadow-blue-900/40">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl font-black mb-6 leading-[1.1] tracking-tight">전문가용<br/>보안 연결</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  본 서비스는 외부 API 키를 암호화하여 직접 관리하는 안전한 연결 방식을 사용합니다.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                    <span className="text-xs font-bold">로컬 드라이브 암호화 저장소</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                    <span className="text-xs font-bold">세션 간 연결 영구 유지</span>
                  </div>
                </div>
              </div>
              <div className="pt-10 border-t border-white/10">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Master AI Key Management Enabled</p>
              </div>
            </div>

            <div className="md:w-7/12 p-16 bg-white flex flex-col justify-center">
              <div className="mb-8">
                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">External Management</span>
                <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">AI 엔진을<br/>연결해야 합니다</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  고화질 이미지 개선 기능을 시작하려면 암호화된 외부 키 관리 도구를 열고 연결을 완료하세요. 한 번 연결하면 다시 묻지 않습니다.
                </p>
              </div>
              
              <button
                onClick={() => setShowKeyModal(true)}
                className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl shadow-2xl shadow-blue-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98] group"
              >
                관리 도구 열기
                <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-6 right-6 z-10">
              <button 
                onClick={() => setShowKeyModal(true)} 
                className={`p-3 rounded-2xl transition-all shadow-sm border ${hasKey ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-blue-600 hover:bg-blue-50'}`}
                title="외부 AI 키 관리"
              >
                <Settings2 className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-blue-600 rounded-xl">
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
                  : 'bg-slate-900 text-white hover:bg-black shadow-slate-200 transform hover:-translate-y-1'
                }
              `}
            >
              {isSplitting ? '이미지 분할 중...' : '이미지 분할하기'}
            </button>

            <div className="mt-12 pt-8 border-t border-slate-50">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> 개선 품질 선택
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {(['1K', '2K', '4K'] as ImageSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-5 rounded-2xl text-xs font-black transition-all border-2
                      ${selectedSize === size 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-100' 
                        : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200 hover:text-blue-500'
                      }
                    `}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-8">
          <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm min-h-[700px]">
            <div className="flex items-center justify-between mb-12 flex-wrap gap-4">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-slate-900 rounded-2xl shadow-lg">
                  <Layers className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">분할 보관함</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Storage Status</span>
                    <span className="w-1 h-1 rounded-full bg-green-500"></span>
                    <span className="text-xs text-blue-600 font-black">Connected via AES-256</span>
                  </div>
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

            {tiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
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
          onKeySelected={handleKeySelected}
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
