// src/services/safetyAnalysisService.js
const City = require('../models/City');
const SafetyAlert = require('../models/SafetyAlert');

class SafetyAnalysisService {
  /**
   * Analyze safety score for a location
   * @param {Object} location - Location with coordinates
   * @param {String} city - City name
   * @returns {Object} Safety analysis
   */
  static async analyzeLocationSafety(location, city) {
    try {
      const cityData = await City.findOne({ name: { $regex: city, $options: 'i' } });

      if (!cityData) {
        return {
          safetyScore: 50,
          riskLevel: 'unknown',
          factors: [],
        };
      }

      let safetyScore = 70; // Default starting score
      const factors = [];

      // Check if location is in safe areas
      if (cityData.safetyAreas?.safe) {
        const inSafeArea = this.isLocationInArea(
          location.coordinates,
          cityData.safetyAreas.safe
        );
        if (inSafeArea) {
          safetyScore += 20;
          factors.push({
            type: 'in_safe_area',
            impact: 'positive',
            description: 'Location is in a designated safe area',
          });
        }
      }

      // Check if location is in unsafe areas
      if (cityData.safetyAreas?.unsafe) {
        const inUnsafeArea = this.isLocationInArea(
          location.coordinates,
          cityData.safetyAreas.unsafe
        );
        if (inUnsafeArea) {
          safetyScore -= 30;
          factors.push({
            type: 'in_unsafe_area',
            impact: 'negative',
            description: 'Location is in a designated unsafe area',
          });
        }
      }

      // Check nearby emergency services
      const emergencyServices = await this.getNearbyEmergencyServices(
        location.coordinates,
        cityData
      );
      if (emergencyServices.hospitals > 0 || emergencyServices.police > 0) {
        safetyScore += 10;
        factors.push({
          type: 'emergency_services_nearby',
          impact: 'positive',
          description: `${emergencyServices.hospitals} hospitals and ${emergencyServices.police} police stations nearby`,
        });
      }

      // Check active safety alerts
      const alerts = await SafetyAlert.find({
        city: { $regex: city, $options: 'i' },
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

      if (alerts.length > 0) {
        const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
        const highAlerts = alerts.filter((a) => a.severity === 'high').length;

        safetyScore -= criticalAlerts * 20 + highAlerts * 10;
        factors.push({
          type: 'active_alerts',
          impact: 'negative',
          description: `${alerts.length} active safety alerts in the city`,
        });
      }

      // Clamp score between 0 and 100
      safetyScore = Math.max(0, Math.min(100, safetyScore));

      const riskLevel = this.getRiskLevelFromScore(safetyScore);

      return {
        safetyScore,
        riskLevel,
        factors,
        cityRating: cityData.safetyRating,
        emergencyServices,
        activeAlerts: alerts.length,
      };
    } catch (error) {
      console.error('Location safety analysis error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if a location is within any of the given areas
   */
  static isLocationInArea(coordinates, areas) {
    return areas.some((area) => {
      const distance = this.calculateDistance(
        coordinates.latitude,
        coordinates.longitude,
        area.coordinates?.latitude,
        area.coordinates?.longitude
      );
      return distance <= (area.radius || 1); // radius in km
    });
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static toRad(degrees) {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Get nearby emergency services
   */
  static getNearbyEmergencyServices(coordinates, cityData) {
    let hospitals = 0;
    let police = 0;

    if (cityData.emergencyContacts) {
      cityData.emergencyContacts.forEach((service) => {
        if (service.coordinates) {
          const distance = this.calculateDistance(
            coordinates.latitude,
            coordinates.longitude,
            service.coordinates.latitude,
            service.coordinates.longitude
          );

          if (distance <= 5) {
            // Within 5 km
            if (service.type === 'hospital') hospitals++;
            if (service.type === 'police') police++;
          }
        }
      });
    }

    return { hospitals, police };
  }

  /**
   * Convert safety score to risk level
   */
  static getRiskLevelFromScore(score) {
    if (score >= 80) return 'very_safe';
    if (score >= 60) return 'safe';
    if (score >= 40) return 'moderate';
    if (score >= 20) return 'unsafe';
    return 'very_unsafe';
  }

  /**
   * Get safety recommendations based on risk level
   */
  static getSafetyRecommendations(riskLevel, alerts = []) {
    const recommendations = {
      very_safe: [
        'Area is generally safe. Standard travel precautions apply.',
        'Enjoy your trip with normal awareness.',
        'Keep valuables secure.',
      ],
      safe: [
        'Area is relatively safe. Use standard precautions.',
        'Avoid walking alone late at night.',
        'Keep important documents secure.',
        'Stay aware of your surroundings.',
      ],
      moderate: [
        'Use heightened caution in this area.',
        'Avoid walking alone, especially at night.',
        'Keep valuables out of sight.',
        'Stay in populated areas during travel.',
        'Keep emergency contacts handy.',
      ],
      unsafe: [
        'Exercise extreme caution in this area.',
        'Avoid traveling alone.',
        'Use registered taxis/transport.',
        'Avoid displaying valuables.',
        'Stay informed with latest alerts.',
        'Have emergency contacts readily available.',
      ],
      very_unsafe: [
        'Reconsider your travel plans to this area.',
        'Monitor government travel warnings.',
        'Register with your embassy.',
        'Maintain constant communication with family.',
        'Avoid this area if possible.',
        'Stay updated with live alerts.',
      ],
    };

    let recs = recommendations[riskLevel] || recommendations.moderate;

    // Add alert-specific recommendations
    if (alerts.length > 0) {
      recs = recs.concat(
        alerts.flatMap((alert) => alert.recommendations || [])
      );
    }

    return [...new Set(recs)]; // Remove duplicates
  }

  /**
   * Categorize areas by safety
   */
  static categorizeAreasBySafety(cityData) {
    const categorized = {
      verySafe: [],
      safe: [],
      moderate: [],
      unsafe: [],
      veryUnsafe: [],
    };

    // Safe areas
    if (cityData.safetyAreas?.safe) {
      cityData.safetyAreas.safe.forEach((area) => {
        categorized.verySafe.push({
          name: area.name,
          description: area.description,
          type: 'safe',
        });
      });
    }

    // Unsafe areas
    if (cityData.safetyAreas?.unsafe) {
      cityData.safetyAreas.unsafe.forEach((area) => {
        categorized.veryUnsafe.push({
          name: area.name,
          description: area.description,
          type: 'unsafe',
        });
      });
    }

    return categorized;
  }

  /**
   * Get travel time-based safety score
   */
  static getTravelTimeSafetyTips(transportType, time) {
    const tips = {
      taxi: {
        day: [
          'Use official/registered taxis',
          'Verify meter is running',
          'Share ride details with someone',
          'Keep valuables secure',
        ],
        night: [
          'Use ride-sharing apps (Uber/Ola) if available',
          'Avoid hailing taxis on the street',
          'Stay alert',
          'Inform someone of your route',
          'Have emergency contacts ready',
        ],
      },
      public_transport: {
        day: [
          'Use crowded buses/trains',
          'Keep valuables secure',
          'Be aware of pickpockets',
          'Stand near exits',
        ],
        night: [
          'Avoid if possible',
          'Use during rush hours only',
          'Stay in well-lit areas',
          'Travel with others',
          'Keep phone charged',
        ],
      },
      walking: {
        day: [
          'Stay in busy, well-lit areas',
          'Use main roads',
          'Keep valuables out of sight',
          'Trust your instincts',
          'Keep phone charged',
        ],
        night: [
          'Avoid if possible',
          'Never walk alone',
          'Stay in main roads',
          'Walk confidently',
          'Keep emergency contacts accessible',
          'Consider using ride service',
        ],
      },
    };

    return tips[transportType]?.[time === 'night' ? 'night' : 'day'] || [];
  }

  /**
   * Analyze multi-city safety for trip
   */
  static async analyzeTripSafety(cities) {
    try {
      const analysis = {
        cities: [],
        overallRiskLevel: 'safe',
        recommendations: [],
        criticalAlerts: [],
      };

      for (const city of cities) {
        const cityData = await City.findOne({ name: { $regex: city, $options: 'i' } });
        const alerts = await SafetyAlert.find({
          city: { $regex: city, $options: 'i' },
          isActive: true,
          expiresAt: { $gt: new Date() },
        });

        const cityAnalysis = {
          city,
          safetyRating: cityData?.safetyRating || 0,
          alerts: alerts.length,
          criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
        };

        analysis.cities.push(cityAnalysis);

        // Update overall risk if any city has high risk
        if (cityData?.safetyRating < 40) {
          analysis.overallRiskLevel = 'unsafe';
        }

        // Collect critical alerts
        alerts
          .filter((a) => a.severity === 'critical')
          .forEach((alert) => {
            analysis.criticalAlerts.push({
              city,
              title: alert.title,
              description: alert.description,
            });
          });
      }

      return {
        success: true,
        data: analysis,
      };
    } catch (error) {
      console.error('Trip safety analysis error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check for nearby emergency services
   */
  static async checkNearbyEmergencies(latitude, longitude, type = 'both') {
    try {
      const emergencies = {
        hospitals: [],
        police: [],
      };

      // Get all cities
      const cities = await City.find({});

      for (const city of cities) {
        if (type === 'hospital' || type === 'both') {
          if (city.hospitals && city.hospitals.length > 0) {
            city.hospitals.forEach((hospital) => {
              const distance = this.calculateDistance(
                latitude,
                longitude,
                hospital.coordinates?.latitude,
                hospital.coordinates?.longitude
              );

              if (distance < 50) { // Within 50 km
                emergencies.hospitals.push({
                  name: hospital.name,
                  phone: hospital.phoneNumber,
                  address: hospital.address,
                  distance: parseFloat(distance.toFixed(2)),
                  coordinates: hospital.coordinates,
                  services: hospital.services,
                });
              }
            });
          }
        }

        if (type === 'police' || type === 'both') {
          if (city.policeStations && city.policeStations.length > 0) {
            city.policeStations.forEach((station) => {
              const distance = this.calculateDistance(
                latitude,
                longitude,
                station.coordinates?.latitude,
                station.coordinates?.longitude
              );

              if (distance < 50) { // Within 50 km
                emergencies.police.push({
                  name: station.name,
                  phone: station.phoneNumber,
                  address: station.address,
                  distance: parseFloat(distance.toFixed(2)),
                  coordinates: station.coordinates,
                });
              }
            });
          }
        }
      }

      // Sort by distance
      emergencies.hospitals.sort((a, b) => a.distance - b.distance);
      emergencies.police.sort((a, b) => a.distance - b.distance);

      return {
        hospitals: emergencies.hospitals.slice(0, 5),
        policeStations: emergencies.police.slice(0, 5),
        nearest: {
          hospital: emergencies.hospitals[0],
          police: emergencies.police[0],
        },
      };
    } catch (error) {
      console.error('Check nearby emergencies error:', error);
      return {
        hospitals: [],
        police: [],
        nearest: {},
      };
    }
  }

  /**
   * Analyze area safety by coordinates
   */
  static async analyzeAreaSafety(latitude, longitude) {
    try {
      // Find nearest city
      const cities = await City.find({});
      let nearestCity = null;
      let minDistance = Infinity;

      for (const city of cities) {
        if (city.coordinates) {
          const distance = this.calculateDistance(
            latitude,
            longitude,
            city.coordinates.latitude,
            city.coordinates.longitude
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearestCity = city;
          }
        }
      }

      let safetyRating = 3; // Default middle rating
      let riskLevel = 'moderate';
      let factors = [];

      if (nearestCity) {
        // Check if in safe area
        if (nearestCity.safetyAreas?.safe) {
          const inSafeArea = this.isLocationInArea(
            { latitude, longitude },
            nearestCity.safetyAreas.safe
          );

          if (inSafeArea) {
            safetyRating = 4.5;
            riskLevel = 'low';
            factors.push('Location is in designated safe area');
          }
        }

        // Check if in unsafe area
        if (nearestCity.safetyAreas?.unsafe) {
          const inUnsafeArea = this.isLocationInArea(
            { latitude, longitude },
            nearestCity.safetyAreas.unsafe
          );

          if (inUnsafeArea) {
            safetyRating = 2;
            riskLevel = 'high';
            factors.push('Location is in designated unsafe area');
          }
        }

        // Use city's safety rating as base
        safetyRating = parseFloat((nearestCity.safetyRating || 50) / 20).toFixed(1);
        riskLevel = this.getRiskLevelFromScore(nearestCity.safetyRating || 50);
      }

      return {
        safetyRating: parseFloat(safetyRating),
        riskLevel,
        nearestCity: nearestCity?.name,
        factors,
        recommendation: this.getSafetyRecommendations(riskLevel)[0],
      };
    } catch (error) {
      console.error('Analyze area safety error:', error);
      return {
        safetyRating: 3,
        riskLevel: 'unknown',
        factors: [],
      };
    }
  }

  /**
   * Get recommended action for alert type and severity
   */
  static getRecommendedAction(alertType, severity) {
    const actions = {
      'emergency': {
        'high': 'Contact emergency services immediately',
        'medium': 'Contact local authorities',
        'low': 'Be aware of situation',
      },
      'warning': {
        'high': 'Avoid this area, seek shelter',
        'medium': 'Exercise caution, avoid if possible',
        'low': 'Stay aware',
      },
      'info': {
        'high': 'Important information available',
        'medium': 'Check updates',
        'low': 'FYI',
      },
    };

    return actions[alertType]?.[severity] || 'Stay safe and informed';
  }

  /**
   * Helper to check if location is in area
   */
  static isLocationInArea(coordinates, areas) {
    if (!Array.isArray(areas) || areas.length === 0) return false;

    return areas.some((area) => {
      const latDiff = Math.abs(coordinates.latitude - (area.center?.latitude || 0));
      const lonDiff = Math.abs(coordinates.longitude - (area.center?.longitude || 0));

      return latDiff < 0.1 && lonDiff < 0.1; // Roughly 10km area
    });
  }
}

module.exports = SafetyAnalysisService;
