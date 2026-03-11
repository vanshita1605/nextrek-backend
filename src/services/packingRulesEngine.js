// src/services/packingRulesEngine.js
const WeatherService = require('./weatherService');

class PackingRulesEngine {
  /**
   * Main method to generate packing checklist based on all factors
   * @param {Object} tripData - Trip information
   * @returns {Object} Structured packing checklist
   */
  static async generatePackingChecklist(tripData) {
    const {
      destination,
      startDate,
      endDate,
      tripType = 'leisure',
      weather = null,
      season = null,
      interests = [],
    } = tripData;

    try {
      // Get weather data
      let weatherData = weather;
      if (!weatherData) {
        const result = await WeatherService.getWeatherForCity(destination);
        weatherData = result.success ? result.weather : null;
      }

      // Determine season
      const detectedSeason = season || this.detectSeasonFromDate(startDate);

      // Calculate trip duration
      const duration = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));

      // Generate base categories
      const checklist = this.generateBaseChecklist(detectedSeason, tripType, duration);

      // Apply weather-based rules
      if (weatherData) {
        this.applyWeatherRules(checklist, weatherData);
      }

      // Apply trip-type-specific rules
      this.applyTripTypeRules(checklist, tripType, interests);

      // Apply duration-based rules
      this.applyDurationRules(checklist, duration);

      // Get weather alerts
      const alerts = weatherData ? WeatherService.getWeatherAlerts({ success: true, weather: weatherData }) : [];

