import crypto from 'node:crypto';
import { validationResult } from 'express-validator';
import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import { ApiError } from '../utils/apiError.js';

function getOrganizationPaymentDetails() {
  const upiId = process.env.ORGANIZATION_UPI_ID?.trim() || '';
  const configuredQr = process.env.ORGANIZATION_UPI_QR_URL?.trim() || '';
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('Eventify')}&cu=INR`;
  return {
    upiId,
    qrCodeUrl: configuredQr || (upiId ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiUri)}` : '')
  };
}

export async function createBooking(req, res, next) {
  let reservedEventId;
  let reservedQuantity;
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ApiError(400, 'Please select a valid ticket quantity.', errors.array().map((e) => e.msg));

    const quantity = Number(req.body.quantity);
    const event = await Event.findOneAndUpdate(
      {
        _id: req.body.eventId,
        status: 'published',
        startDate: { $gt: new Date() },
        salesStartDate: { $lte: new Date() },
        salesEndDate: { $gte: new Date() },
        'ticketTypes._id': req.body.ticketTypeId,
        $expr: { $lte: [{ $add: ['$confirmedTickets', quantity] }, '$totalCapacity'] }
      },
      { $inc: { confirmedTickets: quantity } },
      { new: true }
    );
    if (!event) throw new ApiError(409, 'Tickets are unavailable or sales are closed.');

    reservedEventId = event._id;
    reservedQuantity = quantity;

    const ticket = event.ticketTypes.id(req.body.ticketTypeId);
    if (!ticket || quantity > ticket.perUserLimit || quantity > ticket.quantity) {
      await Event.updateOne({ _id: event._id }, { $inc: { confirmedTickets: -quantity } });
      reservedEventId = undefined;
      reservedQuantity = undefined;
      throw new ApiError(400, 'The selected quantity exceeds the ticket limit.');
    }

    const totalAmount = ticket.price * quantity;
    const bookingReference = `EVT-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

    if (totalAmount === 0) {
      const booking = await Booking.create({
        bookingReference,
        user: req.user._id,
        event: event._id,
        ticketType: ticket.name,
        quantity,
        unitPrice: 0,
        totalAmount: 0,
        status: 'confirmed',
        paymentStatus: 'not_required'
      });
      return res.status(201).json({ success: true, data: { booking, payment: null } });
    }

    const booking = await Booking.create({
      bookingReference,
      user: req.user._id,
      event: event._id,
      ticketType: ticket.name,
      quantity,
      unitPrice: ticket.price,
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending'
    });

    res.status(201).json({
      success: true,
      data: {
        booking,
        payment: { amount: totalAmount, ...getOrganizationPaymentDetails() }
      }
    });
  } catch (error) {
    if (reservedEventId && reservedQuantity) {
      await Event.updateOne({ _id: reservedEventId }, { $inc: { confirmedTickets: -reservedQuantity } });
    }
    next(error);
  }
}

export async function submitUpiPayment(req, res, next) {
  try {
    const transactionId = String(req.body.upiTransactionId || '').trim();
    if (transactionId.length < 6 || transactionId.length > 100) throw new ApiError(400, 'Enter a valid UPI transaction ID.');
    const booking = await Booking.findOne({ _id: req.body.bookingId, user: req.user._id, status: 'pending' });
    if (!booking) throw new ApiError(404, 'Pending booking not found.');
    booking.upiTransactionId = transactionId;
    await booking.save();
    res.json({ success: true, data: { booking } });
  } catch (error) {
    next(error);
  }
}

export async function confirmUpiPayment(req, res, next) {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, status: 'pending' });
    if (!booking) throw new ApiError(404, 'Pending booking not found.');
    if (!booking.upiTransactionId) throw new ApiError(400, 'The attendee has not submitted a UPI transaction ID.');
    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    await booking.save();
    res.json({ success: true, data: { booking } });
  } catch (error) {
    next(error);
  }
}

export async function listMyBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('event', 'title posterUrl venue city startDate endDate category')
      .sort({ bookedAt: -1 });
    res.json({ success: true, data: { bookings } });
  } catch (error) {
    next(error);
  }
}

export async function getBooking(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event', 'title posterUrl venue city startDate endDate category')
      .populate('user', 'name email');

    if (!booking) throw new ApiError(404, 'Booking not found.');

    // Owner or admin can access
    const isOwner = booking.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) throw new ApiError(403, 'You do not have access to this booking.');

    res.json({ success: true, data: { booking } });
  } catch (error) {
    next(error);
  }
}

export async function cancelBooking(req, res, next) {
  try {
    const filter = {
      _id: req.params.id,
      status: { $in: ['confirmed', 'pending'] }
    };
    // Regular users can only cancel their own bookings
    if (req.user.role !== 'admin') {
      filter.user = req.user._id;
    }

    const booking = await Booking.findOne(filter).populate('event', 'startDate');
    if (!booking) throw new ApiError(404, 'Booking not found or already cancelled.');
    if (booking.event.startDate <= new Date()) throw new ApiError(400, 'Bookings cannot be cancelled after the event starts.');

    booking.status = 'cancelled';
    booking.paymentStatus = booking.paymentStatus === 'paid' ? 'paid' : 'failed';
    booking.cancelledAt = new Date();
    await booking.save();
    await Event.updateOne({ _id: booking.event._id }, { $inc: { confirmedTickets: -booking.quantity } });

    res.json({ success: true, data: { booking } });
  } catch (error) {
    next(error);
  }
}
