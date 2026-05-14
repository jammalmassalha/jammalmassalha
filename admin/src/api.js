const API_BASE = import.meta.env.VITE_API_BASE || '';
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY || 'change-me';

const authHeaders = {
  'x-admin-api-key': ADMIN_API_KEY,
};

const requestJson = async (url, options = {}, fallbackMessage) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(fallbackMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Cannot reach backend API. Start backend on port 4000.');
    }

    throw error;
  }
};

export const loadOrders = async () => {
  return requestJson(
    `${API_BASE}/api/admin/orders`,
    {
    headers: authHeaders,
    },
    'Failed to load orders'
  );
};

export const loadTopProducts = async () => {
  return requestJson(
    `${API_BASE}/api/admin/products/top-usa?limit=10`,
    {
      headers: authHeaders,
    },
    'Failed to load top products'
  );
};

export const saveFeaturedProducts = async (productIds) => {
  return requestJson(
    `${API_BASE}/api/admin/products/featured`,
    {
      method: 'PUT',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productIds }),
    },
    'Failed to save featured products'
  );
};

export const createProduct = async (payload) => {
  return requestJson(
    `${API_BASE}/api/admin/products`,
    {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    'Failed to create product'
  );
};
