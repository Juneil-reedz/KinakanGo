require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');

const authRoutes   = require('./routes/auth');
const userRoutes   = require('./routes/users');
const restaurantRoutes = require('./routes/restaurants');
const orderRoutes  = require('./routes/orders');
const appRoutes    = require('./routes/applications');
const issueRoutes  = require('./routes/issues');
const promoRoutes  = require('./routes/promos');
const menuRoutes    = require('./routes/menu');
const upgradeRoutes = require('./routes/upgrades');
const riderRoutes   = require('./routes/riders');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth',         authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/restaurants',  restaurantRoutes);
app.use('/api/orders',       orderRoutes);
app.use('/api/applications', appRoutes);
app.use('/api/issues',       issueRoutes);
app.use('/api/promos',       promoRoutes);
app.use('/api/menu',         menuRoutes);
app.use('/api/upgrades',     upgradeRoutes);
app.use('/api/riders',       riderRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
