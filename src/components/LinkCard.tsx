import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Film, Video, FileText, Clipboard, Heart, Trash2 } from 'lucide-react-native';
import { TameItem, useTameStore } from '../store/useTameStore';
import { useThemeColors, SPACING, TYPOGRAPHY, LAYOUT } from '../styles/theme';

interface LinkCardProps {
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

export function LinkCard({ item, index }: LinkCardProps) {
  const colors = useThemeColors();
  const toggleFavorite = useTameStore((state) => state.toggleFavorite);
  const deleteItem = useTameStore((state) => state.deleteItem);

  const screenWidth = Dimensions.get('window').width;
  const SWIPE_THRESHOLD = 80;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(4)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY()).current;

  // Staggered entrance animation
  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 30),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [index]);

  // Pulse effect if item is newly created (saved in the last 6 seconds)
  useEffect(() => {
    const isNew = Date.now() - item.savedAt < 6000;
    if (isNew) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.04,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [item.savedAt]);

  // Gesture responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only trigger horizontal swipes
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Limit swiping right to standard distance, allow full width left swipe
        const x = gestureState.dx > 120 ? 120 : gestureState.dx;
        pan.setValue({ x, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Favorite
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Animated.spring(pan.x, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start(() => {
            toggleFavorite(item.id);
          });
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Delete
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Animated.timing(pan.x, {
            toValue: -screenWidth,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            deleteItem(item.id);
          });
        } else {
          // Snap back
          Animated.spring(pan.x, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        }
      },
    })
  ).current;

  const renderTypeIcon = (size = 14, color = colors.textSecondary) => {
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

  const renderBadgeLabel = () => {
    switch (item.type) {
      case 'reel':
        return 'Reel';
      case 'video':
        return 'Video';
      case 'article':
        return 'Article';
      case 'note':
        return 'Note';
    }
  };

  const hasThumbnail = !!item.thumbnailUrl;

  return (
    <View style={styles.cardWrapper}>
      {/* Background action layers */}
      <View style={styles.backgroundActionsContainer}>
        {/* Favorite (Left Reveal) */}
        <View style={[styles.actionLeft, { backgroundColor: colors.surfaceRaised }]}>
          <Heart
            size={20}
            color={item.isFavorite ? colors.textSecondary : colors.accent}
            fill={item.isFavorite ? 'none' : colors.accent}
          />
        </View>

        {/* Delete (Right Reveal) */}
        <View style={[styles.actionRight, { backgroundColor: colors.destructive }]}>
          <Trash2 size={20} color="#FFFFFF" />
        </View>
      </View>

      {/* Foreground Interactive Card */}
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: fadeAnim,
            transform: [
              { translateY: translateYAnim },
              { scale: scaleAnim },
              { translateX: pan.x },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Link href={`/item/${item.id}`} asChild>
          <TouchableOpacity style={styles.cardTouchArea} activeOpacity={0.95}>
            {/* Thumbnail / Placeholder */}
            {hasThumbnail ? (
              <Image
                source={{ uri: item.thumbnailUrl! }}
                style={styles.thumbnail}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.surfaceRaised }]}>
                {renderTypeIcon(24, colors.textSecondary)}
              </View>
            )}

            {/* Content Details */}
            <View style={styles.details}>
              {/* Row: Title & Favorite Icon */}
              <View style={styles.titleRow}>
                <Text
                  style={[styles.title, { color: colors.textPrimary }]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.title || 'Untitled'}
                </Text>
                {item.isFavorite && (
                  <Heart size={14} color={colors.accent} fill={colors.accent} style={styles.favIcon} />
                )}
              </View>

              {/* Row: Metadata pill & Time Saved */}
              <View style={styles.metaRow}>
                <View style={[styles.badge, { backgroundColor: colors.surfaceRaised }]}>
                  {renderTypeIcon(10, colors.textSecondary)}
                  <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                    {renderBadgeLabel()}
                  </Text>
                </View>
                <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                  {formatSavedAt(item.savedAt)}
                </Text>
              </View>

              {/* Tag Chips */}
              {item.aiTags && item.aiTags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {item.aiTags.slice(0, 3).map((tag, idx) => (
                    <View key={idx} style={[styles.tagChip, { backgroundColor: colors.surfaceRaised }]}>
                      <Text style={[styles.tagText, { color: colors.accent }]} numberOfLines={1}>
                        #{tag}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Link>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: SPACING.xs,
    position: 'relative',
    height: 104,
  },
  backgroundActionsContainer: {
    ...StyleSheet.absoluteFill,
    borderRadius: LAYOUT.cardRadius,
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  actionLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 24,
  },
  actionRight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 24,
  },
  card: {
    ...StyleSheet.absoluteFill,
    borderRadius: LAYOUT.cardRadius,
    borderWidth: 1,
  },
  cardTouchArea: {
    flex: 1,
    flexDirection: 'row',
    padding: SPACING.sm,
    alignItems: 'center',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: LAYOUT.thumbnailRadius,
  },
  thumbnailPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: LAYOUT.thumbnailRadius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    marginLeft: SPACING.sm,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    ...TYPOGRAPHY.headingSm,
    flex: 1,
    lineHeight: 20,
    marginBottom: 4,
  },
  favIcon: {
    marginLeft: 8,
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    marginRight: 8,
  },
  badgeText: {
    ...TYPOGRAPHY.meta,
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '400',
  },
  timeText: {
    ...TYPOGRAPHY.meta,
    fontSize: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  tagText: {
    ...TYPOGRAPHY.tag,
  },
});
