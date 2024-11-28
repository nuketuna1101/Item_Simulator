//====================================================================================================================
//====================================================================================================================
// src/routes/characters.router.js
// 캐릭터 api 라우터
//====================================================================================================================
//====================================================================================================================

import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import authPassMiddleware from '../middlewares/auth.pass.middleware.js';
import { prisma } from '../utils/prisma/index.js';
import characterStatsInitialValues from '../config/character.initialStats.config.js';
import GOLD_INCREMENT from '../config/character.increment.config.js';

const router = express.Router();


//====================================================================================================================
//====================================================================================================================
// character/create API : 캐릭터 생성
// validation: characterName : 중복 불가
// 캐릭터 생성 성공시, 캐릭터 ID를 response로 돌려받기
// 캐릭터 성공시, 캐릭터 뿐만 아니라, 1대1 대응되는 characterStats, inventory 또한 생성 초기화가 되어야 한다 AS TRASACTION
//====================================================================================================================
//====================================================================================================================
router.post('/characters/create', authMiddleware, async (req, res, next) => {
    try {
        const { userCode } = req.user;
        const { characterName, characterType } = req.body;

        // validation: characterName : 중복 불가
        const isCharNameExist = await prisma.characters.findFirst({
            where: {
                characterName,
            },
        });
        if (isCharNameExist)
            return res.status(409).json({ message: '[Conflict] characterName already exists' });

        // type별 캐릭터 스탯 초기화값 가져오기
        const initStats = characterStatsInitialValues[characterType];
        if (!initStats)
            return res.status(400).json({ message: '[Error] failed to initialize characterStat' });

        // consistency를 위한 트랜잭션 사용
        const newCharacter = await prisma.$transaction(async (trx) => {

            // 캐릭터 생성
            const tmpCharacter = await trx.characters.create({
                data: {
                    userCode: +userCode,
                    characterName,
                    characterType,
                },
            });

            // 대응하는 characterStats 생성과 초기화
            await trx.characterStats.create({
                data: {
                    characterCode: tmpCharacter.characterCode,
                    ...initStats,
                },
            });

            // 대응하는 invnetory 생성과 초기화 .. gold는 default로 설정
            await trx.inventory.create({
                data: {
                    characterCode: tmpCharacter.characterCode,
                },
            });

            return tmpCharacter;
        });

        // 성공시 반환
        return res.status(201).json({
            message: '[Created] new character creation completed.',
            characterCode: newCharacter.characterCode,
        });

    } catch (error) {
        next(error);
    }
});



//====================================================================================================================
//====================================================================================================================
// character/delete API : 캐릭터 삭제
// characterCode를 request에 담아서 해당 아이디의 캐릭터 삭제
// validation: 해당 캐릭터는 자신의 계정이어야 함. 즉, userCode를 통해 확인
// 삭제 성공시, 메시지
// cascade 옵션때문에 삭제는 캐릭터만 삭제해도 됨.
//====================================================================================================================
//====================================================================================================================
router.delete('/characters/:characterCode', authMiddleware, async (req, res, next) => {
    try {
        const { characterCode } = req.params;
        const { userCode } = req.user;
        const character = await prisma.characters.findFirst({
            where: {
                characterCode: +characterCode,
            },
        });
        if (!character)
            return res.status(404).json({ message: '[Not Found] character not found' });
        // validation: 해당 캐릭터는 자신의 계정이어야 함. 즉, userCode를 통해 확인
        if (userCode !== character.userCode)
            return res.status(401).json({ message: '[Unauthorized] not your character' });

        // 캐릭터 삭제
        await prisma.characters.delete({
            where: { characterCode: +characterCode },
        });

        return res.status(200).json({ message: '[Success] deletion completed' });
    } catch (error) {
        next(error);
    }
});



//====================================================================================================================
//====================================================================================================================
// get character API : 캐릭터 상세 조회
// characterCode를 param으로 해당 캐릭터 상세 정보 조회
// 자신의 캐릭터를 조회하는 경우, 모든 세부 정보 보기
// 로그인하지 않았거나 다른 유저가 내 캐릭터 조회 시, characterName과 characterType 만 조회
//====================================================================================================================
//====================================================================================================================
router.get('/characters/:characterCode', authPassMiddleware, async (req, res, next) => {
    try {
        const { characterCode } = req.params;
        // 로그인 안하거나 다른 유저일수도 있으므로 확인할 userCode
        const userCode = (req.user ? req.user.userCode : null);

        const character = await prisma.characters.findFirst({
            where: {
                characterCode: +characterCode,
            },
        });
        if (!character)
            return res.status(404).json({ message: '[Not Found] character not found' });
        // 자신의 계정 캐릭터인지 확인
        const isCharacterMine = userCode === character.userCode;
        const resultData = await prisma.characters.findFirst({
            where: {
                characterCode: +characterCode,
            },
            select: {
                characterName: true,
                characterType: true,
                characterStats: {
                    select: {
                        hp: true,
                        mp: true,
                        level: true,
                        attack: true,
                        defense: true,
                    }
                },
                // 자신의 캐릭터일 경우만 재화 까지 표시
                inventory: isCharacterMine ? {
                    select: { gold: true },
                } : false,
            },
        });
        return res.status(200).json({ data: resultData });
    } catch (error) {
        next(error);
    }
});


//====================================================================================================================
//====================================================================================================================
// character increment gold API : 캐릭터 골드 재화 획득 api
// characterCode를 param으로 해당 캐릭터에게 전달
// 우선은 daily income으로 config에 상수값 저장한만큼 지급
//====================================================================================================================
//====================================================================================================================
router.post('/characters/increment/gold/:characterCode', authMiddleware, async (req, res, next) => {
    try {
        const { characterCode } = req.params;
        const { userCode } = req.user;
        const character = await prisma.characters.findFirst({
            where: {
                characterCode: +characterCode,
            },
        });
        // 캐릭터 일치하는지
        if (!character)
            return res.status(404).json({ message: '[Not Found] character not found' });
        // validation: 해당 캐릭터는 자신의 계정이어야 함. 즉, userCode를 통해 확인
        if (userCode !== character.userCode)
            return res.status(401).json({ message: '[Unauthorized] not your character' });

        const inventory = await prisma.inventory.findFirst({
            where: { characterCode: +characterCode, },
        });
        // 인벤토리 존재 확인
        if (!inventory)
            return res.status(404).json({ message: '[Not Found] inventory not found' });

        // inventory
        const updated = await prisma.inventory.update({
            where: { characterCode: +characterCode, },
            data: {
                gold: inventory.gold + GOLD_INCREMENT,
            },
            select: { gold: true, },
        });

        return res.status(200).json({ message: '[Income] gold incremented.', data: updated });
    } catch (error) {
        next(error);
    }
});


export default router;



