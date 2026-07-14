import { useTameStore } from '../store/useTameStore';
import { enrichLink } from './enrichment';
import { getAiEnrichment } from './gemini';

export async function processItemEnrichment(id: string): Promise<void> {
  const store = useTameStore.getState();
  const item = store.items.find((i) => i.id === id);
  if (!item) return;

  try {
    if (item.type === 'note') {
      const noteText = item.rawNoteText || '';
      // Generate a friendly title from first line or first few words
      const firstLine = noteText.split('\n')[0].trim();
      const derivedTitle = firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine || 'Plain Note';
      
      // Update basic fields first
      store.updateItem(id, {
        title: derivedTitle,
        status: 'enriched',
      });

      // Enrich notes with Gemini if API key is configured
      if (store.geminiApiKey) {
        const ai = await getAiEnrichment(derivedTitle, noteText, store.geminiApiKey);
        store.updateItem(id, {
          aiSummary: ai.summary,
          aiTags: ai.tags,
          folder: ai.folder,
        });
      }
      return;
    }

    // 1. Fetch web/oEmbed metadata for links
    const meta = await enrichLink(item.url, item.type);
    
    // Update store with scraped metadata immediately so UI updates instantly
    const updatedTitle = meta.title || item.title || 'Untitled';
    store.updateItem(id, {
      title: updatedTitle,
      thumbnailUrl: meta.thumbnailUrl,
      status: 'enriched',
    });

    // 2. Fetch AI enrichment using the retrieved title and description
    if (store.geminiApiKey) {
      const desc = meta.description || '';
      const ai = await getAiEnrichment(updatedTitle, desc, store.geminiApiKey);
      
      store.updateItem(id, {
        aiSummary: ai.summary,
        aiTags: ai.tags,
        folder: ai.folder || 'Uncategorized',
      });
    } else {
      store.updateItem(id, {
        folder: 'Uncategorized',
      });
    }
  } catch (error) {
    console.error(`[Coordinator] Enrichment failed for item ${id}:`, error);
    store.updateItem(id, { status: 'failed' });
  }
}
