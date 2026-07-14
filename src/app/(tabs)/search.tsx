import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Search as SearchIcon, X, SlidersHorizontal } from 'lucide-react-native';
import { useTameStore, TameItem } from '../../store/useTameStore';
import { LinkCard } from '../../components/LinkCard';
import { EmptyState } from '../../components/EmptyState';
import { useThemeColors, SPACING, TYPOGRAPHY, LAYOUT } from '../../styles/theme';

export default function SearchScreen() {
  const colors = useThemeColors();
  const items = useTameStore((state) => state.items);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedFolder, setSelectedFolder] = useState<string>('All');

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
        const typeMap: Record<string, TameItem['type']> = {
          Reels: 'reel',
          Videos: 'video',
          Articles: 'article',
          Notes: 'note',
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
  }, [items, searchQuery, selectedType, selectedFolder]);

  const typeFilters = ['All', 'Reels', 'Videos', 'Articles', 'Notes'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Search Input */}
      <View style={styles.searchBarContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SearchIcon size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search titles, summaries, tags..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Scrollable Filters */}
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
            style={[styles.chipsRow, { marginTop: 8 }]}
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

      {/* Filtered Feed */}
      {filteredItems.length === 0 ? (
        <EmptyState message="No items match your search filters." />
      ) : (
        <FlashList
          data={filteredItems}
          renderItem={({ item, index }) => <LinkCard item={item} index={index} />}
          contentContainerStyle={styles.listContent}
        />
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
});
