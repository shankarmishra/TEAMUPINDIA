const Order = require('../models/order.model');
const Product = require('../models/product.model');
const logger = require('../utils/logger');

/**
 * Create a new order
 * @route POST /api/orders
 * @access Private
 */
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      shippingPrice,
      taxPrice
    } = req.body;

    // Validate items and calculate prices
    const orderItems = [];
    let itemsPrice = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product.name}`
        });
      }

      orderItems.push({
        product: item.product,
        quantity: item.quantity,
        price: product.price
      });

      itemsPrice += product.price * item.quantity;

      // Update product stock
      product.stock -= item.quantity;
      await product.save();
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice: itemsPrice + shippingPrice + taxPrice
    });

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order'
    });
  }
};

/**
 * Get all orders
 * @route GET /api/orders
 * @access Private (Admin)
 */
exports.getOrders = async (req, res) => {
  try {
    const { status, startDate, endDate, sort = '-createdAt' } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name')
      .populate('deliveryAssigned', 'name')
      .sort(sort);

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
};

/**
 * Get single order
 * @route GET /api/orders/:id
 * @access Private
 */
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name price')
      .populate('deliveryAssigned', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to view this order
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      !['admin', 'seller', 'delivery'].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order'
    });
  }
};

/**
 * Update order
 * @route PUT /api/orders/:id
 * @access Private (Admin)
 */
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Don't allow updating certain fields if order is delivered or cancelled
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update delivered or cancelled orders'
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('user', 'name email')
      .populate('items.product', 'name price')
      .populate('deliveryAssigned', 'name');

    res.json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    logger.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order'
    });
  }
};

/**
 * Cancel order
 * @route PUT /api/orders/:id/cancel
 * @access Private
 */
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to cancel this order
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Don't allow cancelling if order is delivered
    if (order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel delivered orders'
      });
    }

    // Update order status and add cancel reason
    order.status = 'cancelled';
    order.cancelReason = req.body.reason || 'customer_request';

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    await order.save();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order'
    });
  }
};

/**
 * Get my orders
 * @route GET /api/orders/my-orders
 * @access Private
 */
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name price')
      .sort('-createdAt');

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    logger.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
};

/**
 * Get seller orders
 * @route GET /api/orders/seller/orders
 * @access Private (Seller)
 */
exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      'items.product': { $in: await Product.find({ seller: req.user._id }).select('_id') }
    })
      .populate('user', 'name email')
      .populate('items.product', 'name price')
      .populate('deliveryAssigned', 'name')
      .sort('-createdAt');

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    logger.error('Get seller orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
};

/**
 * Update order status
 * @route PUT /api/orders/:id/status
 * @access Private (Seller)
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'seller');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if seller owns any product in the order
    const hasSellerProduct = order.items.some(
      item => item.product.seller.toString() === req.user._id.toString()
    );

    if (!hasSellerProduct) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status'
    });
  }
};

/**
 * Assign delivery
 * @route PUT /api/orders/:id/assign-delivery
 * @access Private (Admin, Delivery)
 */
exports.assignDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.deliveryAssigned = deliveryId;
    order.deliveryInfo.status = 'pending';
    await order.save();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Assign delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning delivery'
    });
  }
};

/**
 * Update delivery status
 * @route PUT /api/orders/:id/delivery-status
 * @access Private (Delivery)
 */
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status, location, notes } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if delivery person is assigned to this order
    if (order.deliveryAssigned.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this delivery'
      });
    }

    // Update delivery info
    order.deliveryInfo.status = status;
    if (location) {
      order.deliveryInfo.currentLocation = {
        type: 'Point',
        coordinates: location
      };
    }
    if (notes) {
      order.deliveryInfo.notes = notes;
    }

    // Update timestamps based on status
    if (status === 'picked_up') {
      order.deliveryInfo.pickedUpAt = Date.now();
    } else if (status === 'delivered') {
      order.deliveryInfo.deliveredAt = Date.now();
      order.status = 'delivered';
    }

    await order.save();

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Update delivery status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating delivery status'
    });
  }
}; 