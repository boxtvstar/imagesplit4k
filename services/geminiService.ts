
import { GoogleGenAI } from "@google/genai";
import { ImageSize } from "../types";

const getClosestAspectRatio = (width: number, height: number): "1:1" | "3:4" | "4:3" | "9:16" | "16:9" => {
  const ratio = width / height;
  if (ratio > 1.5) return "16:9";
  if (ratio > 1.2) return "4:3";
  if (ratio > 0.8) return "1:1";
  if (ratio > 0.6) return "3:4";
  return "9:16";
};

/**
 * AI 이미지 개선 함수
 * 이제 API 키를 파라미터로 받지 않고 process.env.API_KEY를 직접 사용합니다.
 */
export const enhanceImageWithGemini = async (dataUrl: string, size: ImageSize = '1K'): Promise<string> => {
  // 호출 직전에 새 인스턴스 생성 (최신 키 보장)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const match = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!match) throw new Error("이미지 데이터 형식이 올바르지 않습니다.");
  
  const mimeType = match[1];
  const base64Data = match[2];

  const getDimensions = (): Promise<{width: number, height: number}> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.src = dataUrl;
    });
  };

  const { width, height } = await getDimensions();
  const calculatedAspectRatio = getClosestAspectRatio(width, height);

  const isHighRes = size === '2K' || size === '4K';
  const modelName = isHighRes ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  try {
    const config: any = {
      imageConfig: {
        aspectRatio: calculatedAspectRatio
      }
    };

    if (isHighRes) {
      config.imageConfig.imageSize = size;
    }

    // Fixed: systemInstruction is moved to text prompt for nano banana series models for better adherence.
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: `Restore and upscale this image to high quality. Focus on sharpness and clarity. You are a professional image restoration engine. Output ONLY the resulting image, no text.`,
          },
        ],
      },
      config: config
    });

    const candidate = response.candidates?.[0];
    if (candidate?.finishReason === "SAFETY") {
      throw new Error("이미지가 안전 정책에 의해 차단되었습니다.");
    }

    let resultImage: string | null = null;
    if (candidate?.content?.parts) {
      // Fixed: Iterating through all parts to find the image part as per guidelines.
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          resultImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }
    
    if (resultImage) return resultImage;
    throw new Error("이미지 생성에 실패했습니다. 키 권한 또는 모델 제한을 확인하세요.");

  } catch (error: any) {
    const errorMsg = error?.message || "";
    // Fixed: Handle key selection reset for specific error codes.
    if (errorMsg.includes("403") || errorMsg.includes("permission") || errorMsg.includes("Requested entity was not found")) {
      throw new Error("PERMISSION_DENIED");
    }
    throw error;
  }
};
