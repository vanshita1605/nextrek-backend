// src/services/weatherService.js
const axios = require('axios');

class WeatherService {
  /**
   * Get weather data for a city
   * Using OpenWeatherMap API (free tier)
   * @param {String} city - City name
   * @param {String} country - Country code
   * @returns {Object} Weather data
   */
  static async getWeatherForCity(city, country = '') {
    try {
      const apiKey = process.env.OPENWEATHER_API_KEY || 'demo';
      const location = country ? `${city},${country}` : city;

      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          q: location,
          appid: apiKey,
          units: 'metric',
        },
      });

      const data = response.data;

      return {
        success: true,
        weather: {
          city: data.name,
          country: data.sys.country,
          temperature: {
            current: data.main.temp,
            feelsLike: data.main.feels_like,
            min: data.main.temp_min,
            max: data.main.temp_max,
          },
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          windSpeed: data.wind.speed,
          cloudiness: data.clouds.all,
          description: data.weather[0].description,
          main: data.weather[0].main,
          icon: data.weather[0].icon,
          visibility: data.visibility,
          sunrise: new Date(data.sys.sunrise * 1000),
          sunset: new Date(data.sys.sunset * 1000),
          timezone: data.timezone,
        },
      };
    } catch (error) {
      console.error('Weather API error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get forecast for a city
   * @param {String} city - City name
   * @param {String} country - Country code
   * @param {Number} days - Number of days for forecast (default 5)
   * @returns {Object} Forecast data
   */
  static async getWeatherForecast(city, country = '', days = 5) {
    try {
      const apiKey = process.env.OPENWEATHER_API_KEY || 'demo';
      const location = country ? `${city},${country}` : city;

      // Get coordinates first
      const geoResponse = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
        params: {
          q: location,
          appid: apiKey,
        },
      });

      if (geoResponse.data.length === 0) {
        return {
          success: false,
          error: 'City not found',
        };
      }

      const { lat, lon } = geoResponse.data[0];

      // Get forecast
      const forecastResponse = await axios.get(
        'https://api.openweathermap.org/data/2.5/forecast',
        {
          params: {
            lat,
            lon,
            appid: apiKey,
            units: 'metric',
          },
        }
      );

      const forecast = forecastResponse.data;
      const dailyForecasts = {};

      // Group by day
      forecast.list.forEach((item) => {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];

        if (!dailyForecasts[date]) {
          dailyForecasts[date] = {
            date,
            tempMin: item.main.temp_min,
            tempMax: item.main.temp_max,
            description: item.weather[0].description,
            main: item.weather[0].main,
            humidity: item.main.humidity,
            windSpeed: item.wind.speed,
            items: [],
          };
        }

        dailyForecasts[date].items.push({
          time: new Date(item.dt * 1000).toISOString(),
          temp: item.main.temp,
          description: item.weather[0].description,
          main: item.weather[0].main,
          humidity: item.main.humidity,
        });
      });

      return {
        success: true,
        city: forecast.city.name,
        country: forecast.city.country,
        forecast: Object.values(dailyForecasts).slice(0, days),
      };
    } catch (error) {
      console.error('Forecast API error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Detect season based on month
   * @param {Number} month - Month (0-11)
   * @returns {String} Season name
   */
  static detectSeason(month) {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  /**
   * Get weather alerts/warnings
   * @param {Object} weather - Weather object
   * @returns {Array} Array of alerts
   */
  static getWeatherAlerts(weather) {
    const alerts = [];

    if (!weather.success) {
      return alerts;
    }

    const { temperature, windSpeed, description, main } = weather.weather;

    // Temperature alerts
    if (temperature.current < 0) {
      alerts.push({
        type: 'extreme_cold',
        severity: 'high',
        message: `Extreme cold (${temperature.current}°C) - Pack thermal wear and insulation`,
      });
    } else if (temperature.current < 10) {
      alerts.push({
        type: 'cold',
        severity: 'medium',
        message: `Cold weather - Pack warm clothing and jacket`,
      });
    } else if (temperature.current > 35) {
      alerts.push({
        type: 'extreme_heat',
        severity: 'high',
        message: `Extreme heat (${temperature.current}°C) - Pack light clothes and sunscreen`,
      });
    } else if (temperature.current > 28) {
      alerts.push({
        type: 'hot',
        severity: 'medium',
        message: 'Hot weather - Pack light clothes and sunscreen',
      });
    }

    // Wind alerts
    if (windSpeed > 40) {
      alerts.push({
        type: 'high_wind',
        severity: 'high',
        message: 'High wind conditions - Secure loose items',
      });
    }

    // Weather condition alerts
    if (main === 'Rain') {
      alerts.push({
        type: 'rain',
        severity: 'medium',
        message: 'Rain expected - Pack waterproof jacket and umbrella',
      });
    } else if (main === 'Snow') {
      alerts.push({
        type: 'snow',
        severity: 'high',
        message: 'Snow expected - Pack winter gear and warm clothing',
      });
    } else if (main === 'Thunderstorm') {
      alerts.push({
        type: 'thunderstorm',
        severity: 'high',
        message: 'Thunderstorms possible - Stay indoors, pack umbrella',
      });
    }

    return alerts;
  }
}

module.exports = WeatherService;
