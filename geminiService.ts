
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const curateFashionItems = async (userProfile: any) => {
  const prompt = `Act as a world-class luxury fashion stylist. Based on the following user profile, curate a list of 6 highly relevant luxury fashion items that match their aesthetic and budget.
  
  User Profile:
  - Selected Styles: ${userProfile.selectedStyles.join(', ')}
  - Budget Range: ${userProfile.budgetRange}
  - Pinterest Context: ${userProfile.pinterestBoard || 'N/A'}
  - Bio: ${userProfile.bio}

  Return a JSON array of fashion items.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            brand: { type: Type.STRING },
            price: { type: Type.NUMBER },
            imageUrl: { type: Type.STRING },
            category: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            description: { type: Type.STRING }
          },
          required: ["id", "name", "brand", "price", "imageUrl", "description"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};
