import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useThemeColors, SPACING, TYPOGRAPHY, LAYOUT } from '../styles/theme';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const colors = useThemeColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Warning/Alert Icon for Destructive Actions */}
              {isDestructive && (
                <View style={styles.iconContainer}>
                  <AlertTriangle size={32} color={colors.destructive} />
                </View>
              )}

              {/* Title & Body */}
              <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
              <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                    {cancelLabel}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    { backgroundColor: isDestructive ? colors.destructive : colors.accent },
                  ]}
                  onPress={onConfirm}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.confirmText,
                      { color: isDestructive ? '#FFFFFF' : '#0E0E0E' },
                    ]}
                  >
                    {confirmLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: LAYOUT.borderRadius,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    ...TYPOGRAPHY.headingSm,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: LAYOUT.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  confirmButton: {
    elevation: 1,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
  },
  confirmText: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
  },
});
