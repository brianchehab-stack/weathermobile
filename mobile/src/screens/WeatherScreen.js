import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import useWeather from '../hooks/useWeather';
import { loadRecentCities } from '../storage/preferences';
import { buildLocationLabel, formatTemp, getUnitSymbol, getWindUnit, toHourLabel, toWeekdayLabel } from '../utils/formatters';

function getWeatherVisualTheme(weatherMain) {
  const value = String(weatherMain || '').toLowerCase();

  if (value.includes('rain') || value.includes('drizzle') || value.includes('thunderstorm')) {
    return {
      surface: '#0B1B34',
      border: '#21486F',
      accent: '#7DD3FC',
      glow: 'rgba(56, 189, 248, 0.18)',
      particles: [
        { top: '10%', left: '8%', width: 14, height: 110, rotate: '-20deg', color: 'rgba(125, 211, 252, 0.28)' },
        { top: '18%', right: '16%', width: 12, height: 130, rotate: '-18deg', color: 'rgba(56, 189, 248, 0.24)' },
        { bottom: '12%', left: '28%', width: 10, height: 96, rotate: '-16deg', color: 'rgba(125, 211, 252, 0.22)' }
      ]
    };
  }

  if (value.includes('snow')) {
    return {
      surface: '#142033',
      border: '#415A77',
      accent: '#E0F2FE',
      glow: 'rgba(224, 242, 254, 0.16)',
      particles: [
        { top: '12%', left: '10%', size: 46, color: 'rgba(224, 242, 254, 0.20)' },
        { top: '20%', right: '12%', size: 24, color: 'rgba(255, 255, 255, 0.22)' },
        { bottom: '16%', left: '35%', size: 30, color: 'rgba(224, 242, 254, 0.18)' }
      ]
    };
  }

  if (value.includes('cloud')) {
    return {
      surface: '#101A2D',
      border: '#334155',
      accent: '#CBD5E1',
      glow: 'rgba(148, 163, 184, 0.14)',
      particles: [
        { top: '10%', left: '5%', width: 118, height: 42, color: 'rgba(148, 163, 184, 0.16)' },
        { top: '26%', right: '8%', width: 82, height: 30, color: 'rgba(203, 213, 225, 0.16)' },
        { bottom: '12%', left: '30%', width: 106, height: 36, color: 'rgba(148, 163, 184, 0.12)' }
      ]
    };
  }

  return {
    surface: '#1A2035',
    border: '#8B6F1A',
    accent: '#FDE68A',
    glow: 'rgba(250, 204, 21, 0.16)',
    particles: [
      { top: '8%', left: '8%', size: 72, color: 'rgba(250, 204, 21, 0.22)' },
      { top: '18%', right: '10%', size: 22, color: 'rgba(253, 224, 71, 0.24)' },
      { bottom: '10%', left: '34%', size: 34, color: 'rgba(250, 204, 21, 0.18)' }
    ]
  };
}

function getWeatherIdentity(weatherMain, isFrench) {
  const value = String(weatherMain || '').toLowerCase();

  if (value.includes('rain') || value.includes('drizzle') || value.includes('thunderstorm')) {
    return {
      icon: '🌧️',
      label: isFrench ? 'Pluvieux' : 'Rainy'
    };
  }

  if (value.includes('snow')) {
    return {
      icon: '❄️',
      label: isFrench ? 'Neigeux' : 'Snowy'
    };
  }

  if (value.includes('cloud')) {
    return {
      icon: '☁️',
      label: isFrench ? 'Nuageux' : 'Cloudy'
    };
  }

  return {
    icon: '☀️',
    label: isFrench ? 'Ensoleille' : 'Sunny'
  };
}

