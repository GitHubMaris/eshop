const express = require('express');
const path = require('path');
require('dotenv').config();

const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', shopRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Eshop system running on port ${PORT}`);
});