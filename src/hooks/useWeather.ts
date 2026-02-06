import { useState } from 'react';
import { LocationPoint } from '../types';

interface WeatherForecast {
    location: string;
    temp: string;
    condition: string;
    wind: string;
    humidity: string;
}

export const useWeather = () => {
    const [weatherData, setWeatherData] = useState<any>(null);
    const [isLoadingWeather, setIsLoadingWeather] = useState(false);
    const [weatherError, setWeatherError] = useState<string | null>(null);
    const [weatherIndex, setWeatherIndex] = useState(0);
    const [selectedWeatherLocation, setSelectedWeatherLocation] = useState<LocationPoint | null>(null);

    const fetchWeatherData = async (location: string, coordinates?: { lat: number; lng: number }) => {
        const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
        if (!apiKey || apiKey === "YOUR_WEATHERAPI_KEY_HERE") return null;

        const cacheKey = `weather_${location}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { timestamp, data } = JSON.parse(cached);
                if (Date.now() - timestamp < 3600000) { // 1 hour cache
                    setWeatherData(data);
                    return data;
                }
            } catch (e) { }
        }

        setIsLoadingWeather(true);
        setWeatherError(null);

        try {
            const query = coordinates ? `${coordinates.lat},${coordinates.lng}` : location;
            // Removed lang=ko to allow handling localization manually if needed, 
            // but the original code had lang=ko. Keeping it for consistency.
            const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(query)}&days=3&lang=ko`);
            if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
            const data = await response.json();
            localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
            setWeatherData(data);
            return data;
        } catch (error) {
            setWeatherError("날씨 정보를 불러올 수 없습니다.");
            return null;
        } finally {
            setIsLoadingWeather(false);
        }
    };

    const getKoreanLocationName = (apiName: string, originalName?: string) => {
        if (originalName) return originalName;
        const names: Record<string, string> = {
            'Naha': '나하', 'Okinawa': '오키나와', 'Kunigami': '쿠니가미',
            'Nago': '나고', 'Itoman': '이토만', 'Tomigusuku': '토미구스쿠'
        };
        return names[apiName] || apiName;
    };

    const getWeatherForDay = (dayIndex: number, defaultLocationName: string): WeatherForecast => {
        const originalLocationName = selectedWeatherLocation?.name || defaultLocationName;
        const location = originalLocationName || "오키나와 (나하)";

        if (weatherData?.forecast?.forecastday?.[dayIndex]) {
            const dayData = weatherData.forecast.forecastday[dayIndex];
            const current = dayIndex === 0 ? weatherData.current : dayData.day;
            const koreanLocationName = getKoreanLocationName(weatherData.location?.name || "", originalLocationName);

            return {
                location: koreanLocationName,
                temp: `${Math.round(current.temp_c || current.avgtemp_c)}°`,
                condition: current.condition?.text || "정보 없음",
                wind: `${Math.round((current.wind_kph || current.maxwind_kph) / 3.6)} m/s`,
                humidity: `${current.humidity || current.avghumidity}%`,
            };
        }
        return {
            location,
            temp: "22°",
            condition: "맑음",
            wind: "3 m/s",
            humidity: "60%"
        };
    };

    const getFormattedDate = (daysOffset: number = 0) => {
        const now = new Date();
        now.setDate(now.getDate() + daysOffset);
        const month = now.getMonth() + 1;
        const date = now.getDate();
        const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
        return `${month}월 ${date}일 ${days[now.getDay()]}`;
    };

    return {
        weatherData,
        isLoadingWeather,
        weatherError,
        fetchWeatherData,
        getWeatherForDay,
        getFormattedDate,
        weatherIndex,
        setWeatherIndex,
        selectedWeatherLocation,
        setSelectedWeatherLocation
    };
};
