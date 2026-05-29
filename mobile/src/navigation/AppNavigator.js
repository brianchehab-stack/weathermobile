import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import WeatherScreen from '../screens/WeatherScreen';
import SavedCitiesScreen from '../screens/SavedCitiesScreen';
import { loadSettings, subscribeSettingsChanges } from '../storage/preferences';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const [language, setLanguage] = useState('en');
  const savedCitiesLabel = language === 'fr' ? 'Recherches recentes' : 'Recent Searches';

  useEffect(() => {
    let mounted = true;

    (async () => {
      const settings = await loadSettings();
      if (mounted) {
        setLanguage(settings?.language === 'fr' ? 'fr' : 'en');
      }
    })();

    const unsubscribe = subscribeSettingsChanges((settings) => {
      if (mounted) {
        setLanguage(settings?.language === 'fr' ? 'fr' : 'en');
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <Tab.Navigator
      key={`tabs-${language}`}
      screenOptions={{
        headerStyle: { backgroundColor: '#0B1120' },
        headerTintColor: '#E2E8F0',
        headerTitleStyle: { fontSize: 17, fontWeight: '600' },
        tabBarStyle: { backgroundColor: '#0B1120', borderTopColor: '#1E293B' },
        tabBarActiveTintColor: '#7DD3FC',
        tabBarInactiveTintColor: '#94A3B8'
      }}
    >
      <Tab.Screen name="Weather" component={WeatherScreen} options={{ title: "Main Page" }} />
      <Tab.Screen
        key={`saved-cities-${language}`}
        name="Saved Cities"
        component={SavedCitiesScreen}
        options={() => ({ title: savedCitiesLabel, tabBarLabel: savedCitiesLabel })}
      />
    </Tab.Navigator>
  );
}
