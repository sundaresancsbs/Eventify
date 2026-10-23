import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { createAccessToken } from '../utils/jwt.js';

function getValidationErrors(req) {
  const result = validationResult(req);
  return result.isEmpty() ? undefined : result.array().map((error) => error.msg);
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role };
}

function setAccessCookie(res, accessToken) {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 86400000 // 24 hours
  });
}

export async function register(req, res, next) {
  try {
    const errors = getValidationErrors(req);
    if (errors) throw new ApiError(400, 'Please correct the highlighted fields.', errors);

    const { name, email, phone, password } = req.body;
    if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists.');

    // Forcibly assign 'user' role — never trust client-supplied role
    const user = await User.create({ name, email, phone, password, role: 'user' });
    res.status(201).json({ success: true, data: { user: publicUser(user) } });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const errors = getValidationErrors(req);
    if (errors) throw new ApiError(400, 'Please enter a valid email and password.', errors);

    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !user.isActive || !(await user.comparePassword(req.body.password))) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const accessToken = createAccessToken(user);
    setAccessCookie(res, accessToken);
    res.json({ success: true, data: { user: publicUser(user), accessToken } });
  } catch (error) {
    next(error);
  }
}

export function logout(_req, res) {
  res.clearCookie('accessToken', {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  res.json({ success: true, data: null });
}

export function me(req, res) {
  res.json({ success: true, data: { user: publicUser(req.user) } });
}

export async function updateProfile(req, res, next) {
  try {
    const errors = getValidationErrors(req);
    if (errors) throw new ApiError(400, 'Please correct the highlighted fields.', errors);

    const { name, phone } = req.body;
    // Never allow role, isActive, or password changes through this endpoint
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) throw new ApiError(404, 'User not found.');
    res.json({ success: true, data: { user: publicUser(user) } });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const errors = getValidationErrors(req);
    if (errors) throw new ApiError(400, 'Please correct the highlighted fields.', errors);

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user) throw new ApiError(404, 'User not found.');

    const valid = await user.comparePassword(currentPassword);
    if (!valid) throw new ApiError(401, 'Current password is incorrect.');

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
}
