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

export default router;