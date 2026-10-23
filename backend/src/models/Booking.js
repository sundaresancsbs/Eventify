import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    ticketType: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['confirmed', 'pending', 'cancelled', 'expired'], default: 'confirmed' },
    paymentStatus: { type: String, enum: ['not_required', 'pending', 'paid', 'failed'], default: 'not_required' },
    upiTransactionId: { type: String, trim: true },
    bookedAt: { type: Date, default: Date.now },
    cancelledAt: Date
  },
  { timestamps: true }
);

bookingSchema.index({ event: 1, status: 1 });

export default mongoose.model('Booking', bookingSchema);
