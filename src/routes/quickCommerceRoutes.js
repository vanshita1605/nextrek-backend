// src/routes/quickCommerceRoutes.js
const express = require('express');
const router = express.Router();
const quickCommerceController = require('../controllers/quickCommerceController');
const { authMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Middleware to check validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array(),
    });
  }
  next();
};

// ============ Product Listing API ============

/**
 * GET /api/quickcommerce/products
 * Get all products with filters
 */
router.get('/products', quickCommerceController.getProducts);

/**
 * GET /api/quickcommerce/products/category/:category
 * Get products by category
 */
router.get('/products/category/:category', quickCommerceController.getProductsByCategory);

/**
 * GET /api/quickcommerce/products/search
 * Search products
 */
router.get('/products/search', quickCommerceController.searchProducts);

/**
 * GET /api/quickcommerce/products/:productId
 * Get product details
 */
router.get('/products/:productId', quickCommerceController.getProductDetail);

// ============ Order Creation API ============

/**
 * POST /api/quickcommerce/orders
 * Create new order
 */
router.post(
  '/orders',
  authMiddleware,
  [
    body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
    body('items.*.productId').isMongoId().withMessage('Valid product ID required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('deliveryAddress').isObject().withMessage('Delivery address required'),
    body('deliveryAddress.name').notEmpty().withMessage('Name required'),
    body('deliveryAddress.address').notEmpty().withMessage('Address required'),
    body('deliveryAddress.phone').isMobilePhone().withMessage('Valid phone required'),
    body('paymentMethod').optional().isIn(['credit_card', 'debit_card', 'upi', 'wallet', 'cash_on_delivery']),
  ],
  handleValidationErrors,
  quickCommerceController.createOrder
);

/**
 * GET /api/quickcommerce/orders
 * Get user orders list
 */
router.get('/orders', authMiddleware, quickCommerceController.getUserOrders);

/**
 * GET /api/quickcommerce/orders/:orderId
 * Get order details
 */
router.get('/orders/:orderId', authMiddleware, quickCommerceController.getOrderDetails);

/**
 * POST /api/quickcommerce/orders/:orderId/cancel
 * Cancel order
 */
router.post(
  '/orders/:orderId/cancel',
  authMiddleware,
  [body('reason').optional().isString()],
  handleValidationErrors,
  quickCommerceController.cancelOrder
);

/**
 * POST /api/quickcommerce/orders/:orderId/rate
 * Rate order
 */
router.post(
  '/orders/:orderId/rate',
  authMiddleware,
  [
    body('ratings.overall').isInt({ min: 1, max: 5 }).withMessage('Overall rating required (1-5)'),
    body('ratings.delivery').optional().isInt({ min: 1, max: 5 }),
    body('ratings.quality').optional().isInt({ min: 1, max: 5 }),
    body('review').optional().isString(),
  ],
  handleValidationErrors,
  quickCommerceController.rateOrder
);

// ============ Order Tracking API ============

/**
 * GET /api/quickcommerce/orders/:orderId/track
 * Real-time order tracking
 */
router.get('/orders/:orderId/track', authMiddleware, quickCommerceController.trackOrder);

/**
 * GET /api/quickcommerce/orders/:orderId/tracking-history
 * Get complete tracking history
 */
router.get(
  '/orders/:orderId/tracking-history',
  authMiddleware,
  quickCommerceController.getTrackingHistory
);

// ============ Partner API Integration ============

/**
 * POST /api/quickcommerce/partners/auth
 * Partner login/registration
 */
router.post(
  '/partners/auth',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('action').isIn(['login', 'register']).withMessage('Valid action required'),
  ],
  handleValidationErrors,
  quickCommerceController.partnerAuth
);

/**
 * GET /api/quickcommerce/partners/dashboard
 * Partner dashboard stats
 */
router.get('/partners/dashboard', authMiddleware, quickCommerceController.getPartnerDashboard);

/**
 * POST /api/quickcommerce/partners/sync-products
 * Sync products via API
 */
router.post(
  '/partners/sync-products',
  [
    body('apiKey').notEmpty().withMessage('API key required'),
    body('signature').notEmpty().withMessage('Signature required'),
    body('products').isArray().withMessage('Products must be an array'),
  ],
  handleValidationErrors,
  quickCommerceController.syncPartnerProducts
);

/**
 * GET /api/quickcommerce/partners/orders
 * Get partner orders
 */
router.get('/partners/orders', authMiddleware, quickCommerceController.getPartnerOrders);

/**
 * POST /api/quickcommerce/partners/orders/:orderId/status
 * Update order status by partner
 */
router.post(
  '/partners/orders/:orderId/status',
  authMiddleware,
  [
    body('status')
      .isIn(['pending', 'confirmed', 'preparing', 'ready_for_delivery', 'out_for_delivery', 'delivered', 'cancelled'])
      .withMessage('Valid status required'),
    body('notes').optional().isString(),
  ],
  handleValidationErrors,
  quickCommerceController.updateOrderStatusByPartner
);

module.exports = router;
