
import React, { useState } from 'react';
import { ShieldCheck, X, Zap, ExternalLink, Key, Lock, CheckCircle2, RefreshCw, AlertCircle, HardDrive } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface KeyManagerModalProps {
  onClose: () => void;
  onKeySelected: () => void;
  isConnected: boolean;
}

const KeyManagerModal: React.FC<KeyManagerModalProps> = ({ onClose, onKeySelected, isConnected }) => {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      onKeySelected();
      // 새 키 선택 시 테스트 상태 초기화
      setTestStatus('idle');
    } catch (error) {
      console.error("Key selection failed", error);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setErrorMessage(null);
    
    try {
      // 최신 API 키를 사용하기 위해 호출 시점에 인스턴스 생성
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      // 저사양 모델로 가벼운 연결 확인 작업 수행
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'ping',
      });

      if (response.text) {
        setTestStatus('success');
      } else {
        throw new Error("AI 엔진으로부터 응답이 없습니다.");
      }
    } catch (error: any) {
      console.error("Connection test failed", error);
      setTestStatus('error');
      setErrorMessage(error?.message || "연결에 실패했습니다. 키 권한이나 프로젝트 설정을 확인하세요.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden relative">
        {/* Decorative background glows */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="relative p-12">
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-900 rounded-2xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl transition-all duration-700 transform ${isConnected ? 'bg-green-600 rotate-0' : 'bg-slate-900 -rotate-12'}`}>
              {isConnected ? <ShieldCheck className="w-12 h-12 text-white" /> : <Lock className="w-12 h-12 text-white" />}
            </div>

            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">
              외부 AI 엔진 관리
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed max-w-sm mb-10 font-medium">
              이 앱의 모든 API 키는 사용자의 로컬 환경에 암호화되어 안전하게 보관되며, 플랫폼 외부에서 독립적으로 관리됩니다.
            </p>

            <div className="w-full grid grid-cols-1 gap-4 mb-10">
              {/* Storage Info Card */}
              <div className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-blue-200 transition-colors">
                <div className="bg-white p-4 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                  <HardDrive className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left flex-grow">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Local Persistence</p>
                  <p className="text-base font-bold text-slate-800">로컬 드라이브 암호화 저장소</p>
                </div>
                {isConnected ? (
                  <div className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> ACTIVE
                  </div>
                ) : (
                  <div className="bg-slate-200 text-slate-500 px-4 py-1.5 rounded-full text-xs font-black">
                    INACTIVE
                  </div>
                )}
              </div>

              {/* Engine Status Card */}
              <div className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-blue-200 transition-colors">
                <div className="bg-white p-4 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-amber-500" />
                </div>
                <div className="text-left flex-grow">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Engine Health</p>
                  <p className="text-base font-bold text-slate-800">연결 상태 테스트</p>
                </div>
                <button
                  onClick={handleTestConnection}
                  disabled={!isConnected || testStatus === 'testing'}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2
                    ${testStatus === 'success' ? 'bg-green-600 text-white' : 
                      testStatus === 'error' ? 'bg-red-100 text-red-600' : 
                      'bg-slate-900 text-white hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed'}
                  `}
                >
                  {testStatus === 'testing' ? <RefreshCw className="w-4 h-4 animate-spin" /> : 
                   testStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> : 
                   testStatus === 'error' ? <AlertCircle className="w-4 h-4" /> : null}
                  {testStatus === 'testing' ? '테스트 중...' : 
                   testStatus === 'success' ? '연결 성공' : 
                   testStatus === 'error' ? '테스트 실패' : '테스트 시작'}
                </button>
              </div>
            </div>

            {testStatus === 'error' && (
              <div className="w-full mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-left flex items-start gap-3 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-bold leading-relaxed">{errorMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 w-full">
              <button
                onClick={handleOpenSelectKey}
                className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black text-xl shadow-2xl shadow-blue-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98] group"
              >
                <ExternalLink className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                {isConnected ? 'API 키 변경/설정' : '외부 API 키 연결하기'}
              </button>
            </div>

            <p className="mt-8 text-[12px] text-slate-400 font-bold max-w-xs">
              * 설정된 키는 브라우저를 닫아도 암호화되어 유지됩니다. <br/>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline mt-2 inline-block">결제 방식 확인하기</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyManagerModal;
