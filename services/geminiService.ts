
import { GoogleGenAI, Modality } from "@google/genai";
import type { ImageFile } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const restoreImage = async (
  originalImage: ImageFile,
  maskImage: ImageFile | null,
  prompt: string
): Promise<{ imageUrl: string | null; text: string | null }> => {
  const model = 'gemini-2.5-flash-image-preview';

  const imageParts = [
    {
      inlineData: {
        data: originalImage.base64,
        mimeType: originalImage.mimeType,
      },
    },
  ];

  if (maskImage) {
    imageParts.push({
      inlineData: {
        data: maskImage.base64,
        mimeType: maskImage.mimeType,
      },
    });
  }
  
  const contents = {
      parts: [
          ...imageParts,
          { text: prompt },
      ],
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents,
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    let imageUrl: string | null = null;
    let text: string | null = null;

    if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            } else if (part.text) {
                text = part.text;
            }
        }
    }

    if (!imageUrl) {
        throw new Error("API did not return an image.");
    }
    
    return { imageUrl, text };
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error(error instanceof Error ? error.message : "An unknown error occurred during image restoration.");
  }
};
