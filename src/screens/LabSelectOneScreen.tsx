import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, LabAssignments } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LabSelectOne'>;
  route: RouteProp<RootStackParamList, 'LabSelectOne'>;
};

const CRIMSON = '#a62035';

export default function LabSelectOneScreen({ navigation, route }: Props) {
  const { cartItems, memberName, memberLabs } = route.params;

  const handleSelectLab = (lab: string) => {
    const labAssignments: LabAssignments = { [lab]: cartItems };
    navigation.navigate('Checkout', { items: cartItems, memberName, labAssignments });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Select Which Lab You're{'\n'}Shopping For</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {memberLabs.map((lab) => (
          <TouchableOpacity
            key={lab}
            style={styles.labBtn}
            onPress={() => handleSelectLab(lab)}
          >
            <Text style={styles.labBtnText}>{lab}</Text>
          </TouchableOpacity>
        ))}
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
    backgroundColor: CRIMSON,
    borderRadius: 40,
    paddingVertical: 22,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  labBtnText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
  },
  logo: {
    width: 200,
    height: 50,
    marginBottom: 40,
  },
});
