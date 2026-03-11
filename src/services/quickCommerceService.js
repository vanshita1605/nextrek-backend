// src/services/quickCommerceService.js
const QuickCommerceProduct = require('../models/QuickCommerceProduct');
const QuickCommerceOrder = require('../models/QuickCommerceOrder');
const OrderTracking = require('../models/OrderTracking');
const QuickCommercePartner = require('../models/QuickCommercePartner');
const PartnerAccount = require('../models/PartnerAccount');
const crypto = require('crypto');

class QuickCommerceService {
  /**
   * Get products by filters
   */
  static async getProducts(filters = {}) {
    try {
      let query = { isDeleted: false, isActive: true };

      if (filters.category) query.category = filters.category;
      if (filters.partnerId) query.partnerId = filters.partnerId;
      if (filters.search) {
        query.$text = { $search: filters.search };
      }
      if (filters.minPrice || filters.maxPrice) {
        query.price = {};
        if (filters.minPrice) query.price.$gte = filters.minPrice;
        if (filters.maxPrice) query.price.$lte = filters.maxPrice;
      }

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const products = await QuickCommerceProduct.find(query)
        .populate('partnerId', 'businessName rating')
        .limit(limit)
        .skip(skip)
        .sort({ rating: -1, createdAt: -1 });

      const total = await QuickCommerceProduct.countDocuments(query);

      return {
        success: true,
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Get products error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get product details
   */
  static async getProductDetail(productId) {
    try {
      const product = await QuickCommerceProduct.findById(productId).populate(
        'partnerId',
        'businessName rating deliveryRadius address'
      );

      if (!product) {
        return { success: false, message: 'Product not found' };
      }

      return { success: true, product };
    } catch (error) {
      console.error('Get product detail error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create order
   */
  static async createOrder(userId, orderData) {
    try {
      const { items, deliveryAddress, paymentMethod, appliedCoupon } = orderData;

      // Validate items and calculate totals
      let totalAmount = 0;
      const processedItems = [];

      if (!items || items.length === 0) {
        return { success: false, message: 'No items in order' };
      }

      for (const item of items) {
        if (!item.productId) {
          return { success: false, message: 'Product ID is required for each item' };
        }

        const product = await QuickCommerceProduct.findById(item.productId).lean();

        if (!product) {
          return { success: false, message: `Product not found with ID: ${item.productId}. Please check the product ID.` };
        }

        // Use product name or fallback to category
        const productName = product.productName || product.category || `Product ${item.productId}`;

        if (product.stock < item.quantity) {
          return { success: false, message: `Insufficient stock for ${productName}. Available: ${product.stock}, Requested: ${item.quantity}` };
        }

        // Validate product prices
        const basePrice = parseFloat(product.price);
        const discountedPrice = product.discountedPrice ? parseFloat(product.discountedPrice) : basePrice;
        const quantity = parseInt(item.quantity);

        if (isNaN(basePrice) || basePrice <= 0) {
          return { success: false, message: `Invalid price for product "${productName}": Price must be a positive number (Got: ${product.price})` };
        }

        if (isNaN(quantity) || quantity <= 0) {
          return { success: false, message: `Invalid quantity for product "${productName}": Quantity must be a positive number (Got: ${item.quantity})` };
        }

        if (isNaN(discountedPrice) || discountedPrice < 0) {
          return { success: false, message: `Invalid discounted price for product "${productName}"` };
        }

        const itemPrice = discountedPrice || basePrice;
        const itemTotal = itemPrice * quantity;

        totalAmount += itemTotal;
        processedItems.push({
          productId: product._id,
          productName: productName,
          quantity,
          price: basePrice,
          discountedPrice: discountedPrice !== basePrice ? discountedPrice : undefined,
          totalPrice: Math.round(itemTotal * 100) / 100, // Round to 2 decimals
          image: product.image,
        });
      }

      // Validate total amount
      if (isNaN(totalAmount) || totalAmount <= 0) {
        return { 
          success: false, 
          message: 'Invalid total amount - ensure all products have valid prices' 
        };
      }

      // Calculate fees and taxes
      const deliveryFee = totalAmount > 500 ? 0 : 40;
      const taxRate = 0.05;
      const taxAmount = totalAmount * taxRate;
      let discountAmount = 0;

      // Apply coupon if provided
      if (appliedCoupon) {
        discountAmount = Math.min(totalAmount * 0.1, 100); // 10% discount, max 100
      }

      const calculatedFinalAmount = totalAmount + deliveryFee + taxAmount - discountAmount;
      
      // Final validation
      if (isNaN(calculatedFinalAmount) || calculatedFinalAmount < 0) {
        console.error('Calculation error:', { totalAmount, deliveryFee, taxAmount, discountAmount, calculatedFinalAmount });
        return { 
          success: false, 
          message: 'Failed to calculate order total' 
        };
      }

      const finalAmount = Math.round(calculatedFinalAmount * 100) / 100;

      // Generate order ID
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      // Determine partner from first product
      const firstProduct = await QuickCommerceProduct.findById(items[0].productId);

      if (!firstProduct || !firstProduct.partnerId) {
        return { 
          success: false, 
          message: 'Unable to determine partner for the product' 
        };
      }

      const order = new QuickCommerceOrder({
        orderId,
        userId,
        partnerId: firstProduct.partnerId,
        items: processedItems,
        totalAmount: Math.round(totalAmount * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
        deliveryFee: Math.round(deliveryFee * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        finalAmount,
        deliveryAddress,
        paymentMethod,
        appliedCoupon,
        status: 'pending',
        paymentStatus: 'pending',
        estimatedDeliveryTime: new Date(Date.now() + 30 * 60000), // 30 minutes
      });

      await order.save();

      // Create order tracking
      const tracking = new OrderTracking({
        orderId: order._id,
        userId,
        currentStatus: 'pending',
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        events: [
          {
            status: 'pending',
            description: 'Order placed',
            timestamp: new Date(),
          },
        ],
      });

      await tracking.save();

      // Update product stock
      for (const item of items) {
        await QuickCommerceProduct.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
      }

      // Update partner stats
      await QuickCommercePartner.findByIdAndUpdate(
        firstProduct.partnerId,
        {
          $inc: {
            totalOrders: 1,
            totalEarnings: finalAmount * (1 - 0.15), // 15% commission
          },
        },
        { new: true }
      );

      return {
        success: true,
        order,
        message: 'Order created successfully',
      };
    } catch (error) {
      console.error('Create order error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get order by ID
   */
  static async getOrder(orderId, userId) {
    try {
      const order = await QuickCommerceOrder.findById(orderId)
        .populate('userId', 'name email phone')
        .populate('partnerId', 'businessName phone')
        .populate('items.productId');

      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      // Verify user authorization
      if (order.userId._id.toString() !== userId && order.userId._id !== userId) {
        return { success: false, message: 'Unauthorized access' };
      }

      const tracking = await OrderTracking.findOne({ orderId: order._id });

      return {
        success: true,
        order: {
          ...order.toObject(),
          tracking,
        },
      };
    } catch (error) {
      console.error('Get order error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user orders
   */
  static async getUserOrders(userId, filters = {}) {
    try {
      let query = { userId };

      if (filters.status) query.status = filters.status;
      if (filters.fromDate && filters.toDate) {
        query.createdAt = {
          $gte: new Date(filters.fromDate),
          $lte: new Date(filters.toDate),
        };
      }

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      const orders = await QuickCommerceOrder.find(query)
        .populate('partnerId', 'businessName')
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 });

      const total = await QuickCommerceOrder.countDocuments(query);

      return {
        success: true,
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Get user orders error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId, newStatus, notes = '') {
    try {
      const order = await QuickCommerceOrder.findByIdAndUpdate(
        orderId,
        { status: newStatus, updatedAt: new Date() },
        { new: true }
      );

      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      // Update tracking
      const tracking = await OrderTracking.findOneAndUpdate(
        { orderId },
        {
          currentStatus: newStatus,
          updatedAt: new Date(),
          $push: {
            events: {
              status: newStatus,
              description: notes || `Order status updated to ${newStatus}`,
              timestamp: new Date(),
            },
          },
        },
        { new: true }
      );

      return {
        success: true,
        order,
        tracking,
      };
    } catch (error) {
      console.error('Update order status error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track order in real-time
   */
  static async trackOrder(orderId) {
    try {
      const tracking = await OrderTracking.findOne({ orderId })
        .populate('deliveryAgent.agentId', 'name phone rating');

      if (!tracking) {
        return { success: false, message: 'Tracking not found' };
      }

      return {
        success: true,
        tracking,
      };
    } catch (error) {
      console.error('Track order error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update order location for tracking
   */
  static async updateOrderLocation(orderId, latitude, longitude, address = '') {
    try {
      const tracking = await OrderTracking.findOneAndUpdate(
        { orderId },
        {
          currentLocation: {
            latitude,
            longitude,
            address,
            lastUpdated: new Date(),
          },
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!tracking) {
        return { success: false, message: 'Tracking not found' };
      }

      return {
        success: true,
        tracking,
      };
    } catch (error) {
      console.error('Update order location error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Partner API: Create/Update API credentials
   */
  static async createPartnerApiCredentials(partnerId) {
    try {
      const apiKey = crypto.randomBytes(32).toString('hex');
      const apiSecret = crypto.randomBytes(32).toString('hex');

      const partnerAccount = await PartnerAccount.findOneAndUpdate(
        { partnerId },
        {
          partnerId,
          apiKey,
          apiSecret,
          webhookSecret: crypto.randomBytes(32).toString('hex'),
          connectedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      return {
        success: true,
        apiKey,
        apiSecret,
        webhookSecret: partnerAccount.webhookSecret,
      };
    } catch (error) {
      console.error('Create API credentials error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate partner API request
   */
  static async validatePartnerApiRequest(apiKey, signature, payload) {
    try {
      const partnerAccount = await PartnerAccount.findOne({ apiKey });

      if (!partnerAccount) {
        return { success: false, message: 'Invalid API key' };
      }

      if (partnerAccount.integrationStatus !== 'active') {
        return { success: false, message: 'Integration not active' };
      }

      // Verify signature
      const hash = crypto
        .createHmac('sha256', partnerAccount.apiSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (hash !== signature) {
        return { success: false, message: 'Invalid signature' };
      }

      return {
        success: true,
        partnerAccount,
      };
    } catch (error) {
      console.error('Validate API request error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync products from partner
   */
  static async syncPartnerProducts(partnerId, products) {
    try {
      let insertedCount = 0;
      let updatedCount = 0;

      for (const productData of products) {
        const existing = await QuickCommerceProduct.findOne({
          partnerId,
          sku: productData.sku,
        });

        if (existing) {
          await QuickCommerceProduct.findByIdAndUpdate(existing._id, productData, {
            new: true,
          });
          updatedCount++;
        } else {
          await QuickCommerceProduct.create({
            ...productData,
            partnerId,
          });
          insertedCount++;
        }
      }

      return {
        success: true,
        insertedCount,
        updatedCount,
        message: `Synced ${insertedCount} new and updated ${updatedCount} existing products`,
      };
    } catch (error) {
      console.error('Sync products error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(orderId, userId, reason = '') {
    try {
      const order = await QuickCommerceOrder.findById(orderId);

      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      if (order.userId.toString() !== userId.toString()) {
        return { success: false, message: 'Unauthorized' };
      }

      if (!['pending', 'confirmed'].includes(order.status)) {
        return { success: false, message: 'Order cannot be cancelled in current status' };
      }

      // Update order
      order.status = 'cancelled';
      order.cancellationReason = reason;
      order.cancelledAt = new Date();
      order.refundStatus = 'requested';
      order.refundAmount = order.finalAmount;
      await order.save();

      // Update tracking
      await OrderTracking.findOneAndUpdate(
        { orderId: order._id },
        {
          currentStatus: 'cancelled',
          $push: {
            events: {
              status: 'cancelled',
              description: `Order cancelled. Reason: ${reason}`,
              timestamp: new Date(),
            },
          },
        }
      );

      // Restore product stock
      for (const item of order.items) {
        await QuickCommerceProduct.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } },
          { new: true }
        );
      }

      return {
        success: true,
        message: 'Order cancelled successfully',
        refundAmount: order.refundAmount,
      };
    } catch (error) {
      console.error('Cancel order error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Rate order
   */
  static async rateOrder(orderId, userId, ratings, review = '') {
    try {
      const order = await QuickCommerceOrder.findById(orderId);

      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      if (order.userId.toString() !== userId.toString()) {
        return { success: false, message: 'Unauthorized' };
      }

      order.ratings = {
        overall: ratings.overall,
        delivery: ratings.delivery,
        quality: ratings.quality,
        ratedAt: new Date(),
      };

      if (review) {
        order.review = review;
      }

      await order.save();

      // Update partner rating
      const allRatings = await QuickCommerceOrder.aggregate([
        { $match: { partnerId: order.partnerId, 'ratings.overall': { $exists: true } } },
        {
          $group: {
            _id: '$partnerId',
            avgRating: { $avg: '$ratings.overall' },
            count: { $sum: 1 },
          },
        },
      ]);

      if (allRatings.length > 0) {
        await QuickCommercePartner.findByIdAndUpdate(
          order.partnerId,
          {
            rating: allRatings[0].avgRating,
            reviewCount: allRatings[0].count,
          }
        );
      }

      return {
        success: true,
        message: 'Order rated successfully',
      };
    } catch (error) {
      console.error('Rate order error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = QuickCommerceService;
