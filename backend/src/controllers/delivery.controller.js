const Delivery = require('../models/delivery.model');
const Order = require('../models/order.model');
const { validationResult } = require('express-validator');

const deliveryController = {
  // Create a new delivery
  createDelivery: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const order = await Order.findById(req.body.order);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.status === 'Cancelled') {
        return res.status(400).json({ message: 'Cannot create delivery for cancelled order' });
      }

      const delivery = new Delivery(req.body);
      await delivery.save();

      // Update order status
      order.status = 'confirmed';
      await order.save();

      res.status(201).json(delivery);
    } catch (error) {
      res.status(500).json({ message: 'Error creating delivery', error: error.message });
    }
  },

  // Get all deliveries
  getAllDeliveries: async (req, res) => {
    try {
      const { status, sort, limit = 10, page = 1 } = req.query;
      const query = {};
      
      if (status) {
        query.status = status;
      }

      const sortOptions = {};
      if (sort) {
        const [field, order] = sort.split(':');
        sortOptions[field] = order === 'desc' ? -1 : 1;
      }

      const deliveries = await Delivery.find(query)
        .populate('order')
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await Delivery.countDocuments(query);

      res.json({
        deliveries,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching deliveries', error: error.message });
    }
  },

  // Get delivery by ID
  getDeliveryById: async (req, res) => {
    try {
      const delivery = await Delivery.findById(req.params.id).populate('order');
      if (!delivery) {
        return res.status(404).json({ message: 'Delivery not found' });
      }
      res.json(delivery);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching delivery', error: error.message });
    }
  },

  // Update delivery status
  updateDeliveryStatus: async (req, res) => {
    try {
      const { status, notes } = req.body;
      const delivery = await Delivery.findById(req.params.id);
      
      if (!delivery) {
        return res.status(404).json({ message: 'Delivery not found' });
      }

      delivery.status = status;
      if (notes) {
        delivery.notes = notes;
      }

      // Add delivery attempt
      delivery.deliveryAttempts.push({
        attemptDate: new Date(),
        status,
        notes
      });

      // If delivered, update actualDeliveryDate and order status
      if (status === 'Delivered') {
        delivery.actualDeliveryDate = new Date();
        const order = await Order.findById(delivery.order);
        if (order) {
          order.status = 'Delivered';
          await order.save();
        }
      }

      await delivery.save();
      res.json(delivery);
    } catch (error) {
      res.status(500).json({ message: 'Error updating delivery status', error: error.message });
    }
  },

  // Get deliveries by order ID
  getDeliveriesByOrder: async (req, res) => {
    try {
      const deliveries = await Delivery.find({ order: req.params.orderId })
        .populate('order')
        .sort('-createdAt');
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching deliveries', error: error.message });
    }
  },

  // Track delivery
  trackDelivery: async (req, res) => {
    try {
      const delivery = await Delivery.findOne({ 
        trackingNumber: req.params.trackingNumber 
      }).populate('order');
      
      if (!delivery) {
        return res.status(404).json({ message: 'Delivery not found' });
      }

      res.json({
        trackingNumber: delivery.trackingNumber,
        status: delivery.status,
        expectedDeliveryDate: delivery.expectedDeliveryDate,
        actualDeliveryDate: delivery.actualDeliveryDate,
        deliveryAttempts: delivery.deliveryAttempts,
        deliveryPartner: delivery.deliveryPartner
      });
    } catch (error) {
      res.status(500).json({ message: 'Error tracking delivery', error: error.message });
    }
  }
};

module.exports = deliveryController; 