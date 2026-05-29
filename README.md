Brian’s Weather Forecast ☀️ 🌧️ :

Overview:
A dynamic weather forecasting mobile application built with React Native (Expo), designed for Android/iOS; and powered by the OpenWeatherMap API. 

Features:
Search weather by city OR use the current location
Current weather conditions of the selected city
5-day forecast for the selected city
3-hour forecast for same day for the selected city
Temperature unit toggle (°C / °F) and language selection toggle(EN / FR)
Error handling for invalid input
Responsive UI design with a background animation related to forecasted weather(if sunny / rainy / snowy..)

Highlights:
The mobile app is located in the `mobile` folder and includes the followings:
    Navigation/routing:Implemented using React Navigation (bottom tab navigation)
	Tabs: `Weather` and `Saved Cities`
	Hooks usage:Uses React hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) and a custom hook (`useWeather`)
	Storage technique:Uses AsyncStorage to persist:User settings (temperature unit/language)//Recent searched cities
	Location-specific feature:Integrates device geolocation with `expo-location`//
	Users can fetch weather for their current location

Installation:

```bash

git clone https://github.com/brianchehab-stack/weathermobile.git 
cd mobile 
npm install 

```
Create `mobile/.env`:

```env
EXPO_PUBLIC_WEATHER_API_KEY=your_api_key 
```
Run:

```bash 
npx expo start --tunnel
``` 
Then open in:
- Expo Go on Android/iOS, or Android/iOS emulator
