# Nest.js를 이용한 API 구현

## Description

Nest.js, TypeORM, PostgreSQL을 사용하여 외화송금 API를 구현 하였습니다.

# API 문서
[API 문서 링크](https://documenter.getpostman.com/view/25037884/2sA3QsArwm)

## Tech Spec
* Nest.js: version 10.3
* TypeScript: version 5.4
* Node.js: version 20

## Installation

```bash
$ yarn install
```

## App 실행

```bash
$ yarn run start
```

## Test

```bash
$ yarn run test
```

## Database
* PostgreSQL 사용
* `docker-compose` 사용하여 데이터베이스 생성
```bash
docker-compose up -d
```

## 요구사항 구현여부

### 회원가입 API 
- [x] 회원 가입을 위한 API 구현 완료.
- [x] 회원의 유니크 값은 userId 사용. (이메일 형식)
- [x] 암호화가 필요한 값은 암호화 (비밀번호, 주민번호, 사업자번호). 
- [x] 식별을 위한 ID 타입으로 REG_NO, BUSINESS_NO 2가지 값만 사용.
- [x] idValue를 Bcrypt https://github.com/kelektiv/node.bcrypt.js 사용하여 암호화 완료.

### 로그인 API
- [x] 로그인 API 구현 완료
- [x] 사용자의 name과 userId를 사용하여 JWT token 생성

### 송금 견적서를 갖고 오는 API
- [x] 요구 사항을 반영하여 API 구현 완료.
- [x] USD, JPY 통화 외에 다른 통화는 코드 추가로 쉽게 확장 할 수 있도록 구현.
- [x] 견적서 유효시간은 10분으로 설정.

#### 통화 추가 방법
1. `src/wireTransfer/wireTransfer.constansts.ts`에서 `CURRENCY`에 통화 코드 추가.
2. 같은 파일안에 있는 `SUPPORTED_CURRENCY_CODE`에 추가한 통화의 `frxCode, currencyCode, fractionDigits` 추가

## 송금 접수 요청 API
- [x] 송금접수 요청 구현 완료.
- [x] 견적서 ID `quoteId`를 전달하여 송금 접수.
- [x] 유효기간이 만료된 견적서 접수 요청 시 에러코드 발생.
- [x] 이미 접수된 견적서 재접수 요청시 에러코드 발생.
- [x] 회원의 타입별로 일일 송금액수 제한 설정.

## 회원 거래이력 요청 API
- [x] 회원 거래이력 요청 API 구현 완료.

## Env 환경 설정 파일 설명
* `.env`: Docker 생성용.
* `.env.test`: 테스트 환경 설정용.
* `.env.dev`: 개발모드 환경 설정용. 이 `yarn start` 에서 이 환경 설정파일 사용.
* `.env.prod`: 운영모드 환경 설정용.