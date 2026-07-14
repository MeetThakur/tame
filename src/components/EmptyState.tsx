import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors, TYPOGRAPHY, SPACING } from '../styles/theme';

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = 'Share a link to start your stash.' }: EmptyStateProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {/* Minimal line-art box graphic */}
      <View style={[styles.graphicContainer, { borderColor: colors.border }]}>
        <View style={[styles.innerSquare, { borderColor: colors.textSecondary + '22' }]} />
        <View style={[styles.horizontalLine, { backgroundColor: colors.border }]} />
        <View style={[styles.diagonalLine, { backgroundColor: colors.border }]} />
      </View>
      <Text style={[styles.messageText, { color: colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
    marginTop: 64,
  },
  graphicContainer: {
    width: 80,
    height: 80,
    borderWidth: 1.5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
    opacity: 0.6,
  },
  innerSquare: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 4,
  },
  horizontalLine: {
    position: 'absolute',
    height: 1.5,
    width: '100%',
    top: '50%',
  },
  diagonalLine: {
    position: 'absolute',
    width: 1.5,
    height: '100%',
    left: '50%',
  },
  messageText: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
