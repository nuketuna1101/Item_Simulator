// src/app.js

import express from 'express';
import cookieParser from 'cookie-parser';
import usersRouter from './routes/users.router.js';
import ErrorHandlingMiddleware from './middlewares/errorHandling.middleware.js';

const app = express();
const PORT = 3019;

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use('/api', usersRouter);
app.use(ErrorHandlingMiddleware);


app.listen(PORT, () => {
  console.log(PORT, 'port opened == item-simulator Server running!');
});