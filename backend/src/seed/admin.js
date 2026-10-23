import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';

const [,, name = 'Eventify Admin', email, password] = process.argv;
if (!email || !password) {
  console.error('Usage: npm run seed:admin -- "Admin Name" admin@example.com "strong-password"');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.findOneAndUpdate({ email: email.toLowerCase() }, { name, email: email.toLowerCase(), password: hashedPassword, role: 'admin', isActive: true }, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true });
  console.log(`Admin account ready: ${user.email}`);
} catch (error) {
  console.error(`Unable to seed admin: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
