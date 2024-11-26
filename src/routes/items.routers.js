//====================================================================================================================
//====================================================================================================================
// src/routes/items.router.js
// 아이템 api 라우터
//====================================================================================================================
//====================================================================================================================

import express from 'express';
import { prisma } from '../utils/prisma/index.js';

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


export default router;