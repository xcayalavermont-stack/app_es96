import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LoginSuccess'>;
  route: RouteProp<RootStackParamList, 'LoginSuccess'>;
};

const CRIMSON = '#A51C30';

export default function LoginSuccessScreen({ navigation, route }: Props) {
  const { memberName, memberLabs } = route.params;
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // slight delay so the screen paint settles first
      Animated.delay(100),
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 7,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Login Successful</Text>
        <Text style={styles.bannerName}>{memberName}</Text>
      </View>

      {/* Wyss logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/wysslogo-black-short.png')}
          style={styles.wyssLogo}
          resizeMode="contain"
        />
      </View>

      {/* NFC tap circle — pops in */}
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <TouchableOpacity
          style={styles.circle}
          onPress={() => navigation.replace('Cart', { memberName, memberLabs })}
          activeOpacity={0.8}
        >
          <Text style={styles.circleText}>Tap Phone on Keypad to{'\n'}Unlock Stock Room</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Return to login */}
      <TouchableOpacity
        style={styles.returnButton}
        onPress={() => navigation.replace('Login')}
      >
        <Text style={styles.returnButtonText}>Return To Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingBottom: 40,
  },
  banner: {
    width: '100%',
    backgroundColor: CRIMSON,
    paddingVertical: 28,
    alignItems: 'center',
  },
  bannerText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 36,
    color: '#fff',
  },
  bannerName: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  logoContainer: {
    marginTop: 40,
    marginBottom: 40,
  },
  wyssLogo: {
    width: 280,
    height: 70,
  },
  circle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: CRIMSON,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  circleText: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 22,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 32,
  },
  returnButton: {
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    paddingVertical: 18,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  returnButtonText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 20,
    color: '#fff',
  },
});
