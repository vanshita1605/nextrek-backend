// src/controllers/quickCommerceController.js
const QuickCommerceProduct = require('../models/QuickCommerceProduct');
const QuickCommerceOrder = require('../models/QuickCommerceOrder');
const OrderTracking = require('../models/OrderTracking');
const QuickCommercePartner = require('../models/QuickCommercePartner');
const PartnerAccount = require('../models/PartnerAccount');
const QuickCommerceService = require('../services/quickCommerceService');

// ============ Product Listing API ============

/**
 * Get all products with filters
 * GET /api/quickcommerce/products
 */
exports.getProducts = async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      partnerId: req.query.partnerId,
      search: req.query.search,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : null,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : null,
      page: req.query.page || 1,
      limit: req.query.limit || 20,
    };

    const result = await QuickCommerceService.getProducts(filters);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get products',
      error: error.message,
    });
  }
};

/**
 * Get product by category
 * GET /api/quickcommerce/products/category/:category
 */
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;

    const skip = (page - 1) * limit;

    const products = await QuickCommerceProduct.find({
      category,
      isActive: true,
      isDeleted: false,
    })
      .populate('partnerId', 'businessName rating')
      .skip(skip)
      .limit(limit)
      .sort({ rating: -1 });

    const total = await QuickCommerceProduct.countDocuments({
      category,
      isActive: true,
      isDeleted: false,
    });

    res.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get products',
      error: error.message,
    });
  }
};

/**
 * Get product details
 * GET /api/quickcommerce/products/:productId
 */
exports.getProductDetail = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await QuickCommerceService.getProductDetail(productId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get product detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product details',
      error: error.message,
    });
  }
};

/**
 * Search products
 * GET /api/quickcommerce/products/search/query
 */
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    }

    const skip = (page - 1) * limit;

    const products = await QuickCommerceProduct.find(
      { $text: { $search: q }, isActive: true, isDeleted: false },
      { score: { $meta: 'textScore' } }
    )
      .populate('partnerId', 'businessName rating')
      .skip(skip)
      .limit(limit)
      .sort({ score: { $meta: 'textScore' } });

    const total = await QuickCommerceProduct.countDocuments({
      $text: { $search: q },
      isActive: true,
      isDeleted: false,
    });

    res.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: error.message,
    });
  }
};

// ============ Order Creation API ============

/**
 * Create order
 * POST /api/quickcommerce/orders
 */
exports.createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod, appliedCoupon, specialInstructions } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must have at least one item',
      });
    }

    if (!deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required',
      });
    }

    const result = await QuickCommerceService.createOrder(req.userId, {
      items,
      deliveryAddress,
      paymentMethod: paymentMethod || 'upi',
      appliedCoupon,
      specialInstructions,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: result.order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
    });
  }
};

/**
 * Get order details
 * GET /api/quickcommerce/orders/:orderId
 */
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await QuickCommerceService.getOrder(orderId, req.userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      data: result.order,
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order details',
      error: error.message,
    });
  }
};

/**
 * Get user orders
 * GET /api/quickcommerce/orders
 */
exports.getUserOrders = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      page: req.query.page || 1,
      limit: req.query.limit || 10,
    };

    const result = await QuickCommerceService.getUserOrders(req.userId, filters);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: error.message,
    });
  }
};

/**
 * Cancel order
 * POST /api/quickcommerce/orders/:orderId/cancel
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const result = await QuickCommerceService.cancelOrder(orderId, req.userId, reason);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message,
    });
  }
};

/**
 * Rate order
 * POST /api/quickcommerce/orders/:orderId/rate
 */
exports.rateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { ratings, review } = req.body;

    if (!ratings || !ratings.overall) {
      return res.status(400).json({
        success: false,
        message: 'Ratings are required',
      });
    }

    const result = await QuickCommerceService.rateOrder(orderId, req.userId, ratings, review);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Rate order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate order',
      error: error.message,
    });
  }
};

// ============ Order Tracking API ============

/**
 * Track order in real-time
 * GET /api/quickcommerce/orders/:orderId/track
 */
exports.trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order first to verify authorization
    const order = await QuickCommerceOrder.findById(orderId);
    if (!order || order.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    const result = await QuickCommerceService.trackOrder(orderId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      data: result.tracking,
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track order',
      error: error.message,
    });
  }
};

