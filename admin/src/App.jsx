import { useEffect, useMemo, useState } from 'react';
import { loadOrders } from './api';

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

function App() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const payload = await loadOrders();
        setOrders(payload.orders || []);
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const pending = useMemo(() => orders.filter((order) => order.status !== 'completed').length, [orders]);

  return (
    <main className="layout">
      <header className="header">
        <h1>DropShopping Admin</h1>
        <p>Track order flow, payment state, and fulfillment priority.</p>
      </header>

      <section className="kpi-grid">
        <article className="kpi-card">
          <h2>Total Orders</h2>
          <strong>{orders.length}</strong>
        </article>
        <article className="kpi-card">
          <h2>Pending Work</h2>
          <strong>{pending}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Latest Orders</h2>
        </div>

        {loading && <p>Loading orders...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Chain</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.productId}</td>
                    <td>{order.quantity}</td>
                    <td>{order.chain}</td>
                    <td>
                      <span className={`badge badge-${order.status}`}>{order.status}</span>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6}>No orders yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
