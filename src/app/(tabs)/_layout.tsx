import { Tabs } from 'expo-router/js-tabs';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="gym" options={{ title: 'Gym Hub' }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Nutrition' }} />
    </Tabs>
  );
}
