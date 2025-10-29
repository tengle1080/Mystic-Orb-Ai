import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { TarotCardInfo, Spread, CardInterpretation } from '../types';

// FIX: Initialize GoogleGenAI with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export async function getTarotInterpretation(
  question: string,
  cards: TarotCardInfo[],
  spread: Spread,
): Promise<CardInterpretation[]> {
  try {
    const cardList = cards.map((card, index) => `- ${spread.positions[index]}: ${card.name}`).join('\n');
    const prompt = `You are an authentic tarot reader from New Orleans. You have a genuine, non-theatrical New Orleans accent. Your readings are direct, insightful, and grounded in years of experience. You avoid cliches and speak plainly, with a natural warmth and wisdom.
The user's question is: "${question}".
The spread is "${spread.name}".
The cards drawn are:
${cardList}

For each card, provide a direct and insightful interpretation based on its position, limited to two or three powerful sentences. Also, provide 3-4 short, relevant keywords. Your tone is authentic and down-to-earth. Return the entire reading as a JSON array.`;

    // FIX: Use the 'gemini-2.5-flash' model for basic text tasks as per guidelines.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              position: {
                type: Type.STRING,
                description: 'The position of the card in the spread (e.g., Past, Present, Future).',
              },
              cardName: {
                type: Type.STRING,
                description: 'The name of the tarot card.',
              },
              keywords: {
                type: Type.ARRAY,
                description: 'An array of 3-4 short, punchy keywords or phrases.',
                items: { type: Type.STRING },
              },
              interpretation: {
                type: Type.STRING,
                description: 'A direct and insightful interpretation of the card in its position.',
              },
            },
            required: ['position', 'cardName', 'keywords', 'interpretation'],
          },
        },
      },
    });

    // FIX: Access the generated text directly from the 'text' property of the response object.
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as CardInterpretation[];
  } catch (error) {
    console.error("Error getting tarot interpretation:", error);
    throw new Error("Failed to consult the cosmos. Please try again.");
  }
}

export async function generateSpeechFromText(text: string): Promise<string> {
    try {
        // FIX: Use the 'gemini-2.5-flash-preview-tts' model for text-to-speech tasks.
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            // FIX: The contents should be an array of parts with a text part.
            contents: [{ parts: [{ text: `Read the following text in an authentic, calm, and natural-sounding New Orleans accent: ${text}` }] }],
            config: {
                // FIX: responseModalities must be an array with a single Modality.AUDIO element.
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        // FIX: Use a suitable voice. 'Charon' is another available prebuilt voice.
                        prebuiltVoiceConfig: { voiceName: 'Charon' },
                    },
                },
            },
        });

        // FIX: Extract the base64 encoded audio data from the response.
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Failed to generate audio reading. Please try again.");
    }
}

export async function generateTarotImage(prompt: string): Promise<string> {
    try {
        // FIX: Use the 'gemini-2.5-flash-image' model for general image generation.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                // FIX: responseModalities must be an array with a single Modality.IMAGE element.
                responseModalities: [Modality.IMAGE],
            },
        });

        // FIX: Extract the base64 encoded image data from the response.
        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData) {
            return part.inlineData.data;
        }
        throw new Error("No image data received from API.");
    } catch (error) {
        console.error("Error generating tarot image:", error);
        throw new Error("Failed to generate the card image. Please try again.");
    }
}

export async function getYesNoInterpretation(
  question: string,
  card: TarotCardInfo
): Promise<Omit<CardInterpretation, 'position'>> {
    try {
        const prompt = `You are an authentic tarot reader from New Orleans with a genuine, non-theatrical New Orleans accent. You are direct, insightful, and avoid cliches.
The user asks: "${question}".
The card drawn is: ${card.name}.
Based on the card's meaning, give a direct interpretation. Your interpretation should implicitly suggest a "Yes", "No", or "Maybe" without necessarily starting with the word. Provide 3-4 relevant keywords. Respond with a JSON object.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                    cardName: {
                      type: Type.STRING,
                      description: 'The name of the tarot card.',
                    },
                    keywords: {
                      type: Type.ARRAY,
                      description: 'An array of 3-4 short, punchy keywords or phrases.',
                      items: { type: Type.STRING },
                    },
                    interpretation: {
                      type: Type.STRING,
                      description: 'A direct and insightful interpretation that answers the user\'s question.',
                    },
                },
                required: ['cardName', 'keywords', 'interpretation'],
              },
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error getting Yes/No interpretation:", error);
        throw new Error("Failed to get a clear answer. The spirits are uncertain.");
    }
}