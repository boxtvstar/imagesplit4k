
import React, { useState } from 'react';
import { Key, ShieldCheck, X, RefreshCw, CheckCircle, AlertCircle, ExternalLink, Save } from 'lucide-react';
import { testGeminiConnection } from '../services/geminiService';
import { saveApiKey } from '../services/cryptoService';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
  onClose: () => void;
  initialKey?: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, onClose, initialKey = '' }) => {
  const [apiKey, setApiKey] = useState(initialKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleTestAndSave = async () => {
    if (!apiKey.trim()) return;
    
    setIsTesting(true);
    setTestStatus('idle');
    
    // 1. 먼저 연결 테스트
    const isValid = await testGeminiConnection(apiKey);
    
    if (isValid) {
      setTestStatus('success');
      // 2. 테스트 성공 시 암호화하여 로컬 스토리지에 저장 (Vercel 등 외부에서도 유지됨)
      saveApiKey(apiKey);
      setTimeout(() => {
        onSave(apiKey);
        onClose();
      }, 1000);
    } else {
      setTestStatus('error');
    }
    setIsTesting(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-100">
              <Save className="w-6 h-6 text-white" />
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">로컬 보안 저장소 연동</h2>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            API 키는 브라우저의 보안 영역에 암호화되어 저장됩니다. <br/>
            서버에 전송되지 않으며, 한 번 설정하면 계속 유지됩니다.
          </p>

          <div className="space-y-6">
            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Google Gemini API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestStatus('idle');
                }}
                placeholder="AIzaSy..."
                className={`w-full px-6 py-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-mono text-sm
                  ${testStatus === 'success' ? 'border-green-500 bg-green-50' : 
                    testStatus === 'error' ? 'border-red-500 bg-red-50' : 'border-slate-100 focus:border-blue-500'}
                `}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1 mt-3">
                {testStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {testStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black text-amber-800">Paid Tier Key 필수</span>
              </div>
              <p className="text-[10px] text-amber-700 leading-normal font-medium">
                2K/4K 고화질 개선은 <strong>유료 티어(Pay-as-you-go)</strong> 프로젝트의 키에서만 작동할 가능성이 높습니다. 무료 키 사용 시 이미지가 생성되지 않을 수 있습니다.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleTestAndSave}
                disabled={isTesting || !apiKey.trim()}
                className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl
                  ${isTesting ? 'bg-slate-100 text-slate-400' : 
                    testStatus === 'success' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'}
                `}
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    연결 확인 및 암호화 저장 중...
                  </>
                ) : testStatus === 'success' ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    저장 및 연결 성공
                  </>
                ) : (
                  '로컬 드라이브 저장 및 테스트'
                )}
              </button>
              
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors"
              >
                API 키 관리 페이지 바로가기 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
