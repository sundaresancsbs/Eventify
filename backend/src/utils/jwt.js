import jwt from 'jsonwebtoken';

export function createAccessToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwt.sign({ sub: user._id.toString(), role: user.role }, secret, {
    expiresIn: '1d'
  });
}
