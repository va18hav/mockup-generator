import { GoogleGenAI } from "@google/genai";
import { MODELS, POSES, SETTINGS, STYLES } from '../constants';
import { GenerationRequest, GeneratedImage } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to clean base64 string for Gemini SDK
const cleanBase64 = (b64: string) => {
  return b64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

const getMimeType = (b64: string) => {
  const match = b64.match(/^data:(image\/[a-zA-Z]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

export const generateMockup = async (request: GenerationRequest): Promise<GeneratedImage[]> => {
  const client = getClient();
  
  // Note: For custom models, we might not find it in the constant list, which is fine
  // We use the ID to check if it's a preset, but rely on the request for the image if custom
  const presetModel = MODELS.find(m => m.id === request.modelId);
  const setting = SETTINGS.find(s => s.id === request.settingId);
  const style = STYLES.find(s => s.id === request.styleId);
  
  // We need to fetch pose details for the selected pose IDs
  const poses = POSES.filter(p => request.poseIds.includes(p.id));

  if (!setting || !style || poses.length === 0) {
    throw new Error("Invalid configuration selected");
  }

  const results: GeneratedImage[] = [];

  // Generate one image per selected pose
  for (const pose of poses) {
    const isCustomModel = !!request.modelImageBase64;
    
    // Construct Prompt
    let prompt = '';
    
    if (isCustomModel) {
      prompt = `
        Product Photography Mockup Generation.
        
        TASK:
        The first image provided is the REFERENCE MODEL.
        The second image provided is the CLOTHING ITEM.
        
        Generate a photorealistic image of the REFERENCE MODEL wearing the CLOTHING ITEM.
        You must preserve the facial features, body type, and skin tone of the REFERENCE MODEL exactly.
        You must preserve the texture, pattern, and logo of the CLOTHING ITEM exactly.
        
        POSE:
        Change the model's pose to: ${pose.promptFragment}.
      `;
    } else if (presetModel) {
      prompt = `
        Product Photography Mockup Generation.
        
        TASK:
        Generate a photorealistic fashion mockup displaying the clothing item provided in the image input.
        The clothing item must be worn by ${presetModel.promptFragment}.
        
        POSE:
        The subject is ${pose.promptFragment}.
      `;
    } else {
        continue; // Should not happen
    }

    // Common Prompt endings
    prompt += `
      SETTING:
      The scene is located ${setting.promptFragment}.
      
      STYLE & QUALITY:
      ${style.promptFragment}. Lighting should wrap around the fabric naturally. High fidelity, 4k.
    `;

    try {
      // Prepare contents
      const parts: any[] = [{ text: prompt }];

      // If custom model, add model image first
      if (isCustomModel && request.modelImageBase64) {
         parts.push({
            inlineData: {
                mimeType: getMimeType(request.modelImageBase64),
                data: cleanBase64(request.modelImageBase64)
            }
         });
      }

      // Add cloth image (always last or second)
      parts.push({
        inlineData: {
            mimeType: getMimeType(request.clothImageBase64),
            data: cleanBase64(request.clothImageBase64)
        }
      });

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {}
      });

      // Extract image from response
      const responseParts = response.candidates?.[0]?.content?.parts;
      
      if (responseParts) {
        for (const part of responseParts) {
          if (part.inlineData && part.inlineData.data) {
             const imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
             results.push({
               id: crypto.randomUUID(),
               url: imageUrl,
               promptUsed: prompt,
               timestamp: Date.now()
             });
          }
        }
      }
    } catch (error) {
      console.error("Error generating mockup for pose", pose.name, error);
    }
  }

  return results;
};

export const editMockup = async (imageBase64: string, editInstruction: string): Promise<string> => {
  const client = getClient();
  const mimeType = getMimeType(imageBase64);
  const cleanData = cleanBase64(imageBase64);

  try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanData
              }
            },
            {
              text: editInstruction
            },
          ]
        }
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
             return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          }
        }
      }
      throw new Error("No image generated from edit");
  } catch (error) {
      console.error("Error editing mockup", error);
      throw error;
  }
};