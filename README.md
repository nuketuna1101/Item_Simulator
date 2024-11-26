
# ITEM SIMULATOR

#### Node.js와 Express.js를 활용한 나만의 게임 아이템 시뮬레이터 서비스

사용 개발환경
package manager: npm
DB: MySQL w. AWS RDS
ORM: Prisma




```cmd
# npm 초기화
npm init -y

# 사용할 라이브러리들
npm add express prisma @prisma/client cookie-parser jsonwebtoken
npm add bcrypt
npm add winston
npm install winston-daily-rotate-file
npm add express-session
npm add add express-mysql-session
npm add -D dotenv

# nodemon 라이브러리 DevDependency로 설치
npm add -D nodemon

# prisma 초기화
npx prisma init

# 프로젝트에 schema.prisma에 정의된 테이블을 MySQL에 생성
npx prisma db push

```


---

## 1. AWS EC2 배포

---

## 2. Middleware - Auth 기능 구현

- Request의 Authorization 헤더에서 JWT를 가져와서 인증 된 사용자인지 확인하는 Middleware를 구현

---

## 3. Datebase modeling

Item
User
Character
Character-Inventory
Character-Item

![](https://velog.velcdn.com/images/nuketuna/post/7e56984d-57dd-418d-a205-a643f66e04e7/image.png)

---

## 4. API 구현

- signup api
- login api
- character create api
- character deletion api
- character detail view api
- item creation api
- item edit api
- item list view api
- item detail view api

---


+ 질문과 답변 (README.md 파일에 추가)
    1. **암호화 방식**
        - 비밀번호를 DB에 저장할 때 Hash를 이용했는데, Hash는 단방향 암호화와 양방향 암호화 중 어떤 암호화 방식에 해당할까요?
        - 비밀번호를 그냥 저장하지 않고 Hash 한 값을 저장 했을 때의 좋은 점은 무엇인가요?
    2. **인증 방식**
        - JWT(Json Web Token)을 이용해 인증 기능을 했는데, 만약 Access Token이 노출되었을 경우 발생할 수 있는 문제점은 무엇일까요?
        - 해당 문제점을 보완하기 위한 방법으로는 어떤 것이 있을까요?
    3. **인증과 인가**
        - 인증과 인가가 무엇인지 각각 설명해 주세요.
        - 위 API 구현 명세에서 인증을 필요로 하는 API와 그렇지 않은 API의 차이가 뭐라고 생각하시나요?
        - 아이템 생성, 수정 API는 인증을 필요로 하지 않는다고 했지만 사실은 어느 API보다도 인증이 필요한 API입니다. 왜 그럴까요?
    4. **Http Status Code**
        - 과제를 진행하면서 사용한 Http Status Code를 모두 나열하고, 각각이 의미하는 것과 어떤 상황에 사용했는지 작성해 주세요.
    5. **게임 경제**
        - 현재는 간편한 구현을 위해 캐릭터 테이블에 money라는 게임 머니 컬럼만 추가하였습니다.
            - 이렇게 되었을 때 어떠한 단점이 있을 수 있을까요?
            - 이렇게 하지 않고 다르게 구현할 수 있는 방법은 어떤 것이 있을까요?
        - 아이템 구입 시에 가격을 클라이언트에서 입력하게 하면 어떠한 문제점이 있을 수 있을까요?