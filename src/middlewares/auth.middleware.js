//====================================================================================================================
//====================================================================================================================
// src/middlewares/auth.middleware.js
// 인증 미들웨어
//====================================================================================================================
//====================================================================================================================

import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();


export default async function (req, res, next) {
    try {
        const { accessToken } = req.cookies;
        // accessToken 존재 확인
        if (!accessToken)
            return res.status(400).json({ errorMessage: '[Error] cannot find accessToken' });
        // accessToken 타입 확인
        const [tokenType, token] = accessToken.split(' ');
        if (tokenType !== 'Bearer')
            throw new Error('[Error] token type mismatched');
        // 
        const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY);
        const user_id = payload.user_id;
        // 유저 찾기
        const user = await prisma.users.findFirst({
            where: { user_id: +user_id },
        });
        if (!user) {
            res.clearCookie('accessToken');
            throw new Error('[Error] cannot find user');
        }
        // req.user에 user 정보 저장
        req.user = user;
        next();
    } catch (error) {
        res.clearCookie('accessToken');
        //토큰이 만료되었거나, 조작되었을 때, 에러 메시지를 다르게 출력합니다.
        switch (error.name) {
            case 'TokenExpiredError':
                return res.status(401).json({ message: '[Error] token expired' });
            case 'JsonWebTokenError':
                return res.status(401).json({ message: '[Error] token manipulated' });
            default:
                return res
                    .status(401)
                    .json({ message: error.message ?? '[Error] Unauthorized request' });
        }
    }
}