import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { updateUserProfile } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import { accountColors, accountSpacing, accountTypography, accountBorderRadius, accountShadow } from '@/constants/accountTheme';

export function PersonalInfoSection() {
  const { session } = useAuth();
  const { language } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const meta = session?.user?.user_metadata ?? {};
  const fullName = meta.full_name ?? meta.name ?? '';
  const email = session?.user?.email ?? '';
  const phone = meta.phone ?? '';

  const [editName, setEditName] = useState(fullName);
  const [editPhone, setEditPhone] = useState(phone);

  const openEdit = () => {
    setEditName(fullName);
    setEditPhone(phone);
    setModalVisible(true);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile({ full_name: editName.trim() || undefined, phone: editPhone.trim() || undefined });
      setModalVisible(false);
      showToast(t(language, 'successUpdated'));
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t(language, 'personalInfo')}</Text>
        <View style={[styles.card, accountShadow.soft]}>
          <View style={styles.row}>
            <Text style={styles.label}>{t(language, 'name')}</Text>
            <Text style={styles.value} numberOfLines={1}>{fullName || '—'}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.label}>{t(language, 'email')}</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value} numberOfLines={1}>{email}</Text>
              {session?.user?.email_confirmed_at && (
                <Text style={styles.verified}> • {t(language, 'verified')}</Text>
              )}
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.label}>{t(language, 'phone')}</Text>
            <Text style={styles.value} numberOfLines={1}>{phone || '—'}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={openEdit} activeOpacity={0.7}>
            <Text style={styles.editBtnText}>{t(language, 'edit')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t(language, 'personalInfo')}</Text>
            <Text style={styles.inputLabel}>{t(language, 'name')}</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder={t(language, 'name')}
              placeholderTextColor={accountColors.textMuted}
              autoCapitalize="words"
            />
            <Text style={styles.inputLabel}>{t(language, 'email')}</Text>
            <Text style={styles.inputDisabled}>{email}</Text>
            <Text style={styles.inputHint}>Email cannot be changed here.</Text>
            <Text style={styles.inputLabel}>{t(language, 'phone')}</Text>
            <TextInput
              style={styles.input}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder={t(language, 'phone')}
              placeholderTextColor={accountColors.textMuted}
              keyboardType="phone-pad"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)} disabled={saving}>
                <Text style={styles.modalCancelText}>{t(language, 'cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalSaveText}>{t(language, 'save')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: accountSpacing.sectionGap },
  sectionTitle: {
    ...accountTypography.sectionTitle,
    color: accountColors.textMuted,
    marginBottom: accountSpacing.sm,
    paddingHorizontal: accountSpacing.lg,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: accountColors.backgroundElevated,
    borderRadius: accountBorderRadius.md,
    marginHorizontal: accountSpacing.lg,
    padding: accountSpacing.md,
    borderWidth: 1,
    borderColor: accountColors.borderLight,
  },
  row: { paddingVertical: accountSpacing.sm },
  valueRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  label: { ...accountTypography.caption, color: accountColors.textMuted, marginBottom: 2 },
  value: { ...accountTypography.cardValue, color: accountColors.text },
  verified: { ...accountTypography.caption, color: accountColors.success },
  separator: { height: 1, backgroundColor: accountColors.borderLight, marginVertical: 2 },
  editBtn: { marginTop: accountSpacing.sm, alignSelf: 'flex-start' },
  editBtnText: { ...accountTypography.button, color: accountColors.goldMuted },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: accountColors.backgroundElevated, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: accountSpacing.lg, paddingBottom: accountSpacing.xl + 20 },
  modalTitle: { ...accountTypography.cardTitle, color: accountColors.text, marginBottom: accountSpacing.md },
  inputLabel: { ...accountTypography.caption, color: accountColors.textMuted, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: accountColors.border, borderRadius: accountBorderRadius.sm, padding: accountSpacing.sm, fontSize: 16, color: accountColors.text },
  inputDisabled: { borderWidth: 1, borderColor: accountColors.border, borderRadius: accountBorderRadius.sm, padding: accountSpacing.sm, fontSize: 16, color: accountColors.textMuted, backgroundColor: accountColors.cream },
  inputHint: { fontSize: 12, color: accountColors.textMuted, marginTop: 4 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: accountSpacing.lg },
  modalCancel: { paddingVertical: 12, paddingHorizontal: 20 },
  modalCancelText: { ...accountTypography.button, color: accountColors.textSecondary },
  modalSave: { backgroundColor: accountColors.charcoal, paddingVertical: 12, paddingHorizontal: 24, borderRadius: accountBorderRadius.sm, minWidth: 100, alignItems: 'center' },
  modalSaveText: { ...accountTypography.button, color: '#fff' },

  toast: { position: 'absolute', bottom: 100, left: 24, right: 24, backgroundColor: accountColors.charcoal, padding: accountSpacing.sm, borderRadius: accountBorderRadius.sm, alignItems: 'center' },
  toastText: { color: '#fff', fontSize: 14 },
});
