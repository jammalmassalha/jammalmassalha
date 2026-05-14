const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY || 'change-me';

export const loadOrders = async () => {
  const response = await fetch(`${API_BASE}/api/admin/orders`, {
    headers: {
      'x-admin-api-key': ADMIN_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load orders');
  }

  return response.json();
};
