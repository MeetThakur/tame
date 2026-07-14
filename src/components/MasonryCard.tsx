import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Heart, Trash2, Film, Video, FileText, Clipboard } from 'lucide-react-native';
import { TameItem, useTameStore } from '../store/useTameStore';
import { useThemeColors, SPACING, TYPOGRAPHY, LAYOUT } from '../styles/theme';

interface MasonryCardProps {
  item: TameItem;
  index: number;
}

function formatSavedAt(timestamp: number) {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function MasonryCard({ item, index }: MasonryCardProps) {
  const colors = useThemeColors();
  const toggleFavorite = useTameStore((state) => state.toggleFavorite);
  const deleteItem = useTameStore((state) => state.deleteItem);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(8)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(Math.min(index * 30, 300)),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [index]);

  const renderTypeIcon = (size = 12, color = colors.textSecondary) => {
    switch (item.type) {
      case 'reel':
        return <Film size={size} color={color} />;
      case 'video':
        return <Video size={size} color={color} />;
      case 'article':
        return <FileText size={size} color={color} />;
      case 'note':
        return <Clipboard size={size} color={color} />;
    }
  };

  const handleFavoritePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(item.id);
  };

  const handleDeletePress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Item',
      'Are you sure you want to remove this item from your stash?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteItem(item.id),
        },
      ]
    );
  };

  const hasThumbnail = !!item.thumbnailUrl;
  const isNote = item.type === 'note';

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Link href={`/item/${item.id}`} asChild>
          <TouchableOpacity activeOpacity={0.9} style={styles.touchArea}>
            {/* Visual Cover / Preview */}
            {hasThumbnail ? (
              <Image
                source={{ uri: item.thumbnailUrl! }}
                style={[
                  styles.coverImage,
                  item.type === 'reel' ? { aspectRatio: 3 / 4 } : { aspectRatio: 16 / 9 },
                ]}
                contentFit="cover"
                transition={200}
              />
            ) : isNote && item.rawNoteText ? (
              <View style={[styles.notePreviewContainer, { backgroundColor: colors.surfaceRaised }]}>
                <Text
                  style={[styles.notePreviewText, { color: colors.textSecondary }]}
                  numberOfLines={6}
                >
                  {item.rawNoteText}
                </Text>
              </View>
            ) : (
              <View style={[styles.placeholderCover, { backgroundColor: colors.surfaceRaised }]}>
                {renderTypeIcon(28, colors.textSecondary)}
              </View>
            )}

            {/* Info Section */}
            <View style={styles.content}>
              {/* Meta time / Type indicator */}
              <View style={styles.headerRow}>
                <View style={styles.typeBadge}>
                  {renderTypeIcon(10, colors.textSecondary)}
                  <Text style={[styles.typeBadgeText, { color: colors.textSecondary }]}>
                    {item.type}
                  </Text>
                </View>
                <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                  {formatSavedAt(item.savedAt)}
                </Text>
              </View>

              {/* Title */}
              <Text
                style={[styles.title, { color: colors.textPrimary }]}
                numberOfLines={3}
                ellipsizeMode="tail"
              >
                {item.title || 'Untitled Stash'}
              </Text>

              {/* AI tags */}
              {item.aiTags && item.aiTags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {item.aiTags.slice(0, 2).map((tag, idx) => (
                    <Text key={idx} style={[styles.tagText, { color: colors.accent }]} numberOfLines={1}>
                      #{tag}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Link>

        {/* Bottom Actions Row */}
        <View style={[styles.actionsBar, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleFavoritePress}
            activeOpacity={0.7}
          >
            <Heart
              size={15}
              color={item.isFavorite ? colors.accent : colors.textSecondary}
              fill={item.isFavorite ? colors.accent : 'none'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDeletePress}
            activeOpacity={0.7}
          >
            <Trash2 size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    padding: 6,
  },
  card: {
    borderRadius: LAYOUT.cardRadius,
    borderWidth: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  touchArea: {
    width: '100%',
  },
  coverImage: {
    width: '100%',
    borderBottomWidth: 1,
  },
  notePreviewContainer: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    minHeight: 80,
    justifyContent: 'center',
  },
  notePreviewText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    lineHeight: 16,
  },
  placeholderCover: {
    width: '100%',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  content: {
    padding: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadgeText: {
    ...TYPOGRAPHY.meta,
    fontSize: 10,
    textTransform: 'capitalize',
    marginLeft: 4,
  },
  timeText: {
    ...TYPOGRAPHY.meta,
    fontSize: 9,
  },
  title: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  tagText: {
    ...TYPOGRAPHY.tag,
    fontSize: 10,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  actionButton: {
    padding: 6,
  },
});
