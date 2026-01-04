
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

// API 키 유효성 테스트 함수
export const testGeminiConnection = async (apiKey: string): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    // 가장 가벼운 모델로 응답 테스트
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'hi',
    });
    return !!response.text;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
};

export const enhanceImageWithGemini = async (dataUrl: string, size: ImageSize = '1K', apiKey: string): Promise<string> => {
  if (!apiKey) throw new Error("API 키가 설정되지 않았습니다.");
  
  const ai = new GoogleGenAI({ apiKey });
  
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: `Strictly restore and upscale this image to ${size} quality. No creative changes. Remove watermarks and noise. Output ONLY the image.`,
          },
        ],
      },
      config: {
        systemInstruction: "You are a professional image restoration engine. Preserve identity, remove noise/watermarks, and increase resolution. No style changes.",
        imageConfig: {
          imageSize: size,
          aspectRatio: calculatedAspectRatio
        }
      }
    });

    const candidate = response.candidates?.[0];
    if (candidate?.finishReason === "SAFETY") throw new Error("이미지가 안전 정책에 의해 차단되었습니다.");

    let resultImage: string | null = null;
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          resultImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }
    
    if (resultImage) return resultImage;
    throw new Error("결과물에서 이미지 데이터를 찾을 수 없습니다.");

  } catch (error: any) {
    const errorMsg = error?.message?.toLowerCase() || "";
    if (errorMsg.includes("permission denied") || errorMsg.includes("403") || errorMsg.includes("requested entity was not found")) {
      throw new Error("PERMISSION_DENIED");
    }
    throw new Error(error?.message || "AI 오류가 발생했습니다.");
  }
};
