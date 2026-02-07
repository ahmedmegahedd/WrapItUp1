import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import type { SavedAddress } from '@/types/account';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { accountColors, accountSpacing, accountTypography, accountBorderRadius } from '@/constants/accountTheme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (address: Omit<SavedAddress, 'id'>, existingId?: string) => void;
  editingAddress: SavedAddress | null;
};

const emptyForm = { street: '', apartment: '', city: '', country: '', isDefault: false };

export function AddressFormModal({ visible, onClose, onSave, editingAddress }: Props) {
  const { language } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [street, setStreet] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      if (editingAddress) {
        setStreet(editingAddress.street);
        setApartment(editingAddress.apartment ?? '');
        setCity(editingAddress.city);
        setCountry(editingAddress.country);
        setIsDefault(editingAddress.isDefault);
      } else {
        setStreet(emptyForm.street);
        setApartment(emptyForm.apartment);
        setCity(emptyForm.city);
        setCountry(emptyForm.country);
        setIsDefault(false);
      }
      setErrors({});
    }
  }, [visible, editingAddress]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!street.trim()) e.street = 'Required';
    if (!city.trim()) e.city = 'Required';
    if (!country.trim()) e.country = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { street: street.trim(), apartment: apartment.trim() || undefined, city: city.trim(), country: country.trim(), isDefault };
      onSave(payload, editingAddress?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.content}>
          <Text style={styles.title}>{editingAddress ? t(language, 'edit') : t(language, 'addAddress')}</Text>
          <Text style={styles.label}>{t(language, 'street')}</Text>
          <TextInput style={[styles.input, errors.street && styles.inputError]} value={street} onChangeText={setStreet} placeholder={t(language, 'street')} placeholderTextColor={accountColors.textMuted} />
          {errors.street ? <Text style={styles.errorText}>{errors.street}</Text> : null}
          <Text style={styles.label}>{t(language, 'apartment')}</Text>
          <TextInput style={styles.input} value={apartment} onChangeText={setApartment} placeholder={t(language, 'apartment')} placeholderTextColor={accountColors.textMuted} />
          <Text style={styles.label}>{t(language, 'city')}</Text>
          <TextInput style={[styles.input, errors.city && styles.inputError]} value={city} onChangeText={setCity} placeholder={t(language, 'city')} placeholderTextColor={accountColors.textMuted} />
          {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
          <Text style={styles.label}>{t(language, 'country')}</Text>
          <TextInput style={[styles.input, errors.country && styles.inputError]} value={country} onChangeText={setCountry} placeholder={t(language, 'country')} placeholderTextColor={accountColors.textMuted} />
          {errors.country ? <Text style={styles.errorText}>{errors.country}</Text> : null}
          <TouchableOpacity style={styles.defaultRow} onPress={() => setIsDefault(!isDefault)} activeOpacity={0.7}>
            <View style={[styles.checkbox, isDefault && styles.checkboxChecked]} />
            <Text style={styles.defaultLabel}>{t(language, 'setAsDefault')}</Text>
          </TouchableOpacity>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} disabled={saving} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>{t(language, 'cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{t(language, 'save')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  content: { backgroundColor: accountColors.backgroundElevated, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: accountSpacing.lg, paddingBottom: accountSpacing.xl + 24 },
  title: { ...accountTypography.cardTitle, color: accountColors.text, marginBottom: accountSpacing.md },
  label: { ...accountTypography.caption, color: accountColors.textMuted, marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: accountColors.border, borderRadius: accountBorderRadius.sm, padding: accountSpacing.sm, fontSize: 16, color: accountColors.text },
  inputError: { borderColor: accountColors.error },
  errorText: { fontSize: 12, color: accountColors.error, marginTop: 4 },
  defaultRow: { flexDirection: 'row', alignItems: 'center', marginTop: accountSpacing.md },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: accountColors.border, marginRight: 10 },
  checkboxChecked: { backgroundColor: accountColors.goldMuted, borderColor: accountColors.goldMuted },
  defaultLabel: { ...accountTypography.body, color: accountColors.text },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: accountSpacing.lg },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  cancelBtnText: { ...accountTypography.button, color: accountColors.textSecondary },
  saveBtn: { backgroundColor: accountColors.charcoal, paddingVertical: 12, paddingHorizontal: 24, borderRadius: accountBorderRadius.sm, minWidth: 100, alignItems: 'center' },
  saveBtnText: { ...accountTypography.button, color: '#fff' },
});
