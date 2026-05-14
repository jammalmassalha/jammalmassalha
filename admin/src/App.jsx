import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  CssBaseline,
  Grid2 as Grid,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
} from '@mui/material';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';

import { createProduct, loadOrders, loadTopProducts, saveFeaturedProducts } from './api';

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#006B5B' },
    secondary: { main: '#8A5E00' },
    background: { default: '#F4F6F8', paper: '#FFFFFF' },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: 'IBM Plex Sans, sans-serif',
    h4: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
});

const emptyForm = {
  title: '',
  category: '',
  priceUsd: '',
  salesLast30d: '',
  imageUrl: '',
};

function App() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refreshDashboard = async () => {
    setLoading(true);
    try {
      const [ordersPayload, productsPayload] = await Promise.all([loadOrders(), loadTopProducts()]);
      setOrders(ordersPayload.orders || []);
      setProducts(productsPayload.products || []);
      setSelectedIds((productsPayload.products || []).filter((item) => item.isFeatured).map((item) => item.id));
      setError('');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDashboard();
  }, []);

  const pending = useMemo(() => orders.filter((order) => order.status !== 'completed').length, [orders]);

  const onToggle = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }

      if (prev.length >= 10) {
        return prev;
      }

      return [...prev, id];
    });
  };

  const onSaveSelection = async () => {
    setSaving(true);
    try {
      await saveFeaturedProducts(selectedIds);
      setSuccess('Featured products updated for the mobile app.');
      await refreshDashboard();
    } catch (err) {
      setError(err.message || 'Could not save featured products');
    } finally {
      setSaving(false);
    }
  };

  const onChangeForm = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const onAddProduct = async () => {
    setSaving(true);
    try {
      await createProduct({
        title: form.title,
        category: form.category,
        priceUsd: Number(form.priceUsd),
        imageUrl: form.imageUrl,
        salesLast30d: Number(form.salesLast30d || 0),
      });
      setForm(emptyForm);
      setSuccess('Product added to catalog. Update featured picks if needed.');
      await refreshDashboard();
    } catch (err) {
      setError(err.message || 'Could not create product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #DEE3E8' }}>
        <Toolbar>
          <Inventory2RoundedIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">DropShopping Admin</Typography>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          py: 3,
          minHeight: '100vh',
          background: 'linear-gradient(145deg, #F4F6F8 0%, #EAF3F2 45%, #F9F3E5 100%)',
        }}
      >
        <Container maxWidth="xl">
          <Stack spacing={2}>
            {loading && <LinearProgress />}
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ShoppingCartRoundedIcon color="primary" />
                      <Typography color="text.secondary">Total Orders</Typography>
                    </Stack>
                    <Typography variant="h4">{orders.length}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <BarChartRoundedIcon color="primary" />
                      <Typography color="text.secondary">Pending Fulfillment</Typography>
                    </Stack>
                    <Typography variant="h4">{pending}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary">Featured On App</Typography>
                    <Typography variant="h4">{selectedIds.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Choose up to 10 top-selling USA products.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, lg: 7 }}>
                <Card>
                  <CardContent>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                      <Typography variant="h6">Top 10 USA Best-Sellers</Typography>
                      <Button variant="contained" onClick={onSaveSelection} disabled={saving}>
                        Save App Selection
                      </Button>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Selected products are visible in the Flutter app storefront.
                    </Typography>

                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Show</TableCell>
                          <TableCell>Product</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">30d Sales</TableCell>
                          <TableCell>Rank</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {products.map((product) => {
                          const selected = selectedIds.includes(product.id);
                          return (
                            <TableRow key={product.id} hover>
                              <TableCell>
                                <Checkbox checked={selected} onChange={() => onToggle(product.id)} />
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Avatar src={product.imageUrl} variant="rounded" />
                                  <Typography>{product.title}</Typography>
                                </Stack>
                              </TableCell>
                              <TableCell>{product.category}</TableCell>
                              <TableCell align="right">${Number(product.priceUsd).toFixed(2)}</TableCell>
                              <TableCell align="right">{Number(product.salesLast30d).toLocaleString()}</TableCell>
                              <TableCell>
                                <Chip size="small" label={`#${product.rank}`} color={selected ? 'primary' : 'default'} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 5 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Add Product To Catalog
                    </Typography>
                    <Stack spacing={1.2}>
                      <TextField label="Title" value={form.title} onChange={onChangeForm('title')} fullWidth />
                      <TextField label="Category" value={form.category} onChange={onChangeForm('category')} fullWidth />
                      <TextField label="Price (USD)" type="number" value={form.priceUsd} onChange={onChangeForm('priceUsd')} fullWidth />
                      <TextField
                        label="Sales in last 30 days"
                        type="number"
                        value={form.salesLast30d}
                        onChange={onChangeForm('salesLast30d')}
                        fullWidth
                      />
                      <TextField label="Image URL" value={form.imageUrl} onChange={onChangeForm('imageUrl')} fullWidth />
                      <Button variant="outlined" onClick={onAddProduct} disabled={saving}>
                        Add Product
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>

                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Recent Orders
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Order</TableCell>
                          <TableCell>Product</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orders.slice(0, 6).map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <Typography variant="caption">{order.id}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(order.createdAt)}
                              </Typography>
                            </TableCell>
                            <TableCell>{order.productId}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={order.status}
                                color={order.status === 'completed' ? 'success' : 'warning'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
