import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import { ApiError } from '../utils/apiError.js';

function validateRequest(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    throw new ApiError(400, 'Please correct the highlighted fields.', result.array().map((error) => error.msg));
  }
}

function eventPayload(body) {
  return {
    title: body.title,
    description: body.description,
    category: body.category,
    posterUrl: body.posterUrl,
    venue: body.venue,
    address: body.address,
    city: body.city,
    startDate: body.startDate,
    endDate: body.endDate,
    totalCapacity: body.totalCapacity,
    ticketTypes: body.ticketTypes,
    salesStartDate: body.salesStartDate,
    salesEndDate: body.salesEndDate,
    status: body.status || 'draft'
  };
}

function validateDates(payload) {
  const start = new Date(payload.startDate);
  const end = new Date(payload.endDate);
  const salesStart = new Date(payload.salesStartDate);
  const salesEnd = new Date(payload.salesEndDate);
  if ([start, end, salesStart, salesEnd].some((date) => Number.isNaN(date.getTime()))) {
    throw new ApiError(400, 'All event dates must be valid.');
  }
  if (end <= start) throw new ApiError(400, 'Event end date must be after the start date.');
  if (salesEnd <= salesStart) throw new ApiError(400, 'Ticket sales end date must be after the start date.');
  if (payload.ticketTypes.reduce((total, ticket) => total + Number(ticket.quantity), 0) < Number(payload.totalCapacity)) {
    throw new ApiError(400, 'Ticket type quantities must cover the event capacity.');
  }
}

async function getAvailability(eventId) {
  const now = new Date();
  const [result] = await Booking.aggregate([
    { $match: { event: new mongoose.Types.ObjectId(eventId), status: { $in: ['confirmed', 'pending'] } } },
    { $group: { _id: null, ticketsSold: { $sum: '$quantity' } } }
  ]);
  const event = await Event.findById(eventId).select('totalCapacity ticketTypes salesStartDate salesEndDate status startDate');
  if (!event) throw new ApiError(404, 'Event not found.');
  const ticketsSold = result?.ticketsSold || 0;
  return { totalCapacity: event.totalCapacity, ticketsSold, availableTickets: Math.max(0, event.totalCapacity - ticketsSold), ticketTypes: event.ticketTypes, salesStartDate: event.salesStartDate, salesEndDate: event.salesEndDate, salesOpen: event.salesStartDate <= now && event.salesEndDate >= now, status: event.status, startDate: event.startDate };
}

export async function listEvents(req, res, next) {
  try {
    const { search, category, city, sort = 'upcoming', page = 1, limit = 12 } = req.query;
    const now = new Date();
    const filter = { status: 'published', startDate: { $gte: now }, salesStartDate: { $lte: now }, salesEndDate: { $gte: now } };
    if (category) filter.category = new RegExp(`^${String(category).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    if (city) filter.city = new RegExp(String(city).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (search) filter.$text = { $search: search };
    const sortMap = { upcoming: { startDate: 1 }, newest: { createdAt: -1 }, price: { 'ticketTypes.0.price': 1 } };
    const pageNumber = Math.max(1, Number(page));
    const pageSize = Math.min(50, Math.max(1, Number(limit)));
    const [events, total] = await Promise.all([
      Event.find(filter).sort(sortMap[sort] || sortMap.upcoming).skip((pageNumber - 1) * pageSize).limit(pageSize).lean(),
      Event.countDocuments(filter)
    ]);
    res.json({ success: true, data: { events, pagination: { page: pageNumber, limit: pageSize, total, pages: Math.ceil(total / pageSize) } } });
  } catch (error) {
    next(error);
  }
}

export async function featuredEvents(req, res, next) {
  try {
    const now = new Date();
    const events = await Event.find({ status: 'published', startDate: { $gte: now }, salesStartDate: { $lte: now }, salesEndDate: { $gte: now } }).sort({ startDate: 1 }).limit(6).lean();
    res.json({ success: true, data: { events } });
  } catch (error) {
    next(error);
  }
}

export async function listManagedEvents(req, res, next) {
  try {
    const events = await Event.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, data: { events, pagination: { page: 1, limit: 100, total: events.length, pages: 1 } } });
  } catch (error) {
    next(error);
  }
}

export async function getEvent(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid event ID.');
    const event = await Event.findOne({ _id: req.params.id, status: { $ne: 'archived' } }).populate('createdBy', 'name');
    if (!event) throw new ApiError(404, 'Event not found.');
    const availability = await getAvailability(event.id);
    res.json({ success: true, data: { event, availability } });
  } catch (error) {
    next(error);
  }
}

export async function getAvailabilityForEvent(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid event ID.');
    res.json({ success: true, data: { availability: await getAvailability(req.params.id) } });
  } catch (error) {
    next(error);
  }
}

export async function createEvent(req, res, next) {
  try {
    validateRequest(req);
    const payload = eventPayload(req.body);
    validateDates(payload);
    const event = await Event.create({ ...payload, createdBy: req.user._id });
    res.status(201).json({ success: true, data: { event } });
  } catch (error) {
    next(error);
  }
}

export async function updateEvent(req, res, next) {
  try {
    validateRequest(req);
    if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid event ID.');
    const payload = eventPayload(req.body);
    validateDates(payload);
    const event = await Event.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!event) throw new ApiError(404, 'Event not found.');
    res.json({ success: true, data: { event } });
  } catch (error) {
    next(error);
  }
}

export async function updateEventStatus(req, res, next) {
  try {
    if (!['draft', 'published', 'cancelled', 'archived'].includes(req.body.status)) throw new ApiError(400, 'Invalid event status.');
    const event = await Event.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
    if (!event) throw new ApiError(404, 'Event not found.');
    res.json({ success: true, data: { event } });
  } catch (error) {
    next(error);
  }
}

export async function deleteEvent(req, res, next) {
  try {
    const bookings = await Booking.countDocuments({ event: req.params.id, status: { $ne: 'cancelled' } });
    if (bookings > 0) throw new ApiError(409, 'Events with bookings cannot be deleted. Archive or cancel the event instead.');
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) throw new ApiError(404, 'Event not found.');
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}
