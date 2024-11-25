// src/routes/users.router.js
import express from 'express';
import { prisma } from '../utils/prisma/index.js';

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
        if (isNicknameExist) {
            return res.status(409).json({ message: '[Conflict] nickname already exists' });
        }

        // 
        // const isExistUser = await prisma.users.findFirst({
        //     where: {
        //         email,
        //     },
        // });

        // if (isExistUser) {
        //     return res.status(409).json({ message: '[Conflict] already exists' });
        // }

        /* TODO: 
            - nickname이 이미 존재하는지 validation 체크 
            - password와 password_confirm 같은지 validation 체크 
        */

        // Users 테이블에 사용자를 추가합니다.
        const user = await prisma.users.create({
            data: { username, nickname, password },
        });
        return res.status(201).json({ message: '[Created] sign-up completed.' });

    } catch (error) {
        next(error);
    }
});

export default router;