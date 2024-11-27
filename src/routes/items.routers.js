//====================================================================================================================
//====================================================================================================================
// src/routes/items.router.js
// 아이템 api 라우터
//====================================================================================================================
//====================================================================================================================

import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();


//====================================================================================================================
//====================================================================================================================
// item/create API : 아이템 생성
// request: 아이템 코드, 아이템 명, 아이템 스탯(json 형식), 아이템 가격 등
//====================================================================================================================
//====================================================================================================================
router.post('/items/create', async (req, res, next) => {
    try {
        const { item_name, item_price, item_rarity, item_stat } = req.body;

        // validation: item_name : 중복 불가
        const isItemNameExist = await prisma.items.findFirst({
            where: {
                item_name,
            },
        });
        if (isItemNameExist)
            return res.status(409).json({ message: '[Conflict] item_name already exists' });

        // 아이템 생성: 주의: 정수형 데이터 변환과 valid 체크
        const processedPrice = parseInt(item_price, 10);
        if (isNaN(processedPrice))
            return res.status(400).json({ message: '[Error] item_price invalid' });

        const newItem = await prisma.items.create({
            data: {
                item_name,
                item_price: processedPrice,
                item_rarity,
                item_stat,
            },
        });

        // 성공시 반환
        return res.status(201).json({
            message: '[Created] new item creation completed.',
            item_id: newItem.item_id,
        });

    } catch (error) {
        next(error);
    }
});




//====================================================================================================================
//====================================================================================================================
// item/edit API : 아이템 수정
// URI param: 아이템 코드
// request:아이템 명, 아이템 스탯(json 형식), 아이템 가격 등
// 단, 가격은 수정 불가능
//====================================================================================================================
//====================================================================================================================
router.post('/items/edit/:item_id', async (req, res, next) => {
    try {
        const { item_id } = req.params;
        const { item_name, item_rarity, item_stat } = req.body;

        // validation: item_name : 중복 불가
        const item = await prisma.items.findFirst({
            where: {
                item_id: +item_id,
            },
        });
        if (!item)
            return res.status(404).json({ message: '[Not Found] cannot find item' });

        // 아이템 수정
        const updated = await prisma.items.update({
            where: { item_id: +item_id, },
            data: {
                item_name,
                item_rarity,
                item_stat,
            },
        });

        // 성공시 반환
        return res.status(200).json({
            message: '[Success] item update completed.',
            item: updated,
        });

    } catch (error) {
        next(error);
    }
});




//====================================================================================================================
//====================================================================================================================
// item/list API : 아이템 목록 조회
// response: 아이템 코드, 아이템 명, 아이템 가격 내용 조회
// 생성된 모든 아이템에 관하여 적용
//====================================================================================================================
//====================================================================================================================
router.get('/items/list', async (req, res, next) => {
    try {
        // 아이템 리스트 가져오기
        const itemList = await prisma.items.findMany({
            select: {
                item_id: true,
                item_name: true,
                item_price: true,
            },
        });
        return res.status(200).json({ itemList });
    } catch (error) {
        next(error);
    }
});




//====================================================================================================================
//====================================================================================================================
// item/detail-view API : 아이템 상세 정보 조회
// URI param: 아이템 코드
// response: 아이템 코드, 아이템 명, 아이템 스탯, 아이템 가격 내용 조회
//====================================================================================================================
//====================================================================================================================
router.get('/items/:item_id', async (req, res, next) => {
    try {
        // 아이템 리스트 가져오기
        const { item_id } = req.params;
        const item = await prisma.items.findFirst({
            where: { item_id: +item_id, },
            select: {
                item_id: true,
                item_name: true,
                item_price: true,
                item_rarity: true,
                item_stat: true,
            },
        });
        // validation: item을 찾았는지
        if (!item)
            return res.status(404).json({ message: '[Not found] cannot find item' });

        return res.status(200).json({ item });
    } catch (error) {
        next(error);
    }
});



