import { GoogleGenAI, Modality, Type } from '@google/genai';

export async function generateScript(
  topic: string,
  category: string,
  format: string,
  language: string,
  tone: string,
  mediaPart?: { inlineData: { data: string, mimeType: string } } | null
): Promise<string> {
  const prompt = `
You are an elite, professional scriptwriter for YouTube, Shorts, and Instagram Reels, specializing in ${language} content.
Your task is to write a highly engaging, professional script in ${language} based on the following details:

- Topic/Context: ${topic || 'Analyze the attached media and write a script about it.'}
- Category: ${category}
- Format: ${format}
- Language: ${language}
- Tone of Voice: ${tone}

Instructions:
1. Write the script entirely in ${language} (using its native script/alphabet).
2. The script must be highly engaging, starting with a strong hook, followed by the main body, and ending with a clear Call to Action (CTA).
3. **Tone of Voice:** You MUST strictly follow the ${tone} tone throughout the script.
4. **Duration & Word Count:** Tailor the length to the chosen format. IF the user specifies a time duration in the topic (e.g., "for 20 minutes video"), you MUST write exactly enough content to fill that time based on an average human speaking speed of 130-150 words per minute. (e.g., a 20-minute video requires ~2600 to 3000 words).
5. **Speaking Time Tags:** At the end of EVERY spoken paragraph or section, you MUST add a bracketed tag indicating the estimated speaking time for that specific block of text. Example: \`[Intro - 20 seconds]\` or \`[Paragraph 2 - 40 seconds]\` or \`[Section 3 - 1 minute 15 seconds]\`.
6. **Visuals & Images:** For EACH AND EVERY paragraph in the generated script, you MUST add a suggestion to upload an image related to that specific script paragraph to help the user get visual ideas. Insert the image directly in the script above the paragraph using this exact Markdown format:
   ![Image Description](https://image.pollinations.ai/prompt/{Detailed_English_Description_Of_Scene_Using_Underscores_For_Spaces})
   Make sure the URL uses underscores "_" instead of spaces. Example: ![Stock Market Crash](https://image.pollinations.ai/prompt/Stock_market_crash_red_arrows_falling_financial_crisis_cinematic)
7. Include visual cues or B-roll suggestions in brackets [like this] where appropriate.
8. After the script, add a section titled "Suggestions & Tone" (in English or ${language}). In this section, provide professional advice on:
   - The ideal tone of voice (e.g., energetic, serious, mysterious, informative).
   - Suggestions for background music (BGM).
   - Editing tips to make the video more engaging.
   - Any other tips to improve the delivery of the script.
9. **Sources & References:** At the very end of the script, add a section titled "Sources & References" (in English or ${language}). List the real-world sources, articles, or facts used to write this script to build trust with the audience.

Format the output using Markdown for readability.
  `;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your Vercel project settings.');
    }
    const ai = new GoogleGenAI({ apiKey });
    
    const config: any = {
      temperature: 0.7,
    };

    // Add Google Search grounding for categories that need live/factual data
    if (['Latest News', 'Finance', 'World Politics', 'Breaking News'].includes(category)) {
      config.tools = [{ googleSearch: {} }];
    }

    const parts: any[] = [];
    if (mediaPart) {
      parts.push(mediaPart);
    }
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Corrected model name
      contents: { parts },
      config,
    });

    let finalScript = response.text || 'Failed to generate script. Please try again.';

    // Extract Google Search grounding URLs if available
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
      finalScript += '\n\n---\n\n### 🔗 Live Sources (Google Search)\n';
      const uniqueUrls = new Set();
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          if (!uniqueUrls.has(chunk.web.uri)) {
            uniqueUrls.add(chunk.web.uri);
            finalScript += `- [${chunk.web.title}](${chunk.web.uri})\n`;
          }
        }
      });
    }

    return finalScript;
  } catch (error: any) {
    console.error('Error generating script:', error);
    throw new Error(error.message || 'An error occurred while generating the script.');
  }
}

export async function getTrendingTopics(): Promise<{ title: string; category: string; url?: string }[]> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Trending topics skipped: Gemini API Key is missing.');
      return [];
    }
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      Identify 5-7 highly trending topics on the internet today (global and India-specific).
      Focus on news, technology, entertainment, and politics.
      
      IMPORTANT: Return ONLY a JSON array of objects. No other text.
      Format: [{"title": "Topic Name", "category": "News/Tech/etc", "url": "optional_link"}]
    `;

    // We remove the strict responseSchema here because it often conflicts with googleSearch grounding
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text?.trim() || '[]';
    
    // Robust extraction: find the first '[' and last ']' to handle cases where the model adds extra text
    const startIdx = text.indexOf('[');
    const endIdx = text.lastIndexOf(']');
    
    if (startIdx !== -1 && endIdx !== -1) {
      const jsonStr = text.substring(startIdx, endIdx + 1);
      return JSON.parse(jsonStr);
    }
    
    // Fallback: if JSON parsing fails, try to parse line by line
    const lines = text.split('\n').filter(l => l.trim().length > 10);
    if (lines.length > 0) {
      return lines.slice(0, 6).map(line => ({
        title: line.replace(/^[-*0-9.\s]+/, '').trim(),
        category: 'Trending'
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    // Return empty array instead of throwing to prevent UI crash
    return [];
  }
}
