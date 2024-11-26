// src/app.js

import express from 'express';
import cookieParser from 'cookie-parser';
// middlewares
import LoggingMiddleware from './middlewares/logging.middleware.js';
import ErrorHandlingMiddleware from './middlewares/errorHandling.middleware.js';
import usersRouter from './routes/users.routers.js';
import charactersRouter from './routes/characters.routers.js';
import itemsRouter from './routes/items.routers.js';

const app = express();
const PORT = 3019;

// Middlewares
app.use(LoggingMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use('/api', [usersRouter, charactersRouter, itemsRouter]);
app.use(ErrorHandlingMiddleware);


app.listen(PORT, () => {
  console.log(PORT, 'port opened == item-simulator Server running!');
});