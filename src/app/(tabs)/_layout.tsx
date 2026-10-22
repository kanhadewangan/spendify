import { Tabs } from 'expo-router';

import { TabBar } from '@/components/ui';
import { useTheme } from '@/lib/ThemeProvider';

// Tab switch: incoming fades in and rises 8 px over 200 ms. No horizontal slide (HIG).
export default function TabsLayout() {
  const { c } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: c.bg },
        animation: 'fade',
        transitionSpec: { animation: 'timing', config: { duration: 200 } },
        sceneStyleInterpolator: ({ current }) => ({
          sceneStyle: {
            opacity: current.progress.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [0, 1, 0],
            }),
            transform: [
              {
                translateY: current.progress.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [8, 0, 8],
                }),
              },
            ],
          },
        }),
      }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="expenses" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