export default function WeatherScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const {
    query,
    setQuery,
    weather,
    forecast,
    dailyForecast,
    settings,
    loading,
    error,
    searchCity,
    loadByCoords,
    updateSettings
  } = useWeather();

  const [locationBusy, setLocationBusy] = useState(false);
  const [isHourlyDrawerOpen, setIsHourlyDrawerOpen] = useState(false);
  const [isDailyDrawerOpen, setIsDailyDrawerOpen] = useState(false);
  const [recentCities, setRecentCities] = useState([]);
  const isFrench = settings.language === 'fr';
  const isCompact = width < 430;
  const driftAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const labels = useMemo(() => {
    if (isFrench) {
      return {
        title: "Profitez de notre application ☀️ 🌧️",
        subtitle: '',
        placeholder: 'Ville, Pays (exemple: Montreal,CA)',
        search: 'Rechercher',
        useMyLocation: 'Utiliser ma position',
        locating: 'Localisation...',
        humidity: 'Humidite',
        wind: 'Vent',
        shortForecast: 'Previsions 3 heures ',
        longForecast: 'Previsions 5 jours',
        openDrawer: 'Afficher',
        closeDrawer: 'Masquer',
        currentWeather: 'Meteo actuelle',
        languageLabel: 'Langue',
        locationErrorTitle: 'Erreur de localisation'
      };
    }

    return {
      title: "Enjoy our App ☀️ 🌧️",
      subtitle: '',
      placeholder: 'City, Country (example: Montreal,CA)',
      search: 'Search',
      useMyLocation: 'Use My Location',
      locating: 'Locating...',
      humidity: 'Humidity',
      wind: 'Wind',
      shortForecast: '3-Hour Forecast for today',
      longForecast: '5-Day Forecast',
      openDrawer: 'Show',
      closeDrawer: 'Hide',
      currentWeather: 'Current Weather',
      languageLabel: 'Language',
      locationErrorTitle: 'Location Error'
    };
  }, [isFrench]);

  useEffect(() => {
    navigation.setOptions({
      title: isFrench ? 'Page Principale' : 'Main Page'
    });
  }, [navigation, isFrench]);

  useEffect(() => {
    const selectedCity = route.params?.selectedCity;
    if (!selectedCity) {
      return;
    }

    setQuery(selectedCity.state
      ? `${selectedCity.name}, ${selectedCity.state}, ${selectedCity.country}`
      : `${selectedCity.name}, ${selectedCity.country}`);

    loadByCoords(selectedCity.lat, selectedCity.lon);
  }, [route.params, setQuery, loadByCoords]);

  useEffect(() => {
    searchCity('Montreal,CA');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const recent = await loadRecentCities();
      if (mounted) {
        setRecentCities(recent);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const locale = settings.language === 'fr' ? 'fr-CA' : 'en-CA';
  const timezone = weather?.timezone || 0;
  const weatherTheme = useMemo(() => getWeatherVisualTheme(weather?.weather?.[0]?.main), [weather]);
  const weatherIdentity = useMemo(
    () => getWeatherIdentity(weather?.weather?.[0]?.main, isFrench),
    [weather, isFrench]
  );

  useEffect(() => {
    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(driftAnim, {
          toValue: 1,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(driftAnim, {
          toValue: 0,
          duration: 5000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    );

    driftLoop.start();
    pulseLoop.start();

    return () => {
      driftLoop.stop();
      pulseLoop.stop();
    };
  }, [driftAnim, pulseAnim]);

  const nextThreeHours = useMemo(() => {
    if (!forecast?.list) {
      return [];
    }
    return forecast.list.slice(0, 6);
  }, [forecast]);

  const citySuggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 2) {
      return [];
    }

    return recentCities
      .map((city) => ({
        ...city,
        label: city.state
          ? `${city.name}, ${city.state}, ${city.country}`
          : `${city.name}, ${city.country}`
      }))
      .filter((city) => city.label.toLowerCase().includes(normalized))
      .filter((city) => city.label.toLowerCase() !== normalized)
      .slice(0, 5);
  }, [query, recentCities]);

  const hasResults = Boolean(weather || nextThreeHours.length > 0 || dailyForecast.length > 0);

  async function handleUseMyLocation() {
    setLocationBusy(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied.');
      }

      const current = await Location.getCurrentPositionAsync({});
      await loadByCoords(current.coords.latitude, current.coords.longitude);
    } catch (err) {
      Alert.alert(labels.locationErrorTitle, err?.message || 'Unable to use your current location.');
    } finally {
      setLocationBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.headerRow, isCompact && styles.headerRowCompact]}>
        <Text style={styles.title}>{labels.title}</Text>
        <View style={[styles.headerLanguageToggle, isCompact && styles.headerLanguageToggleCompact]}>
          <Pressable
            style={[styles.headerToggleButton, settings.language === 'en' && styles.toggleActive]}
            onPress={() => updateSettings({ language: 'en' })}
          >
            <Text style={styles.buttonText}>EN</Text>
          </Pressable>
          <Pressable
            style={[styles.headerToggleButton, settings.language === 'fr' && styles.toggleActive]}
            onPress={() => updateSettings({ language: 'fr' })}
          >
            <Text style={styles.buttonText}>FR</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.subtitle}>{labels.subtitle}</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={[styles.input, isCompact && styles.inputCompact]}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => searchCity(query)}
          placeholder={labels.placeholder}
          placeholderTextColor="#64748B"
          returnKeyType="search"
          autoCorrect
          spellCheck
          autoCapitalize="words"
          autoComplete="postal-address-region"
          blurOnSubmit
        />

        {citySuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {citySuggestions.map((city) => (
              <Pressable
                key={`${city.name}-${city.country}-${city.lat}-${city.lon}`}
                style={styles.suggestionItem}
                onPress={() => {
                  setQuery(city.label);
                  searchCity(city.label);
                }}
              >
                <Text style={styles.suggestionText}>{city.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.buttonRow, isCompact && styles.buttonRowCompact]}>
        <Pressable style={styles.primaryButton} onPress={() => searchCity(query)}>
          <Text style={styles.buttonText}>{labels.search}</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleUseMyLocation}>
          <Text style={styles.buttonText}>{locationBusy ? labels.locating : labels.useMyLocation}</Text>
        </Pressable>
      </View>

      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleButton, settings.units === 'metric' && styles.toggleActive]}
          onPress={() => updateSettings({ units: 'metric' })}
        >
          <Text style={styles.buttonText}>°C</Text>
        </Pressable>
        <Pressable
          style={[styles.toggleButton, settings.units === 'imperial' && styles.toggleActive]}
          onPress={() => updateSettings({ units: 'imperial' })}
        >
          <Text style={styles.buttonText}>°F</Text>
        </Pressable>
      </View>

      {(loading || locationBusy) && <ActivityIndicator size="large" color="#7DD3FC" style={styles.loader} />}
      {!!error && <Text style={styles.error}>{error}</Text>}

      {hasResults && (
        <View
          style={[
            styles.resultsShell,
            { backgroundColor: weatherTheme.surface, borderColor: weatherTheme.border },
            isCompact && styles.resultsShellCompact
          ]}
        >
          <View style={styles.weatherStateBar}>
            <Animated.View
              style={[
                styles.weatherStateIconWrap,
                {
                  transform: [
                    {
                      translateY: driftAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -6]
                      })
                    }
                  ]
                }
              ]}
            >
              <Text style={styles.weatherStateIcon}>{weatherIdentity.icon}</Text>
            </Animated.View>
            <View>
              <Text style={[styles.weatherStateLabel, { color: weatherTheme.accent }]}>{labels.currentWeather}</Text>
              <Text style={styles.weatherStateValue}>{weatherIdentity.label}</Text>
            </View>
          </View>

          <View pointerEvents="none" style={styles.resultsBackdrop}>
            <Animated.View
              style={[
                styles.resultsGlow,
                { backgroundColor: weatherTheme.glow },
                {
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.14]
                      })
                    }
                  ],
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.55, 0.88]
                  })
                }
              ]}
            />
            {weatherTheme.particles.map((particle, index) => {
              const isLine = particle.height && particle.width;

              return (
                <Animated.View
                  key={`${particle.color}-${index}`}
                  style={[
                    styles.weatherParticle,
                    isLine ? styles.weatherLine : styles.weatherOrb,
                    {
                      backgroundColor: particle.color,
                      top: particle.top,
                      right: particle.right,
                      bottom: particle.bottom,
                      left: particle.left,
                      width: particle.width || particle.size,
                      height: particle.height || particle.size,
                      borderRadius: isLine ? 999 : (particle.size || 24) / 2,
                      transform: [
                        {
                          translateY: driftAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, index % 2 === 0 ? 14 : -14]
                          })
                        },
                        {
                          translateX: driftAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, index % 2 === 0 ? 8 : -8]
                          })
                        },
                        { rotate: particle.rotate || '0deg' }
                      ]
                    }
                  ]}
                />
              );
            })}
          </View>

          {weather && (
            <View style={styles.resultCard}>
              <Text style={styles.location}>{buildLocationLabel(weather)}</Text>
              <Text style={[styles.temp, { color: weatherTheme.accent }]}>{formatTemp(weather.main.temp)}{getUnitSymbol(settings.units)}</Text>
              <Text style={styles.meta}>{weather.weather[0].description}</Text>
              <Text style={styles.meta}>{labels.humidity}: {weather.main.humidity}%</Text>
              <Text style={styles.meta}>{labels.wind}: {weather.wind.speed} {getWindUnit(settings.units)}</Text>
            </View>
          )}

          {nextThreeHours.length > 0 && (
            <View style={styles.resultSection}>
              <Pressable
                style={styles.drawerHeader}
                onPress={() => setIsHourlyDrawerOpen((current) => !current)}
              >
                <Text style={styles.sectionTitle}>{labels.shortForecast}</Text>
                <Text style={[styles.drawerToggleText, { color: weatherTheme.accent }]}>
                  {isHourlyDrawerOpen ? `${labels.closeDrawer} ▲` : `${labels.openDrawer} ▼`}
                </Text>
              </Pressable>
              {isHourlyDrawerOpen && nextThreeHours.map((entry) => (
                <View key={entry.dt} style={styles.rowItem}>
                  <Text style={styles.rowText}>{toHourLabel(entry.dt, timezone, locale)}</Text>
                  <Text style={styles.rowText}>{formatTemp(entry.main.temp)}{getUnitSymbol(settings.units)}</Text>
                </View>
              ))}
            </View>
          )}

          {dailyForecast.length > 0 && (
            <View style={styles.resultSection}>
              <Pressable
                style={styles.drawerHeader}
                onPress={() => setIsDailyDrawerOpen((current) => !current)}
              >
                <Text style={styles.sectionTitle}>{labels.longForecast}</Text>
                <Text style={[styles.drawerToggleText, { color: weatherTheme.accent }]}>
                  {isDailyDrawerOpen ? `${labels.closeDrawer} ▲` : `${labels.openDrawer} ▼`}
                </Text>
              </Pressable>
              {isDailyDrawerOpen && dailyForecast.map((day) => (
                <View key={day.dateKey} style={styles.rowItem}>
                  <Text style={styles.rowText}>{toWeekdayLabel(day.dt, timezone, locale)}</Text>
                  <Text style={styles.rowText}>
                    {formatTemp(day.maxTemp)} / {formatTemp(day.minTemp)}{getUnitSymbol(settings.units)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#020617',
    padding: 16,
    paddingBottom: 32
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  headerRowCompact: {
    alignItems: 'flex-start',
    flexDirection: 'column'
  },
  title: {
    flex: 1,
    fontSize:20,
    fontWeight: '700',
    color: '#E2E8F0'
  },
  headerLanguageToggle: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12
  },
  headerLanguageToggleCompact: {
    marginLeft: 0,
    alignSelf: 'flex-end'
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 10,
    color: '#94A3B8',
    fontSize: 13
  },
  searchRow: {
    marginBottom: 10
  },
  input: {
    backgroundColor: '#1E3A5F',
    color: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#38BDF8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  inputCompact: {
    fontSize: 15
  },
  suggestionsContainer: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#0F172A',
    overflow: 'hidden'
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  suggestionText: {
    color: '#CBD5E1'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10
  },
  buttonRowCompact: {
    flexDirection: 'column'
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  buttonText: {
    color: '#E2E8F0',
    fontWeight: '600'
  },
  toggleRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10
  },
  toggleButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center'
  },
  headerToggleButton: {
    minWidth: 54,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  toggleActive: {
    backgroundColor: '#0EA5E9'
  },
  loader: {
    marginTop: 14
  },
  error: {
    marginTop: 10,
    color: '#FCA5A5'
  },
  resultsShell: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative'
  },
  resultsShellCompact: {
    borderRadius: 20
  },
  resultsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden'
  },
  resultsGlow: {
    position: 'absolute',
    top: -40,
    right: -10,
    width: 180,
    height: 180,
    borderRadius: 999
  },
  weatherParticle: {
    position: 'absolute'
  },
  weatherOrb: {
    opacity: 1
  },
  weatherLine: {
    opacity: 1
  },
  weatherStateBar: {
    margin: 14,
    marginBottom: 0,
    backgroundColor: 'rgba(2, 6, 23, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  weatherStateIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.28)'
  },
  weatherStateIcon: {
    fontSize: 24
  },
  weatherStateLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4
  },
  weatherStateValue: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2
  },
  resultCard: {
    margin: 14,
    marginBottom: 0,
    backgroundColor: 'rgba(2, 6, 23, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    borderRadius: 18,
    padding: 14
  },
  resultSection: {
    margin: 14,
    marginTop: 12,
    backgroundColor: 'rgba(2, 6, 23, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    borderRadius: 18,
    padding: 12
  },
  location: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '700'
  },
  temp: {
    marginTop: 8,
    color: '#7DD3FC',
    fontSize: 38,
    fontWeight: '700'
  },
  meta: {
    marginTop: 4,
    color: '#CBD5E1'
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  drawerToggleText: {
    color: '#7DD3FC',
    fontSize: 13,
    fontWeight: '600'
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  rowText: {
    color: '#CBD5E1'
  }
});
