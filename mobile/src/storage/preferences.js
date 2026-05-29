import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'weather_settings';
const RECENT_CITIES_KEY = 'weather_recent_cities';
const settingsListeners = new Set();

function notifySettingsChanged(settings) {
  settingsListeners.forEach((listener) => {
    listener(settings);
  });
}

export async function saveSettings(settings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  notifySettingsChanged(settings);
}

export async function loadSettings() {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function loadRecentCities() {
  const raw = await AsyncStorage.getItem(RECENT_CITIES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveRecentCity(cityRecord) {
  const current = await loadRecentCities();
  const deduped = current.filter(
    (item) => item.name.toLowerCase() !== cityRecord.name.toLowerCase() || item.country !== cityRecord.country
  );

  const next = [cityRecord, ...deduped].slice(0, 8);
  await AsyncStorage.setItem(RECENT_CITIES_KEY, JSON.stringify(next));
  return next;
}

export function subscribeSettingsChanges(listener) {
  settingsListeners.add(listener);
  return () => {
    settingsListeners.delete(listener);
  };
}
