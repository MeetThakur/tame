import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Dimensions,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Film, Video, FileText, Clipboard, Check, Loader2 } from 'lucide-react-native';
import { useTameStore } from '../store/useTameStore';
import { processItemEnrichment } from '../services/coordinator';
import { useThemeColors, SPACING, TYPOGRAPHY, LAYOUT } from '../styles/theme';

interface ShareConfirmationSheetProps {
  sharedValue: string;
  onDismiss: () => void;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/;

export function ShareConfirmationSheet({ sharedValue, onDismiss }: ShareConfirmationSheetProps) {
  const colors = useThemeColors();
  const addItem = useTameStore((state) => state.addItem);
  const updateItem = useTameStore((state) => state.updateItem);
  const deleteItem = useTameStore((state) => state.deleteItem);

  const [itemId, setItemId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState<'reel' | 'video' | 'article' | 'note'>('note');
  const [url, setUrl] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Parse share value and pre-save immediately
  useEffect(() => {
    if (!sharedValue) return;

    const match = sharedValue.match(URL_REGEX);
    let itemUrl = '';
    let itemType: 'reel' | 'video' | 'article' | 'note' = 'note';
    let defaultTitle = '';
    let extractedNoteText = '';

    if (match) {
      itemUrl = match[1];
      // Clean up notes or captions around the URL if present
      extractedNoteText = sharedValue.replace(itemUrl, '').trim();
      
      if (itemUrl.includes('instagram.com') && (itemUrl.includes('/reel/') || itemUrl.includes('/p/') || itemUrl.includes('/reels/'))) {
        itemType = 'reel';
        defaultTitle = 'Instagram Reel';
      } else if (itemUrl.includes('youtube.com') || itemUrl.includes('youtu.be')) {
        itemType = 'video';
        defaultTitle = 'YouTube Video';
      } else {
        itemType = 'article';
        // Extract domain as a fallback title
        try {
          const domain = new URL(itemUrl).hostname.replace('www.', '');
          defaultTitle = domain.charAt(0).toUpperCase() + domain.slice(1);
        } catch {
          defaultTitle = 'Web Article';
        }
      }
    } else {
      itemType = 'note';
      extractedNoteText = sharedValue;
      const firstLine = sharedValue.split('\n')[0].trim();
      defaultTitle = firstLine.length > 40 ? firstLine.substring(0, 37) + '...' : firstLine || 'Plain Note';
    }

    setType(itemType);
    setUrl(itemUrl);
    setTitle(defaultTitle);
    if (extractedNoteText) {
      setNote(extractedNoteText);
    }

    // Save minimal record to MMKV immediately to prevent loss
    const generatedId = addItem({
      url: itemUrl,
      type: itemType,
      title: defaultTitle,
      thumbnailUrl: null,
      rawNoteText: itemType === 'note' ? sharedValue : extractedNoteText || null,
      aiSummary: null,
      aiTags: [],
      folder: null,
      status: 'pending',
    });

    setItemId(generatedId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [sharedValue]);

  // Handle Android physical back button press
  useEffect(() => {
    const backAction = () => {
      handleCancel();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [itemId]);

  const handleCancel = () => {
    if (itemId) {
      deleteItem(itemId);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
    setTimeout(() => {
      BackHandler.exitApp();
    }, 100);
  };

  const handleSave = async () => {
    if (!itemId) return;

    setSaveStatus('saving');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Save edits
    updateItem(itemId, {
      title: title.trim() || 'Untitled',
      rawNoteText: type === 'note' ? sharedValue : note.trim() || null,
    });

    setSaveStatus('saved');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Start background enrichment process
    processItemEnrichment(itemId).catch((err) => {
      console.error('[Background Enrichment Exception]:', err);
    });

    // Hold saved UI for 1.5s, then exit back to original app
    setTimeout(() => {
      onDismiss();
      setTimeout(() => {
        BackHandler.exitApp();
      }, 100);
    }, 1500);
  };

  const renderIcon = () => {
    const iconSize = 28;
    const iconColor = colors.textSecondary;
    switch (type) {
      case 'reel':
        return <Film size={iconSize} color={iconColor} />;
      case 'video':
        return <Video size={iconSize} color={iconColor} />;
      case 'article':
        return <FileText size={iconSize} color={iconColor} />;
      case 'note':
        return <Clipboard size={iconSize} color={iconColor} />;
    }
  };

  return (
    <Modal visible={true} transparent animationType="slide" onRequestClose={handleCancel}>
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingView}
            >
              <View style={[styles.sheetContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Drag handle */}
                <View style={styles.dragHandleContainer}>
                  <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    RECEIVING FOR LATER
                  </Text>

                  {/* Metadata preview row */}
                  <View style={styles.previewRow}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.surfaceRaised }]}>
                      {renderIcon()}
                    </View>
                    <View style={styles.titleInputContainer}>
                      <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Content title..."
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.titleInput, { color: colors.textPrimary }]}
                        multiline
                        numberOfLines={2}
                      />
                    </View>
                  </View>

                  {/* Optional Notes */}
                  {type !== 'note' && (
                    <TextInput
                      value={note}
                      onChangeText={setNote}
                      placeholder="Add a note... (optional)"
                      placeholderTextColor={colors.textSecondary}
                      style={[
                        styles.noteInput,
                        {
                          backgroundColor: colors.surfaceRaised,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        },
                      ]}
                      multiline
                    />
                  )}

                  {/* Action Button */}
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: saveStatus === 'saved' ? '#4CAF50' : colors.accent,
                      },
                    ]}
                    onPress={handleSave}
                    disabled={saveStatus !== 'idle'}
                    activeOpacity={0.8}
                  >
                    {saveStatus === 'idle' && (
                      <Text style={[styles.actionButtonText, { color: '#0E0E0E' }]}>
                        Save to Tame
                      </Text>
                    )}
                    {saveStatus === 'saving' && (
                      <View style={styles.rowCentered}>
                        <Loader2 size={16} color="#0E0E0E" style={styles.spin} />
                        <Text style={[styles.actionButtonText, { color: '#0E0E0E', marginLeft: 8 }]}>
                          Saving…
                        </Text>
                      </View>
                    )}
                    {saveStatus === 'saved' && (
                      <View style={styles.rowCentered}>
                        <Check size={18} color="#FFFFFF" />
                        <Text style={[styles.actionButtonText, { color: '#FFFFFF', marginLeft: 8 }]}>
                          Saved ✓
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: 24,
  },
  metaText: {
    ...TYPOGRAPHY.meta,
    marginBottom: 12,
    letterSpacing: 1.5,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: LAYOUT.thumbnailRadius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleInputContainer: {
    flex: 1,
    marginLeft: 16,
    minHeight: 64,
    justifyContent: 'center',
  },
  titleInput: {
    ...TYPOGRAPHY.headingSm,
    paddingVertical: 4,
    textAlignVertical: 'center',
  },
  noteInput: {
    ...TYPOGRAPHY.body,
    borderRadius: LAYOUT.borderRadius,
    borderWidth: 1,
    padding: 12,
    minHeight: 80,
    maxHeight: 140,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: LAYOUT.borderRadius,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
  },
  rowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spin: {
    // Basic loader styling
  },
});
