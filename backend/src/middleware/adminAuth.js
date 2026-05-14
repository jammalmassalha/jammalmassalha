import { config } from '../config.js';

export const requireAdmin = (req, res, next) => {
  const apiKey = req.header('x-admin-api-key');

  if (!apiKey || apiKey !== config.adminApiKey) {
    return res.status(401).json({ message: 'Unauthorized admin access' });
  }

  return next();
};
