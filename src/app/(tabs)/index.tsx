import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Plus, Sparkles, Settings as SettingsIcon, Link as LinkIcon, Clipboard, X } from 'lucide-react-native';
import { useTameStore, TameItem } from '../../store/useTameStore';
import { LinkCard } from '../../components/LinkCard';
import { SkeletonCard } from '../../components/SkeletonCard';
import { EmptyState } from '../../components/EmptyState';
import { processItemEnrichment } from '../../services/coordinator';
import { useThemeColors, SPACING, TYPOGRAPHY, LAYOUT } from '../../styles/theme';

type ListItem =
  | { type: 'header'; title: string }
  | { type: 'item'; data: TameItem };

export default function HomeScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const items = useTameStore((state) => state.items);
  const addItem = useTameStore((state) => state.addItem);

  // Manual Add Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isUrl, setIsUrl] = useState(true);

  // Group items by time periods
  const getListData = (): ListItem[] => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgoStart = todayStart - 7 * 24 * 60 * 60 * 1000;

    const today: TameItem[] = [];
    const thisWeek: TameItem[] = [];
    const earlier: TameItem[] = [];

    items.forEach((item) => {
      if (item.savedAt >= todayStart) {
        today.push(item);
      } else if (item.savedAt >= weekAgoStart) {
        thisWeek.push(item);
      } else {
        earlier.push(item);
      }
    });

    const listData: ListItem[] = [];
    if (today.length > 0) {
      listData.push({ type: 'header', title: 'Today' });
      today.forEach((item) => listData.push({ type: 'item', data: item }));
    }
    if (thisWeek.length > 0) {
      listData.push({ type: 'header', title: 'This Week' });
      thisWeek.forEach((item) => listData.push({ type: 'item', data: item }));
    }
    if (earlier.length > 0) {
      listData.push({ type: 'header', title: 'Earlier' });
      earlier.forEach((item) => listData.push({ type: 'item', data: item }));
    }

    return listData;
  };

  const listData = getListData();

  // "Surprise me" logic: opens a random unread item
  const handleSurpriseMe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const unreadItems = items.filter((item) => !item.isRead);
    
    if (unreadItems.length === 0) {
      Alert.alert('All Caught Up', 'You have no unread items in your stash.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * unreadItems.length);
    const randomItem = unreadItems[randomIndex];
    router.push(`/item/${randomItem.id}`);
  };

  const handleManualAdd = () => {
    const text = inputText.trim();
    if (!text) return;

    let type: 'reel' | 'video' | 'article' | 'note' = 'note';
    let url = '';
    let title = 'Loading content...';
    let rawNoteText: string | null = null;

    if (isUrl) {
      url = text;
      if (url.includes('instagram.com') && (url.includes('/reel/') || url.includes('/p/'))) {
        type = 'reel';
        title = 'Instagram Reel';
      } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        type = 'video';
        title = 'YouTube Video';
      } else {
        type = 'article';
        try {
          const domain = new URL(url).hostname.replace('www.', '');
          title = domain.charAt(0).toUpperCase() + domain.slice(1);
        } catch {
          title = 'Web Article';
        }
      }
    } else {
      type = 'note';
      rawNoteText = text;
      const firstLine = text.split('\n')[0].trim();
      title = firstLine.length > 45 ? firstLine.substring(0, 42) + '...' : firstLine || 'Plain Note';
    }

    // Save minimal item
    const generatedId = addItem({
      url,
      type,
      title,
      thumbnailUrl: null,
      rawNoteText,
      aiSummary: null,
      aiTags: [],
      folder: null,
      status: 'pending',
    });

    setModalVisible(false);
    setInputText('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Run background enrichment
    processItemEnrichment(generatedId).catch((err) => {
      console.error('[Manual Enrichment Exception]:', err);
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Custom Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.headerButton} onPress={handleSurpriseMe} activeOpacity={0.7}>
          <Sparkles size={20} color={colors.accent} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Tame</Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/settings')}
          activeOpacity={0.7}
        >
          <SettingsIcon size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Main List / Empty State */}
      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <FlashList
          data={listData}
          renderItem={({ item, index }) => {
            if (item.type === 'header') {
              return (
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                  {item.title}
                </Text>
              );
            }
            // If item status is pending, show skeleton loading
            if (item.data.status === 'pending') {
              return <SkeletonCard />;
            }
            return <LinkCard item={item.data} index={index} />;
          }}
          getItemType={(item) => item.type}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Manual Add FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setModalVisible(true);
        }}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#0E0E0E" />
      </TouchableOpacity>

      {/* Manual Add Dialog Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add stash item</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Selector Tabs */}
              <View style={[styles.selectorRow, { backgroundColor: colors.surfaceRaised }]}>
                <TouchableOpacity
                  style={[
                    styles.selectorTab,
                    isUrl && { backgroundColor: colors.surface },
                  ]}
                  onPress={() => setIsUrl(true)}
                >
                  <LinkIcon size={16} color={isUrl ? colors.accent : colors.textSecondary} />
                  <Text style={[styles.selectorText, { color: isUrl ? colors.textPrimary : colors.textSecondary }]}>
                    Link / URL
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.selectorTab,
                    !isUrl && { backgroundColor: colors.surface },
                  ]}
                  onPress={() => setIsUrl(false)}
                >
                  <Clipboard size={16} color={!isUrl ? colors.accent : colors.textSecondary} />
                  <Text style={[styles.selectorText, { color: !isUrl ? colors.textPrimary : colors.textSecondary }]}>
                    Note
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Input field */}
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder={isUrl ? 'Paste URL link here...' : 'Write notes here...'}
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                    minHeight: isUrl ? 50 : 120,
                  },
                ]}
                multiline={!isUrl}
                autoFocus
                autoCapitalize="none"
              />

              {/* Submit CTA */}
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.accent }]}
                onPress={handleManualAdd}
                activeOpacity={0.8}
              >
                <Text style={[styles.submitButtonText, { color: '#0E0E0E' }]}>
                  Save to Tame
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    ...TYPOGRAPHY.headingLg,
  },
  sectionHeader: {
    ...TYPOGRAPHY.meta,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
    marginHorizontal: 20,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingBottom: 88,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
  },
  modalCard: {
    borderRadius: LAYOUT.borderRadius,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    ...TYPOGRAPHY.headingSm,
  },
  selectorRow: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
  },
  selectorTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  selectorText: {
    ...TYPOGRAPHY.body,
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  modalInput: {
    ...TYPOGRAPHY.body,
    borderRadius: LAYOUT.borderRadius,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: LAYOUT.borderRadius,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
  },
});
