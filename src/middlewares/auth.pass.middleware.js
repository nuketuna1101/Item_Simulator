//====================================================================================================================
//====================================================================================================================
// src/middlewares/auth.pass.middleware.js
// 인증 미들웨어 :: 단, 인증 실패시 그 다음으로 넘긴다.
//====================================================================================================================
//====================================================================================================================
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();


export default async function (req, res, next) {
    try {
        const { accessToken } = req.cookies;
        // accessToken 존재 확인, 없으면 바로 next
        if (!accessToken)
            return next();
        // accessToken 타입 확인
        const [tokenType, token] = accessToken.split(' ');
        if (tokenType !== 'Bearer')
            throw new Error('[Error] token type mismatched');
        // 
        const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY);
        const userCode = payload.userCode;
        // 유저 찾기
        const user = await prisma.users.findFirst({
            where: { userCode: +userCode },
        });
        if (!user) {
            res.clearCookie('accessToken');
            throw new Error('[Error] cannot find user');
        }
        // req.user에 user 정보 저장
        req.user = user;
        next();
    } catch (error) {
        next();
    }
}