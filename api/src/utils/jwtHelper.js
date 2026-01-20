import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signToken(payload, options = {}) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn, ...options });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret);
}
