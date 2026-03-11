// src/controllers/tripMemoryController.js
const TripMemoryService = require('../services/tripMemoryService');
const TripMemory = require('../models/TripMemory');
const TripTimeline = require('../models/TripTimeline');
const TripJournal = require('../models/TripJournal');
const TripSummary = require('../models/TripSummary');

// ============ Photo Upload API ============

/**
 * Upload photo to trip
 * POST /api/trips/:tripId/memories/upload
 */
exports.uploadPhoto = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { caption, location, takenAt, tags } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const result = await TripMemoryService.uploadPhoto(tripId, req.userId, req.file.buffer, {
      caption,
      location: location ? JSON.parse(location) : {},
      takenAt: takenAt ? new Date(takenAt) : new Date(),
      tags: tags ? tags.split(',') : [],
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      message: 'Photo uploaded successfully',
      data: result.photo,
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photo',
      error: error.message,
    });
  }
};

/**
 * Get trip photos/memories
 * GET /api/trips/:tripId/memories
 */
exports.getTripMemories = async (req, res) => {
  try {
    const { tripId } = req.params;
    const filters = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      isHighlight: req.query.isHighlight,
      tag: req.query.tag,
      sentiment: req.query.sentiment,
      sortBy: req.query.sortBy || 'uploadedAt',
      sortOrder: req.query.sortOrder || 'desc',
    };

    const result = await TripMemoryService.getTripMemories(tripId, req.userId, filters);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get trip memories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get memories',
      error: error.message,
    });
  }
};

/**
 * Get photos by category/album
 * GET /api/trips/:tripId/memories/album/:albumName
 */
exports.getAlbum = async (req, res) => {
  try {
    const { tripId, albumName } = req.params;

    const tripMemory = await TripMemory.findOne({ tripId, userId: req.userId });

    if (!tripMemory) {
      return res.status(404).json({
        success: false,
        message: 'Trip memories not found',
      });
    }

    const album = tripMemory.albums.find(a => a.name === albumName);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found',
      });
    }

    // Get photos from album
    const albumPhotos = tripMemory.photos.filter(p =>
      album.photos.includes(p.photoId)
    );

    res.json({
      success: true,
      album: {
        name: album.name,
        description: album.description,
        photosCount: albumPhotos.length,
        createdAt: album.createdAt,
        photos: albumPhotos,
      },
    });
  } catch (error) {
    console.error('Get album error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get album',
      error: error.message,
    });
  }
};

/**
 * Like photo
 * POST /api/trips/:tripId/memories/:photoId/like
 */
exports.likePhoto = async (req, res) => {
  try {
    const { tripId, photoId } = req.params;

    const result = await TripMemoryService.likePhoto(tripId, req.userId, photoId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Like photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like photo',
      error: error.message,
    });
  }
};

/**
 * Comment on photo
 * POST /api/trips/:tripId/memories/:photoId/comment
 */
exports.commentOnPhoto = async (req, res) => {
  try {
    const { tripId, photoId } = req.params;
    const { text, userRating } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required',
      });
    }

    const result = await TripMemoryService.commentOnPhoto(
      tripId,
      req.userId,
      photoId,
      userRating,
      text
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Comment on photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message,
    });
  }
};

/**
 * Mark photo as highlight
 * POST /api/trips/:tripId/memories/:photoId/highlight
 */
exports.markAsHighlight = async (req, res) => {
  try {
    const { tripId, photoId } = req.params;

    const tripMemory = await TripMemory.findOneAndUpdate(
      { tripId, userId: req.userId, 'photos.photoId': photoId },
      {
        $set: { 'photos.$.isHighlight': true },
        $inc: { totalHighlights: 1 },
      },
      { new: true }
    );

    if (!tripMemory) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found',
      });
    }

    res.json({
      success: true,
      message: 'Photo marked as highlight',
    });
  } catch (error) {
    console.error('Mark as highlight error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as highlight',
      error: error.message,
    });
  }
};

// ============ Timeline API ============

/**
 * Get trip timeline
 * GET /api/trips/:tripId/timeline
 */
exports.getTimeline = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const timeline = await TripTimeline.findOne({ tripId });

    if (!timeline) {
      return res.status(404).json({
        success: false,
        message: 'Timeline not found',
      });
    }

    // Sort events by timestamp descending
    const events = timeline.events.sort((a, b) => b.timestamp - a.timestamp);
    const skip = (page - 1) * limit;
    const paginatedEvents = events.slice(skip, skip + limit);

    res.json({
      success: true,
      data: {
        totalEvents: timeline.totalEvents,
        keyMilestones: timeline.keyMilestones,
        averageSentiment: timeline.averageSentiment,
        mostActiveDay: timeline.mostActiveDay,
        events: paginatedEvents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: events.length,
          pages: Math.ceil(events.length / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get timeline',
      error: error.message,
    });
  }
};

/**
 * Generate timeline
 * POST /api/trips/:tripId/timeline/generate
 */
