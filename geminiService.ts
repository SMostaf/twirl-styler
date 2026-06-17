import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateNeuroIntervention = async (
  state: string,
  userProfile: any,
  additionalContext?: string
) => {
  const prompt = `Act as an expert clinical neuroscientist and trauma-informed somatic therapist.
  You are generating a highly personalized, real-time nervous system regulation intervention for a user.

  User Profile:
  - Name: ${userProfile.name}
  - Primary Challenges/Symptoms: ${userProfile.symptoms.join(', ')}
  - Wearables/Devices: ${userProfile.devices.join(', ')}
  - Regulation Goals: ${userProfile.goals.join(', ')}
  - Bio/Context: ${userProfile.bio}

  Current Nervous System State: ${state}
  Additional user context (how they feel right now): ${additionalContext || 'None provided.'}

  Design a specific, evidence-based somatic or breathwork protocol to help them regulate.
  - If state is SYMPATHETIC (Fight or Flight): Focus on down-regulation, calming the amygdala, long slow exhalations, grounding, or progressive muscle relaxation.
  - If state is DORSAL_VAGAL (Freeze/Shut-down): Focus on gentle up-regulation, activating the system safely, mobilization without threat, somatic orienting, or fluttering eyes.
  - If state is VENTRAL_VAGAL (Safe/Regulated): Focus on expansion, gratitude, positive neuroplasticity, heart-opening, or anchoring this safety state.

  Return a JSON object conforming to the schema below. Keep it engaging, highly professional, and science-backed.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["breathwork", "somatic", "cognitive", "sleep"] },
          duration: { type: Type.STRING },
          description: { type: Type.STRING },
          steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          scienceDescription: { type: Type.STRING }
        },
        required: ["id", "title", "type", "duration", "description", "steps", "scienceDescription"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return null;
  }
};

export const generateCoachMessage = async (
  state: string,
  userProfile: any,
  chatHistory: { role: 'user' | 'model'; text: string }[]
) => {
  const historyText = chatHistory
    .map(msg => `${msg.role === 'user' ? 'User' : 'Neuro-Coach'}: ${msg.text}`)
    .join('\n');

  const prompt = `You are the NeuroPath AI Coach, a clinical neuroscience expert and warm, trauma-informed guide.
  The user is currently in a ${state} state of their nervous system.
  
  User Profile:
  - Name: ${userProfile.name}
  - Primary Challenges: ${userProfile.symptoms.join(', ')}
  - Goals: ${userProfile.goals.join(', ')}
  
  Conversation history so far:
  ${historyText}

  Provide a brief (2-4 sentences), highly compassionate, science-backed response to the user's latest message. Offer a micro-somatic recommendation based on their state (${state}).
  Keep your tone deeply validating, scientific but accessible, and free of toxic positivity.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text || "I'm here to support your nervous system. Let's take a deep, slow breath together.";
};
