export type EnrichmentResult = {
  title: string | null;
  thumbnailUrl: string | null;
  description: string | null;
};

// Decodes common HTML entities to keep text clean
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
}

export async function fetchYouTubeMetadata(url: string): Promise<EnrichmentResult> {
  try {
    const encodedUrl = encodeURIComponent(url);
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodedUrl}&format=json`);
    if (!response.ok) {
      throw new Error('YouTube oEmbed endpoint error');
    }
    const data = await response.json();
    return {
      title: data.title ? decodeHtmlEntities(data.title) : 'YouTube Video',
      thumbnailUrl: data.thumbnail_url || null,
      description: data.author_name ? `Video by ${data.author_name}` : null,
    };
  } catch (error) {
    console.error('[YouTube Enrichment] Error:', error);
    return { title: null, thumbnailUrl: null, description: null };
  }
}

export async function fetchHtmlMetadata(url: string): Promise<EnrichmentResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for scrapers

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 TameLinkScraper/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }

    const html = await response.text();

    const getMetaTag = (property: string): string | null => {
      // Regex for <meta property="og:title" content="Value" /> or <meta name="og:title" content="Value" />
      const regexPattern = `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`;
      const regex = new RegExp(regexPattern, 'i');
      let match = html.match(regex);
      
      if (!match) {
        // Reverse layout: <meta content="Value" property="og:title" />
        const regexRevPattern = `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`;
        const regexRev = new RegExp(regexRevPattern, 'i');
        match = html.match(regexRev);
      }

      return match ? decodeHtmlEntities(match[1]) : null;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const fallbackTitle = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : null;

    const title = getMetaTag('og:title') || getMetaTag('twitter:title') || fallbackTitle;
    const thumbnailUrl = getMetaTag('og:image') || getMetaTag('twitter:image') || null;
    const description = getMetaTag('og:description') || getMetaTag('twitter:description') || null;

    return { title, thumbnailUrl, description };
  } catch (error) {
    console.error('[HTML Scraper] Error:', error);
    return { title: null, thumbnailUrl: null, description: null };
  }
}

export async function enrichLink(url: string, type: 'reel' | 'video' | 'article' | 'note'): Promise<EnrichmentResult> {
  if (type === 'note') {
    return { title: 'Note', thumbnailUrl: null, description: null };
  }

  if (type === 'video') {
    const meta = await fetchYouTubeMetadata(url);
    if (meta.title) return meta;
    // Fall back to standard scrapers if oEmbed failed
  }

  // Instagram Reels and standard website articles use HTML Scraper
  const meta = await fetchHtmlMetadata(url);
  
  if (type === 'reel' && !meta.title) {
    // Graceful fallback for Instagram reels if blocked or scraped unsuccessfully
    return {
      title: 'Instagram Reel',
      thumbnailUrl: null,
      description: 'Shared from Instagram',
    };
  }

  return meta;
}
