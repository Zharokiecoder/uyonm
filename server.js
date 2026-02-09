require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const newsletterRoutes = require('./routes/newsletter');
const eventsRoutes = require('./routes/events');
const membersRoutes = require('./routes/members');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration - allow frontend domains
const allowedOrigins = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (file://, mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        // In development, allow all localhost origins
        if (process.env.NODE_ENV === 'development' &&
            (origin.startsWith('http://localhost') ||
                origin.startsWith('http://127.0.0.1') ||
                origin.startsWith('file://'))) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'United Youth Nigeria Movement API',
        status: 'running',
        version: '1.0.0'
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/members', membersRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 UYNM Backend running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});
