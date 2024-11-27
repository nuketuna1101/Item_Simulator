//====================================================================================================================
//====================================================================================================================
// src/routes/inventory.router.js
// 인벤토리 api 라우터
//====================================================================================================================
//====================================================================================================================

import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

//====================================================================================================================
//====================================================================================================================
// inventory/list API : 인벤토리 조회
// URI param: character_id
// response: 캐릭터가 가진 모든 inventoryItem의 아이템 id, 아이템명, 아이템 수량 (단, 장착해제된)
//====================================================================================================================
//====================================================================================================================
router.get('/inventory/list/:character_id', authMiddleware, async (req, res, next) => {
    try {
        const { user_id } = req.user;
        const { character_id } = req.params;

        // validation: 해당 캐릭터는 자신의 계정이어야 함. 즉, user_id를 통해 확인
        const myCharacter = await prisma.characters.findFirst({
            where: { character_id: +character_id, },
            include: { inventory: true, },
        });
        if (user_id !== myCharacter.user_id)
            return res.status(401).json({ message: '[Unauthorized] not your character' });

        // 인벤토리 아이템 조회: 장착 해제된 아이템만
        const myInventoryItems = await prisma.inventoryItems.findMany({
            where: {
                inventory_id: myCharacter.inventory.inventory_id,
                isEquipped: false,
            },
            select: {
                item_id: true,
                item_quantity: true,
                item_name: true,
            },
        });

        // 성공시 반환
        return res.status(200).json({ myInventoryItems });

    } catch (error) {
        next(error);
    }
});



export default router;