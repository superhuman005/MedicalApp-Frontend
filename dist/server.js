require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const routes = require('./routes');
const { errorHandler, notFound } = require('./routes/middleware/error');
const app = express();
connectDB();
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Medical App API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/v1/auth',
            appointments: '/api/v1/appointments',
            doctors: '/api/v1/doctors',
            patients: '/api/v1/patients',
            consultations: '/api/v1/consultations',
            medicalRecords: '/api/v1/medical-records',
            payments: '/api/v1/payments',
            subscriptions: '/api/v1/subscriptions',
            ai: '/api/v1/ai'
        }
    });
});
app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api/v1`);
});
process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', err.message);
    server.close(() => process.exit(1));
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    process.exit(1);
});
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated.');
    });
});
//# sourceMappingURL=server.js.map