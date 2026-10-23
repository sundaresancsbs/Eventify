import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { ApiError } from '../utils/apiError.js';

export async function getDashboardStats(req, res, next) {
  try {
    const now = new Date();
    const [
      totalEvents,
      publishedEvents,
      draftEvents,
      totalUsers,
      totalBookings,
      confirmedBookings,
      recentBookings,
      upcomingEvents,
      revenue
    ] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ status: 'published' }),
      Event.countDocuments({ status: 'draft' }),
      User.countDocuments({ role: 'user' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.find({ status: { $in: ['confirmed', 'pending'] } })
        .sort({ bookedAt: -1 })
        .limit(10)
        .populate('user', 'name email')
        .populate('event', 'title startDate venue city')
        .lean(),
      Event.find({ status: 'published', startDate: { $gte: now } })
        .sort({ startDate: 1 })
        .limit(5)
        .lean(),
      Booking.aggregate([
        { $match: { status: 'confirmed', paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalEvents,
          publishedEvents,
          draftEvents,
          totalUsers,
          totalBookings,
          confirmedBookings,
          totalRevenue: revenue[0]?.total || 0
        },
        recentBookings,
        upcomingEvents
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function listAllBookings(req, res, next) {
  try {
    const { page = 1, limit = 20, status, eventId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (eventId && mongoose.isValidObjectId(eventId)) filter.event = eventId;

    const pageNumber = Math.max(1, Number(page));
    const pageSize = Math.min(100, Math.max(1, Number(limit)));

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ bookedAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .populate('user', 'name email phone')
        .populate('event', 'title startDate venue city posterUrl')
        .lean(),
      Booking.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: { page: pageNumber, limit: pageSize, total, pages: Math.ceil(total / pageSize) }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function listAllUsers(req, res, next) {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      const regex = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const pageNumber = Math.max(1, Number(page));
    const pageSize = Math.min(100, Math.max(1, Number(limit)));

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      User.countDocuments(filter)
    ]);

    // Attach booking counts
    const userIds = users.map((u) => u._id);
    const bookingCounts = await Booking.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', count: { $sum: 1 } } }
    ]);
    const countMap = Object.fromEntries(bookingCounts.map((b) => [b._id.toString(), b.count]));
    const usersWithCount = users.map((u) => ({ ...u, bookingCount: countMap[u._id.toString()] || 0 }));

    res.json({
      success: true,
      data: {
        users: usersWithCount,
        pagination: { page: pageNumber, limit: pageSize, total, pages: Math.ceil(total / pageSize) }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid user ID.');
    if (id === req.user._id.toString()) throw new ApiError(400, 'You cannot change your own account status.');

    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') throw new ApiError(400, 'isActive must be a boolean.');

    const user = await User.findByIdAndUpdate(id, { isActive }, { new: true }).select('-password');
    if (!user) throw new ApiError(404, 'User not found.');

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
}

export async function getAnalytics(req, res, next) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      bookingsByDay,
      bookingsByStatus,
      topEvents,
      revenueByEvent,
      registrationsByDay,
      categoryBreakdown
    ] = await Promise.all([
      // Bookings over last 30 days by day
      Booking.aggregate([
        { $match: { bookedAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$bookedAt' } },
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // Bookings by status
      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Top 5 events by booking count
      Booking.aggregate([
        { $match: { status: { $in: ['confirmed', 'pending'] } } },
        { $group: { _id: '$event', ticketsSold: { $sum: '$quantity' }, bookings: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
        { $sort: { ticketsSold: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'events', localField: '_id', foreignField: '_id', as: 'event' } },
        { $unwind: '$event' },
        { $project: { eventTitle: '$event.title', eventCategory: '$event.category', ticketsSold: 1, bookings: 1, revenue: 1 } }
      ]),
      // Revenue by event
      Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: '$event', revenue: { $sum: '$totalAmount' } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'events', localField: '_id', foreignField: '_id', as: 'event' } },
        { $unwind: '$event' },
        { $project: { eventTitle: '$event.title', revenue: 1 } }
      ]),
      // New user registrations over last 30 days
      User.aggregate([
        { $match: { role: 'user', createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // Events by category
      Event.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        bookingsByDay,
        bookingsByStatus,
        topEvents,
        revenueByEvent,
        registrationsByDay,
        categoryBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
}
