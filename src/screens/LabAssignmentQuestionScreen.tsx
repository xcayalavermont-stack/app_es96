import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LabAssignmentQuestion'>;
  route: RouteProp<RootStackParamList, 'LabAssignmentQuestion'>;
};

const CRIMSON = '#a62035';

export default function LabAssignmentQuestionScreen({ navigation, route }: Props) {
  const { cartItems, memberName, memberLabs } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Are You Shopping For More{'\n'}Than One Lab?</Text>
      </View>

      <View style={styles.body}>
        <TouchableOpacity
          style={styles.choiceBtn}
          onPress={() => navigation.navigate('LabSelectMany', { cartItems, memberName, memberLabs })}
        >
          <Text style={styles.choiceBtnText}>Yes</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.choiceBtn}
          onPress={() => navigation.navigate('LabSelectOne', { cartItems, memberName, memberLabs })}
        >
          <Text style={styles.choiceBtnText}>No</Text>
        </TouchableOpacity>
      </View>

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
  body: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    gap: 0,
  },
  choiceBtn: {
    width: '100%',
    backgroundColor: CRIMSON,
    borderRadius: 12,
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceBtnText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 32,
    color: '#fff',
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 24,
  },
  logo: {
    width: 200,
    height: 50,
    marginBottom: 40,
  },
});
