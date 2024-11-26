//====================================================================================================================
//====================================================================================================================
// src/routes/users.router.js
// 유저 api 라우터
//====================================================================================================================
//====================================================================================================================

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middlewares/auth.middleware.js';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();


//====================================================================================================================
//====================================================================================================================
// character/create API : 캐릭터 생성
// validation: character_name : 중복 불가
// 캐릭터 생성 성공시, 캐릭터 ID를 response로 돌려받기
//====================================================================================================================
//====================================================================================================================
router.post('/character/create', authMiddleware, async (req, res, next) => {
    try {
        const { user_id } = req.user;
        const { character_name, character_type } = req.body;

        // validation: character_name : 중복 불가
        const isCharNameExist = await prisma.characters.findFirst({
            where: {
                character_name,
            },
        });
        if (isCharNameExist)
            return res.status(409).json({ message: '[Conflict] character_name already exists' });


        const newCharacter = await prisma.posts.create({
            data: {
                user_id: +user_id,
                character_name,
                character_type,
            },
        });

        return res.status(201).json({
            message: '[Created] new character creation completed.',
            character_id: newCharacter.character_id,
        });

    } catch (error) {
        next(error);
    }

});



//====================================================================================================================
//====================================================================================================================
// character/delete API : 캐릭터 삭제
// character_id를 request에 담아서 해당 아이디의 캐릭터 삭제
// validation: 해당 캐릭터는 자신의 계정이어야 함. 즉, user_id를 통해 확인
// 삭제 성공시, 메시지
//====================================================================================================================
//====================================================================================================================
router.post('/character/delete', authMiddleware, async (req, res, next) => {
    try {
        const { character_id } = req.body;
        const { user_id } = req.user;
        const character = await prisma.characters.findFirst({
            where: {
                character_id,
            },
        });
        if (!character)
            return res.status(404).json({ message: '[Not Found] character not found' });
        // validation: 해당 캐릭터는 자신의 계정이어야 함. 즉, user_id를 통해 확인
        if (user_id !== character.user_id)
            return res.status(401).json({ message: '[Unauthorized] not your character' });

        // 캐릭터 삭제
        await prisma.characters.delete({
            where: { character_id },
        });

    } catch (error) {
        next(error);
    }

});

export default router;







router.post('/character/delete', authMiddleware, async (req, res, next) => {
    const { character_id } = req.body;
    const { user_id } = req.user; // authMiddleware를 통해 설정된 사용자 정보

    try {
        // 캐릭터가 해당 사용자 계정에 속하는지 확인
        const character = await prisma.characters.findFirst({
            where: {
                character_id,
                user_id,
            },
        });

        if (!character) {
            return res.status(404).json({ message: '[Not Found] character not found or unauthorized' });
        }

        // 캐릭터 삭제
        await prisma.characters.delete({
            where: { character_id },
        });

        return res.status(200).json({ message: '[Success] character deleted.' });
    } catch (error) {
        next(error);
    }
});
