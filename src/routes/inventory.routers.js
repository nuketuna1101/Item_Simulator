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
                equippedOn: null,
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



//====================================================================================================================
//====================================================================================================================
// inventory/list/equipped API : 장착한 아이템들 조회
// URI param: character_id
// response: 캐릭터가 가진 모든 inventoryItem의 아이템 id, 아이템명, 아이템 수량 (단, 장착해제된)
//====================================================================================================================
//====================================================================================================================
router.get('/inventory/list/equipped/:character_id', async (req, res, next) => {
    try {
        const { character_id } = req.params;

        // 캐릭터 탐색
        const character = await prisma.characters.findFirst({
            where: { character_id: +character_id, },
            include: { inventory: true, },
        });
        if (!character)
            return res.status(404).json({ message: '[Not Found] cannot find character' });

        // 인벤토리 아이템 조회: 장착된 아이템만
        const equippedItems = await prisma.inventoryItems.findMany({
            where: {
                inventory_id: character.inventory.inventory_id,
                equippedOn: { not: null, },
            },
            select: {
                item_id: true,
                item_name: true,
                item_quantity: true,
            },
        });

        // 성공시 반환
        return res.status(200).json({ equippedItems });

    } catch (error) {
        next(error);
    }
});





//====================================================================================================================
//====================================================================================================================
// inventory/equip API : 아이템 장착
// URI param: character_id
// request: 착용하려는 아이템 id
// validation: 캐릭터 인벤토리에 존재해야 하는 아이템, 이미 장착된 아이템이 아닌 아이템
// 기타 로직: 장착 성공 시 스탯 변경
//====================================================================================================================
//====================================================================================================================
router.post('/inventory/equip/:character_id', authMiddleware, async (req, res, next) => {
    try {
        const { user_id } = req.user;
        const { character_id } = req.params;
        const { item_id } = req.body;
        // validation: 자신의 계정 확인 
        const myCharacter = await prisma.characters.findFirst({
            where: { character_id: +character_id, },
            include: { inventory: true },
        });
        if (user_id !== myCharacter.user_id)
            return res.status(401).json({ message: '[Unauthorized] not your character' });
        // validation: 아이템 : 인벤토리내 미장착된 아이템
        const myInventoryItem = await prisma.inventoryItems.findFirst({
            where: {
                inventory_id: myCharacter.inventory.inventory_id,
                item_id,
                equippedOn: null,
            },
        });
        if (!myInventoryItem)
            return res.status(404).json({ message: '[Not Found] item not found in inventory or already equipped' });

        // 아이템 정보 조회
        const targetItem = await prisma.items.findFirst({
            where: { item_id, },
        });

        // 이미 해당 슬롯에 장착된 아이템이 있는지 확인
        const alreadyEquipped = await prisma.inventoryItems.findFirst({
            where: {
                inventory_id: myCharacter.inventory.inventory_id,
                equippedOn: targetItem.equip_slot,
            },
        });
        if (alreadyEquipped)
            return res.status(400).json({ message: '[Bad Request] slot already occupied' });


        const itemStats = targetItem.item_stat;
        // TRANSACTION: 장착 로직은 트랜잭션 처리
        await prisma.$transaction(async (trx) => {
            // 기존 아이템 장착 상태 업데이트
            await trx.inventoryItems.update({
                where: { inventoryItem_id: myInventoryItem.inventoryItem_id },
                data: { equippedOn: targetItem.equip_slot, },
            });

            // 캐릭터 스탯 업데이트
            await trx.characterStats.update({
                where: { character_id: myCharacter.character_id },
                data: {
                    hp: {increment: itemStats.hp || 0,},
                    mp: {increment: itemStats.mp || 0,},
                    attack: {increment: itemStats.attack || 0,},
                    defense: {increment: itemStats.defense || 0,},
                },
            });
        });

        // 성공시 반환
        return res.status(200).json({ message: '[Success] item equipped' });
    } catch (error) {
        next(error);
    }
});


//====================================================================================================================
//====================================================================================================================
// inventory/unequip API : 아이템 장착
// URI param: character_id
// request: 착용해제하려는 아이템 id
// response: 캐릭터가 가진 모든 inventoryItem의 아이템 id, 아이템명, 아이템 수량 (단, 장착해제된)
//====================================================================================================================
//====================================================================================================================
router.post('/inventory/unequip/:character_id', authMiddleware, async (req, res, next) => {
    try {
        const { user_id } = req.user;
        const { character_id } = req.params;
        const { item_id } = req.body;
        // validation: 자신의 계정 확인 
        const myCharacter = await prisma.characters.findFirst({
            where: { character_id: +character_id, },
            include: { inventory: true },
        });
        if (user_id !== myCharacter.user_id)
            return res.status(401).json({ message: '[Unauthorized] not your character' });
        // validation: 아이템 : 장착여부
        const myInventoryItem = await prisma.inventoryItems.findFirst({
            where: {
                inventory_id: myCharacter.inventory.inventory_id,
                item_id,
                equippedOn: { not: null, },
            },
        });
        if (!myInventoryItem)
            return res.status(404).json({ message: '[Not Found] cannot find equipped item' });

        // 아이템 정보 조회
        const targetItem = await prisma.items.findFirst({
            where: { item_id, },
        });
        const itemStats = targetItem.item_stat;
        // TRANSACTION: 장착 로직은 트랜잭션 처리
        await prisma.$transaction(async (trx) => {
            // 아이템 탈착 설정
            await trx.inventoryItems.update({
                where: { inventoryItem_id: myInventoryItem.inventoryItem_id },
                data: { equippedOn: null, },
            });

            // 캐릭터 스탯 업데이트
            await trx.characterStats.update({
                where: { character_id: myCharacter.character_id },
                data: {
                    hp: {decrement: itemStats.hp || 0,},
                    mp: {decrement: itemStats.mp || 0,},
                    attack: {decrement: itemStats.attack || 0,},
                    defense: {decrement: itemStats.defense || 0,},
                },
            });
        });

        // 성공시 반환
        return res.status(200).json({ message: '[Success] item unequipped' });
    } catch (error) {
        next(error);
    }
});





export default router;