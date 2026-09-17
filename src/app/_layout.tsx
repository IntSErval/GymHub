import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';

import { migrate } from '@/db/schema';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="gymhub.db" onInit={migrate}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="workout" options={{ title: 'Workout' }} />
      </Stack>
    </SQLiteProvider>
  );
}
