import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import LoginScreen from '../screens/LoginScreen';
import LoginSuccessScreen from '../screens/LoginSuccessScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import AdminScreen from '../screens/AdminScreen';
import LabAssignmentQuestionScreen from '../screens/LabAssignmentQuestionScreen';
import LabSelectOneScreen from '../screens/LabSelectOneScreen';
import LabSelectManyScreen from '../screens/LabSelectManyScreen';
import LabItemAssignScreen from '../screens/LabItemAssignScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: { backgroundColor: '#a62035' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LoginSuccess"
        component={LoginSuccessScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: 'Scan & Cart', headerBackVisible: false }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
      <Stack.Screen
        name="Admin"
        component={AdminScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LabAssignmentQuestion"
        component={LabAssignmentQuestionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LabSelectOne"
        component={LabSelectOneScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LabSelectMany"
        component={LabSelectManyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LabItemAssign"
        component={LabItemAssignScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
