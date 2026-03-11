// src/services/tripMemoryService.js
const TripMemory = require('../models/TripMemory');
const TripTimeline = require('../models/TripTimeline');
const TripJournal = require('../models/TripJournal');
const TripSummary = require('../models/TripSummary');
const Trip = require('../models/Trip');
const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;

class TripMemoryService {
  /**
   * Upload photo to trip
   */
  static async uploadPhoto(tripId, userId, fileBuffer, metadata = {}) {
    try {
      const Trip_doc = await Trip.findById(tripId);
      if (!Trip_doc) {
        return { success: false, message: 'Trip not found' };
      }

      // Upload to Cloudinary
      const cloudinaryUrl = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `tripz/memories/${tripId}`,
            resource_type: 'auto',
            eager: [
              { width: 200, height: 200, crop: 'thumb', quality: 80 },
              { width: 500, height: 500, crop: 'limit', quality: 85 },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadStream.end(fileBuffer);
      });

      // Get or create TripMemory
      let tripMemory = await TripMemory.findOne({ tripId, userId });
      if (!tripMemory) {
        tripMemory = new TripMemory({
          tripId,
          userId,
          title: `Memories from ${Trip_doc.title || 'Trip'}`,
          photos: [],
        });
      }

      // Add photo metadata
      const photo = {
        photoId: cloudinaryUrl.public_id,
        url: cloudinaryUrl.secure_url,
        thumbnail: cloudinaryUrl.eager?.[0]?.secure_url || cloudinaryUrl.secure_url,
        caption: metadata.caption || '',
        uploadedBy: userId,
        location: metadata.location || {},
        takenAt: metadata.takenAt || new Date(),
        tags: metadata.tags || [],
        cameraMetadata: metadata.cameraMetadata || {},
        sentiment: 'unknown',
      };

      tripMemory.photos.push(photo);
      tripMemory.totalPhotos = tripMemory.photos.length;

      // Calculate storage used (rough estimate)
      tripMemory.storageUsed += cloudinaryUrl.bytes ? cloudinaryUrl.bytes / (1024 * 1024) : 0.5;

      await tripMemory.save();

      // Add to timeline
      await this.addTimelineEvent(tripId, userId, {
        eventType: 'photo_taken',
        title: `Photo uploaded: ${metadata.caption || 'Untitled'}`,
        description: metadata.caption || '',
        location: metadata.location,
        photos: [{ url: photo.url, caption: photo.caption }],
        timestamp: metadata.takenAt || new Date(),
      });

      return {
        success: true,
        photo,
        message: 'Photo uploaded successfully',
      };
    } catch (error) {
      console.error('Upload photo error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add timeline event
   */
  static async addTimelineEvent(tripId, userId, eventData) {
    try {
      let timeline = await TripTimeline.findOne({ tripId });

      if (!timeline) {
        timeline = new TripTimeline({
          tripId,
          userId,
          events: [],
        });
      }

      const event = {
        eventId: `EVT-${tripId}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        timestamp: eventData.timestamp || new Date(),
        eventType: eventData.eventType || 'custom_event',
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        photos: eventData.photos || [],
        metadata: eventData.metadata || {},
        importance: eventData.importance || 2,
        cost: eventData.cost,
        duration: eventData.duration,
        attendees: eventData.attendees || [],
        sentimentScore: eventData.sentimentScore || 0,
      };

      timeline.events.push(event);
      timeline.totalEvents = timeline.events.length;

      // Update activity breakdown
      const activityBreakdown = timeline.activityBreakdown || new Map();
      const currentCount = activityBreakdown.get(eventData.eventType) || 0;
      activityBreakdown.set(eventData.eventType, currentCount + 1);
      timeline.activityBreakdown = activityBreakdown;

      // Update key milestones if importance is high
      if (event.importance >= 4) {
        timeline.keyMilestones = timeline.keyMilestones || [];
        timeline.keyMilestones.push({
          eventId: event.eventId,
          title: event.title,
          description: event.description,
          timestamp: event.timestamp,
          importance: event.importance,
        });
      }

      timeline.lastUpdated = new Date();
      await timeline.save();

      return { success: true, event };
    } catch (error) {
      console.error('Add timeline event error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate timeline from trip data
   */
  static async generateTimeline(tripId, userId) {
    try {
      const Trip_doc = await Trip.findById(tripId);
      if (!Trip_doc) {
        return { success: false, message: 'Trip not found' };
      }

      let timeline = await TripTimeline.findOne({ tripId });

      if (timeline && timeline.isAutoGenerated) {
        // Clear and regenerate
        timeline.events = [];
        timeline.keyMilestones = [];
        timeline.activityBreakdown = new Map();
      } else {
        timeline = new TripTimeline({
          tripId,
          userId,
          events: [],
          isAutoGenerated: true,
        });
      }

      // Add departure event
      if (Trip_doc.startDate) {
        timeline.events.push({
          eventId: `EVT-DEP-${tripId}`,
          timestamp: Trip_doc.startDate,
          eventType: 'departure',
          title: `Departure from ${Trip_doc.originCity || 'Home'}`,
          description: `Started journey to ${Trip_doc.destination}`,
          location: { name: Trip_doc.originCity || 'Home' },
          importance: 4,
        });
      }

      // Add arrival event
      if (Trip_doc.startDate && Trip_doc.destination) {
        const arrivalTime = new Date(Trip_doc.startDate);
        arrivalTime.setHours(arrivalTime.getHours() + 4); // Assume travel time
        timeline.events.push({
          eventId: `EVT-ARR-${tripId}`,
          timestamp: arrivalTime,
          eventType: 'arrival',
          title: `Arrival at ${Trip_doc.destination}`,
          description: `Reached destination: ${Trip_doc.destination}`,
          location: { name: Trip_doc.destination },
          importance: 4,
        });
      }

      // Add end event
      if (Trip_doc.endDate) {
        timeline.events.push({
          eventId: `EVT-END-${tripId}`,
          timestamp: Trip_doc.endDate,
          eventType: 'departure',
          title: `Trip ended`,
          description: `Returned from trip`,
          importance: 3,
        });
      }

      timeline.startDate = Trip_doc.startDate;
      timeline.endDate = Trip_doc.endDate;
      timeline.totalEvents = timeline.events.length;
      timeline.lastUpdated = new Date();

      // Calculate average sentiment
      const sentiments = timeline.events.filter(e => e.sentimentScore !== undefined);
      if (sentiments.length > 0) {
        timeline.averageSentiment =
          sentiments.reduce((sum, e) => sum + e.sentimentScore, 0) / sentiments.length;
      }

      // Find most active day
      const eventsByDay = {};
      timeline.events.forEach(event => {
        const dayKey = new Date(event.timestamp).toDateString();
        eventsByDay[dayKey] = (eventsByDay[dayKey] || 0) + 1;
      });

      const mostActiveDay = Object.entries(eventsByDay).sort((a, b) => b[1] - a[1])[0];
      if (mostActiveDay) {
        timeline.mostActiveDay = new Date(mostActiveDay[0]);
      }

      await timeline.save();

      return {
        success: true,
        timeline,
        message: 'Timeline generated successfully',
      };
    } catch (error) {
      console.error('Generate timeline error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate auto trip summary
   */
  static async generateTripSummary(tripId, userId) {
    try {
      const Trip_doc = await Trip.findById(tripId).populate('participants');
      const tripMemory = await TripMemory.findOne({ tripId, userId });
      const tripJournal = await TripJournal.findOne({ tripId, userId });
      const timeline = await TripTimeline.findOne({ tripId });

      if (!Trip_doc) {
        return { success: false, message: 'Trip not found' };
      }

      // Calculate duration
      const startDate = Trip_doc.startDate;
      const endDate = Trip_doc.endDate;
      const daysCount = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

      // Build summary
      let summary = await TripSummary.findOne({ tripId });

      if (!summary) {
        summary = new TripSummary({
          tripId,
          userId,
        });
      }

      summary.title = `${Trip_doc.title || 'Trip'} Summary`;
      summary.overview = `A wonderful ${daysCount}-day journey to ${Trip_doc.destination || 'amazing destinations'}`;

      // Duration stats
      summary.duration = {
        startDate,
        endDate,
        daysCount,
      };

      // Destination info
      if (Trip_doc.destination) {
        summary.destinations.push({
          name: Trip_doc.destination,
          daysSpent: daysCount,
          highlights: [],
          photos: tripMemory ? tripMemory.totalPhotos : 0,
        });
      }

      // Statistics
      summary.statistics = {
        totalPhotos: tripMemory ? tripMemory.totalPhotos : 0,
        totalJournalEntries: tripJournal ? tripJournal.totalEntries : 0,
        totalActivities: timeline ? timeline.totalEvents : 0,
        totalExpense: Trip_doc.budget?.totalBudget || 0,
        averageDailyExpense: (Trip_doc.budget?.totalBudget || 0) / daysCount,
        dominantSentiment: tripJournal ? tripJournal.dominantSentiment : 'neutral',
      };

      // Highlights from memories
      if (tripMemory) {
        const highlights = tripMemory.photos.filter(p => p.isHighlight).slice(0, 5);
        summary.highlights = highlights.map((h, idx) => ({
          title: h.caption || `Highlight ${idx + 1}`,
          description: h.aiDescription || '',
          date: h.uploadedAt,
          photo: h.url,
          sentiment: h.sentiment,
          importance: 4,
        }));

        // Best moments
        summary.bestMoments = highlights.slice(0, 3).map((h, idx) => ({
          momentId: h.photoId,
          title: h.caption || `Best Moment ${idx + 1}`,
          description: h.aiDescription || '',
          photo: h.url,
          date: h.uploadedAt,
        }));

        // Cover photo
        if (tripMemory.photos.length > 0) {
          summary.coverPhoto = {
            url: tripMemory.photos[0].url,
            caption: tripMemory.photos[0].caption || 'Trip memories',
          };

          summary.favoritePhoto = {
            url: tripMemory.photos[Math.floor(Math.random() * tripMemory.photos.length)].url,
            caption: 'Favorite moment',
            date: new Date(),
          };
        }
      }

      // Personal insights
      if (tripJournal) {
        summary.personalInsights = {
          theme: tripJournal.dominantTone || 'Adventure',
          learnings: tripJournal.insights?.personalGrowth || [],
          favoriteMemory: tripJournal.insights?.bestDay?.summary || '',
          mostChallenging: tripJournal.insights?.worstDay?.summary || '',
          personalGrowth: tripJournal.insights?.personalGrowth || [],
          recommendations: ['Make lasting memories', 'Explore new cultures', 'Connect with locals'],
        };

        summary.moodJourney = tripJournal.entries
          .slice(0, 10)
          .map(e => ({
            date: e.date,
            mood: e.mood,
            sentiment: e.sentiment,
            summary: e.aiSummary || e.title,
          }));
      }

      // Travel style assessment
      if (tripMemory && tripMemory.totalPhotos > 50) {
        summary.travelStyle = 'adventurous';
      } else if (!tripMemory || tripMemory.totalPhotos === 0) {
        summary.travelStyle = 'relaxed';
      } else {
        summary.travelStyle = 'family';
      }

      // AI Generated insights
      summary.aiGenerated = {
        summaryText: `You had an amazing ${daysCount}-day trip to ${Trip_doc.destination}. With ${summary.statistics.totalPhotos} photos and ${summary.statistics.totalJournalEntries} journal entries, you created wonderful memories that will last a lifetime.`,
        keyTakeaways: [
          `Visited incredible destinations in ${Trip_doc.destination}`,
          `Created ${summary.statistics.totalPhotos} memorable moments`,
          `Journeyed with ${Trip_doc.participants?.length || 1} fellow travelers`,
          'Discovered new perspectives and experiences',
        ],
        suggestedCaptions: [
          'Adventure awaits! 🌍',
          'Creating memories that last a lifetime ✨',
          'Every moment is a treasure 📸',
          'Journey of a lifetime 🚀',
        ],
        generatedAt: new Date(),
      };

      summary.isPublic = false;
      summary.generatedAt = new Date();

      await summary.save();

      return {
        success: true,
        summary,
        message: 'Trip summary generated successfully',
      };
    } catch (error) {
      console.error('Generate trip summary error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get trip memories
   */
  static async getTripMemories(tripId, userId, filters = {}) {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const tripMemory = await TripMemory.findOne({ tripId, userId });

      if (!tripMemory) {
        return { success: false, message: 'No memories found for this trip' };
      }

      let photos = tripMemory.photos;

      // Apply filters
      if (filters.isHighlight) {
        photos = photos.filter(p => p.isHighlight === (filters.isHighlight === 'true'));
      }

      if (filters.tag) {
        photos = photos.filter(p => p.tags.includes(filters.tag));
      }

      if (filters.sentiment) {
        photos = photos.filter(p => p.sentiment === filters.sentiment);
      }

      // Sort
      const sortBy = filters.sortBy || 'uploadedAt';
      const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
      photos.sort((a, b) => {
        if (sortBy === 'uploadedAt') {
          return (b.uploadedAt - a.uploadedAt) * sortOrder;
        } else if (sortBy === 'likes') {
          return (b.likes - a.likes) * sortOrder;
        }
        return 0;
      });

      const paginatedPhotos = photos.slice(skip, skip + limit);

      return {
        success: true,
        photos: paginatedPhotos,
        pagination: {
          page,
          limit,
          total: photos.length,
          pages: Math.ceil(photos.length / limit),
        },
      };
    } catch (error) {
      console.error('Get trip memories error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Like photo
   */
  static async likePhoto(tripId, userId, photoId) {
    try {
      const tripMemory = await TripMemory.findOneAndUpdate(
        { tripId, userId, 'photos.photoId': photoId },
        {
          $inc: { 'photos.$.likes': 1 },
          $addToSet: { 'photos.$.likedBy': userId },
        },
        { new: true }
      );

      if (!tripMemory) {
        return { success: false, message: 'Photo not found' };
      }

      return {
        success: true,
        message: 'Photo liked',
      };
    } catch (error) {
      console.error('Like photo error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add comment to photo
   */
  static async commentOnPhoto(tripId, userId, photoId, userRating, text) {
    try {
      const photo = await TripMemory.findOneAndUpdate(
        { tripId, userId, 'photos.photoId': photoId },
        {
          $push: {
            'photos.$.comments': {
              userId,
              userRating,
              text,
              createdAt: new Date(),
            },
          },
        },
        { new: true }
      );

      if (!photo) {
        return { success: false, message: 'Photo not found' };
      }

      return {
        success: true,
        message: 'Comment added',
      };
    } catch (error) {
      console.error('Comment on photo error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add journal entry
   */
  static async addJournalEntry(tripId, userId, entryData) {
    try {
      let journal = await TripJournal.findOne({ tripId, userId });

      if (!journal) {
        journal = new TripJournal({
          tripId,
          userId,
          entries: [],
        });
      }

      const entry = {
        entryId: `JNL-${tripId}-${Date.now()}`,
        title: entryData.title,
        content: entryData.content,
        date: entryData.date || new Date(),
        location: entryData.location,
        tone: entryData.tone,
        mood: entryData.mood,
        weather: entryData.weather,
        attachments: entryData.attachments || [],
        tags: entryData.tags || [],
        isPrivate: entryData.isPrivate !== false,
        isFavorite: false,
        wordCount: (entryData.content || '').split(/\s+/).length,
        readingTime: Math.ceil((entryData.content || '').split(/\s+/).length / 200),
        aiSummary: this.generateEntrySummary(entryData.content),
        sentiment:
          entryData.mood >= 4
            ? 'very_positive'
            : entryData.mood === 3
              ? 'neutral'
              : 'very_negative',
        createdAt: new Date(),
      };

      journal.entries.push(entry);
      journal.totalEntries = journal.entries.length;
      journal.totalWords += entry.wordCount;
      journal.averageMood =
        journal.entries.reduce((sum, e) => sum + (e.mood || 0), 0) / journal.entries.length;

      await journal.save();

      return {
        success: true,
        entry,
        message: 'Journal entry added',
      };
    } catch (error) {
      console.error('Add journal entry error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate entry summary (simple AI simulation)
   */
  static generateEntrySummary(content) {
    if (!content || content.length === 0) return '';
    const sentences = content.split('.');
    return sentences.slice(0, 2).join('. ').trim() + (sentences.length > 2 ? '...' : '');
  }
}

module.exports = TripMemoryService;
