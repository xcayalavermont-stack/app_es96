import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Oswald_400Regular, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Oswald_400Regular,
    Oswald_600SemiBold,
    Oswald_700Bold,
  });

  const onLayoutRootView = React.useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {fontsLoaded && (
        <NavigationContainer onReady={onLayoutRootView}>
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      )}
    </GestureHandlerRootView>
  );
}
