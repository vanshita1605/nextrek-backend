// src/controllers/reviewController.js
const Review = require('../models/Review');
const Trip = require('../models/Trip');
const TouristPlace = require('../models/TouristPlace');
const FoodSpot = require('../models/FoodSpot');
const Hotel = require('../models/Hotel');
const Transport = require('../models/Transport');
const User = require('../models/User');

// Create review
exports.createReview = async (req, res) => {
  try {
    const { entityType, entityId, rating, title, description, photos } = req.body;

    if (!entityType || !entityId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'EntityType, entityId, and rating (1-5) are required',
      });
    }

    // Check if user already reviewed this entity
    const existingReview = await Review.findOne({
      userId: req.userId,
      entityType,
      entityId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this entity',
      });
    }

    const review = new Review({
      userId: req.userId,
      entityType,
      entityId,
      rating,
      title,
      description,
      photos: photos || [],
      status: 'pending',
    });

    await review.save();

    // Update entity rating
    await updateEntityRating(entityType, entityId);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message,
    });
  }
};

// Get reviews for entity
exports.getEntityReviews = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 10, sortBy = 'recent' } = req.query;

    let query = {
      entityType,
      entityId,
      status: 'approved',
    };

    let sortOptions = { createdAt: -1 };
    if (sortBy === 'rating') {
      sortOptions = { rating: -1 };
    } else if (sortBy === 'helpful') {
      sortOptions = { helpfulCount: -1 };
    }

    const reviews = await Review.find(query)
      .populate('userId', 'firstName lastName profilePhoto')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(query);

    // Calculate average rating
    const allReviews = await Review.find({ entityType, entityId, status: 'approved' });
    const avgRating = allReviews.length > 0
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        reviews,
        averageRating: avgRating,
        totalReviews: allReviews.length,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews',
      error: error.message,
    });
  }
};

// Get user's reviews
exports.getUserReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ userId: req.userId })
      .populate('entityId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ userId: req.userId });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews',
      error: error.message,
    });
  }
};

// Update review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, description, photos } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (review.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this review',
      });
    }

    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (description) review.description = description;
    if (photos) review.photos = photos;

    review.status = 'pending';
    await review.save();

    // Update entity rating
    await updateEntityRating(review.entityType, review.entityId);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review,
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message,
    });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (review.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this review',
      });
    }

    const entityType = review.entityType;
    const entityId = review.entityId;

    await Review.findByIdAndDelete(reviewId);

    // Update entity rating
    await updateEntityRating(entityType, entityId);

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message,
    });
  }
};

// Mark review as helpful
exports.markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check if already marked helpful
    if (review.helpfulBy.includes(req.userId)) {
      return res.status(400).json({
        success: false,
        message: 'You have already marked this as helpful',
      });
    }

    review.helpfulBy.push(req.userId);
    review.helpfulCount = review.helpfulBy.length;
    await review.save();

    res.json({
      success: true,
      message: 'Review marked as helpful',
      data: {
        helpfulCount: review.helpfulCount,
      },
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as helpful',
      error: error.message,
    });
  }
};

// Report review
exports.reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required',
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    review.reports.push({
      reportedBy: req.userId,
      reason,
      description,
      reportedAt: new Date(),
    });

    if (review.reports.length >= 3) {
      review.status = 'flagged';
    }

    await review.save();

    res.json({
      success: true,
      message: 'Review reported successfully',
    });
  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report review',
      error: error.message,
    });
  }
};

// Admin: Approve review
exports.approveReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Check if user is admin
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can approve reviews',
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    review.status = 'approved';
    await review.save();

    // Update entity rating
    await updateEntityRating(review.entityType, review.entityId);

    res.json({
      success: true,
      message: 'Review approved',
      data: review,
    });
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve review',
      error: error.message,
    });
  }
};

// Admin: Reject review
exports.rejectReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    // Check if user is admin
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can reject reviews',
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    review.status = 'rejected';
    review.rejectionReason = reason;
    await review.save();

    res.json({
      success: true,
      message: 'Review rejected',
      data: review,
    });
  } catch (error) {
    console.error('Reject review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject review',
      error: error.message,
    });
  }
};

// Helper function to update entity rating
async function updateEntityRating(entityType, entityId) {
  try {
    const reviews = await Review.find({
      entityType,
      entityId,
      status: 'approved',
    });

    if (reviews.length === 0) return;

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const reviewCount = reviews.length;

    const updateData = {
      rating: parseFloat(avgRating.toFixed(1)),
      reviewCount,
    };

    switch (entityType) {
      case 'TouristPlace':
        await TouristPlace.findByIdAndUpdate(entityId, updateData);
        break;
      case 'FoodSpot':
        await FoodSpot.findByIdAndUpdate(entityId, updateData);
        break;
      case 'Hotel':
        await Hotel.findByIdAndUpdate(entityId, updateData);
        break;
      case 'Transport':
        await Transport.findByIdAndUpdate(entityId, updateData);
        break;
    }
  } catch (error) {
    console.error('Update entity rating error:', error);
  }
}
