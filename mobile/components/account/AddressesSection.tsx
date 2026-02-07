import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAddresses } from '@/contexts/AddressesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SavedAddress } from '@/types/account';
import { t } from '@/lib/i18n';
import { AddressFormModal } from './AddressFormModal';
import { accountColors, accountSpacing, accountTypography, accountBorderRadius, accountShadow } from '@/constants/accountTheme';

export function AddressesSection() {
  const { language } = useLanguage();
  const { addresses, addAddress, updateAddress, removeAddress, setDefaultAddress } = useAddresses();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);

  const openAdd = () => {
    setEditingAddress(null);
    setModalVisible(true);
  };

  const openEdit = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setModalVisible(true);
  };

  const handleSave = (payload: Omit<SavedAddress, 'id'>, existingId?: string) => {
    if (existingId) {
      updateAddress(existingId, payload);
    } else {
      addAddress(payload);
    }
  };

  const handleDelete = (addr: SavedAddress) => {
    Alert.alert(t(language, 'delete'), `Remove this address?`, [
      { text: t(language, 'cancel'), style: 'cancel' },
      { text: t(language, 'delete'), style: 'destructive', onPress: () => removeAddress(addr.id) },
    ]);
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t(language, 'savedAddresses')}</Text>
        <TouchableOpacity onPress={openAdd} activeOpacity={0.7}>
          <Text style={styles.addLink}>{t(language, 'addAddress')}</Text>
        </TouchableOpacity>
      </View>
      {addresses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t(language, 'addAddress')}</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={openAdd} activeOpacity={0.7}>
            <Text style={styles.emptyBtnText}>{t(language, 'addAddress')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        addresses.map((addr) => (
          <View key={addr.id} style={[styles.card, accountShadow.soft]}>
            {addr.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>{t(language, 'default')}</Text>
              </View>
            )}
            <Text style={styles.addressLine}>{addr.street}{addr.apartment ? `, ${addr.apartment}` : ''}</Text>
            <Text style={styles.addressLine}>{addr.city}, {addr.country}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setDefaultAddress(addr.id)} disabled={addr.isDefault} style={styles.actionBtn}>
                <Text style={[styles.actionText, addr.isDefault && styles.actionTextDisabled]}>{t(language, 'setDefault')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openEdit(addr)} style={styles.actionBtn}>
                <Text style={styles.actionText}>{t(language, 'edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(addr)} style={styles.actionBtn}>
                <Text style={[styles.actionText, styles.actionDestructive]}>{t(language, 'delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <AddressFormModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditingAddress(null); }}
        onSave={handleSave}
        editingAddress={editingAddress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: accountSpacing.sectionGap },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: accountSpacing.lg, marginBottom: accountSpacing.sm },
  sectionTitle: { ...accountTypography.sectionTitle, color: accountColors.textMuted, textTransform: 'uppercase' },
  addLink: { ...accountTypography.button, color: accountColors.goldMuted },
  emptyCard: { backgroundColor: accountColors.backgroundElevated, borderRadius: accountBorderRadius.md, marginHorizontal: accountSpacing.lg, padding: accountSpacing.lg, alignItems: 'center', borderWidth: 1, borderColor: accountColors.borderLight },
  emptyText: { ...accountTypography.body, color: accountColors.textMuted, marginBottom: accountSpacing.sm },
  emptyBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  emptyBtnText: { ...accountTypography.button, color: accountColors.goldMuted },
  card: { backgroundColor: accountColors.backgroundElevated, borderRadius: accountBorderRadius.md, marginHorizontal: accountSpacing.lg, marginBottom: accountSpacing.sm, padding: accountSpacing.md, borderWidth: 1, borderColor: accountColors.borderLight },
  defaultBadge: { alignSelf: 'flex-start', backgroundColor: accountColors.cream, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  defaultBadgeText: { fontSize: 11, fontWeight: '600', color: accountColors.textSecondary },
  addressLine: { ...accountTypography.cardValue, color: accountColors.text, marginBottom: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: accountSpacing.sm },
  actionBtn: { paddingVertical: 4 },
  actionText: { ...accountTypography.caption, color: accountColors.goldMuted },
  actionTextDisabled: { color: accountColors.textMuted },
  actionDestructive: { color: accountColors.destructive },
});
