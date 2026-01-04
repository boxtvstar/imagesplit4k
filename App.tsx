
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import ImageUploader from './components/ImageUploader';
import TileCard from './components/TileCard';
import Lightbox from './components/Lightbox';
import { ImageTile, AspectRatio, ImageSize } from './types';
import { splitImage, downloadAllAsZip } from './services/imageService';
import { enhanceImageWithGemini } from './services/geminiService';
import { 
  Grid3X3, Download, RefreshCw, Layers, CheckCircle, 
  Key, ExternalLink, Zap, ShieldCheck, Cpu, AlertTriangle, ArrowRight
} from 'lucide-react';

const App: React.FC = () => {
  const [isKeySelected, setIsKeySelected] = useState<boolean | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rows, setRows] = useState<number>(3);
  const [cols, setCols] = useState<number>(3);
  const [tiles, setTiles] = useState<ImageTile[]>([]);
  const [isSplitting, setIsSplitting] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [selectedSize, setSelectedSize] = useState<ImageSize>('1K');
  const [lightboxTile, setLightboxTile] = useState<ImageTile | null>(null);

  // 앱 실행 즉시 API 키 상태를 체크합니다.
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const aistudio = (window as any).aistudio;
        if (aistudio) {
          const hasKey = await aistudio.hasSelectedApiKey();
          setIsKeySelected(hasKey);
        } else {
          // 로컬 환경 또는 직접 주입된 키가 있는 경우
          setIsKeySelected(!!process.env.API_KEY);
        }
      } catch (err) {
        setIsKeySelected(false);
      }
    };
    checkApiKey();
  }, []);

  const handleOpenKeySelector = async () => {
    try {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        await aistudio.openSelectKey();
        // 키 선택 창이 닫히면 레이스 컨디션을 방지하기 위해 성공으로 간주하고 진입합니다.
        setIsKeySelected(true);
      }
    } catch (err) {
      console.error("Key selector error", err);
    }
  };

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
    const target = tiles.find(t => t.id === id);
    if (!target) return;

    setTiles(prev => prev.map(t => t.id === id ? { ...t, isEnhancing: true } : t));
    if (lightboxTile?.id === id) {
      setLightboxTile(prev => prev ? { ...prev, isEnhancing: true } : null);
    }

    try {
      const enhancedUrl = await enhanceImageWithGemini(target.originalUrl, selectedSize);
      
      setTiles(prev => prev.map(t => t.id === id ? { ...t, enhancedUrl, isEnhancing: false } : t));
      if (lightboxTile?.id === id) {
        setLightboxTile(prev => prev ? { ...prev, enhancedUrl, isEnhancing: false } : null);
      }
    } catch (err: any) {
      if (err.message === "API_KEY_ERROR") {
        alert("API 키 권한 오류가 발생했습니다. 유료 프로젝트의 키를 다시 선택해주세요.");
        setIsKeySelected(false);
      } else {
        alert(`AI 개선 오류: ${err.message}`);
      }
      
      setTiles(prev => prev.map(t => t.id === id ? { ...t, isEnhancing: false } : t));
      if (lightboxTile?.id === id) {
        setLightboxTile(prev => prev ? { ...prev, isEnhancing: false } : null);
      }
    }
  };

  // 1. API 키가 아직 확인되지 않았을 때 (로딩)
  if (isKeySelected === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-400 font-bold tracking-widest animate-pulse">인증 세션 확인 중...</p>
      </div>
    );
  }

  // 2. API 키가 연결되지 않았을 때 (온보딩 화면 강제)
  if (isKeySelected === false) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-24">
          <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row">
            <div className="md:w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 p-12 text-white flex flex-col justify-between">
              <div>
                <div className="bg-white/20 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center mb-8">
                  <Cpu className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl font-black mb-6 leading-tight">초고화질 AI<br/>이미지 마스터</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-300" />
                    <span className="font-semibold">Gemini 3 Pro 전문가용 엔진</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-blue-300" />
                    <span className="font-semibold">최대 4K 무손실 업스케일링</span>
                  </div>
                </div>
              </div>
              <p className="text-blue-200 text-xs mt-12 opacity-50 font-bold uppercase tracking-widest">Enterprise AI Solution</p>
            </div>

            <div className="md:w-1/2 p-12 flex flex-col justify-center bg-white">
              <div className="mb-10">
                <div className="inline-flex items-center gap-2 text-amber-600 font-bold mb-4 bg-amber-50 px-4 py-1 rounded-full text-sm">
                  <Key className="w-4 h-4" /> 필수 설정
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">Gemini API 키 연결</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                  이미지 분할 및 4K 화질 개선을 사용하기 위해 <b>결제 수단이 등록된 유료 프로젝트</b>의 API 키 연결이 필요합니다.
                </p>
                
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-8 flex gap-4">
                  <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                  <div>
                    <p className="text-xs text-slate-700 font-bold mb-1">유료 프로젝트 한도 확인</p>
                    <a 
                      href="https://ai.google.dev/gemini-api/docs/billing" 
                      target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-blue-600 underline flex items-center gap-1 hover:text-blue-800"
                    >
                      공식 결제 가이드 바로가기 <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <button
                  onClick={handleOpenKeySelector}
                  className="group w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl shadow-2xl shadow-blue-200 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                  API 키 연결 후 시작
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // 3. 메인 앱 화면
  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 사이드 설정 창 */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <button onClick={handleOpenKeySelector} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-200 text-slate-400 transition-colors" title="키 설정">
                <Key className="w-4 h-4" />
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
              className={`w-full mt-8 py-5 rounded-[1.5rem] font-black text-lg shadow-2xl transition-all
                ${!selectedFile || isSplitting 
                  ? 'bg-slate-100 text-slate-300' 
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
            </div>
          </section>
        </div>

        {/* 결과창 */}
        <div className="lg:col-span-8">
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[600px]">
            <div className="flex items-center justify-between mb-10">
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
                  className="flex items-center gap-2 py-3.5 px-7 bg-slate-900 text-white rounded-[1.2rem] text-sm font-black hover:bg-black transition-all shadow-xl shadow-slate-200"
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
                <p className="font-black text-slate-400 text-xl uppercase tracking-tighter">No Images Generated</p>
              </div>
            )}
          </section>
        </div>
      </div>

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
