
import React, { useState } from 'react';
import { X, ShieldCheck, Key, CheckCircle, AlertCircle, Loader2, Play } from 'lucide-react';
import { saveEncryptedKey } from '../services/cryptoService';
import { GoogleGenAI } from "@google/genai";

interface ApiKeyModalProps {
  onClose: () => void;
  onSuccess: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose, onSuccess }) => {
  const [inputKey, setInputKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleTestAndSave = async () => {
    if (!inputKey.trim()) {
      setStatus('error');
      setErrorMessage('API 키를 입력해주세요.');
      return;
    }

    setStatus('testing');
    try {
      // 연결 테스트용 최소 호출
      const ai = new GoogleGenAI({ apiKey: inputKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'hi',
      });

      if (response.text) {
        await saveEncryptedKey(inputKey);
        setStatus('success');
        setTimeout(() => {
          onSuccess(inputKey);
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'API 키가 유효하지 않거나 연결에 실패했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900">보안 API 설정</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Gemini API Key
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="AI Studio에서 발급받은 키 입력"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:ring-0 outline-none font-bold text-slate-700 transition-all"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <ul className="text-[11px] text-slate-500 space-y-2 font-medium">
                <li className="flex gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  로컬 드라이브에 AES-256 규격으로 암호화되어 저장됩니다.
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  서버로 키가 전송되지 않으며 오직 브라우저 내에서만 동작합니다.
                </li>
              </ul>
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold animate-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4" />
                {errorMessage}
              </div>
            )}

            {status === 'success' && (
              <div className="flex items-center gap-2 p-4 bg-green-50 text-green-600 rounded-2xl text-xs font-bold animate-in slide-in-from-top-2">
                <CheckCircle className="w-4 h-4" />
                인증 성공! 키가 안전하게 저장되었습니다.
              </div>
            )}

            <button
              onClick={handleTestAndSave}
              disabled={status === 'testing' || status === 'success'}
              className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all
                ${status === 'testing' ? 'bg-slate-100 text-slate-400' : 
                  status === 'success' ? 'bg-green-500 text-white' : 
                  'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-100 hover:-translate-y-1'}
              `}
            >
              {status === 'testing' ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  연결 테스트 중...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  테스트 및 저장
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
