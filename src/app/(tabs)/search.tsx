import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Search as SearchIcon, X, SlidersHorizontal, Sparkles, CornerDownLeft } from 'lucide-react-native';
import { useStashStore, StashItem } from '../../store/useStashStore';
import * as Haptics from 'expo-haptics';
import { LinkCard } from '../../components/LinkCard';
import { EmptyState } from '../../components/EmptyState';
import { useThemeColors, SPACING, TYPOGRAPHY, LAYOUT } from '../../styles/theme';
import { askGeminiAboutStash, AiAskResult } from '../../services/gemini';

export default function SearchScreen() {
  const colors = useThemeColors();
  const items = useStashStore((state) => state.items);
  const geminiApiKey = useStashStore((state) => state.geminiApiKey);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedFolder, setSelectedFolder] = useState<string>('All');

  // AI Ask states
  const [aiAskMode, setAiAskMode] = useState(false);
  const [aiResponse, setAiResponse] = useState<AiAskResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Extract unique folders from store items
  const folders = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.folder) {
        set.add(item.folder);
      }
    });
    return ['All', 'Uncategorized', ...Array.from(set)];
  }, [items]);

  // Filter items in JS
  const filteredItems = useMemo(() => {
    if (aiAskMode) {
      if (aiResponse) {
        return items.filter((item) => aiResponse.matchingIds.includes(item.id));
      }
      return [];
    }

    return items.filter((item) => {
      // 1. Text Search Filter (over Title, AI summary, rawNoteText, and AI Tags)
      const query = searchQuery.trim().toLowerCase();
      let matchesQuery = true;
      if (query) {
        const titleMatch = item.title?.toLowerCase().includes(query) || false;
        const summaryMatch = item.aiSummary?.toLowerCase().includes(query) || false;
        const noteMatch = item.rawNoteText?.toLowerCase().includes(query) || false;
        const tagsMatch = item.aiTags?.some((tag) => tag.toLowerCase().includes(query)) || false;
        matchesQuery = titleMatch || summaryMatch || noteMatch || tagsMatch;
      }

      // 2. Type Filter
      let matchesType = true;
      if (selectedType !== 'All') {
        const typeMap: Record<string, StashItem['type']> = {
          Reels: 'reel',
          Videos: 'video',
          Articles: 'article',
          Notes: 'note',
          Music: 'music',
        };
        matchesType = item.type === typeMap[selectedType];
      }

      // 3. Folder Filter
      let matchesFolder = true;
      if (selectedFolder !== 'All') {
        if (selectedFolder === 'Uncategorized') {
          matchesFolder = !item.folder || item.folder.toLowerCase() === 'uncategorized';
        } else {
          matchesFolder = item.folder === selectedFolder;
        }
      }

      return matchesQuery && matchesType && matchesFolder;
    });
  }, [items, searchQuery, selectedType, selectedFolder, aiAskMode, aiResponse]);

  const handleAiSearch = async () => {
    const queryText = searchQuery.trim();
    if (!queryText) return;

    if (!geminiApiKey) {
      Alert.alert(
        'Gemini API Key Required',
        'Please enter your Gemini API Key in the Settings tab to use Stash AI Ask search.'
      );
      return;
    }

    setIsAiLoading(true);
    setAiResponse(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // 1. Basic Local Heuristic Scoring
      const queryTerms = queryText.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      
      const scoredItems = items.map(item => {
        let score = 0;
        const searchCorpus = [
          item.title,
          item.aiSummary,
          item.rawNoteText,
          ...(item.aiTags || []),
          item.folder
        ].filter(Boolean).join(' ').toLowerCase();

        queryTerms.forEach(term => {
          if (searchCorpus.includes(term)) {
            score += 1; // Simple hit counter
          }
        });
        
        return { item, score };
      });

      // 2. Sort by score (descending) and take top 30
      scoredItems.sort((a, b) => b.score - a.score);
      const topItems = scoredItems.slice(0, 30).map(si => si.item);

      const simplifiedItems = topItems.map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        aiSummary: item.aiSummary || item.rawNoteText
      }));
      
      console.log(`[Stash AI] Querying Gemini with top ${simplifiedItems.length} items`);
      const result = await askGeminiAboutStash(queryText, simplifiedItems, geminiApiKey);
      setAiResponse(result);
    } catch (err) {
      console.error(err);
      Alert.alert('Search Failed', 'Failed to retrieve AI response. Please check your network connection.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleAiMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAiAskMode(!aiAskMode);
    setAiResponse(null);
  };

  const typeFilters = ['All', 'Reels', 'Videos', 'Articles', 'Notes', 'Music'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Search Input */}
      <View style={styles.searchBarContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: aiAskMode ? colors.accent : colors.border }]}>
          <SearchIcon size={18} color={aiAskMode ? colors.accent : colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={(val) => {
              setSearchQuery(val);
              if (aiResponse) setAiResponse(null);
            }}
            placeholder={aiAskMode ? "Ask Stash AI about your saved items..." : "Search titles, summaries, tags..."}
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={aiAskMode ? handleAiSearch : undefined}
            returnKeyType={aiAskMode ? 'search' : 'default'}
          />
          
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                setAiResponse(null);
              }} 
              style={styles.clearButton}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* AI Ask Toggle Button */}
          <TouchableOpacity 
            onPress={toggleAiMode} 
            style={[styles.aiModeButton, { backgroundColor: aiAskMode ? colors.accent + '22' : 'transparent' }]}
            activeOpacity={0.7}
          >
            <Sparkles size={16} color={aiAskMode ? colors.accent : colors.textSecondary} />
          </TouchableOpacity>

          {/* AI Ask Submit Button */}
          {aiAskMode && searchQuery.trim().length > 0 && (
            <TouchableOpacity 
              onPress={handleAiSearch} 
              style={[styles.aiSubmitButton, { backgroundColor: colors.accent }]}
              activeOpacity={0.8}
            >
              <CornerDownLeft size={14} color="#0E0E0E" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Scrollable Filters (Standard Mode only) */}
      {!aiAskMode && (
        <View style={styles.filtersWrapper}>
          {/* Type Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScrollContent}
            style={styles.chipsRow}
          >
            {typeFilters.map((type) => {
              const isSelected = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedType(type)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.surface,
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: isSelected ? '#0E0E0E' : colors.textSecondary,
                        fontWeight: isSelected ? '600' : '400',
                      },
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Folder Filter Chips */}
          {folders.length > 2 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScrollContent}
              style={{ flexGrow: 0, marginTop: 8 }}
            >
              {folders.map((folder) => {
                const isSelected = selectedFolder === folder;
                return (
                  <TouchableOpacity
                    key={folder}
                    onPress={() => setSelectedFolder(folder)}
                    style={[
                      styles.chipFolder,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.surface,
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: isSelected ? '#0E0E0E' : colors.textSecondary,
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}
                    >
                      {folder}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* Main Content Area */}
      {isAiLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Consulting Stash AI...
          </Text>
        </View>
      ) : aiAskMode && !aiResponse ? (
        <View style={styles.centerContainer}>
          <Sparkles size={32} color={colors.textSecondary} style={{ marginBottom: 12 }} />
          <Text style={[styles.aiHintTitle, { color: colors.textPrimary }]}>Stash AI Ask</Text>
          <Text style={[styles.aiHintText, { color: colors.textSecondary }]}>
            Ask questions like:{"\n"}
            • "What recipes did I save?"{"\n"}
            • "Show me links about tech"{"\n"}
            • "Tell me what Melo did"
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* AI Response Card */}
          {aiAskMode && aiResponse && (
            <View style={[styles.aiAnswerCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}>
              <View style={styles.aiAnswerHeader}>
                <Sparkles size={14} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={[styles.aiAnswerTitle, { color: colors.accent }]}>Stash AI Answer</Text>
              </View>
              <Text style={[styles.aiAnswerText, { color: colors.textPrimary }]}>
                {aiResponse.answer}
              </Text>
            </View>
          )}

          {/* Feed */}
          {filteredItems.length === 0 ? (
            <EmptyState message={aiAskMode ? "No items found matching your question." : "No items match your search filters."} />
          ) : (
            <FlashList
              data={filteredItems}
              renderItem={({ item, index }) => <LinkCard item={item} index={index} />}
              // @ts-ignore: types are mismatched but prop is required
              estimatedItemSize={104}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: LAYOUT.borderRadius,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    ...TYPOGRAPHY.body,
    flex: 1,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
    marginRight: 4,
  },
  aiModeButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 4,
  },
  aiSubmitButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersWrapper: {
    marginBottom: 12,
  },
  chipsRow: {
    flexGrow: 0,
  },
  chipsScrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 32,
  },
  chipFolder: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 28,
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  listContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    marginTop: 12,
  },
  aiHintTitle: {
    ...TYPOGRAPHY.headingSm,
    fontSize: 16,
    marginBottom: 8,
  },
  aiHintText: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
  },
  aiAnswerCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: LAYOUT.borderRadius,
    borderWidth: 1,
    padding: 16,
  },
  aiAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiAnswerTitle: {
    ...TYPOGRAPHY.meta,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.0,
  },
  aiAnswerText: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    lineHeight: 18,
  },
});
