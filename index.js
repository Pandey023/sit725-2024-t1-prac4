const express = require('express');
const winston = require('winston');
const app = express();
const port = 3000;

// Winston logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'calculator-microservice' },
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`Request: ${req.method} ${req.url}`, {
    headers: req.headers,
    ip: req.ip,
  });
  next();
});

// Helper function for calculation
const calculate = (req, res, operation) => {
  const num1 = parseFloat(req.query.num1);
  const num2 = parseFloat(req.query.num2);

  if (isNaN(num1) || isNaN(num2)) {
    logger.error('Invalid input parameters');
    return res.status(400).json({ error: 'Invalid input: num1 and num2 must be numbers.' });
  }

  let result;
  try {
    switch (operation) {
      case 'add':
        result = num1 + num2;
        break;
      case 'subtract':
        result = num1 - num2;
        break;
      case 'multiply':
        result = num1 * num2;
        break;
      case 'divide':
        if (num2 === 0) {
          logger.error('Attempted division by zero');
          return res.status(400).json({ error: 'Cannot divide by zero.' });
        }
        result = num1 / num2;
        break;
      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }

    logger.info({
      level: 'info',
      message: `New ${operation} operation requested: ${num1} ${operation} ${num2} = ${result}`,
    });

    res.json({ result });
  } catch (err) {
    logger.error(`Error during calculation: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// API endpoints
app.get('/add', (req, res) => calculate(req, res, 'add'));
app.get('/subtract', (req, res) => calculate(req, res, 'subtract'));
app.get('/multiply', (req, res) => calculate(req, res, 'multiply'));
app.get('/divide', (req, res) => calculate(req, res, 'divide'));

// Start server
app.listen(port, () => {
  console.log(`Calculator microservice running at http://localhost:${port}`);
});
