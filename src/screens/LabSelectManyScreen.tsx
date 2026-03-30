import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LabSelectMany'>;
  route: RouteProp<RootStackParamList, 'LabSelectMany'>;
};

const GREY = '#3a3a3a';
const CRIMSON = '#a62035';

export default function LabSelectManyScreen({ navigation, route }: Props) {
  const { cartItems, memberName, memberLabs } = route.params;
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (lab: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(lab)) next.delete(lab);
      else next.add(lab);
      return next;
    });
  };

  const canProceed = selected.size >= 2;

  const handleNext = () => {
    const selectedLabs = Array.from(selected);
    navigation.navigate('LabItemAssign', {
      cartItems,
      selectedLabs,
      currentLabIndex: 0,
      labAssignments: {},
      memberName,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Select Which Labs You're{'\n'}Shopping For</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {memberLabs.map((lab) => {
          const isSelected = selected.has(lab);
          return (
            <TouchableOpacity
              key={lab}
              style={[styles.labBtn, isSelected && styles.labBtnSelected]}
              onPress={() => toggle(lab)}
            >
              <Text style={styles.labBtnText}>{lab}</Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canProceed}
        >
          <Text style={styles.nextBtnText}>NEXT</Text>
        </TouchableOpacity>
      </ScrollView>

      <Image
        source={require('../../assets/wysslogo-black-short.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    backgroundColor: CRIMSON,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 32,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 42,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'stretch',
    paddingHorizontal: 48,
    paddingVertical: 40,
    gap: 16,
  },
  labBtn: {
    backgroundColor: GREY,
    borderRadius: 40,
    paddingVertical: 22,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labBtnSelected: {
    backgroundColor: CRIMSON,
  },
  labBtnText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
  },
  nextBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 40,
    paddingVertical: 22,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 8,
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextBtnText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 20,
    color: '#fff',
  },
  logo: {
    width: 200,
    height: 50,
    marginBottom: 40,
  },
});
