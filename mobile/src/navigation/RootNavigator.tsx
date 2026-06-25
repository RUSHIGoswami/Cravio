import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeContext';
import { Icons } from '../components/icons/Icon';
import {
  OnboardingScreen,
  DiscoverScreen,
  CampaignsScreen,
  PortfolioScreen,
  MessagesScreen,
  BuilderScreen,
} from '../screens';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  Builder: undefined;
};

export type MainTabParamList = {
  Discover: undefined;
  Campaigns: undefined;
  Portfolio: undefined;
  Messages: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.brand,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: { backgroundColor: theme.colors.bgSurface, borderTopColor: theme.colors.borderSubtle, borderTopWidth: 1.5 },
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ tabBarIcon: ({ color, size }) => <Icons.Compass size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Campaigns"
        component={CampaignsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Icons.Brief size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{ tabBarIcon: ({ color, size }) => <Icons.User size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ tabBarIcon: ({ color, size }) => <Icons.Chat size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

/** App-wide navigation: onboarding gate -> bottom-tab shell, with the campaign builder as a modal stack screen. */
export function RootNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Onboarding">
          {({ navigation }) => <OnboardingScreen onDone={() => navigation.replace('Main')} />}
        </RootStack.Screen>
        <RootStack.Screen name="Main" component={MainTabs} />
        <RootStack.Group screenOptions={{ presentation: 'modal' }}>
          <RootStack.Screen name="Builder">
            {({ navigation }) => <BuilderScreen onClose={() => navigation.goBack()} />}
          </RootStack.Screen>
        </RootStack.Group>
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
