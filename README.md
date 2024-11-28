
# ITEM SIMULATOR

#### Node.js와 Express.js를 활용한 나만의 게임 아이템 시뮬레이터 서비스
<br><br>

## 사용 개발환경
- package manager: npm
- DB: MySQL w. AWS RDS
- ORM: Prisma

<br>

## 프로젝트 세팅
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

## 2. Middleware

#### Auth 인증 미들웨어
- Request의 Authorization 헤더에서 JWT를 가져와서 인증 된 사용자인지 확인하는 Middleware를 구현

#### Logging 로깅 미들웨어
- winston daily rotate file 통한 타임스탬프가 찍힌 로그 파일로 저장

#### Error Handling 미들웨어
- 정상 처리 실패시 에러 flow 처리 위한 핸들러


---

## 3. Datebase modeling

- 명세와는 다르게 적용
- equippedOn와 equipSlot 속성을 통해 장착 로직 이용
- 업데이트: 전체컬럼명 카멜케이스로 통일

![](https://velog.velcdn.com/images/nuketuna/post/be9264f0-ea7c-4bb7-b156-363c04977253/image.png)

---

## 4. API 구현

### 필수기능 API
#### users.router.js
- 회원가입
- 로그인

#### characters.router.js
- 캐릭터 생성
- 캐릭터 삭제
- 캐릭터 상세정보 조회 (인증에 따라 공개 정보 범위 다름)

#### items.router.js
- 아이템 생성
- 아이템 수정
- 전체 아이템 리스트 조회
- 아이템 상세 정보 조회

<br>

### 추가기능 API

#### characters.router.js
- 캐릭터 gold 재화 획득

#### items.router.js
- 아이템 구매
- 아이템 판매

#### inventory.router.js
- 인벤토리 아이템 조회
- 착용한 아이템 조회
- 아이템 장착
- 아이템 장착 해제

---


## 5. 질문과 답변
    1. **암호화 방식**

        > 본 프로젝트는 bcrypt 를 이용한 단방향 해시 알고리즘의 암호화를 적용했다.
        > 이 방식은 비밀번호 문자열에 대해 랜덤 생성된 salt 값을 추가한다. 이를 통해 무차별 대입 공격 (brute-force)이나 미리 계산된 해시 value를 저장한 테이블을 이용해 동일 해시값을 이용해 찾아내는 Rainbow table 공격을 무력화시킬 수 있다.

    2. **인증 방식**

        > 본 프로젝트는 Json Web Token (JWT)를 이용한 인증 방식을 채택했는데, Access Token이 노출될 경우, 탈취된 토큰에 대한 감지와 처리를 할 수 없기 때문에 권한을 악용한 위협에 취약하다는 문제점이 존재한다.
        > 따라서 access token의 유효 기간을 보다 짧게 만료시키고, 이를 발급 관리하기 위한 Refresh Token을 도입하는 형태로 보완한다.
        > 추가적으로 이상활동 감지 시 토큰을 무효화시키는 로직을 추가하거나 권한의 사용 범위를 제한시켜 피해를 최소화하는 방향도 존재한다.

    3. **인증과 인가**
        
        > Authentication은 사용자 인증 과정으로 누구인지 신원을 확인하는 과정이고, Authorization은 앞서 인증된 사용자가 특정 리소스에 접근 권한이 있는지 확인하는 과정이다.
        > 구현된 API들 중 단순히 공개된 정보의 조회하거나 public한 정보에 대한 제공이나 기능을 하는데에는 인증을 필요로 하지 않지만, 인게임 재화의 사용이나 개인 계정과 관련한 보호되어야 할 민감한 작업에 대해서는 인증 과정이 필요하다.
        > 본 프로젝트의 아이템 생성, 수정 API는 이 프로젝트에 한해서 인증을 필요로 하지 않지만, 실제 게임의 경우 유저가 게임 데이터를 조작하거나 악의적인 공격을 가할 수 있기 때문에 admin 권한을 가진 사용자에게만 허가하도록 하는 편이 좋다.

    4. **Http Status Code**

        > Success Response 2XX
        > 200 OK : 성공적, 정상적인 처리 완료
        > ex. 로그인 시도 후 성공 시 200 반환

        > 201 Created : 정상적인 처리 이후 새 데이터 생성
        > ex. 유저가 캐릭터 생성 시도 후 성공 시 201 반환


        > Client Error Response 4XX
        > 400 Bad Request : 오류로 인한 요청 처리 불가능
        > ex. 회원가입 시 비밀번호와 확인 비밀번호가 일치하지 않을 시 반환.

        > 401 Unauthorized : 요청에 대해 인증되지 않은 사용자에 대한 처리 막기. 또는 올바른 인증 자격 증명 미제공 시 처리.
        > ex. 로그인 시도 시 일치하지 않은 비밀번호 입력 시 401 반환.

        > 402 Payment Required : 해당 코드는 mdn web docs 기준 현재 사용되지는 않지만, 디지털 결제 시스템을 위해 작성된 오류 코드. 본 프로젝트에서는 재화를 이용한 구매 실패에 대해 적용했음.

        > 403 Forbidden : 클라이언트가 콘텐츠에 접근 권한이 없을 시 반환.
        > 401과의 차이? 401은 인증이 필요하거나, 인증 자격 증명이 유효하지 않음.
        > 403은 인증이 되었으나 해당 자원에 대한 인가되지 않음.
        > ex. a 계정 유저가 b 계정의 캐릭터에 대해 삭제 api 호출 시 403 반환.

        > 404 Not Found : 요청 리소스가 존재하지 않거나 찾을 수 없을 때 없음. 
        > ex. 존재하지 않은 아이템에 대한 아이템 코드로 조회 시도

        > 409 Conflict : 서버의 상태와 충돌 시 반환.
        > ex. 회원가입 시 unique하게 정의해야 하는 유저 id에 대해 이미 존재하는 아이디 입력 시 반환.

    5. **게임 경제**
        > 기획과 명세에는 간편한 구현을 위해 캐릭터 테이블에 게임 머니 컬럼을 추가한 형태를 제시했지만, 이 경우 다음과 같은 단점들이 존재한다.
        > 캐릭터의 다른 속성과 함께 재화 정보를 관리하기 때문에 설계 측면에서 좋지 못하고 데이터 보안에 있어서 피해가 더 클 수 있다. 또 다른 종류의 재화를 추가할 경우 확장성에 있어서도 복잡해진다.
        > 따라서, 민감하고 중요한 재화와 관련한 테이블을 따로 만들어 관리하는 것이, 데이터 무결성을 유지하고 확장하는 데에 더 장점을 보인다.

        > 아이템 구입 시, 클라이언트 단에서 가격을 입력하게 되면, 가격에 대한 조작 가능성이 존재하므로 부정 거래의 위험에 취약해진다.