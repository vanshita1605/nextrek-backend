// src/scripts/seedCities.js
const mongoose = require('mongoose');
const City = require('../models/City');
require('dotenv').config();

const cities = [
  {
    name: 'Jaipur',
    country: 'India',
    state: 'Rajasthan',
    latitude: 26.9124,
    longitude: 75.7873,
    description: 'The Pink City, known for its architecture and historical monuments',
    population: 3046163,
    bestTimeToVisit: { start: 'October', end: 'March' },
    averageBudgetPerDay: { budget: 1800, currency: 'INR' },
    language: ['Hindi', 'English'],
    currency: 'INR',
    timezone: 'IST',
    highlights: ['City Palace', 'Hawa Mahal', 'Jantar Mantar'],
    safetyRating: 4,
  },
  {
    name: 'Delhi',
    country: 'India',
    state: 'Delhi',
    latitude: 28.7041,
    longitude: 77.1025,
    description: 'India\'s capital city, blending ancient history with modern development',
    population: 30960000,
    bestTimeToVisit: { start: 'October', end: 'March' },
    averageBudgetPerDay: { budget: 2500, currency: 'INR' },
    language: ['Hindi', 'English'],
    currency: 'INR',
    timezone: 'IST',
    highlights: ['Red Fort', 'India Gate', 'Taj Mahal (Agra Day Trip)'],
    safetyRating: 3.5,
  },
  {
    name: 'Mumbai',
    country: 'India',
    state: 'Maharashtra',
    latitude: 19.0760,
    longitude: 72.8777,
    description: 'The City of Dreams, India\'s financial and entertainment hub',
    population: 20961472,
    bestTimeToVisit: { start: 'October', end: 'February' },
    averageBudgetPerDay: { budget: 3000, currency: 'INR' },
    language: ['Marathi', 'Hindi', 'English'],
    currency: 'INR',
    timezone: 'IST',
    highlights: ['Gateway of India', 'Marine Drive', 'Taj Mahal Hotel'],
    safetyRating: 3.5,
  },
  {
    name: 'Bangalore',
    country: 'India',
    state: 'Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
    description: 'The Silicon Valley of India, known for tech industry and pleasant climate',
    population: 8425970,
    bestTimeToVisit: { start: 'September', end: 'May' },
    averageBudgetPerDay: { budget: 2800, currency: 'INR' },
    language: ['Kannada', 'Hindi', 'English'],
    currency: 'INR',
    timezone: 'IST',
    highlights: ['Vidhana Soudha', 'Lalbagh', 'Tipu Sultan\'s Palace'],
    safetyRating: 4,
  },
  {
    name: 'Hyderabad',
    country: 'India',
    state: 'Telangana',
    latitude: 17.3850,
    longitude: 78.4867,
    description: 'The Pearl of the Deccan, famous for biryani and IT industry',
    population: 6809970,
    bestTimeToVisit: { start: 'October', end: 'February' },
    averageBudgetPerDay: { budget: 2000, currency: 'INR' },
    language: ['Telugu', 'Hindi', 'English'],
    currency: 'INR',
    timezone: 'IST',
    highlights: ['Charminar', 'Hussain Sagar Lake', 'Chowmahalla Palace'],
    safetyRating: 3.5,
  },
  {
    name: 'Goa',
    country: 'India',
    state: 'Goa',
    latitude: 15.2993,
    longitude: 73.8343,
    description: 'Coastal paradise with beaches, Portuguese architecture, and vibrant nightlife',
    population: 1458545,
    bestTimeToVisit: { start: 'November', end: 'March' },
    averageBudgetPerDay: { budget: 2000, currency: 'INR' },
    language: ['Konkani', 'Hindi', 'English'],
    currency: 'INR',
    timezone: 'IST',
    highlights: ['Baga Beach', 'Fort Aguada', 'Basilica of Bom Jesus'],
    safetyRating: 4,
  },
  {
    name: 'Agra',
    country: 'India',
    state: 'Uttar Pradesh',
    latitude: 27.1767,
    longitude: 78.0081,
    description: 'Home to the iconic Taj Mahal, a symbol of love and a UNESCO World Heritage Site',
    population: 1571000,
    bestTimeToVisit: { start: 'October', end: 'March' },
    averageBudgetPerDay: { budget: 1600, currency: 'INR' },
    language: ['Hindi', 'English'],
    currency: 'INR',
    timezone: 'IST',
    highlights: ['Taj Mahal', 'Agra Fort', 'Mehtab Bagh'],
    safetyRating: 3,
  },
  {
    name: 'Varanasi',
    country: 'India',
    state: 'Uttar Pradesh',
    latitude: 25.3176,
    longitude: 82.9789,
    description: 'One of the oldest living cities, sacred to Hinduism, with spiritual significance',
    population: 1371000,
    bestTimeToVisit: { start: 'October', end: 'March' },
    averageBudgetPerDay: { budget: 1400, currency: 'INR' },
    language: ['Hindi', 'English'],
    currency: 'INR',
    timezone: 'IST',
    highlights: ['Ganges River', 'Kashi Vishwanath Temple', 'Manikarnika Ghat'],
    safetyRating: 3,
  },
  {
    name: 'Paris',
    country: 'France',
    state: 'Île-de-France',
    latitude: 48.8566,
    longitude: 2.3522,
    description: 'The City of Light, renowned for art, culture, and iconic landmarks',
    population: 2161000,
    bestTimeToVisit: { start: 'April', end: 'October' },
    averageBudgetPerDay: { budget: 4000, currency: 'INR' },
    language: ['French', 'English'],
    currency: 'EUR',
    timezone: 'CET',
    highlights: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame Cathedral'],
    safetyRating: 4.5,
  },
  {
    name: 'London',
    country: 'United Kingdom',
    state: 'England',
    latitude: 51.5074,
    longitude: -0.1278,
    description: 'The capital of the UK, famous for royal palaces and historic landmarks',
    population: 9002488,
    bestTimeToVisit: { start: 'May', end: 'September' },
    averageBudgetPerDay: { budget: 4500, currency: 'INR' },
    language: ['English'],
    currency: 'GBP',
    timezone: 'GMT',
    highlights: ['Big Ben', 'Buckingham Palace', 'Tower of London'],
    safetyRating: 4.5,
  },
];

async function seedCities() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-planning');
    console.log('Connected to MongoDB');

    // Clear existing cities
    await City.deleteMany({});
    console.log('Cleared existing cities');

    // Insert new cities
    const result = await City.insertMany(cities);
    console.log(`Successfully seeded ${result.length} cities`);

    // Log the results
    result.forEach((city) => {
      console.log(`✓ Added: ${city.name} (${city.country}) - ₹${city.averageBudgetPerDay?.budget}/day`);
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding cities:', error);
    process.exit(1);
  }
}

seedCities();