//====================================================================================================================
//====================================================================================================================
// item/purchase API : 아이템 구매
// URI param: 구입할 내 캐릭터 아이디
// request: 아이템 id, 아이템 수량
// response: 구매한 이후의 gold 재화 수량
// 기타 로직: 구매한 아이템은 인벤토리로 이동 (이 때, 인벤토리가 꽉 차있는지 확인?)
//====================================================================================================================
//====================================================================================================================
router.post('/items/purchase/:character_id', authMiddleware, async (req, res, next) => {
    try {
        const { user_id } = req.user;
        const { character_id } = req.params;
        const { item_id, item_quantity } = req.body;

        // validation: 해당 캐릭터는 자신의 계정이어야 함. 즉, user_id를 통해 확인
        const myCharacter = await prisma.characters.findFirst({
            where: { character_id: +character_id, },
            include: { inventory: true, },
        });
        if (user_id !== myCharacter.user_id)
            return res.status(401).json({ message: '[Unauthorized] not your character' });


        const targetItem = await prisma.items.findFirst({
            where: { item_id, },
        });
        // validation: item_id로 item 찾았는지
        if (!targetItem)
            return res.status(404).json({ message: '[Not Found] cannot find item' });

        const myInventory = myCharacter.inventory; //= await prisma.inventory.findFirst({ where: { character_id: +character_id, }, });
        // 현재 가진 골드가 구매할 액수만큼 있는가?
        const goldAfterPurchase = myInventory.gold - targetItem.item_price * item_quantity;
        const isPurchasable = goldAfterPurchase >= 0;
        // 적으면 사지 못한다.
        if (!isPurchasable)
            return res.status(402).json({ message: '[Not Enough gold] need more golds.' });

        // TRANSACTION: 거래 로직은 트랜잭션 처리
        const trxInventory = await prisma.$transaction(async (trx) => {
            // 구매 로직: 골드는 차감
            const updatedInventory = await trx.inventory.update({
                where: { inventory_id: myInventory.inventory_id, },
                data: { gold: goldAfterPurchase }
            });
            // 구매 로직: 아이템 인벤토리에 추가
            await trx.inventoryItems.create({
                data: {
                    inventory_id: myInventory.inventory_id,
                    item_id,
                    item_quantity,
                    isEquipped: false,
                },
            });

            return updatedInventory;
        });

        // 성공시 반환
        return res.status(200).json({
            message: '[Success] item purchase completed.',
            remained_gold: trxInventory.gold,
        });

    } catch (error) {
        next(error);
    }
});



//====================================================================================================================
//====================================================================================================================
// item/sell API : 아이템 판매
// URI param: 구입할 내 캐릭터 아이디
// request: 아이템 id, 아이템 수량
// response: 판매한 이후의 gold 재화 수량
// 기타 로직: 판매한 아이템은 인벤토리에서 차감
// validation: 판매하려는 아이템은 장착해제된 인벤토리에 존재하는 아이템이어야 하며, 수량도 그에 상응해야 한다
//====================================================================================================================
//====================================================================================================================
router.post('/items/sell/:character_id', authMiddleware, async (req, res, next) => {
    try {
        const { user_id } = req.user;
        const { character_id } = req.params;
        const { item_id, item_quantity } = req.body;
        // validation: 해당 캐릭터는 자신의 계정이어야 함. 즉, user_id를 통해 확인
        const myCharacter = await prisma.characters.findFirst({
            where: { character_id: +character_id, },
            include: { inventory: true, },
        });
        if (user_id !== myCharacter.user_id)
            return res.status(401).json({ message: '[Unauthorized] not your character' });

        // 판매하려는 아이템 검색: 장착 해제되어야 하며, 수량도 충분해야함
        const targetItems = await prisma.inventoryItems.findFirst({
            where: {
                inventory_id: myCharacter.inventory.inventory_id,
                item_id,
                isEquipped: false,
                item_quantity: {
                    gte: item_quantity,
                },
            },
        });
        // validation: 아이템이 인벤토리에 존재하는지
        if (!targetItems)
            return res.status(404).json({ message: '[Not Found] cannot find item' });
        // 미리 차감 계산
        const updatedQuantity = targetItems.item_quantity - item_quantity;
        // 미리 금액 계산
        const calculatedPrice = (await prisma.items.findUnique({ where: { item_id }, })).item_price * item_quantity;
        // TRANSACTION: 판매 로직은 트랜잭션 처리
        const trxInventory = await prisma.$transaction(async (trx) => {
            // 판매 로직: 판매된 아이템 만큼 차감
            // 차감해도 남을 경우, 업데이트
            if (updatedQuantity > 0) {
                await trx.inventoryItems.update({
                    where: { inventoryItem_id: targetItems.inventoryItem_id, },
                    data: { item_quantity: updatedQuantity, },
                });
            }
            // 차감 시 다 사용이면 삭제
            else if (updatedQuantity == 0) {
                await trx.inventoryItems.delete({
                    where: { inventoryItem_id: targetItems.inventoryItem_id, },
                });
            }
            // 음수일 경우는 error임
            else
                throw new Error('Invalid quantity');

            // 판매 로직: 그만큼의 재화 증가
            const updatedInventory = await trx.inventory.update({
                where: { inventory_id: myCharacter.inventory.inventory_id, },
                data: { gold: myCharacter.inventory.gold + calculatedPrice }
            });

            return updatedInventory;
        });

        // 성공시 반환
        return res.status(200).json({
            message: '[Success] item successfully sold.',
            remained_gold: trxInventory.gold,
        });

    } catch (error) {
        next(error);
    }
});




export default router;