      return {
        success: true,
        checklist,
        metadata: {
          destination,
          season: detectedSeason,
          tripType,
          duration,
          weather: weatherData ? {
            temp: weatherData.temperature.current,
            condition: weatherData.main,
            description: weatherData.description,
          } : null,
          alerts,
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      console.error('Packing rules engine error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate base packing checklist
   */
  static generateBaseChecklist(season, tripType, duration) {
    const checklist = {
      clothing: {
        name: 'Clothing',
        priority: 'high',
        items: [
          { name: 'Underwear (7 pairs)', quantity: 7, priority: 'high' },
          { name: 'Socks (7 pairs)', quantity: 7, priority: 'high' },
          { name: 'T-shirts/tops', quantity: Math.ceil(duration / 2), priority: 'high' },
          { name: 'Pants/trousers', quantity: 2, priority: 'high' },
          { name: 'Shorts', quantity: 1, priority: 'medium' },
          { name: 'Comfortable shoes', quantity: 1, priority: 'high' },
          { name: 'Flip-flops/sandals', quantity: 1, priority: 'medium' },
        ],
      },
      toiletries: {
        name: 'Toiletries & Hygiene',
        priority: 'high',
        items: [
          { name: 'Toothbrush & toothpaste', priority: 'high' },
          { name: 'Shampoo & conditioner', priority: 'high' },
          { name: 'Body wash/soap', priority: 'high' },
          { name: 'Deodorant', priority: 'high' },
          { name: 'Sunscreen (SPF 30+)', priority: 'high' },
          { name: 'Moisturizer', priority: 'medium' },
          { name: 'Razor & shaving cream', priority: 'medium' },
          { name: 'Comb/brush', priority: 'low' },
          { name: 'Nail clippers', priority: 'low' },
        ],
      },
      documents: {
        name: 'Documents & Money',
        priority: 'high',
        items: [
          { name: 'Passport', priority: 'high' },
          { name: 'Travel tickets/confirmation', priority: 'high' },
          { name: 'Travel insurance documents', priority: 'high' },
          { name: 'Hotel confirmations', priority: 'high' },
          { name: 'Credit/debit cards', priority: 'high' },
          { name: 'Cash in local currency', priority: 'high' },
          { name: 'Emergency contact numbers', priority: 'high' },
        ],
      },
      electronics: {
        name: 'Electronics',
        priority: 'high',
        items: [
          { name: 'Mobile phone & charger', priority: 'high' },
          { name: 'Power bank', priority: 'medium' },
          { name: 'Universal power adapter', priority: 'high' },
          { name: 'Headphones', priority: 'low' },
          { name: 'Camera', priority: 'low' },
        ],
      },
      medications: {
        name: 'Medications & First Aid',
        priority: 'high',
        items: [
          { name: 'Prescription medications', priority: 'high' },
          { name: 'Pain relievers', priority: 'medium' },
          { name: 'Antacids', priority: 'low' },
          { name: 'Allergy medications', priority: 'low' },
          { name: 'Anti-diarrhea medicine', priority: 'medium' },
          { name: 'Bandages & antiseptic', priority: 'low' },
        ],
      },
      miscellaneous: {
        name: 'Miscellaneous',
        priority: 'low',
        items: [
          { name: 'Luggage/backpack', priority: 'high' },
          { name: 'Day backpack', priority: 'medium' },
          { name: 'Reusable water bottle', priority: 'medium' },
          { name: 'Sunglasses', priority: 'medium' },
          { name: 'Hat/cap', priority: 'low' },
          { name: 'Earplugs/eye mask', priority: 'low' },
          { name: 'Travel pillow', priority: 'low' },
        ],
      },
    };

    return checklist;
  }

  /**
   * Apply weather-based rules to checklist
   */
  static applyWeatherRules(checklist, weather) {
    const temp = weather.temperature.current;
    const main = weather.main;

    // Cold weather rules
    if (temp < 5) {
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Winter jacket/coat',
        quantity: 1,
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Thermal underwear',
        quantity: 1,
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Warm hat',
        quantity: 1,
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Gloves',
        quantity: 1,
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Scarf',
        quantity: 1,
        priority: 'medium',
      });
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Warm socks',
        quantity: 3,
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Waterproof boots',
        quantity: 1,
        priority: 'high',
      });

      // Lip balm for dry weather
      this.addItemIfNotExists(checklist.toiletries, {
        name: 'Lip balm/chapstick',
        priority: 'medium',
      });
    } else if (temp > 25) {
      // Hot weather rules
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Lightweight clothing',
        quantity: 5,
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Linen/cotton clothes',
        quantity: 3,
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Hat with brim',
        quantity: 1,
        priority: 'medium',
      });

      // Suncare
      this.addItemIfNotExists(checklist.toiletries, {
        name: 'High SPF sunscreen',
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.toiletries, {
        name: 'After-sun lotion',
        priority: 'medium',
      });
      this.addItemIfNotExists(checklist.miscellaneous, {
        name: 'Sunglasses with UV protection',
        priority: 'high',
      });
    }

    // Rain rules
    if (main === 'Rain' || main === 'Thunderstorm' || main === 'Drizzle') {
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Waterproof jacket',
        quantity: 1,
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Waterproof pants',
        quantity: 1,
        priority: 'medium',
      });
      this.addItemIfNotExists(checklist.miscellaneous, {
        name: 'Umbrella',
        quantity: 1,
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.miscellaneous, {
        name: 'Waterproof bag',
        quantity: 1,
        priority: 'medium',
      });
    }

    // Snow rules
    if (main === 'Snow') {
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Snow boots',
        quantity: 1,
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Snow pants',
        quantity: 1,
        priority: 'high',
      });
    }

    // High humidity
    if (weather.humidity > 70) {
      this.addItemIfNotExists(checklist.toiletries, {
        name: 'Anti-fungal powder/spray',
        priority: 'medium',
      });
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Extra socks',
        quantity: 3,
        priority: 'medium',
      });
    }
  }

  /**
   * Apply trip-type-specific rules
   */
  static applyTripTypeRules(checklist, tripType, interests = []) {
    if (tripType === 'beach') {
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Swimsuit',
        quantity: 2,
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Beach cover-up',
        quantity: 1,
        priority: 'medium',
      });
      this.addItemIfNotExists(checklist.miscellaneous, {
        name: 'Waterproof phone case',
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.miscellaneous, {
        name: 'Beach towel',
        priority: 'medium',
      });
    }

    if (tripType === 'adventure' || tripType === 'hiking') {
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Hiking boots',
        quantity: 1,
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Athletic wear',
        quantity: 3,
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Rain jacket',
        quantity: 1,
        priority: 'medium',
      });
      this.addItemIfNotExists(checklist.miscellaneous, {
        name: 'Backpack (40-50L)',
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.miscellaneous, {
        name: 'Trekking poles',
        priority: 'medium',
      });
      this.addItemIfNotExists(checklist.miscellaneous, {
        name: 'Insect repellent',
        priority: 'medium',
      });
    }

    if (tripType === 'business') {
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Formal dress/suit',
        quantity: 1,
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Formal shoes',
        quantity: 1,
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Tie/accessories',
        quantity: 2,
        priority: 'medium',
      });
      this.addItemIfNotExists(checklist.electronics, {
        name: 'Laptop/tablet',
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.miscellaneous, {
        name: 'Business cards',
        priority: 'medium',
      });
    }

    if (interests.includes('photography')) {
      this.addItemIfNotExists(checklist.electronics, {
        name: 'Camera with lenses',
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.electronics, {
        name: 'Extra memory cards',
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.electronics, {
        name: 'Tripod',
        priority: 'medium',
      });
    }

    if (interests.includes('cycling')) {
      this.addItemIfNotExists(checklist.clothing, {
        name: 'Cycling shorts',
        quantity: 2,
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.miscellaneous, {
        name: 'Bike helmet',
        priority: 'high',
      });
      this.addItemIfNotExists(checklist.miscellaneous, {
        name: 'Bike repair kit',
        priority: 'medium',
      });
    }
  }

  /**
   * Apply duration-based rules
   */
  static applyDurationRules(checklist, duration) {
    if (duration <= 3) {
      // Short trip - minimal items
      checklist.clothing.items.forEach((item) => {
        if (item.quantity && item.quantity > 1) {
          item.quantity = Math.max(1, Math.ceil(item.quantity / 2));
        }
      });
    } else if (duration > 7) {
      // Long trip - more of everything
      checklist.clothing.items.forEach((item) => {
        if (item.quantity && item.quantity <= 3) {
          item.quantity = Math.ceil(item.quantity * 1.5);
        }
      });

      // Add laundry supplies
      this.addItemIfNotExists(checklist.miscellaneous, {
        name: 'Laundry detergent packets',
        quantity: 3,
        priority: 'low',
      });
      this.addItemIfNotExists(checklist.miscellaneous, {
        name: 'Clothesline',
        priority: 'low',
      });
    }
  }

  /**
   * Helper to add item if it doesn't exist
   */
  static addItemIfNotExists(category, item) {
    const exists = category.items.some((i) => i.name.toLowerCase() === item.name.toLowerCase());
    if (!exists) {
      category.items.push({
        ...item,
        packed: false,
      });
    }
  }

  /**
   * Detect season from date
   */
  static detectSeasonFromDate(date) {
    const month = new Date(date).getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  /**
   * Get packing suggestions based on weather alerts
   */
  static getWeatherBasedSuggestions(weatherAlerts) {
    const suggestions = [];

    weatherAlerts.forEach((alert) => {
      const suggestion = {
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
      };
      suggestions.push(suggestion);
    });

    return suggestions;
  }

  /**
   * Calculate completion percentage
   */
  static calculateCompletion(checklist) {
    let total = 0;
    let packed = 0;

    Object.values(checklist).forEach((category) => {
      category.items.forEach((item) => {
        total++;
        if (item.packed) packed++;
      });
    });

    return total > 0 ? Math.round((packed / total) * 100) : 0;
  }
}

module.exports = PackingRulesEngine;
