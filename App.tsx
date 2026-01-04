
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import ImageUploader from './components/ImageUploader';
import TileCard from './components/TileCard';
import Lightbox from './components/Lightbox';
import ApiKeyModal from './components/ApiKeyModal';
import { ImageTile, AspectRatio, ImageSize } from './types';
import { splitImage, downloadAllAsZip } from './services/imageService';
import { enhanceImageWithGemini } from './services/geminiService';
import { getDecryptedKey, removeKey } from './services/cryptoService';
import { 
  Grid3X3, Download, RefreshCw, Layers, CheckCircle, 
  Key, ExternalLink, Zap, ShieldCheck, Cpu, AlertTriangle, ArrowRight, Settings2, LogOut
} from 'lucide-react';

const App: React.FC = () => {
  const [hasValidKey, setHasValidKey] = useState<boolean | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rows, setRows] = useState<number>(3);
  const [cols, setCols] = useState<number>(3);
  const [tiles, setTiles] = useState<ImageTile[]>([]);
  const [isSplitting, setIsSplitting] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [selectedSize, setSelectedSize] = useState<ImageSize>('1K');
  const [lightboxTile, setLightboxTile] = useState<ImageTile | null>(null);

  // 로컬 암호화 저장소에서 키 존재 여부 확인
  useEffect(() => {
    const checkSavedKey = async () => {
      const key = await getDecryptedKey();
      setHasValidKey(!!key);
    };
    checkSavedKey();
  }, []);

  const handleKeySuccess = () => {
    setHasValidKey(true);
    setIsModalOpen(false);
  };

  const handleLogout = () => {
    if (confirm('저장된 API 키를 삭제하고 로그아웃 하시겠습니까?')) {
      removeKey();
      setHasValidKey(false);
      setTiles([]);
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
      if (err.message === "API_KEY_ERROR" || err.message === "API_KEY_MISSING") {
        alert("API 키가 유효하지 않거나 설정이 필요합니다.");
        setHasValidKey(false);
      } else {
        alert(`AI 개선 오류: ${err.message}`);
      }
      
      setTiles(prev => prev.map(t => t.id === id ? { ...t, isEnhancing: false } : t));
      if (lightboxTile?.id === id) {
        setLightboxTile(prev => prev ? { ...prev, isEnhancing: false } : null);
      }
    }
  };

  // 1. 로딩
  if (hasValidKey === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-400 font-bold tracking-widest animate-pulse">암호화 세션 복구 중...</p>
      </div>
    );
  }

  // 2. 키가 없을 때 (외부 웹앱용 온보딩)
  if (!hasValidKey) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-24">
          <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row">
            <div className="md:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-12 text-white flex flex-col justify-between">
              <div>
                <div className="bg-white/10 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border border-white/10">
                  <ShieldCheck className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-4xl font-black mb-6 leading-tight">AI 화질 개선<br/>보안 웹 서비스</h2>
                <p className="text-slate-300 font-medium leading-relaxed mb-6 opacity-80">
                  사용자의 API 키를 직접 관리하여 보안을 유지하고,<br/>
                  제한 없는 초고해상도 분할 서비스를 경험하세요.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-bold">AES-256 로컬 암호화 저장</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-bold">서버리스 (키 정보 미전송)</span>
                  </div>
                </div>
              </div>
              <p className="text-slate-500 text-[10px] mt-12 font-black uppercase tracking-[0.2em]">Private & Secure AI Environment</p>
            </div>

            <div className="md:w-1/2 p-12 flex flex-col justify-center bg-white">
              <div className="mb-10">
                <div className="inline-flex items-center gap-2 text-blue-600 font-black mb-4 bg-blue-50 px-4 py-1.5 rounded-full text-xs uppercase tracking-tighter">
                  <Settings2 className="w-4 h-4" /> Setup Required
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">서비스 시작하기</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                  Gemini API 키를 연결해야 이미지 분할 및 AI 개선 도구를 사용할 수 있습니다. 입력된 키는 오직 귀하의 브라우저에만 암호화되어 보관됩니다.
                </p>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="group w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl shadow-2xl shadow-blue-100 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                  API 키 설정 및 테스트
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <p className="mt-6 text-center text-[10px] text-slate-400 font-bold">
                  키가 없으신가요? <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-500 underline">Google AI Studio</a>에서 무료로 발급 가능합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
        {isModalOpen && <ApiKeyModal onClose={() => setIsModalOpen(false)} onSuccess={handleKeySuccess} />}
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
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => setIsModalOpen(true)} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-200 text-slate-400 transition-colors" title="키 재설정">
                <Settings2 className="w-4 h-4" />
              </button>
              <button onClick={handleLogout} className="p-2 bg-red-50 rounded-xl hover:bg-red-100 text-red-400 transition-colors" title="키 삭제">
                <LogOut className="w-4 h-4" />
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
      {isModalOpen && <ApiKeyModal onClose={() => setIsModalOpen(false)} onSuccess={handleKeySuccess} />}
    </Layout>
  );
};

export default App;
