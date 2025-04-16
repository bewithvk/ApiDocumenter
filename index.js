// Main application file for the Confluence API Spec Documentation Plugin
const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const errorHandler = require('errorhandler');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const ac = require('atlassian-connect-express');

// Configure Atlassian Connect Express
const app = express();
// Read config
const config = require('./config.json');
const addon = ac(app, config);

// Define middleware
const port = addon.config.port() || process.env.PORT || 8000;
app.set('port', port);

// Configure dev environment
const devEnv = app.get('env') === 'development';
if (devEnv) {
  app.use(errorHandler());
}

// Set up middleware
app.use(morgan(devEnv ? 'dev' : 'combined'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser());
app.use(compression());
app.use(addon.middleware());
app.use(express.static(path.join(__dirname, 'public')));

// Configure view engine
app.engine('hbs', require('express-hbs').express4({
  partialsDir: path.join(__dirname, 'views', 'partials'),
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  defaultLayout: path.join(__dirname, 'views', 'layouts', 'main.hbs')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Register routes
const routes = require('./routes/index');
const apiRoutes = require('./routes/api');

app.use('/', routes);
app.use('/api', apiRoutes);

// Handle 404 errors
app.use(function(req, res, next) {
  res.status(404).render('404', {
    title: 'Not Found'
  });
});

// Handle other errors
app.use(function(err, req, res, next) {
  console.error(err.stack);
  const statusCode = err.status || 500;
  res.status(statusCode).render('500', {
    title: 'Error',
    message: err.message,
    error: (devEnv) ? err : {}
  });
});

// Register the addon with a host
if (devEnv) {
  addon.register();
}

// Start the server
app.listen(port, '0.0.0.0', function() {
  console.log('API Spec Documentation plugin running at http://localhost:%d', port);
});

module.exports = app;