exports.generateTimeline = async (req, res) => {
  try {
    const { tripId } = req.params;

    const result = await TripMemoryService.generateTimeline(tripId, req.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Timeline generated successfully',
      data: result.timeline,
    });
  } catch (error) {
    console.error('Generate timeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate timeline',
      error: error.message,
    });
  }
};

// ============ Trip Summary API ============

/**
 * Generate auto trip summary
 * POST /api/trips/:tripId/summary/generate
 */
exports.generateTripSummary = async (req, res) => {
  try {
    const { tripId } = req.params;

    const result = await TripMemoryService.generateTripSummary(tripId, req.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      message: 'Trip summary generated successfully',
      data: result.summary,
    });
  } catch (error) {
    console.error('Generate trip summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate trip summary',
      error: error.message,
    });
  }
};

/**
 * Get trip summary
 * GET /api/trips/:tripId/summary
 */
exports.getTripSummary = async (req, res) => {
  try {
    const { tripId } = req.params;

    const summary = await TripSummary.findOne({ tripId });

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Summary not found. Generate one first.',
      });
    }

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Get trip summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get summary',
      error: error.message,
    });
  }
};

/**
 * Get summary statistics
 * GET /api/trips/:tripId/summary/stats
 */
exports.getSummaryStats = async (req, res) => {
  try {
    const { tripId } = req.params;

    const summary = await TripSummary.findOne({ tripId });

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Summary not found',
      });
    }

    res.json({
      success: true,
      data: {
        title: summary.title,
        duration: summary.duration,
        statistics: summary.statistics,
        highlights: summary.highlights,
        topLocations: summary.topLocations,
        topActivities: summary.topActivities,
        personalInsights: summary.personalInsights,
        travelStyle: summary.travelStyle,
        aiGenerated: summary.aiGenerated,
      },
    });
  } catch (error) {
    console.error('Get summary stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message,
    });
  }
};

// ============ Journal API ============

/**
 * Add journal entry
 * POST /api/trips/:tripId/journal
 */
exports.addJournalEntry = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { title, content, date, location, tone, mood, weather, tags, attachments, isPrivate } =
      req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
      });
    }

    const result = await TripMemoryService.addJournalEntry(tripId, req.userId, {
      title,
      content,
      date,
      location,
      tone,
      mood,
      weather,
      tags,
      attachments,
      isPrivate,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      message: 'Journal entry added',
      data: result.entry,
    });
  } catch (error) {
    console.error('Add journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add journal entry',
      error: error.message,
    });
  }
};

/**
 * Get journal entries
 * GET /api/trips/:tripId/journal
 */
exports.getJournalEntries = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { page = 1, limit = 10, sortBy = 'date', sortOrder = 'desc' } = req.query;

    const journal = await TripJournal.findOne({ tripId, userId: req.userId });

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'No journal entries found',
      });
    }

    let entries = journal.entries;

    // Sort
    entries.sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc' ? b.date - a.date : a.date - b.date;
      } else if (sortBy === 'mood') {
        return sortOrder === 'desc' ? b.mood - a.mood : a.mood - b.mood;
      }
      return 0;
    });

    const skip = (page - 1) * limit;
    const paginatedEntries = entries.slice(skip, skip + limit);

    res.json({
      success: true,
      entries: paginatedEntries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: entries.length,
        pages: Math.ceil(entries.length / limit),
      },
    });
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get journal entries',
      error: error.message,
    });
  }
};

/**
 * Mark entry as favorite
 * POST /api/trips/:tripId/journal/:entryId/favorite
 */
exports.markEntryAsFavorite = async (req, res) => {
  try {
    const { tripId, entryId } = req.params;

    const journal = await TripJournal.findOneAndUpdate(
      { tripId, userId: req.userId, 'entries.entryId': entryId },
      {
        $set: { 'entries.$.isFavorite': true },
      },
      { new: true }
    );

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found',
      });
    }

    res.json({
      success: true,
      message: 'Entry marked as favorite',
    });
  } catch (error) {
    console.error('Mark as favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as favorite',
      error: error.message,
    });
  }
};

/**
 * Get journal insights
 * GET /api/trips/:tripId/journal/insights
 */
exports.getJournalInsights = async (req, res) => {
  try {
    const { tripId } = req.params;

    const journal = await TripJournal.findOne({ tripId, userId: req.userId });

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal not found',
      });
    }

    res.json({
      success: true,
      data: {
        totalEntries: journal.totalEntries,
        totalWords: journal.totalWords,
        averageMood: journal.averageMood,
        dominantTone: journal.dominantTone,
        dominantSentiment: journal.dominantSentiment,
        mostFrequentTags: journal.mostFrequentTags,
        overallTheme: journal.overallTheme,
        insights: journal.insights,
      },
    });
  } catch (error) {
    console.error('Get journal insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get insights',
      error: error.message,
    });
  }
};

module.exports = exports;
