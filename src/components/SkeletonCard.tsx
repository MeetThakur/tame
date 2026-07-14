import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useThemeColors, SPACING, LAYOUT } from '../styles/theme';

export function SkeletonCard() {
  const colors = useThemeColors();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Left Thumbnail placeholder */}
      <Animated.View
        style={[
          styles.thumbnail,
          { backgroundColor: colors.surfaceRaised, opacity: pulseAnim },
        ]}
      />

      {/* Right details placeholders */}
      <View style={styles.details}>
        <Animated.View
          style={[
            styles.titleLine,
            { backgroundColor: colors.surfaceRaised, opacity: pulseAnim },
          ]}
        />
        <Animated.View
          style={[
            styles.titleLineShort,
            { backgroundColor: colors.surfaceRaised, opacity: pulseAnim },
          ]}
        />

        <View style={styles.metaRow}>
          <Animated.View
            style={[
              styles.metaBadge,
              { backgroundColor: colors.surfaceRaised, opacity: pulseAnim },
            ]}
          />
          <Animated.View
            style={[
              styles.metaText,
              { backgroundColor: colors.surfaceRaised, opacity: pulseAnim },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: SPACING.sm,
    borderRadius: LAYOUT.cardRadius,
    borderWidth: 1,
    marginBottom: SPACING.xs,
    height: 96,
    alignItems: 'center',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: LAYOUT.thumbnailRadius,
  },
  details: {
    flex: 1,
    marginLeft: SPACING.sm,
    justifyContent: 'center',
  },
  titleLine: {
    height: 14,
    borderRadius: 4,
    marginBottom: 6,
    width: '90%',
  },
  titleLineShort: {
    height: 14,
    borderRadius: 4,
    marginBottom: 10,
    width: '50%',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaBadge: {
    height: 12,
    width: 60,
    borderRadius: 6,
    marginRight: 8,
  },
  metaText: {
    height: 10,
    width: 80,
    borderRadius: 5,
  },
});
