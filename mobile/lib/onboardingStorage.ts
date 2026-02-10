import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@wrapitup_hasSeenOnboarding';

export async function getHasSeenOnboarding(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === 'true';
  } catch {
    return false;
  }
}

export async function setHasSeenOnboarding(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, 'true');
  } catch (_) {}
}
