import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Heart,
  Trash2,
  CheckCircle,
  ExternalLink,
  FolderClosed,
  Tag,
  BookOpen,
  Film,
  Video,
  FileText,
  Clipboard as ClipboardIcon,
  Music,
  Copy,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { useStashStore } from '../../store/useStashStore';
import { useThemeColors, SPACING, TYPOGRAPHY, LAYOUT } from '../../styles/theme';
import { ConfirmationModal } from '../../components/ConfirmationModal';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colors = useThemeColors();

  const items = useStashStore((state) => state.items);
  const folders = useStashStore((state) => state.folders);
  const updateItem = useStashStore((state) => state.updateItem);
  const deleteItem = useStashStore((state) => state.deleteItem);

  const item = items.find((i) => i.id === id);

  // Edit fields state
  const [title, setTitle] = useState('');
  const [folder, setFolder] = useState('');
  const [tagsString, setTagsString] = useState('');
  const [noteText, setNoteText] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [folderDropdownVisible, setFolderDropdownVisible] = useState(false);

  // Sync state with item on mount/load
  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setFolder(item.folder || '');
      setTagsString(item.aiTags ? item.aiTags.join(', ') : '');
      setNoteText(item.rawNoteText || '');
    }
  }, [item?.id]);

  if (!item) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <Text style={{ color: colors.textPrimary }}>Item not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={{ color: colors.accent }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Update item details in store
  const handleSaveEdits = (field: 'title' | 'folder' | 'tags' | 'note', val: string) => {
    if (field === 'title') {
      updateItem(item.id, { title: val });
    } else if (field === 'folder') {
      updateItem(item.id, { folder: val.trim() || 'Uncategorized' });
    } else if (field === 'tags') {
      const parsedTags = val
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);
      updateItem(item.id, { aiTags: parsedTags });
    } else if (field === 'note') {
      updateItem(item.id, { rawNoteText: val });
    }
  };

  const handleFavoriteToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateItem(item.id, { isFavorite: !item.isFavorite });
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setDeleteModalVisible(true);
  };

  const handleOpenLink = async () => {
    if (!item.url) return;
    try {
      if (item.url.startsWith('http')) {
        await WebBrowser.openBrowserAsync(item.url, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
          toolbarColor: colors.background,
        });
      } else {
        const supported = await Linking.canOpenURL(item.url);
        if (supported) {
          await Linking.openURL(item.url);
        } else {
          Alert.alert('Invalid URL', 'Cannot open this URL on your device.');
        }
      }
    } catch (err) {
      console.error('Failed to open link:', err);
    }
  };
  const handleCopyLink = async () => {
    if (!item.url) return;
    await Clipboard.setStringAsync(item.url);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({
      type: 'success',
      text1: 'Link Copied',
      text2: 'The URL has been copied to your clipboard.',
    });
  };
  const renderCover = () => {
    if (item.thumbnailUrl) {
      return (
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={styles.coverImage}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      );
    }

    // Centered large icon placeholder
    return (
      <View style={[styles.coverPlaceholder, { backgroundColor: colors.surfaceRaised }]}>
        {item.type === 'reel' && <Film size={48} color={colors.textSecondary} />}
        {item.type === 'video' && <Video size={48} color={colors.textSecondary} />}
        {item.type === 'article' && <FileText size={48} color={colors.textSecondary} />}
        {item.type === 'note' && <ClipboardIcon size={48} color={colors.textSecondary} />}
        {item.type === 'music' && <Music size={48} color={colors.textSecondary} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Custom Detail Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.7}>
            <ChevronLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            {/* Favorite */}
            <TouchableOpacity style={styles.iconButton} onPress={handleFavoriteToggle} activeOpacity={0.7}>
              <Heart
                size={20}
                color={item.isFavorite ? colors.accent : colors.textSecondary}
                fill={item.isFavorite ? colors.accent : 'none'}
              />
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity style={styles.iconButton} onPress={handleDelete} activeOpacity={0.7}>
              <Trash2 size={20} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Cover Media */}
          <View style={styles.coverWrapper}>{renderCover()}</View>

          {/* Editable Title */}
          <View style={styles.metaSection}>
            <TextInput
              value={title}
              onChangeText={(val) => {
                setTitle(val);
                handleSaveEdits('title', val);
              }}
              placeholder="Enter title..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.titleInput, { color: colors.textPrimary }]}
              multiline
            />
          </View>

          {/* Link URL Display */}
          {item.url ? (
            <View style={styles.urlDisplayRow}>
              <Text
                style={[styles.urlText, { color: colors.textSecondary }]}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {item.url}
              </Text>
            </View>
          ) : null}

          {/* Action Buttons (Open / Copy) */}
          {item.url ? (
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.openLinkBtn, { backgroundColor: colors.accent, flex: 1, marginRight: 8 }]}
                onPress={handleOpenLink}
                activeOpacity={0.8}
              >
                <ExternalLink size={16} color="#0E0E0E" style={{ marginRight: 8 }} />
                <Text style={[styles.openLinkBtnText, { color: '#0E0E0E' }]}>Open Link</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.openLinkBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flex: 1, marginLeft: 8 }]}
                onPress={handleCopyLink}
                activeOpacity={0.8}
              >
                <Copy size={16} color={colors.textPrimary} style={{ marginRight: 8 }} />
                <Text style={[styles.openLinkBtnText, { color: colors.textPrimary }]}>Copy Link</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* AI Summary View */}
          {item.aiSummary ? (
            <View style={styles.aiSummarySection}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>AI Summary</Text>
              <Text style={[styles.aiSummaryText, { color: colors.textPrimary }]}>
                {item.aiSummary}
              </Text>
            </View>
          ) : item.status === 'pending' ? (
            <View style={styles.aiSummarySection}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>AI Summary</Text>
              <Text style={[styles.aiSummaryText, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                Summarizing content...
              </Text>
            </View>
          ) : null}

          {/* Notes display / editor */}
          <View style={styles.inputSection}>
            <View style={styles.labelRow}>
              <BookOpen size={14} color={colors.textSecondary} />
              <Text style={[styles.label, { color: colors.textSecondary }]}>Note Content</Text>
            </View>
            <TextInput
              value={noteText}
              onChangeText={(val) => {
                setNoteText(val);
                handleSaveEdits('note', val);
              }}
              placeholder="Enter note text here..."
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.textAreaInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              multiline
            />
          </View>

          {/* Editable Folder */}
          <View style={styles.inputSection}>
            <View style={styles.labelRow}>
              <FolderClosed size={14} color={colors.textSecondary} />
              <Text style={[styles.label, { color: colors.textSecondary }]}>Folder</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  justifyContent: 'center',
                },
              ]}
              onPress={() => setFolderDropdownVisible(true)}
            >
              <Text style={{ color: folder ? colors.textPrimary : colors.textSecondary }}>
                {folder || 'Uncategorized'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Editable Tags */}
          <View style={styles.inputSection}>
            <View style={styles.labelRow}>
              <Tag size={14} color={colors.textSecondary} />
              <Text style={[styles.label, { color: colors.textSecondary }]}>Tags (comma separated)</Text>
            </View>
            <TextInput
              value={tagsString}
              onChangeText={(val) => {
                setTagsString(val);
                handleSaveEdits('tags', val);
              }}
              placeholder="cooking, tech, workout"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.tagTextInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.accent,
                },
              ]}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <ConfirmationModal
        visible={deleteModalVisible}
        title="Delete Stash"
        message="Are you sure you want to remove this item from your stash? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={() => {
          setDeleteModalVisible(false);
          deleteItem(item.id);
          router.back();
        }}
        onCancel={() => setDeleteModalVisible(false)}
      />

      {/* Folder Selection Dropdown Modal */}
      <Modal
        visible={folderDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFolderDropdownVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFolderDropdownVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.dropdownContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.dropdownTitle, { color: colors.textPrimary }]}>Select Folder</Text>
                <ScrollView style={{ maxHeight: 300 }}>
                  <TouchableOpacity
                    style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setFolder('');
                      handleSaveEdits('folder', '');
                      setFolderDropdownVisible(false);
                    }}
                  >
                    <Text style={{ color: !folder ? colors.accent : colors.textPrimary }}>Uncategorized</Text>
                  </TouchableOpacity>
                  {folders.map((fName) => (
                    <TouchableOpacity
                      key={fName}
                      style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        setFolder(fName);
                        handleSaveEdits('folder', fName);
                        setFolderDropdownVisible(false);
                      }}
                    >
                      <Text style={{ color: folder === fName ? colors.accent : colors.textPrimary }}>{fName}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginTop: 16,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  coverWrapper: {
    height: 180,
    borderRadius: LAYOUT.cardRadius,
    overflow: 'hidden',
    marginBottom: 20,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaSection: {
    marginBottom: 12,
  },
  titleInput: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    paddingVertical: 4,
  },
  urlDisplayRow: {
    marginBottom: 16,
  },
  urlText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  openLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: LAYOUT.borderRadius,
    paddingVertical: 14,
  },
  openLinkBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 24,
  },
  aiSummarySection: {
    marginBottom: 24,
  },
  aiSummaryText: {
    ...TYPOGRAPHY.body,
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    ...TYPOGRAPHY.meta,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },
  textInput: {
    ...TYPOGRAPHY.body,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tagTextInput: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 13,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textAreaInput: {
    ...TYPOGRAPHY.body,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownContainer: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
  },
  dropdownTitle: {
    ...TYPOGRAPHY.headingSm,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
});
