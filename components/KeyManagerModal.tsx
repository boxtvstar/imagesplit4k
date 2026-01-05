
import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Zap, Key, Lock, CheckCircle2, RefreshCw, AlertCircle, Save, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { testGeminiConnection } from '../services/geminiService';

interface KeyManagerModalProps {
  onClose: () => void;
  onKeyUpdated: () => void;
  isConnected: boolean;
}

const KeyManagerModal: React.FC<KeyManagerModalProps> = ({ onClose, onKeyUpdated, isConnected }) => {
  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('custom_gemini_api_key');
    if (saved) {
      try {
        setInputValue(atob(saved));
      } catch {
        setInputValue(saved);
      }
    }
  }, []);

  const handleSaveAndTest = async () => {
    if (!inputValue.trim()) {
      setErrorMessage("API 키를 입력해주세요.");
      setTestStatus('error');
      return;
    }

    setTestStatus('testing');
    setErrorMessage(null);

    try {
      const success = await testGeminiConnection(inputValue.trim());
      if (success) {
        localStorage.setItem('custom_gemini_api_key', btoa(inputValue.trim()));
        setTestStatus('success');
        onKeyUpdated();
        setTimeout(onClose, 1000);
      } else {
        throw new Error("연결 테스트 응답이 유효하지 않습니다.");
      }
    } catch (error: any) {
      setTestStatus('error');
      setErrorMessage(error?.message || "연결에 실패했습니다. 키를 다시 확인해주세요.");
    }
  };

  const handleClear = () => {
    localStorage.removeItem('custom_gemini_api_key');
    setInputValue('');
    setTestStatus('idle');
    onKeyUpdated();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden relative">
        <div className="p-10 flex flex-col items-center text-center">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>

          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl transition-all duration-500 ${isConnected ? 'bg-green-500 scale-110 shadow-green-200' : 'bg-slate-900 shadow-slate-200'}`}>
            {isConnected ? <ShieldCheck className="w-10 h-10 text-white" /> : <Lock className="w-10 h-10 text-white" />}
          </div>

          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">API 보안 커넥터</h2>
          <p className="text-slate-500 text-sm mb-6">Gemini AI 화질 개선 엔진을 사용하기 위해<br/>자신의 API 키를 입력해주세요.</p>

          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mb-8 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black hover:bg-blue-100 transition-all border border-blue-100"
          >
            무료 API 키 발급받기 <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="w-full space-y-6">
            <div className="text-left space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gemini API Key</label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-mono text-sm pr-12 shadow-inner"
                />
                <button
                  onClick={() => setShowKey(e => !e)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {testStatus === 'error' && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-left animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-bold leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {testStatus === 'success' && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl text-left animate-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <p className="text-xs text-green-700 font-bold">연결에 성공했습니다! 설정을 저장합니다.</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleClear}
                className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
              >
                초기화
              </button>
              <button
                onClick={handleSaveAndTest}
                disabled={testStatus === 'testing'}
                className="flex-1 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {testStatus === 'testing' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                연결 및 보안 저장
              </button>
            </div>
          </div>

          <div className="mt-8 p-4 bg-slate-50 rounded-2xl text-left space-y-1">
            <p className="text-[11px] text-slate-600 font-bold">💡 2K/4K 개선이 안 되나요?</p>
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              Gemini 3 Pro 모델은 구글 클라우드 프로젝트에 결제 수단이 등록되어 있어야 사용할 수 있는 경우가 많습니다. 무료 키라면 1K 모드를 이용해 보세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyManagerModal;
