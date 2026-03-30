import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useNfcScan } from '../hooks/useNfcScan';
import { loadMembers } from '../data/memberStore';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
  const [huid, setHuid] = useState('');
  const [loading, setLoading] = useState(false);
  const { scan, supported } = useNfcScan();

  useEffect(() => {
    if (!supported) return;
    let active = true;

    async function listenForCard() {
      while (active) {
        const uid = await scan();
        if (!active || !uid) continue;

        const members = await loadMembers();
        const member = members.find(
          (m) => m.cardUid.toUpperCase() === uid.toUpperCase()
        );

        if (member) {
          if (active) navigation.replace('LoginSuccess', { memberName: member.name, memberLabs: member.labs });
        } else {
          Alert.alert('Not Recognised', 'This card is not enrolled. Please log in manually.');
        }
      }
    }

    listenForCard();
    return () => { active = false; };
  }, [supported]);

  const handleLogin = async (id: string = huid) => {
    if (!id.trim()) {
      Alert.alert('Error', 'Please enter your HUID.');
      return;
    }
    setLoading(true);
    try {
      if (id.trim() === '1111') {
        navigation.replace('Admin');
      } else {
        const members = await loadMembers();
        const member = members.find((m) => m.huid === id.trim());
        if (!member) {
          Alert.alert('Not Found', 'No member found with that HUID.');
          return;
        }
        navigation.replace('LoginSuccess', { memberName: member.name, memberLabs: member.labs });
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message ?? 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Wyss Institute Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/wysslogo-black-short.png')}
          style={styles.wyssLogo}
          resizeMode="contain"
        />
      </View>

      {/* Harvard Shield */}
      <View style={styles.shieldContainer}>
        <Image
          source={require('../../assets/Screenshot 2026-03-25 192202.png')}
          style={styles.shieldImage}
          resizeMode="contain"
        />
      </View>

      {/* NFC Prompt */}
      <View style={styles.promptContainer}>
        <Text style={styles.promptTitle}>Tap HUID To Begin</Text>
        <Text style={styles.promptSubtitle}>Tap HUID on NFC Tap Point To Login</Text>
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Manual Login */}
      <View style={styles.manualLogin}>
        <Text style={styles.manualLabel}>Manual Login:</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="HUID"
            placeholderTextColor="#999"
            value={huid}
            onChangeText={setHuid}
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={() => handleLogin()}
          />
          <TouchableOpacity
            style={[styles.goButton, loading && styles.goButtonDisabled]}
            onPress={() => handleLogin()}
            disabled={loading}
          >
            <Text style={styles.goButtonText}>Go</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const CRIMSON = '#A51C30';
const SHIELD_SIZE = 180;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CRIMSON,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 8,
  },
  wyssLogo: {
    width: 260,
    height: 60,
  },
  shieldContainer: {
    marginTop: 60,
    marginBottom: 24,
    alignItems: 'center',
  },
  shieldImage: {
    width: SHIELD_SIZE,
    height: SHIELD_SIZE,
  },
  shield: {
    width: SHIELD_SIZE,
    height: SHIELD_SIZE * 1.15,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderBottomLeftRadius: SHIELD_SIZE * 0.5,
    borderBottomRightRadius: SHIELD_SIZE * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shieldInner: {
    width: SHIELD_SIZE * 0.82,
    height: SHIELD_SIZE * 0.95,
    backgroundColor: CRIMSON,
    borderRadius: 8,
    borderBottomLeftRadius: SHIELD_SIZE * 0.42,
    borderBottomRightRadius: SHIELD_SIZE * 0.42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  shieldH: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 90,
    color: '#fff',
    lineHeight: 100,
    marginTop: -10,
  },
  promptContainer: {
    alignItems: 'center',
  },
  promptTitle: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 28,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  promptSubtitle: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  manualLogin: {
    width: '100%',
    alignItems: 'center',
  },
  manualLabel: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Oswald_400Regular',
    color: '#333',
    marginRight: 8,
  },
  goButton: {
    backgroundColor: '#4a5e1a',
    borderRadius: 6,
    paddingHorizontal: 22,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goButtonDisabled: {
    opacity: 0.6,
  },
  goButtonText: {
    fontFamily: 'Oswald_600SemiBold',
    color: '#fff',
    fontSize: 16,
  },
});
