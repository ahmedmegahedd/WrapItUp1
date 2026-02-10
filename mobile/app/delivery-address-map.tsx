import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAddresses } from '@/contexts/AddressesContext';
import { usePendingDelivery } from '@/contexts/PendingDeliveryContext';
import { t } from '@/lib/i18n';
import {
  reverseGeocode,
  buildMapsLink,
  buildFullAddress,
  GeocodingError,
  type ReverseGeocodeResult,
} from '@/lib/geocoding';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { hapticPrimary } from '@/lib/haptics';

const DEFAULT_REGION: Region = {
  latitude: 30.0444,
  longitude: 31.2357,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function DeliveryAddressMapScreen() {
  const { language, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { addAddress } = useAddresses();
  const { setPendingFromMap } = usePendingDelivery();
  const params = useLocalSearchParams<{ fromCheckout?: string }>();

  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [address, setAddress] = useState<ReverseGeocodeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const mapRef = useRef<MapView>(null);
  const userDraggedRef = useRef(false);
  const initialLoadRef = useRef(true);

  const runReverseGeocode = useCallback(async (lat: number, lng: number) => {
    setError(null);
    setLoading(true);
    try {
      const result = await reverseGeocode(lat, lng);
      setAddress(result);
    } catch (e) {
      const err = e instanceof GeocodingError ? e : new Error(e instanceof Error ? e.message : 'Unknown error');
      const base = t(language, 'errorResolvingAddress');
      const detail = err.message && err.message !== base ? err.message : '';
      const hint =
        e instanceof GeocodingError && e.code === 'REQUEST_DENIED'
          ? ` ${t(language, 'geocodingApiHint')}`
          : '';
      setError(detail ? `${base}: ${detail}${hint}` : `${base}${hint}`);
      setAddress(null);
    } finally {
      setLoading(false);
    }
  }, [language]);

  const handleRegionChangeComplete = useCallback(
    (r: Region) => {
      setRegion(r);
      if (initialLoadRef.current) {
        initialLoadRef.current = false;
        runReverseGeocode(r.latitude, r.longitude);
        return;
      }
      if (userDraggedRef.current) {
        userDraggedRef.current = false;
        runReverseGeocode(r.latitude, r.longitude);
      }
    },
    [runReverseGeocode]
  );

  const handleRegionChange = useCallback(() => {
    userDraggedRef.current = true;
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!mounted) return;
        if (status === Location.PermissionStatus.GRANTED) {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (!mounted) return;
          const newRegion: Region = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setRegion(newRegion);
          mapRef.current?.animateToRegion(newRegion, 400);
        }
      } catch {
        // keep default region
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleConfirmLocation = async () => {
    if (!address) return;
    hapticPrimary();
    setConfirming(true);
    try {
      const fullAddress = buildFullAddress(address);
      const mapsLink = buildMapsLink(region.latitude, region.longitude);
      await addAddress({
        street: address.street || address.area || fullAddress,
        city: address.city,
        country: address.country,
        area: address.area || undefined,
        governorate: address.governorate || undefined,
        fullAddress,
        mapsLink,
        latitude: region.latitude,
        longitude: region.longitude,
        isDefault: false,
      });
      if (params.fromCheckout === '1') {
        setPendingFromMap(fullAddress, mapsLink);
      }
      router.back();
    } finally {
      setConfirming(false);
    }
  };

  const addressLine =
    address &&
    [address.street, address.area, address.city].filter(Boolean).join(', ');

  return (
    <>
      <Stack.Screen
        options={{
          title: t(language, 'chooseLocationOnMap'),
          headerShown: true,
          headerBackTitle: t(language, 'goBack'),
        }}
      />
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={DEFAULT_REGION}
          region={undefined}
          onRegionChangeComplete={handleRegionChangeComplete}
          onRegionChange={handleRegionChange}
          showsUserLocation={false}
          showsMyLocationButton={false}
          mapType="standard"
          accessibilityLabel={t(language, 'chooseLocationOnMap')}
        />
        {/* Fixed center pin */}
        <View
          style={[styles.pinWrapper, { top: height / 2 - 40 }]}
          pointerEvents="none"
          accessibilityElementsHidden
        >
          <View style={styles.pin}>
            <View style={styles.pinDot} />
          </View>
        </View>

        {/* Bottom panel */}
        <View
          style={[
            styles.panel,
            {
              paddingBottom: Math.max(insets.bottom, spacing.md),
              paddingLeft: spacing.lg + insets.left,
              paddingRight: spacing.lg + insets.right,
            },
          ]}
        >
          <Text style={[styles.panelLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t(language, 'detectedAddress')}
          </Text>
          {loading ? (
            <View style={[styles.loadingRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t(language, 'resolvingAddress')}
              </Text>
            </View>
          ) : error ? (
            <Text style={[styles.errorText, { textAlign: isRTL ? 'right' : 'left' }]}>{error}</Text>
          ) : addressLine ? (
            <Text
              style={[styles.addressText, { textAlign: isRTL ? 'right' : 'left' }]}
              numberOfLines={3}
              accessibilityRole="text"
              accessibilityLabel={`${t(language, 'detectedAddress')}: ${addressLine}`}
            >
              {addressLine}
            </Text>
          ) : (
            <Text
              style={[styles.mutedText, { textAlign: isRTL ? 'right' : 'left' }]}
              accessibilityRole="text"
              accessibilityLabel={t(language, 'resolvingAddress')}
            >
              {t(language, 'resolvingAddress')}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.confirmBtn, confirming && styles.confirmBtnDisabled]}
            onPress={handleConfirmLocation}
            disabled={!address || confirming}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t(language, 'confirmLocation')}
            accessibilityState={{ disabled: !address || confirming }}
          >
            {confirming ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.confirmBtnText}>
                {t(language, 'confirmLocation')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pinWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  panelLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textMuted,
  },
  addressText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 15,
    color: colors.error,
    marginBottom: spacing.md,
  },
  mutedText: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
