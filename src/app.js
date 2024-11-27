// src/app.js

import express from 'express';
import cookieParser from 'cookie-parser';
// middlewares
import LoggingMiddleware from './middlewares/logging.middleware.js';
import ErrorHandlingMiddleware from './middlewares/errorHandling.middleware.js';
import usersRouter from './routes/users.routers.js';
import charactersRouter from './routes/characters.routers.js';
import itemsRouter from './routes/items.routers.js';
import inventoryRouter from './routes/inventory.routers.js';

const app = express();
const PORT = 3019;

// Middlewares
app.use(LoggingMiddleware);
app.use(express.json());
app.use(cookieParser());
app.use('/api', [usersRouter, charactersRouter, itemsRouter, inventoryRouter]);

// 추후엔 이 방식도 아니라 라우팅 미들웨어를 통해서 라우팅해주자
// app.use('/api/users', usersRouter);
// app.use('/api/characters', charactersRouter);
// app.use('/api/items', itemsRouter);


app.use(ErrorHandlingMiddleware);


app.listen(PORT, () => {
  console.log(PORT, 'port opened == item-simulator Server running!');
});