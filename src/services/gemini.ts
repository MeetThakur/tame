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
