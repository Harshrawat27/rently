import '../lib/polyfills'; // Import polyfills first
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import './global.css';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '../lib/auth';
import { AuthWrapper } from '../components/AuthWrapper';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthWrapper>
          <Stack>
            <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
            <Stack.Screen name='auth' options={{ headerShown: false }} />
            <Stack.Screen name='property-details' options={{ headerShown: false }} />
            <Stack.Screen name='room-details' options={{ headerShown: false }} />
            <Stack.Screen name='tenant-details' options={{ headerShown: false }} />
            <Stack.Screen name='property-expenses' options={{ headerShown: false }} />
            <Stack.Screen name='+not-found' />
          </Stack>
        </AuthWrapper>
        <StatusBar style='auto' />
      </ThemeProvider>
    </AuthProvider>
  );
}
