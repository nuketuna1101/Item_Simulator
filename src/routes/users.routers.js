//====================================================================================================================
//====================================================================================================================
// src/routes/users.router.js
// 유저 api 라우터
//====================================================================================================================
//====================================================================================================================

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();



//====================================================================================================================
//====================================================================================================================
// sign-up API : 유저 회원가입
// pw에 대해서는 hashing 적용
// validation: nickname : 중복 불가, 영어 소문자 + 숫자의 조합
// validation: password : 6자 이상, 비밀번호 확인과 일치
// 회원가입 성공 시, pw 제외 정보 반환
//====================================================================================================================
//====================================================================================================================
router.post('/sign-up', async (req, res, next) => {
    const { username, nickname, password, password_confirm } = req.body;
    try {
        // validation: nickname : 중복 불가
        const isNicknameExist = await prisma.users.findFirst({
            where: {
                nickname,
            },
        });
        if (isNicknameExist)
            return res.status(409).json({ message: '[Conflict] nickname already exists' });
        // password와 password_confirm 같은지 validation 체크 
        if (password !== password_confirm)
            return res.status(400).json({ message: '[Mismatch] password confirmation failed' });

        // bcrypt를 통한 암호화 과정
        const hashedPW = await bcrypt.hash(password, 10);

        // Users 테이블 추가
        const user = await prisma.users.create({
            data: {
                username,
                nickname,
                password: hashedPW,
            },
        });
        // 201 코드 전송
        return res.status(201).json({ 
            message: '[Created] sign-up completed.',
            username,
            nickname
         });

    } catch (error) {
        next(error);
    }
});


//====================================================================================================================
//====================================================================================================================
// log-in API : 유저 로그인 api
// 유저 닉네임, 비밀번호를 통한 로그인 요청
// validation: nickname : 존재하지 않는 nickname
// validation: password : 비밀번호 일치하지 않음
// fhrmdls 성공 시, access token 생성 및 반환
//====================================================================================================================
//====================================================================================================================
router.post('/log-in', async (req, res, next) => {
    const { nickname, password } = req.body;

    try {
        // validation: nickname : 존재하지 않는 nickname
        const user = await prisma.users.findFirst({
            where: {
                nickname,
            },
        });
        if (!user)
            return res.status(404).json({ message: '[Not Found] cannot find nickname' });

        /* TODO: password 일치하는지 */
        const isPWValid = await bcrypt.compare(password, user.password);
        if (!isPWValid)
            return res.status(401).json({ message: '[Unauthorized] password mismatched' });

        // token 생성
        const accessToken = jwt.sign(
            {
                user_id: user.user_id,
            },
            process.env.ACCESS_TOKEN_SECRET_KEY,
            { expiresIn: '5m' },
        );

        // authotization 쿠키에 Bearer 토큰 으로 JWT를 저장
        res.cookie('accessToken', `Bearer ${accessToken}`);

        // 로그인 성공
        return res.status(200).json({ message: '[Success] log-in completed.' });

    } catch (error) {
        next(error);
    }
});


export default router;