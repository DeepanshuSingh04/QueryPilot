const withTimeout = (promise, ms, label) =>
    Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
        ),
    ])

// Minimal mapping from Open-Meteo's numeric weather codes to plain text
const WEATHER_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail",
}

export const getWeather = async ({ city }) => {
    // Step 1: geocode the city name to lat/lon (also free, same provider)
    const geoRes = await withTimeout(
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`),
        15000,
        "Geocoding request"
    )
    const geoData = await geoRes.json()

    if (!geoData.results || geoData.results.length === 0) {
        return JSON.stringify({ error: `Could not find location "${city}"` })
    }

    const { latitude, longitude, name, country } = geoData.results[ 0 ]

    // Step 2: fetch current weather for that lat/lon
    const weatherRes = await withTimeout(
        fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
            `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
            `&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
        ),
        15000,
        "Weather request"
    )
    const weatherData = await weatherRes.json()

    const result = {
        location: `${name}, ${country}`,
        current: {
            temperature_c: weatherData.current?.temperature_2m,
            humidity_percent: weatherData.current?.relative_humidity_2m,
            wind_speed_kmh: weatherData.current?.wind_speed_10m,
            condition: WEATHER_CODES[ weatherData.current?.weather_code ] ?? "Unknown",
        },
        today_forecast: {
            max_temp_c: weatherData.daily?.temperature_2m_max?.[ 0 ],
            min_temp_c: weatherData.daily?.temperature_2m_min?.[ 0 ],
        },
    }

    console.log(JSON.stringify(result))
    return JSON.stringify(result)
}