// src/app.js

import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = 3019;

app.use(express.json());
app.use(cookieParser());

app.listen(PORT, () => {
  console.log(PORT, 'port opened == item-simulator Server running!');
});