# Tame

> *"Set it aside. Come back when ready."*

**Tame** (from the Japanese ため, meaning "for later") is a minimalist React Native (Expo) link organizer app. It lets you capture links and thoughts from any source (Instagram Reels, YouTube videos, articles, and plain notes) via the native Android share sheet, automatically enriches them with Open Graph metadata and oEmbed APIs, and uses Gemini 2.5 Flash to automatically summarize, tag, and organize them into folders.

---

## ✨ Features

- **Native Android Share Sheet Target**: Seamless quick-save from Instagram, YouTube, Chrome, etc., using `expo-share-intent`.
- **Background Metadata Scraper**: Parses Open Graph tags for articles/reels, and calls YouTube's oEmbed endpoint to resolve video details.
- **AI-Powered Enrichment**: Employs Google Gemini 2.5 Flash to generate one-sentence summaries, categorize into folders, and create semantic tags.
- **Japanese Stationery Aesthetic**: Minimal dark-first UI built around lots of negative space, sharp borders, structured typography (`DM Sans`, `Inter`, and `JetBrains Mono`), and a single memorable acid-green accent (`#C8F560`).
- **Interactive Gestures**: Swipe right to toggle favorite, swipe left to delete with smooth, native 60fps haptics.
- **"Surprise Me" Selector**: Shake up decision paralysis by surfacing a random unread item from your stash.
- **Local-First & Offline**: Instant performance powered by `react-native-mmkv` and `Zustand`.

---

## 🛠️ Tech Stack

- **Core**: React Native & Expo SDK 57 (TypeScript)
- **Navigation**: Expo Router (File-based routing)
- **State Management**: Zustand
- **Storage**: MMKV (via `react-native-mmkv`)
- **Rendering**: Shopify FlashList (performance-optimized list renderer)
- **AI**: Gemini 2.5 Flash API (Direct integration with JSON Schema mode)
- **Icons**: Lucide React Native

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js (v20 or newer recommended)
- A physical Android device with **USB Debugging enabled** (connected to your dev computer via ADB). *Note: The Android emulator is not recommended due to system resource constraints.*

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Gemini API Key
To utilize AI tagging and summarization:
1. Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).
2. Run the application (see step 3).
3. Navigate to **Settings** (top-right cog icon on the home screen).
4. Enter your key under **Gemini Integration**. The key is persisted locally in MMKV as `gemini_api_key` and is never transmitted to external servers except for direct API calls.

### 3. Build & Run (Physical Device)
Since Tame relies on native Android Intent Filters (`expo-share-intent`), you **cannot use Expo Go**. You must compile a development client.

Generate the native `android` project structure:
```bash
npx expo prebuild --clean
```

Compile and install the application directly onto your connected device:
```bash
npx expo run:android --device
```

Start the Metro bundler:
```bash
npm run start
```

---

## 💾 Data Model

Each item is represented by the following TypeScript schema:

```typescript
type TameItem = {
  id: string;                  // Unique random identifier
  url: string;                 // Extracted URL (empty string for notes)
  type: 'reel' | 'video' | 'article' | 'note';
  title: string | null;        // Title (scraped or user-edited)
  thumbnailUrl: string | null; // Thumbnail image URL
  rawNoteText: string | null;  // User-added notes or raw text
  aiSummary: string | null;    // One-sentence summary from Gemini
  aiTags: string[];            // Categorized tags array
  folder: string | null;       // Suggested folder name
  isFavorite: boolean;         // Favorite status flag
  isRead: boolean;             // Read/unread status flag
  savedAt: number;             // Epoch millisecond timestamp
  status: 'pending' | 'enriched' | 'failed';
};
```

---

## 🏗️ CI Build Workflow

A GitHub Actions pipeline is configured at `.github/workflows/build.yml` to automatically build and package your APK on push events:

```yaml
name: Build APK
on:
  push:
    branches: [main]
```
To run the cloud build, push your code and configure `EXPO_TOKEN` in your repository secrets.