/**
 * Get tracking history
 * GET /api/quickcommerce/orders/:orderId/tracking-history
 */
exports.getTrackingHistory = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await QuickCommerceOrder.findById(orderId);
    if (!order || order.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    const tracking = await OrderTracking.findOne({ orderId });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'Tracking not found',
      });
    }

    res.json({
      success: true,
      data: {
        currentStatus: tracking.currentStatus,
        events: tracking.events.sort((a, b) => b.timestamp - a.timestamp),
        deliveryAgent: tracking.deliveryAgent,
        currentLocation: tracking.currentLocation,
        estimatedDeliveryTime: tracking.estimatedDeliveryTime,
      },
    });
  } catch (error) {
    console.error('Get tracking history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tracking history',
      error: error.message,
    });
  }
};

// ============ Partner API Integration ============

/**
 * Partner login/registration
 * POST /api/quickcommerce/partners/auth
 */
exports.partnerAuth = async (req, res) => {
  try {
    const { email, password, action } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    if (action === 'login') {
      const partner = await QuickCommercePartner.findOne({ email });

      if (!partner || !(await partner.matchPassword(password))) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { partnerId: partner._id, role: 'partner' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        token,
        partner: {
          id: partner._id,
          businessName: partner.businessName,
          email: partner.email,
        },
      });
    } else if (action === 'register') {
      const existingPartner = await QuickCommercePartner.findOne({ email });

      if (existingPartner) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered',
        });
      }

      const partner = new QuickCommercePartner(req.body);
      await partner.save();

      // Create API credentials
      const credentials = await QuickCommerceService.createPartnerApiCredentials(partner._id);

      res.status(201).json({
        success: true,
        message: 'Partner registered successfully',
        partner: {
          id: partner._id,
          businessName: partner.businessName,
          email: partner.email,
        },
        apiCredentials: credentials,
      });
    }
  } catch (error) {
    console.error('Partner auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message,
    });
  }
};

/**
 * Get partner dashboard stats
 * GET /api/quickcommerce/partners/dashboard
 */
exports.getPartnerDashboard = async (req, res) => {
  try {
    const partner = await QuickCommercePartner.findById(req.partnerId);

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found',
      });
    }

    const orders = await QuickCommerceOrder.countDocuments({ partnerId: req.partnerId });
    const products = await QuickCommerceProduct.countDocuments({ partnerId: req.partnerId });
    const totalEarnings = partner.totalEarnings;
    const rating = partner.rating;

    res.json({
      success: true,
      data: {
        businessName: partner.businessName,
        rating,
        totalEarnings,
        totalOrders: orders,
        totalProducts: products,
        isVerified: partner.isVerified,
        commissionRate: partner.commissionRate,
      },
    });
  } catch (error) {
    console.error('Get partner dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard',
      error: error.message,
    });
  }
};

/**
 * Sync products via API
 * POST /api/quickcommerce/partners/sync-products
 */
exports.syncPartnerProducts = async (req, res) => {
  try {
    const { apiKey, signature, products } = req.body;

    if (!apiKey || !signature || !products) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const validation = await QuickCommerceService.validatePartnerApiRequest(
      apiKey,
      signature,
      products
    );

    if (!validation.success) {
      return res.status(401).json(validation);
    }

    const result = await QuickCommerceService.syncPartnerProducts(
      validation.partnerAccount.partnerId,
      products
    );

    res.json(result);
  } catch (error) {
    console.error('Sync products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync products',
      error: error.message,
    });
  }
};

/**
 * Get partner orders
 * GET /api/quickcommerce/partners/orders
 */
exports.getPartnerOrders = async (req, res) => {
  try {
    const status = req.query.status;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    let query = { partnerId: req.partnerId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const orders = await QuickCommerceOrder.find(query)
      .populate('userId', 'name email phone')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await QuickCommerceOrder.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get partner orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: error.message,
    });
  }
};

/**
 * Update order status by partner
 * POST /api/quickcommerce/partners/orders/:orderId/status
 */
exports.updateOrderStatusByPartner = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    const order = await QuickCommerceOrder.findById(orderId);

    if (!order || order.partnerId.toString() !== req.partnerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    const result = await QuickCommerceService.updateOrderStatus(orderId, status, notes);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Order status updated',
      data: result.order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message,
    });
  }
};

module.exports = exports;
