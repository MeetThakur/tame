export type GeminiResult = {
  tags: string[];
  summary: string | null;
  folder: string | null;
};

export async function getAiEnrichment(
  title: string,
  description: string,
  apiKey: string
): Promise<GeminiResult> {
  const fallbackResult: GeminiResult = {
    tags: [],
    summary: null,
    folder: null,
  };

  if (!apiKey || apiKey.trim() === '') {
    console.log('[Gemini API] Skipped: No API key configured');
    return fallbackResult;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const prompt = `Given the following content title and description, respond ONLY with a valid JSON object (no markdown, no preamble):
{
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "One sentence summary of what this content is about.",
  "folder": "suggested folder name (e.g. Tech, Recipes, Fitness, Learning, Entertainment)"
}

Title: ${title}
Description: ${description || 'No description available'}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gemini API error, status: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error('Empty response text from Gemini');
    }

    const jsonParsed = JSON.parse(responseText.trim());
    return {
      tags: Array.isArray(jsonParsed.tags) ? jsonParsed.tags.map((t: string) => t.toLowerCase()) : [],
      summary: typeof jsonParsed.summary === 'string' ? jsonParsed.summary : null,
      folder: typeof jsonParsed.folder === 'string' ? jsonParsed.folder : null,
    };
  } catch (error) {
    console.error('[Gemini API] Failed or timed out:', error);
    return fallbackResult;
  }
}

export type AiSearchQueryItem = {
  id: string;
  title: string | null;
  type: string;
  aiSummary: string | null;
};

export type AiAskResult = {
  answer: string;
  matchingIds: string[];
};

export async function askGeminiAboutStash(
  query: string,
  items: AiSearchQueryItem[],
  apiKey: string
): Promise<AiAskResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const itemsSummary = items
      .map((item) => `- ID: ${item.id}\n  Title: ${item.title || 'Untitled'}\n  Type: ${item.type}\n  Summary: ${item.aiSummary || 'No summary available'}`)
      .join('\n');

    const prompt = `You are Tame AI, a smart assistant managing the user's stashed links and notes. 
The user has a collection of saved links, videos, and articles, and has asked a question about them.
Answer the user's question directly based on their stashes, and return the IDs of the items that match or are relevant to the query.

Respond ONLY with a valid JSON object matching this schema (no markdown, no preamble):
{
  "answer": "Direct friendly answer to the user's question based on their saved items. Refer to items by their titles.",
  "matchingIds": ["list", "of", "matching", "IDs", "from", "the", "items", "provided"]
}

User's Question: "${query}"

Stashed Items:
${itemsSummary}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gemini API error, status: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error('Empty response text from Gemini');
    }

    const jsonParsed = JSON.parse(responseText.trim());
    return {
      answer: typeof jsonParsed.answer === 'string' ? jsonParsed.answer : 'I couldn\'t find a clear answer based on your stash.',
      matchingIds: Array.isArray(jsonParsed.matchingIds) ? jsonParsed.matchingIds : [],
    };
  } catch (error) {
    console.error('[Gemini AI Search] Failed or timed out:', error);
    return {
      answer: 'Failed to analyze your stash. Make sure your API key is correct and you have an internet connection.',
      matchingIds: [],
    };
  }
}

