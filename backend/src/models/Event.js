import mongoose from 'mongoose';

const ticketTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    perUserLimit: { type: Number, required: true, min: 1 }
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, maxlength: 5000 },
    category: { type: String, required: true, trim: true, index: true },
    posterUrl: { type: String, trim: true },
    venue: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    totalCapacity: { type: Number, required: true, min: 1 },
    confirmedTickets: { type: Number, default: 0, min: 0 },
    ticketTypes: { type: [ticketTypeSchema], required: true, validate: (types) => types.length > 0 },
    salesStartDate: { type: Date, required: true },
    salesEndDate: { type: Date, required: true },
    status: { type: String, enum: ['draft', 'published', 'cancelled', 'archived'], default: 'draft', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

eventSchema.index({ title: 'text', category: 'text', city: 'text' });

export default mongoose.model('Event', eventSchema);
