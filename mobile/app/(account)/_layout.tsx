import { Stack } from 'expo-router';

export default function AccountGroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="saved-products" />
    </Stack>
  );
}
