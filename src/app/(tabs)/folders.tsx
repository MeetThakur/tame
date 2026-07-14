import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { FolderClosed, ChevronLeft, ArrowRight } from 'lucide-react-native';
import { useTameStore, TameItem } from '../../store/useTameStore';
import { LinkCard } from '../../components/LinkCard';
import { EmptyState } from '../../components/EmptyState';
import { useThemeColors, SPACING, TYPOGRAPHY, LAYOUT } from '../../styles/theme';

type FolderData = {
  name: string;
  count: number;
};

export default function FoldersScreen() {
  const colors = useThemeColors();
  const items = useTameStore((state) => state.items);

  // Active folder selection for in-page drill down
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  // Aggregate unique folders and count items
  const folderList = useMemo((): FolderData[] => {
    const counts: Record<string, number> = {};
    let uncategorizedCount = 0;

    items.forEach((item) => {
      if (item.folder && item.folder.trim() !== '' && item.folder.toLowerCase() !== 'uncategorized') {
        const key = item.folder.trim();
        counts[key] = (counts[key] || 0) + 1;
      } else {
        uncategorizedCount++;
      }
    });

    const list: FolderData[] = Object.keys(counts).map((name) => ({
      name,
      count: counts[name],
    }));

    // Put Uncategorized folder at the top/beginning if there are uncategorized items
    if (uncategorizedCount > 0 || list.length === 0) {
      list.unshift({ name: 'Uncategorized', count: uncategorizedCount });
    }

    return list;
  }, [items]);

  // Items for the currently selected folder
  const activeFolderItems = useMemo((): TameItem[] => {
    if (!activeFolder) return [];

    return items.filter((item) => {
      if (activeFolder === 'Uncategorized') {
        return !item.folder || item.folder.trim() === '' || item.folder.toLowerCase() === 'uncategorized';
      }
      return item.folder === activeFolder;
    });
  }, [items, activeFolder]);

  // Back from sub-feed
  const handleGoBack = () => {
    setActiveFolder(null);
  };

  if (activeFolder) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Sub Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7}>
            <ChevronLeft size={20} color={colors.textPrimary} />
            <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>Folders</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {activeFolder}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Folder items feed */}
        {activeFolderItems.length === 0 ? (
          <EmptyState message={`No items in ${activeFolder}.`} />
        ) : (
          <FlashList
            data={activeFolderItems}
            renderItem={({ item, index }) => <LinkCard item={item} index={index} />}
            contentContainerStyle={styles.subListContent}
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={{ width: 40 }} />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Folders</Text>
        <View style={{ width: 40 }} />
      </View>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <FlashList
          data={folderList}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.gridCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setActiveFolder(item.name)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.folderIconContainer, { backgroundColor: colors.surfaceRaised }]}>
                  <FolderClosed size={20} color={colors.accent} />
                </View>
                <ArrowRight size={14} color={colors.textSecondary} />
              </View>

              <Text style={[styles.folderName, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.name}
              </Text>

              <Text style={[styles.itemCountText, { color: colors.textSecondary }]}>
                {item.count} {item.count === 1 ? 'item' : 'items'}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    width: 80,
  },
  backButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    marginLeft: 2,
  },
  headerTitle: {
    ...TYPOGRAPHY.headingLg,
    textAlign: 'center',
    flex: 1,
  },
  gridContent: {
    padding: 16,
  },
  gridCard: {
    flex: 1,
    margin: 6,
    padding: 16,
    borderRadius: LAYOUT.cardRadius,
    borderWidth: 1,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  folderIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderName: {
    ...TYPOGRAPHY.headingSm,
    fontSize: 15,
    marginBottom: 4,
  },
  itemCountText: {
    ...TYPOGRAPHY.meta,
  },
  subListContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
});
