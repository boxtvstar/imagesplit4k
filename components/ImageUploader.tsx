
import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, selectedFile, onClear }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      onImageSelect(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      alert('이미지 파일만 업로드 가능합니다.');
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [onImageSelect]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onClear();
  };

  return (
    <div className="w-full">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-xl transition-all duration-300 p-8 flex flex-col items-center justify-center min-h-[300px] cursor-pointer
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-white hover:border-blue-400'}
          ${preview ? 'border-none p-0 overflow-hidden shadow-inner bg-black' : ''}
        `}
        onClick={() => !preview && document.getElementById('file-upload')?.click()}
      >
        {preview ? (
          <div className="relative w-full h-full flex items-center justify-center bg-gray-900 group">
            <img src={preview} alt="Preview" className="max-h-[500px] w-auto object-contain transition-transform duration-500 group-hover:scale-105" />
            <button
              onClick={handleClear}
              className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-full text-gray-800 hover:bg-white shadow-lg transition-all transform hover:rotate-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-900 font-semibold mb-1">이미지를 드래그하거나 클릭하여 업로드</p>
            <p className="text-gray-500 text-sm">PNG, JPG, WebP 지원</p>
          </>
        )}
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={onFileChange}
        />
      </div>
    </div>
  );
};

export default ImageUploader;
