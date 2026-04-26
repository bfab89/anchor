import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import BreatheScreen from '../screens/BreatheScreen';
import SafetyPlanScreen from '../screens/SafetyPlanScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import JournalScreen from '../screens/JournalScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: ['home', 'home-outline'],
  Breathe: ['leaf', 'leaf-outline'],
  'Safety Plan': ['shield-checkmark', 'shield-checkmark-outline'],
  Resources: ['call', 'call-outline'],
  Journal: ['book', 'book-outline'],
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const [active, inactive] = TAB_ICONS[route.name] || ['help', 'help-outline'];
            return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
          },
          tabBarActiveTintColor: Colors.sage,
          tabBarInactiveTintColor: Colors.textTertiary,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            marginBottom: 2,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Breathe" component={BreatheScreen} />
        <Tab.Screen name="Safety Plan" component={SafetyPlanScreen} />
        <Tab.Screen name="Resources" component={ResourcesScreen} />
        <Tab.Screen name="Journal" component={JournalScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
