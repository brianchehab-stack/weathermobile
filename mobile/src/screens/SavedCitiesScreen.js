import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { loadRecentCities, loadSettings } from '../storage/preferences';

export default function SavedCitiesScreen() {
  const navigation = useNavigation();
  const [cities, setCities] = useState([]);
  const [language, setLanguage] = useState('en');

  const labels = useMemo(() => {
    if (language === 'fr') {
      return {
        title: 'Villes enregistrees',
        subtitle: 'Touchez une ville pour charger ses previsions dans l\'onglet Meteo.',
        empty: 'Aucune ville enregistree pour le moment. Effectuez une recherche depuis l ecran Meteo.'
      };
    }

    return {
      title: 'Saved Cities',
      subtitle: 'Tap a city to load its forecast in the Weather tab.',
      empty: 'No saved cities yet. Search from the Weather screen.'
    };
  }, [language]);

  const refreshCities = useCallback(async () => {
    const [recent, settings] = await Promise.all([loadRecentCities(), loadSettings()]);
    const nextLanguage = settings?.language === 'fr' ? 'fr' : 'en';
    setCities(recent);
    setLanguage(nextLanguage);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshCities();
    }, [refreshCities])
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{labels.title}</Text>
      {cities.length === 0 && <Text style={styles.empty}>{labels.empty}</Text>}

      {cities.map((city) => {
        const key = `${city.name}-${city.country}-${city.lat}-${city.lon}`;
        return (
          <Pressable
            key={key}
            style={styles.card}
            onPress={() => {
              navigation.navigate('Weather', { selectedCity: city });
            }}
          >
            <Text style={styles.cityName}>{city.name}</Text>
            <Text style={styles.cityMeta}>{city.state ? `${city.state}, ` : ''}{city.country}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#020617'
  },
  title: {
    color: '#E2E8F0',
    fontSize: 22,
    fontWeight: '700'
  },
  empty: {
    color: '#94A3B8',
    marginTop: 24
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#0F172A',
    padding: 14,
    marginBottom: 10
  },
  cityName: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600'
  },
  cityMeta: {
    color: '#94A3B8',
    marginTop: 4
  }
});
