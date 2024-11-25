// src/middlewares/errorHandling.middleware.js

export default function (err, req, res, next) {
    console.error(err);
    res.status(500).json({ errorMessage: '[Error] Server internal error.' });
}