import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { addFood, findFoodByBarcode } from '@/db/nutrition';
import { fromOpenFoodFacts } from '@/lib/nutrition';

const OFF_URL = 'https://world.openfoodfacts.org/api/v2/product/';

export default function Scan() {
  const db = useSQLiteContext();
  const [permission, requestPermission] = useCameraPermissions();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  // The camera fires onBarcodeScanned repeatedly while a code is in view; handle only the first.
  const handled = useRef(false);

  async function lookUp(raw: string) {
    const code = raw.trim();
    if (handled.current) return;
    if (!/^\d{6,14}$/.test(code)) {
      Alert.alert('Invalid barcode', 'Enter the 6–14 digits under the barcode.');
      return;
    }
    handled.current = true;
    setBusy(true);
    try {
      if (!(await findFoodByBarcode(db, code))) {
        let json: unknown = null;
        try {
          const res = await fetch(`${OFF_URL}${code}.json?fields=product_name,nutriments`);
          json = await res.json(); // not-found is a 404 with a JSON body (status 0)
        } catch (e) {
          console.warn(e);
          Alert.alert('Could not reach Open Food Facts', 'Enter the food details yourself; the barcode is kept.');
        }
        const food = fromOpenFoodFacts(json, code);
        if (food) await addFood(db, food, 'off');
      }
      // food-picker resolves the barcode: known food → grams entry, unknown → custom form prefilled.
      // t makes a repeat scan of the same code still count as a new param.
      router.dismissTo({ pathname: '/food-picker', params: { barcode: code, t: String(Date.now()) } });
    } catch (e) {
      console.warn(e);
      Alert.alert('Could not look up barcode', String(e));
      handled.current = false;
      setBusy(false);
    }
  }

  const native = Platform.OS !== 'web';

  return (
    <View style={styles.container}>
      {native && permission?.granted ? (
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
          onBarcodeScanned={busy ? undefined : ({ data }) => lookUp(data)}
        />
      ) : native && permission && permission.canAskAgain ? (
        <Pressable style={styles.button} onPress={requestPermission} accessibilityRole="button">
          <Text style={styles.buttonText}>Allow camera</Text>
        </Pressable>
      ) : native && permission ? (
        <Text style={styles.muted}>Camera access is off. Type the barcode instead.</Text>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Barcode digits"
        keyboardType="number-pad"
        value={typed}
        onChangeText={setTyped}
        accessibilityLabel="Barcode"
        editable={!busy}
      />
      <Pressable
        style={[styles.button, busy && styles.disabled]}
        onPress={() => lookUp(typed)}
        disabled={busy}
        accessibilityRole="button">
        <Text style={styles.buttonText}>{busy ? 'Looking up…' : 'Look up'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  camera: { height: 300, borderRadius: 10, overflow: 'hidden' },
  muted: { color: '#666' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  disabled: { opacity: 0.5 },
  button: { backgroundColor: '#216e39', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
