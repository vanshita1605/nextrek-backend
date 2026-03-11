// src/services/aiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Trip = require('../models/Trip');
const Expense = require('../models/Expense');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const BudgetService = require('./budgetService');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// Model configuration with fallbacks
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-pro';

class AIService {
  /**
   * List available models for debugging
   */
  static async listAvailableModels() {
    try {
      const models = await genAI.listModels();
      console.log('Available Gemini models:', models);
      return models;
    } catch (error) {
      console.error('Error listing models:', error.message);
      return null;
    }
  }
  /**
   * Generate travel recommendations based on trip details
   */
  static async generateTravelRecommendations(city, tripType, budget, days) {
    try {
      // Check if API key is configured
      if (!process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY.includes('dummy')) {
        return {
          success: false,
          error: 'Google Gemini API key not configured. Set GOOGLE_GEMINI_API_KEY in .env file with a valid key.',
          code: 'MISSING_API_KEY',
        };
      }

      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      
      const prompt = `Provide travel recommendations for a ${tripType} trip to ${city} for ${days} days with a budget of $${budget}.
      
      Include:
      1. Must-visit attractions
      2. Local food recommendations
      3. Budget allocation suggestions
      4. Best time to visit
      5. Local transportation options
      6. Safety tips
      
      Keep the response concise and practical.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        recommendations: text,
      };
    } catch (error) {
      console.error('AI recommendation error:', error);
      
      // If it's a 404 model not found error, provide mock response in development
      if (error.status === 404 && process.env.NODE_ENV === 'development') {
        console.log('Returning mock recommendations for development (Gemini API not available)');
        return {
          success: true,
          recommendations: this._getMockRecommendations(city, tripType, budget, days),
          note: 'Mock data - Configure GOOGLE_GEMINI_API_KEY for real recommendations',
        };
      }
      
      // Handle specific API errors
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        return {
          success: false,
          error: 'Gemini API quota exceeded temporarily. Please try again in a few moments.',
          code: 'QUOTA_EXCEEDED',
        };
      } else if (error.message?.includes('401') || error.message?.includes('UNAUTHENTICATED')) {
        return {
          success: false,
          error: 'Invalid or expired Google Gemini API key. Get a new key from: https://makersuite.google.com/app/apikey',
          code: 'INVALID_API_KEY',
        };
      } else if (error.status === 404 || error.message?.includes('is not found')) {
        return {
          success: false,
          error: `Model '${MODEL_NAME}' not accessible with current API key. Your API key may not have Gemini API enabled. Steps to fix: 1) Go to https://console.cloud.google.com/apis 2) Enable "Generative AI API" 3) Create new API key at https://makersuite.google.com/app/apikey 4) Update GOOGLE_GEMINI_API_KEY in .env`,
          code: 'MODEL_NOT_FOUND',
          details: `Attempted model: ${MODEL_NAME}`,
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to generate recommendations',
        code: error.code,
      };
    }
  }

  /**
   * Mock recommendations for development/testing
   */
  static _getMockRecommendations(city, tripType, budget, days) {
    const budgetPerDay = (budget / days).toFixed(2);
    return `
Based on your ${tripType} trip to ${city} for ${days} days with a budget of $${budget}:

**Daily Budget:** $${budgetPerDay}

**Must-Visit Attractions:**
- Top local landmark (30-60 min visit, free-$15)
- Cultural/historical site (2-3 hours, $10-25)
- Natural attraction or park area (variable time)
- Local market or shopping district (flexible time)

**Local Food Recommendations:**
- Breakfast: Local street food or café ($3-8)
- Lunch: Popular local restaurant ($8-15)
- Dinner: Traditional cuisine spot ($12-25)
- Try local specialties and street food for authentic experience

**Budget Allocation Suggestion:**
- Accommodation: 40% ($${(budget * 0.4 / days).toFixed(2)}/day)
- Food & Dining: 30% ($${(budget * 0.3 / days).toFixed(2)}/day)
- Activities & Transport: 30% ($${(budget * 0.3 / days).toFixed(2)}/day)

**Best Time to Visit:**
- Check seasonal weather patterns
- Avoid peak tourist seasons if possible
- Consider local festivals and events

**Local Transportation:**
- Public transit: Buses, metros, local trains (cheapest option)
- Taxis/apps: Use ride-sharing apps for better rates
- Walking: Explore neighborhoods on foot for free

**Safety Tips:**
- Keep valuables secure
- Use official transportation methods
- Stay aware of your surroundings
- Keep emergency contacts handy
- Follow local customs and guidelines

Note: For real AI-powered recommendations, configure a valid GOOGLE_GEMINI_API_KEY.
    `;
  }

  /**
   * Get budget advice based on spending patterns
   */
  static async getBudgetAdvice(tripId, userId) {
    try {
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return {
          success: false,
          error: 'Trip not found',
        };
      }

      const expenses = await Expense.find({ tripId });
      const budgetAnalytics = await BudgetService.getBudgetAnalytics(tripId);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `Analyze these trip budget metrics and provide advice:
      
      Trip Details:
      - Total Budget: $${trip.Budget?.total || 0}
      - Spent: $${trip.Budget?.spent || 0}
      - Days Remaining: ${Math.max(0, Math.ceil((trip.endDate - new Date()) / (1000 * 60 * 60 * 24)))}
      
      Category Breakdown:
      ${Object.entries(trip.Budget?.categories || {})
        .map(([cat, val]) => `- ${cat}: Budget $${val.allocated}, Spent $${val.spent}`)
        .join('\n')}
      
      Daily Spending Rate: $${budgetAnalytics?.dailySpendingRate?.toFixed(2) || 0}
      Projected Total: $${budgetAnalytics?.projectedTotal?.toFixed(2) || 0}
      
      Provide practical advice to manage the remaining budget. Keep it concise.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        advice: text,
      };
    } catch (error) {
      console.error('AI budget advice error:', error);
      
      if (error.status === 404 && process.env.NODE_ENV === 'development') {
        console.log('Returning mock budget advice for development (Gemini API not available)');
        return {
          success: true,
          advice: this._getMockBudgetAdvice(trip, budgetAnalytics),
          note: 'Mock data - Configure GOOGLE_GEMINI_API_KEY for real advice',
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to get budget advice',
      };
    }
  }

  /**
   * Get packing suggestions based on destination and weather
   */
  static async getPackingSuggestions(city, season, duration) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Provide a packing suggestion for a ${duration}-day trip to ${city} in ${season}.
      
      Include:
      1. Essential clothing items
      2. Weather-specific items
      3. Travel accessories
      4. Documents to carry
      5. Toiletries
      6. Electronics
      7. Emergency items
      
      Format as a bullet list. Keep it practical and concise.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        suggestions: text,
      };
    } catch (error) {
      console.error('AI packing suggestions error:', error);
      
      if (error.status === 404 && process.env.NODE_ENV === 'development') {
        console.log('Returning mock packing suggestions for development (Gemini API not available)');
        return {
          success: true,
          suggestions: this._getMockPackingSuggestions(city, season, duration),
          note: 'Mock data - Configure GOOGLE_GEMINI_API_KEY for real suggestions',
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to get packing suggestions',
      };
    }
  }

  /**
   * Get itinerary suggestions
   */
  static async getItinerarySuggestions(city, days, interests, budget) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Create a ${days}-day itinerary for ${city} with budget of $${budget}.
      
      Interests: ${interests.join(', ')}
      
      For each day:
      1. Provide 3-4 activities
      2. Estimated costs
      3. Travel time between locations
      4. Recommended restaurants
      5. Best time to visit each place
      
      Keep recommendations practical and budget-friendly.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        itinerary: text,
      };
    } catch (error) {
      console.error('AI itinerary suggestions error:', error);
      
      if (error.status === 404 && process.env.NODE_ENV === 'development') {
        console.log('Returning mock itinerary for development (Gemini API not available)');
        return {
          success: true,
          itinerary: this._getMockItinerary(city, days, interests, budget),
          note: 'Mock data - Configure GOOGLE_GEMINI_API_KEY for real itinerary',
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to get itinerary',
      };
    }
  }

  /**
   * Get safety and local tips
   */
  static async getSafetyAndLocalTips(city, country) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Provide safety and local tips for traveling to ${city}, ${country}.
      
      Include:
      1. Safety precautions
      2. Local customs and etiquette
      3. Language tips
      4. Currency and money tips
      5. Transportation tips
      6. Emergency contacts importance
      7. Best neighborhoods to stay in
      8. Areas to avoid
      9. Local festivals/events
      10. Best times to visit
      
      Keep it practical and concise.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        tips: text,
      };
    } catch (error) {
      console.error('AI safety tips error:', error);
      
      if (error.status === 404 && process.env.NODE_ENV === 'development') {
        console.log('Returning mock safety tips for development (Gemini API not available)');
        return {
          success: true,
          tips: this._getMockSafetyTips(city, country),
          note: 'Mock data - Configure GOOGLE_GEMINI_API_KEY for real tips',
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to get safety tips',
      };
    }
  }

  /**
   * Ask general travel questions
   */
  static async askQuestion(question, context = {}) {
    try {
      const contextText = context.tripDetails
        ? `Trip Context: ${JSON.stringify(context.tripDetails)}\n`
        : '';

      const prompt = `${contextText}
      
      User Question: ${question}
      
      Please provide a helpful, concise answer related to travel planning and budgeting.`;

      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        answer: text,
      };
    } catch (error) {
      console.error('AI question error:', error);
      
      // If it's a 404 model not found error, provide mock response in development
      if (error.status === 404 && process.env.NODE_ENV === 'development') {
        console.log('Returning mock answer for development (Gemini API not available)');
        return {
          success: true,
          answer: this._getMockAnswer(question, context),
          note: 'Mock data - Configure GOOGLE_GEMINI_API_KEY for real answers',
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to answer question',
      };
    }
  }

  /**
   * Mock answer for development/testing
   */
  static _getMockAnswer(question, context = {}) {
    return `
Based on your question about travel planning and budgeting:

**Q: ${question}**

**A:** Here are some practical tips:

1. **Planning Phase:**
   - Research your destination thoroughly
   - Check seasonal weather patterns
   - Look at local events and festivals
   - Read recent travel reviews

2. **Budget Tips:**
   - Set realistic daily budgets per category
   - Track expenses daily
   - Find free attractions and activities
   - Use public transportation instead of taxis
   - Eat where locals eat for better prices

3. **Packing:**
   - Pack light to save on baggage fees
   - Bring versatile clothing
   - Don't overpack toiletries
   - Carry essentials in carry-on

4. **Safety:**
   - Keep digital copies of important documents
   - Use secure payment methods
   - Share itinerary with trusted contacts
   - Stay aware of your surroundings
   - Use official transportation

5. **Cultural Respect:**
   - Research local customs before traveling
   - Learn basic phrases in local language
   - Dress appropriately for the destination
   - Be respectful at religious sites

Note: For real AI-powered answers, configure a valid GOOGLE_GEMINI_API_KEY.
    `;
  }

  /**
   * Generate meal plan recommendations
   */
  static async generateMealPlan(city, days, dietaryPreferences = []) {
    try {
      const dietText = dietaryPreferences.length > 0
        ? ` with ${dietaryPreferences.join(', ')} preferences`
        : '';

      const prompt = `Generate a ${days}-day meal plan for ${city}${dietText}.
      
      For each day, provide:
      1. Breakfast recommendation with estimated cost
      2. Lunch recommendation with estimated cost
      3. Dinner recommendation with estimated cost
      4. Local specialties to try
      5. Restaurant tips
      
      Include estimated daily food budget.`;

      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        mealPlan: text,
      };
    } catch (error) {
      console.error('AI meal plan error:', error);
      
      // If it's a 404 model not found error, provide mock response in development
      if (error.status === 404 && process.env.NODE_ENV === 'development') {
        console.log('Returning mock meal plan for development (Gemini API not available)');
        return {
          success: true,
          mealPlan: this._getMockMealPlan(city, days, dietaryPreferences),
          note: 'Mock data - Configure GOOGLE_GEMINI_API_KEY for real meal plans',
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to generate meal plan',
      };
    }
  }

  /**
   * Mock meal plan for development/testing
   */
  static _getMockMealPlan(city, days, dietaryPreferences = []) {
    const dietaryNote = dietaryPreferences.length > 0 ? `(${dietaryPreferences.join(', ')}) ` : '';
    return `
${days}-Day Meal Plan for ${city} ${dietaryNote}

**Daily Food Budget Estimate:** $25-40 per person (varies by city)

**Day 1 - Sample Itinerary:**
- Breakfast ($4-6): Local café or street food breakfast specialty
- Lunch ($8-12): Mid-range restaurant with local cuisine
- Dinner ($12-18): Popular local restaurant experience
- Snacks ($3-5): Street food or café
**Daily Total: $27-41**

**Tips:**
- Eat where locals eat for authentic and affordable meals
- Markets often have fresh, cheap produce
- Avoid tourist-heavy restaurant districts for better prices
- Try street food from busy vendors (usually safe and cheap)
- Ask locals for their favorite budget-friendly restaurants
- Set mealtimes to optimize sightseeing schedule

**Local Specialties to Try:**
- Research region-specific dishes before arrival
- Visit local food markets
- Try popular chain restaurants loved by locals
- Don't miss street food opportunities
- Ask your accommodation for recommendations

**Budget Breakdown:**
- Street food/breakfast: $3-8
- Lunch mains: $5-12
- Dinner: $10-20
- Snacks/coffee: $2-4
- Total daily average: $25-45

**Dining Recommendations:**
- Lunch is often the main meal in many cultures (cheaper)
- Dinner can be lighter and cheaper
- Breakfast from street vendors/bakeries
- Water from refillable bottles, not plastic bottles
- Look for set menus offering better value

Note: For personalized meal plans, configure a valid GOOGLE_GEMINI_API_KEY.
    `;
  }

  /**
   * Start or continue a chat conversation
   */
  static async chatWithAssistant(tripId, userId, conversationId, userMessage, context = {}) {
    try {
      // Save user message
      const userMsg = new ChatMessage({
        tripId,
        userId,
        conversationId,
        role: 'user',
        message: userMessage,
        messageType: 'text',
        readOnly: false,
        context: new Map(Object.entries(context)),
      });
      await userMsg.save();

      // Get conversation history
      const conversationHistory = await ChatMessage.find({ conversationId })
        .sort({ createdAt: 1 })
        .select('role message -_id');

      // Build conversation context for Gemini
      const conversationContext = conversationHistory
        .slice(-10) // Keep last 10 messages for context
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.message}`)
        .join('\n');

      const systemPrompt = `You are a helpful travel planning assistant for a trip management app. 
You provide advice on travel planning, budgeting, itineraries, packing, safety, and local tips.
Be concise, practical, and helpful. Always prioritize user safety.
${context.tripDetails ? `Trip Context: ${JSON.stringify(context.tripDetails)}` : ''}`;

      const fullPrompt = `${systemPrompt}

Recent Conversation:
${conversationContext || 'This is the start of the conversation.'}

User: ${userMessage}

Please provide a helpful response.`;

      // Get AI response
      const startTime = Date.now();
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const assistantMessage = response.text();
      const responseTime = Date.now() - startTime;

      // Save assistant message (read-only)
      const aiMsg = new ChatMessage({
        tripId,
        userId,
        conversationId,
        role: 'assistant',
        message: assistantMessage,
        messageType: 'text',
        readOnly: true,
        metadata: {
          model: 'gemini-pro',
          responseTime,
        },
      });
      await aiMsg.save();

      return {
        success: true,
        message: assistantMessage,
        messageId: aiMsg._id,
        conversationId,
      };
    } catch (error) {
      console.error('Chat error:', error);
      
      // If it's a 404 model not found error, provide mock response in development
      if (error.status === 404 && process.env.NODE_ENV === 'development') {
        console.log('Returning mock chat response for development (Gemini API not available)');
        const assistantMessage = this._getMockChatResponse(userMessage, context);
        
        // Still save messages to database for continuity
        const aiMsg = new ChatMessage({
          tripId,
          userId,
          conversationId,
          role: 'assistant',
          message: assistantMessage,
          messageType: 'text',
          readOnly: true,
          metadata: {
            model: 'mock',
            responseTime: 0,
            note: 'Mock data - Configure GOOGLE_GEMINI_API_KEY for real responses',
          },
        });
        await aiMsg.save();
        
        return {
          success: true,
          message: assistantMessage,
          messageId: aiMsg._id,
          conversationId,
          note: 'Mock data',
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to get chat response',
      };
    }
  }

  /**
   * Mock chat response for development/testing
   */
  static _getMockChatResponse(userMessage, context = {}) {
    // Simple keyword matching for mock responses
    const msg = userMessage.toLowerCase();
    
    if (msg.includes('budget') || msg.includes('cost') || msg.includes('spend')) {
      return `
Based on your question about budget:

**Budget Management Tips:**
- Set daily spending limits by category
- Track expenses in real-time
- Build in a 10-15% contingency buffer
- Review spending at the end of each day
- Adjust categories as needed based on actual spending
- Look for affordable alternatives without sacrificing experiences

**Common Travel Categories:**
- Accommodation: 35-40% of budget
- Food & Dining: 25-30%
- Activities & Transport: 25-30%
- Shopping/Souvenirs: 5-10%

Would you like specific advice on any category?`;
    } else if (msg.includes('pack') || msg.includes('luggage') || msg.includes('clothes')) {
      return `
**Packing Tips:**
- Pack light - try to fit everything in carry-on
- Wear bulky items during travel
- Roll clothes instead of folding
- Use packing cubes to organize
- Bring versatile pieces that mix and match
- Leave room for souvenirs
- Compress bags help save space
- Wear heaviest shoes during travel

**Must-Have Essentials:**
- Travel documents
- Medications & basic first aid
- Phone charger & power bank
- Comfortable walking shoes
- Layers for changing weather
- Toiletries (travel size)

What type of trip are you planning?`;
    } else if (msg.includes('itinerary') || msg.includes('day') || msg.includes('schedule')) {
      return `
**Creating Your Itinerary:**
- Start with must-see attractions
- Group nearby locations
- Plan for travel time between locations
- Include breaks and rest time
- Consider opening hours and best times
- Leave flexibility for discoveries
- Balance activities with downtime

**Day Planning:**
- Morning: Energy high - active sightseeing
- Midday: Lunch & relax near accommodation
- Afternoon: Secondary attractions or shopping
- Evening: Dinner & night activities

**Tips:**
- Don't overschedule
- Allow buffer time
- Use public transit efficiently
- Book popular activities in advance

What activities are you most interested in?`;
    } else if (msg.includes('safety') || msg.includes('safe') || msg.includes('danger')) {
      return `
**Safety Essentials:**
- Register with your embassy if traveling internationally
- Share your itinerary with someone at home
- Keep emergency contacts accessible
- Use hotel safes for valuables
- Avoid walking alone late at night
- Use official transportation methods
- Be aware of pickpocketing in crowded areas
- Keep copies of important documents separately
- Notify your bank of your travel dates
- Research your destination beforehand

**Local Awareness:**
- Learn basic phrases in local language
- Understand local customs and traditions
- Ask locals for safe neighborhoods
- Avoid areas on travel warnings
- Don't flash expensive items

**Emergency Preparation:**
- Know how to call emergency services
- Have travel insurance
- Keep medication accessible
- Have backup payment methods

Do you have specific safety concerns?`;
    } else if (msg.includes('food') || msg.includes('eat') || msg.includes('restaurant')) {
      return `
**Food & Dining Guide:**
- Eat where locals eat for authentic and affordable meals
- Visit local markets for fresh food
- Try street food from busy vendors (usually safe)
- Ask your host or locals for recommendations
- Look for set menus for better value
- Lunch is often cheaper than dinner
- Breakfast from street vendors/bakeries

**Budget Tips:**
- Average daily food budget: $20-35
- Street food: $2-5
- Local restaurant: $8-15
- Upscale restaurant: $20-40

**Safety:**
- Check hygiene standards
- Eat hot, freshly cooked food
- Avoid raw items from uncertain sources
- Drink bottled or purified water

What cuisines are you excited to try?`;
    }
    
    // Default response
    return `
Thank you for your question about travel planning.

I'm a travel assistant here to help with:
- Budget planning and cost management
- Itinerary suggestions and scheduling
- Packing advice and checklists
- Safety tips and local customs
- Food recommendations
- Transportation guidance
- Activity planning

**To get the best help:**
- Ask specific questions
- Share your trip details (destination, duration, budget)
- Let me know your interests
- Ask follow-up questions

What would you like help with for your trip?`;
  }

  /**
   * Get conversation history
   */
  static async getConversationHistory(conversationId, limit = 50) {
    try {
      const messages = await ChatMessage.find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'firstName lastName email')
        .select('-context');

      return {
        success: true,
        messages: messages.reverse(),
        total: await ChatMessage.countDocuments({ conversationId }),
      };
    } catch (error) {
      console.error('Get conversation history error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify message ownership and read-only status
   */
  static async verifyMessageAccess(messageId, userId, operation = 'read') {
    try {
      const message = await ChatMessage.findById(messageId);

      if (!message) {
        return {
          success: false,
          allowed: false,
          reason: 'Message not found',
        };
      }

      // Read operation - always allowed for trip participants
      if (operation === 'read') {
        return {
          success: true,
          allowed: true,
        };
      }

      // Write/Delete operations
      if (operation === 'delete' || operation === 'edit') {
        // User can only delete their own messages
        if (message.userId.toString() !== userId.toString()) {
          return {
            success: true,
            allowed: false,
            reason: 'Can only delete your own messages',
          };
        }

        // Cannot edit/delete assistant messages (read-only)
        if (message.readOnly) {
          return {
            success: true,
            allowed: false,
            reason: 'This message is read-only and cannot be modified',
          };
        }

        return {
          success: true,
          allowed: true,
        };
      }

      return {
        success: true,
        allowed: false,
        reason: 'Invalid operation',
      };
    } catch (error) {
      console.error('Verify message access error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete a user message (enforces read-only for AI messages)
   */
  static async deleteMessage(messageId, userId) {
    try {
      const access = await this.verifyMessageAccess(messageId, userId, 'delete');

      if (!access.success || !access.allowed) {
        return {
          success: false,
          allowed: false,
          reason: access.reason || 'Operation not allowed',
        };
      }

      const message = await ChatMessage.findByIdAndDelete(messageId);

      return {
        success: true,
        message: 'Message deleted successfully',
        deletedMessageId: messageId,
      };
    } catch (error) {
      console.error('Delete message error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Edit a user message (cannot edit assistant/read-only messages)
   */
  static async editMessage(messageId, userId, newMessage) {
    try {
      const access = await this.verifyMessageAccess(messageId, userId, 'edit');

      if (!access.success || !access.allowed) {
        return {
          success: false,
          allowed: false,
          reason: access.reason || 'Operation not allowed',
        };
      }

      const message = await ChatMessage.findByIdAndUpdate(
        messageId,
        {
          message: newMessage,
          isEdited: true,
          editedAt: new Date(),
          editedBy: userId,
        },
        { new: true }
      );

      return {
        success: true,
        message: 'Message updated successfully',
        updatedMessage: message,
      };
    } catch (error) {
      console.error('Edit message error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Mark message as helpful/unhelpful
   */
  static async rateMessageHelpfulness(messageId, userId, isHelpful, feedback = '') {
    try {
      const message = await ChatMessage.findById(messageId);

      if (!message) {
        return {
          success: false,
          error: 'Message not found',
        };
      }

      const updated = await ChatMessage.findByIdAndUpdate(
        messageId,
        {
          helpful: isHelpful,
          feedback,
        },
        { new: true }
      );

      return {
        success: true,
        message: `Message marked as ${isHelpful ? 'helpful' : 'unhelpful'}`,
        messageId,
      };
    } catch (error) {
      console.error('Rate message error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Start a new conversation
   */
  static async startNewConversation(tripId, userId, firstMessage = null) {
    try {
      const conversationId = `conv_${tripId}_${userId}_${Date.now()}`;

      if (firstMessage) {
        const userMsg = new ChatMessage({
          tripId,
          userId,
          conversationId,
          role: 'user',
          message: firstMessage,
          messageType: 'text',
          readOnly: false,
        });
        await userMsg.save();
      }

      return {
        success: true,
        conversationId,
        tripId,
        userId,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Start conversation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all conversations for a trip
   */
  static async getTripConversations(tripId) {
    try {
      const messages = await ChatMessage.find({ tripId }).select(
        'conversationId userId createdAt updatedAt'
      );

      const conversations = {};
      messages.forEach((msg) => {
        if (!conversations[msg.conversationId]) {
          conversations[msg.conversationId] = {
            conversationId: msg.conversationId,
            tripId,
            userId: msg.userId,
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt,
            messageCount: 0,
          };
        }
        conversations[msg.conversationId].messageCount += 1;
        conversations[msg.conversationId].updatedAt = msg.updatedAt;
      });

      return {
        success: true,
        conversations: Object.values(conversations).sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        ),
      };
    } catch (error) {
      console.error('Get conversations error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get conversation summary
   */
  static async getConversationSummary(conversationId) {
    try {
      const messages = await ChatMessage.find({ conversationId });

      if (messages.length === 0) {
        return {
          success: false,
          error: 'Conversation not found',
        };
      }

      const userMessages = messages.filter((m) => m.role === 'user');
      const assistantMessages = messages.filter((m) => m.role === 'assistant');

      return {
        success: true,
        summary: {
          conversationId,
          totalMessages: messages.length,
          userMessages: userMessages.length,
          assistantMessages: assistantMessages.length,
          messageTypes: messages.reduce((acc, m) => {
            acc[m.messageType] = (acc[m.messageType] || 0) + 1;
            return acc;
          }, {}),
          timespan: {
            start: messages[0].createdAt,
            end: messages[messages.length - 1].createdAt,
          },
          averageResponseTime:
            assistantMessages.length > 0
              ? (assistantMessages.reduce((sum, m) => sum + (m.metadata?.responseTime || 0), 0)
                  / assistantMessages.length)
              : 0,
          helpfulCount: messages.filter((m) => m.helpful === true).length,
          unhelpfulCount: messages.filter((m) => m.helpful === false).length,
        },
      };
    } catch (error) {
      console.error('Get conversation summary error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Mock budget advice for development/testing
   */
  static _getMockBudgetAdvice(trip, budgetAnalytics) {
    return `
**Budget Analysis & Advice**

**Current Status:**
- Total Budget: $${trip.Budget?.total || 'N/A'}
- Spent So Far: $${trip.Budget?.spent || 0}
- Remaining: $${(trip.Budget?.total || 0) - (trip.Budget?.spent || 0)}
- Daily Spending Rate: $${budgetAnalytics?.dailySpendingRate?.toFixed(2) || 0}

**Budget Health:**
- Percentage Spent: ${((trip.Budget?.spent || 0) / (trip.Budget?.total || 1) * 100).toFixed(1)}%
- Projected Final: $${budgetAnalytics?.projectedTotal?.toFixed(2) || 0}

**Recommendations:**
1. **If On Track:** Continue current spending patterns, but monitor daily expenses
2. **If Over Budget:** Consider reducing discretionary spending in upcoming days
3. **If Under Budget:** Allow flexibility for experiences you don't want to miss

**Action Items:**
- Review daily spending categories
- Adjust budget allocation if needed
- Look for free attractions
- Use public transportation rather than taxis
- Eat at local restaurants away from tourist areas
- Book accommodations during off-peak hours for possible discounts

**Tips to Stay on Budget:**
- Set daily spending alerts
- Track expenses daily
- Look for group discounts
- Use free walking tours and attractions
- Cook some meals if accommodation allows
- Use public transport passes/cards for daily travel

Note: For personalized budget analysis, configure a valid GOOGLE_GEMINI_API_KEY.
    `;
  }

  /**
   * Mock packing suggestions for development/testing
   */
  static _getMockPackingSuggestions(city, season, duration) {
    return `
**Packing List for ${duration}-Day Trip to ${city} (${season})**

**Clothing (${season}):**
- 3-4 upper body tops/shirts
- 1-2 bottoms (pants/skirts)
- 1 light jacket or sweater
- 1 pair everyday shoes
- 1 pair comfortable walking shoes
- Undergarments (5-7 days worth)
- Socks (5-7 pairs)
- Sleepwear
- Appropriate outerwear for season

**Weather-Specific Items:**
- If Summer: Sunscreen, sunglasses, light fabrics, hat
- If Winter: Warm coat, gloves, hat, thermal layers
- If Rainy Season: Compact umbrella, rain jacket
- If Cold: Layers, warm coat, accessories

**Travel Accessories:**
- Comfortable day backpack
- Phone charger and cables
- Power bank
- Universal adapter (if traveling internationally)
- Headphones
- Travel pillow
- Luggage locks

**Documents & Money:**
- Passport/ID
- Travel insurance documents
- Boarding passes (digital copy)
- Credit/debit cards
- Some local currency

**Toiletries:**
- Basic toiletries (travel size)
- Medications
- Personal hygiene items
- Deodorant
- Toothbrush and toothpaste

**Electronics:**
- Phone
- Camera (if desired)
- Portable batteries
- USB cables
- Appropriate plugs/adapters

**Emergency Items:**
- First aid basics
- Important medication
- Insurance documents
- Emergency contact numbers

**Pro Packing Tips:**
- Wear bulkiest items during travel
- Roll clothing to save space
- Use packing cubes
- Wear shoes during transit
- Keep essentials in carry-on
- Leave room for souvenirs

Note: For personalized packing advice, configure a valid GOOGLE_GEMINI_API_KEY.
    `;
  }

  /**
   * Mock itinerary for development/testing
   */
  static _getMockItinerary(city, days, interests, budget) {
    const interests_str = interests && interests.length > 0 ? interests.join(', ') : 'general sightseeing';
    const budget_per_day = (budget / days).toFixed(0);
    return `
**${days}-Day Itinerary for ${city}**
**Interests:** ${interests_str}
**Budget:** $${budget}/day ($${budget_per_day}/day)

**Day 1: Arrival & Orientation**
- Morning: Arrive and settle in accommodation
- Afternoon: Explore nearby area, get local SIM if needed
- Evening: Dinner at local restaurant near accommodation
- Budget: $50-80

**Day 2: Main Attractions**
- Morning: Visit main landmark/museum (2-3 hours)
- Lunch: Local restaurant ($8-15)
- Afternoon: Explore city center/market area
- Evening: Walk around neighborhood, casual dinner
- Budget: $60-100

**Day 3: Cultural Experience**
- Morning: Visit cultural/historical site
- Lunch: Try local specialty food
- Afternoon: Local market or shopping district
- Evening: Traditional dinner experience
- Budget: $60-100

**Daily Activities Breakdown (adapt based on remaining days):**
- Free walking tours (tip-based)
- Museum visits
- Parks and gardens
- Local neighborhoods
- Food tours and markets
- Street food experiences

**Estimated Costs (per day):**
- Accommodation: $30-60
- Food: $20-35
- Activities/Transport: $15-40
- Total per day: $65-135

**Money-Saving Tips:**
- Use public transportation
- Book combination tickets
- Visit during free admission hours
- Eat where locals eat
- Stay in neighborhoods away from tourist centers

**General Guidelines:**
- Book popular activities in advance
- Keep backup plans for weather
- Allow flexibility for discoveries
- Take breaks between activities
- Respect local customs
- Keep emergency contacts handy

Note: For detailed personalized itinerary, configure a valid GOOGLE_GEMINI_API_KEY.
    `;
  }

  /**
   * Mock safety tips for development/testing
   */
  static _getMockSafetyTips(city, country) {
    return `
**Safety & Local Tips for ${city}, ${country}**

**Safety Precautions:**
- Keep copies of important documents separately
- Use hotel safe for valuables
- Avoid walking alone late at night
- Be aware of pickpocketing in crowded areas
- Use official taxis or ride-sharing apps
- Keep emergency numbers handy
- Register with your embassy if traveling long-term

**Local Customs & Etiquette:**
- Research local customs before arrival
- Dress appropriately for the culture
- Ask permission before photographing
- Respect religious sites and practices
- Learn basic greetings in local language
- Be respectful of local traditions
- Tipping varies by country - ask locals

**Language Tips:**
- Learn basic phrases: hello, thank you, excuse me, help
- Download offline translation app
- Carry written address of your accommodation
- Download map offline
- Learn numbers for prices
- Learn "no" clearly and politely

**Currency & Money Tips:**
- Use ATMs during daytime
- Avoid exchanging at airports
- Keep money in multiple places
- Use credit cards at established places
- Check for better exchange rates
- Notify bank of travel dates
- Avoid large cash displays

**Transportation Tips:**
- Use official transportation methods
- Validate tickets appropriately
- Know alternative routes
- Don't flash expensive items
- Sit near driver/attendants
- Avoid traveling alone very late
- Ask locals for safe neighborhoods

**Emergency Contacts:**
- Keep emergency helpline numbers
- Know nearest embassy location
- Have travel insurance contact info
- Register travel plans with someone at home
- Keep backup phone number
- Know how to call emergency services

**Best Neighborhoods:**
- Ask locals for safe areas
- Stay in well-reviewed accommodations
- Check crime maps online
- Read recent travel reviews
- Ask staff for recommendations
- Avoid isolated areas at night

**Areas to Avoid:**
- Industrial areas late at night
- Known high-crime zones
- Very crowded areas with valuables
- Unmarked taxis
- Street deals/offers from strangers

**Local Festivals/Events:**
- Research before visiting
- Plan transport in advance
- Avoid large crowds if uncomfortable
- Keep valuables secure
- Know alternative routes

**Best Times to Visit:**
- Avoid peak tourist seasons if possible
- Check for local holidays and closures
- Consider weather patterns
- Look for festivals and events
- Check for strikes or political events

Note: For real-time safety information, configure a valid GOOGLE_GEMINI_API_KEY and check current travel advisories.
    `;
  }
}

module.exports = AIService;
