import { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { OptimizedImage } from '@/components/OptimizedImage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { getCollections } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { colors, spacing, borderRadius } from '@/constants/theme';

export default function CollectionsScreen() {
  const { language } = useLanguage();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstFocus = useRef(true);

  const fetchCollections = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const list = await getCollections();
      setCollections(list);
    } catch (err: any) {
      setCollections([]);
      setError(err?.response?.status ? `API error ${err.response.status}` : err?.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const showLoading = isFirstFocus.current;
      if (isFirstFocus.current) isFirstFocus.current = false;
      fetchCollections(showLoading);
    }, [fetchCollections])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCollections(false);
  }, [fetchCollections]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t(language, 'allCollections')}</Text>
        <Text style={styles.headerSubtitle}>{collections.length} {collections.length !== 1 ? t(language, 'collectionCountPlural') : t(language, 'collectionCount')}</Text>
      </View>
      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, collections.length === 0 && styles.listEmpty]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            {error ? (
              <>
                <Text style={styles.emptyText}>{t(language, 'couldntLoadCollections')}</Text>
                <Text style={styles.emptySubtext}>{error}</Text>
                <Text style={styles.hint}>{t(language, 'loadCollectionsError')}</Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyText}>{t(language, 'noCollectionsYet')}</Text>
                <Text style={styles.emptySubtext}>{t(language, 'noCollectionsHint')}</Text>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push(`/collection/${item.slug}`)}
            activeOpacity={0.8}
          >
            {item.image_url ? (
              <OptimizedImage uri={item.image_url} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]} />
            )}
            <View style={styles.textWrap}>
              <Text style={styles.name}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
              ) : null}
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundMuted },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  headerSubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  listEmpty: { flexGrow: 1 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 17, fontWeight: '600', color: colors.textMuted },
  emptySubtext: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  hint: { fontSize: 13, color: colors.textMuted, marginTop: spacing.md, paddingHorizontal: spacing.lg, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.sm,
  },
  thumbPlaceholder: { backgroundColor: colors.border },
  textWrap: { flex: 1, marginLeft: spacing.md },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  desc: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 24, color: colors.textMuted },
});
