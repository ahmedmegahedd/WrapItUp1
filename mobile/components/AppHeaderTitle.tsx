import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

const logoSource = require('@/assets/wrapitup.avif');

/** Centered brand logo for the app header. */
export function AppHeaderTitle() {
  return (
    <View style={styles.wrap}>
      <Image
        source={logoSource}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel="Wrap It Up"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    height: 40,
    width: 170,
  },
});
