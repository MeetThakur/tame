import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ChevronLeft, Eye, EyeOff, Share2, Trash2, Key, SunMoon, Database } from 'lucide-react-native';
import { useTameStore } from '../store/useTameStore';
import { useThemeColors, SPACING, TYPOGRAPHY, LAYOUT } from '../styles/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const items = useTameStore((state) => state.items);
  const geminiApiKey = useTameStore((state) => state.geminiApiKey);
  const setGeminiApiKey = useTameStore((state) => state.setGeminiApiKey);
  const theme = useTameStore((state) => state.theme);
  const setTheme = useTameStore((state) => state.setTheme);
  const clearAll = useTameStore((state) => state.clearAll);

  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey);
  const [showKey, setShowKey] = useState(false);

  // Save API key change
  const handleApiKeyChange = (key: string) => {
    setApiKeyInput(key);
    setGeminiApiKey(key);
  };

  // Select theme
  const handleThemeChange = (selectedTheme: 'dark' | 'light' | 'system') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTheme(selectedTheme);
  };

  // Export JSON file via Sharing
  const handleExportAll = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (items.length === 0) {
        Alert.alert('Empty Stash', 'There is no data in your stash to export.');
        return;
      }

      const jsonString = JSON.stringify(items, null, 2);
      const fileUri = `${(FileSystem as any).documentDirectory}tame_stash_export.json`;
      
      // Write to temp file system path
      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Launch share sheet
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Tame Stash',
          UTI: 'public.json', // iOS UTI
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Native sharing is not available on this device.');
      }
    } catch (err) {
      console.error('[Export Service] Error:', err);
      Alert.alert('Export Failed', 'An error occurred while generating the export file.');
    }
  };

  // Delete all items
  const handleClearAllData = () => {
    Alert.alert(
      'Clear all data',
      'This will permanently delete all saved links and notes. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clearAll();
            Alert.alert('Cleared', 'All data has been wiped.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={colors.textPrimary} />
          <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>Home</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Gemini API Key Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Key size={16} color={colors.textSecondary} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Gemini Integration</Text>
          </View>

          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              value={apiKeyInput}
              onChangeText={handleApiKeyChange}
              placeholder="Enter Gemini API key..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.apiKeyInput, { color: colors.textPrimary }]}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowKey(!showKey)}>
              {showKey ? (
                <EyeOff size={16} color={colors.textSecondary} />
              ) : (
                <Eye size={16} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            Get a free Gemini API key from Google AI Studio. Setting this enables background auto-tagging, categorizing, and summarization of new links/notes.
          </Text>
        </View>

        {/* Theme Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SunMoon size={16} color={colors.textSecondary} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
          </View>

          <View style={[styles.tabSelector, { backgroundColor: colors.surfaceRaised }]}>
            {(['dark', 'light', 'system'] as const).map((t) => {
              const isActive = theme === t;
              const label = t.charAt(0).toUpperCase() + t.slice(1);
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.tabSelectorButton,
                    isActive && { backgroundColor: colors.surface },
                  ]}
                  onPress={() => handleThemeChange(t)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabSelectorText,
                      {
                        color: isActive ? colors.accent : colors.textSecondary,
                        fontWeight: isActive ? '600' : '400',
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Stash Database Actions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={16} color={colors.textSecondary} />
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Data Management</Text>
          </View>

          {/* Export JSON Button */}
          <TouchableOpacity
            style={[styles.actionRowBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleExportAll}
            activeOpacity={0.8}
          >
            <View style={styles.rowCentered}>
              <Share2 size={16} color={colors.textPrimary} style={{ marginRight: 12 }} />
              <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Export Stash (JSON)</Text>
            </View>
          </TouchableOpacity>

          {/* Clear All Button */}
          <TouchableOpacity
            style={[
              styles.actionRowBtn,
              { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 12 },
            ]}
            onPress={handleClearAllData}
            activeOpacity={0.8}
          >
            <View style={styles.rowCentered}>
              <Trash2 size={16} color={colors.destructive} style={{ marginRight: 12 }} />
              <Text style={[styles.actionBtnText, { color: colors.destructive }]}>Clear All Data</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer Branding */}
        <View style={styles.footer}>
          <Text style={[styles.footerTitle, { color: colors.textPrimary }]}>Tame</Text>
          <Text style={[styles.footerSubtitle, { color: colors.textSecondary }]}>
            Set it aside. Come back when ready.
          </Text>
          <Text style={[styles.footerVersion, { color: colors.textSecondary + '66' }]}>v1.0.0 (Demo)</Text>
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    ...TYPOGRAPHY.meta,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginLeft: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: LAYOUT.borderRadius,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  apiKeyInput: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 13,
    flex: 1,
    paddingVertical: 8,
  },
  eyeBtn: {
    padding: 8,
  },
  hintText: {
    ...TYPOGRAPHY.meta,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },
  tabSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
  },
  tabSelectorButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
  },
  tabSelectorText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  actionRowBtn: {
    borderRadius: LAYOUT.borderRadius,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  rowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnText: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  footerTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  footerSubtitle: {
    ...TYPOGRAPHY.meta,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  footerVersion: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 10,
  },
});
