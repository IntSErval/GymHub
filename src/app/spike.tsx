/* eslint-disable @typescript-eslint/no-require-imports -- throwaway diagnostic */
import { ScrollView, StyleSheet, Text } from 'react-native';

// ponytail: throwaway Expo Go diagnostic; loads each lib in isolation and prints the real error. Delete after step 1.
const steps: [string, () => unknown][] = [
  ['three', () => require('three')],
  ['expo-gl', () => require('expo-gl')],
  ['expo-asset', () => require('expo-asset')],
  ['expo-file-system', () => require('expo-file-system')],
  ['expo-file-system/legacy', () => require('expo-file-system/legacy')],
  ['@react-three/fiber/native', () => require('@react-three/fiber/native')],
];

const results = steps.map(([name, load]) => {
  try {
    load();
    return `OK    ${name}`;
  } catch (e) {
    const err = e as Error;
    return `FAIL  ${name}\n      ${err.message}\n      ${(err.stack ?? '').split('\n').slice(0, 4).join('\n      ')}`;
  }
});

export default function Spike() {
  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.pad}>
      <Text style={styles.text}>{results.join('\n\n')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#0d0f0a' },
  pad: { padding: 16, paddingTop: 64 },
  text: { color: '#f2f5e8', fontFamily: 'Courier', fontSize: 12 },
});
