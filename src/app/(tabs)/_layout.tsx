import { Tabs } from 'expo-router/js-tabs';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Gym Hub' }} />
    </Tabs>
  );
}
