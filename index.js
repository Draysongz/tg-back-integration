// index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();


// Middleware
// app.use(cors({
// 	origin: 'https://tg-front-dev.vercel.app/', // Replace with your front-end URL
// }));

app.use(cors());

app.use(express.json()); // Parses incoming JSON requests


// Import routes
const authRoutes = require('./routes/auth');
const dailyCheckInRoutes = require('./routes/dailyCheckIn');
const tappingSessionRoutes = require('./routes/tappingSession');
const comboRoutes = require('./routes/combo');
const dailyWordRoutes = require('./routes/dailyWord');
const rouletteRoutes = require('./routes/roulette');
const referralRoutes = require('./routes/referral');
const taskRoutes = require('./routes/tasks');
const adminComboRoutes = require('./routes/adminCombo');
const adminDailyWordRoutes = require('./routes/adminDailyWord');
const userRoutes = require('./routes/user');



// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/daily-checkin', dailyCheckInRoutes);
app.use('/api/tapping-session', tappingSessionRoutes);
app.use('/api/combo', comboRoutes);
app.use('/api/daily-word', dailyWordRoutes);
app.use('/api/roulette', rouletteRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminComboRoutes);
app.use('/api/admin', adminDailyWordRoutes);
app.use('/api/user', userRoutes);

// Connect to MongoDB

mongoose
	.connect(process.env.MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,

		maxPoolSize: 50, // Default is 5
		w: 'majority',

		// useCreateIndex: true, // Uncomment if using an older version of Mongoose
	})
	.then(() => console.log('MongoDB connected'))
	.catch((err) => console.log(err));


// Start the server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});