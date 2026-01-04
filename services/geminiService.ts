
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

export const enhanceImageWithGemini = async (dataUrl: string, size: ImageSize = '1K'): Promise<string> => {
  // 호출 시점에 최신 API 키를 반영하기 위해 인스턴스 생성
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
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
    // MALFORMED_FUNCTION_CALL 에러 방지 전략: 
    // 텍스트 파트에는 어떠한 구조적 명령도 넣지 않고 단순 서술만 남김.
    // 모든 전문적인 지시 사항은 config.systemInstruction으로 격리.
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
            text: `Restore and upscale this image to ${size} quality.`,
          },
        ],
      },
      config: {
        systemInstruction: "You are an AI image restoration engine. Your task is to receive an image and return an upscaled, cleaned, and enhanced version of the same image at the requested resolution. Output ONLY the image data part. Do not engage in text chat.",
        imageConfig: {
          imageSize: size,
          aspectRatio: calculatedAspectRatio
        }
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("AI 응답 생성에 실패했습니다.");
    }

    const candidate = response.candidates[0];
    
    if (candidate.finishReason === "SAFETY") {
      throw new Error("이미지가 안전 정책에 의해 차단되었습니다.");
    }

    if (!candidate.content || !candidate.content.parts) {
      throw new Error(`이미지 처리 실패 (사유: ${candidate.finishReason}). 2K/4K 작업은 유료 프로젝트 API 키가 필요합니다.`);
    }

    let resultImage: string | null = null;
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        resultImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
    
    if (resultImage) return resultImage;
    throw new Error("결과물에서 이미지 데이터를 찾을 수 없습니다.");

  } catch (error: any) {
    console.error("Gemini AI Error:", error);
    
    if (error?.message?.includes("Requested entity was not found") || error?.status === 404) {
      throw new Error("API_KEY_ERROR");
    }
    
    if (error?.message?.includes("MALFORMED_FUNCTION_CALL")) {
      throw new Error("모델 통신 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
    
    throw error;
  }
};
