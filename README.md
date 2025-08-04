# Express + Prisma + Supertest 통합테스트 예제

이 프로젝트는 Express.js, Prisma ORM, 그리고 Supertest를 사용한 통합테스트 예제입니다.
docker 를 사용하여 postgres:13 셋업하여 실습 진행합니다. (편의상 maimdb, testdb 둘다 docker로 셋업)

## 🚀 기능

- **Express.js**: 웹 서버 프레임워크
- **Prisma**: PostgreSQL ORM
- **Supertest**: HTTP 통합테스트
- **미들웨어 3개**: Helmet (보안), Morgan (로깅), express.json (JSON 파싱)
- **TypeScript**: 타입 안전성

## 📁 프로젝트 구조

```
cicd-practice/
├── src/
│   ├── app.ts              # Express 앱 설정 (미들웨어 + 라우터)
│   ├── server.ts           # 서버 시작 로직
│   ├── middlewares/        # 커스텀 미들웨어들
│   │   ├── logger.ts       # 요청 로깅 미들웨어
│   │   ├── auth.ts         # 인증 토큰 검증 미들웨어
│   │   ├── validation.ts   # 데이터 유효성 검사 미들웨어
│   │   └── rateLimit.ts    # 요청 제한 미들웨어
│   ├── integration-test/
│   │   └── app.test.ts     # Supertest 통합테스트
│   └── setupTests.ts       # Jest 테스트 설정
├── prisma/
│   └── schema.prisma       # Prisma 스키마
├── .env                    # 환경변수 (DATABASE_URL)
└── jest.config.js          # Jest 설정
```

## 🛠️ 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env` 파일에 데이터베이스 연결 정보를 설정하세요:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/testdb"
DB_HOST=localhost
```

### 3. Prisma 설정

```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션 (선택사항)
npx prisma migrate dev
```

### 4. 개발 서버 실행

```bash
npm run dev
```

### 5. 테스트 실행

```bash
npm test
```

## 🧪 테스트

### 테스트 실행

```bash
# 모든 테스트 실행
npm test

# 테스트 감시 모드
npm run test:watch
```

### 테스트 내용

- **기본 라우트 테스트**: GET `/` 엔드포인트
- **보안 헤더 테스트**: Helmet 미들웨어 검증
- **미들웨어 체인 테스트**: 여러 미들웨어가 순서대로 실행되는지 검증
- **인증 테스트**: 토큰 검증 미들웨어 동작 확인
- **유효성 검사 테스트**: 데이터 검증 미들웨어 동작 확인
- **요청 제한 테스트**: Rate Limiting 미들웨어 동작 확인
- **에러 처리 테스트**: 각 미들웨어에서 발생하는 다양한 에러 상황

## 🔧 미들웨어

### 전역 미들웨어

1. **Helmet** (보안)

   - XSS 공격 방지
   - Content Security Policy 설정
   - Clickjacking 방지
   - 기타 보안 헤더 자동 설정

2. **Morgan** (로깅)

   - HTTP 요청 로깅
   - 요청 시간, 메서드, URL, 상태 코드 기록
   - 개발 및 디버깅에 유용

3. **express.json** (JSON 파싱)
   - JSON 요청 본문 파싱
   - API 요청 처리에 필수

### 라우트별 미들웨어 체인

각 라우트에는 여러 미들웨어가 순서대로 적용됩니다:

#### GET `/users` - 사용자 목록 조회

1. **requestLogger** - 요청 시작/완료 로깅
2. **rateLimiter** - 요청 제한 확인 (1분당 5회)
3. **verifyAccessToken** - 인증 토큰 검증
4. **핸들러** - 사용자 목록 조회

#### POST `/users` - 사용자 생성

1. **requestLogger** - 요청 시작/완료 로깅
2. **rateLimiter** - 요청 제한 확인
3. **verifyAccessToken** - 인증 토큰 검증
4. **validateUserBody** - 요청 데이터 유효성 검사
5. **핸들러** - 사용자 생성

#### GET `/users/:id` - 개별 사용자 조회

1. **requestLogger** - 요청 시작/완료 로깅
2. **rateLimiter** - 요청 제한 확인
3. **verifyAccessToken** - 인증 토큰 검증
4. **validateUserId** - ID 유효성 검사
5. **핸들러** - 개별 사용자 조회

## 📊 API 엔드포인트

### GET `/`

기본 라우트 - 서버 상태 확인

```json
{
  "message": "Express 서버가 동작중입니다!",
  "dbHost": "localhost"
}
```

### GET `/users`

사용자 목록 조회

```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "name": "사용자",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST `/users`

새 사용자 생성

```json
{
  "email": "newuser@example.com",
  "name": "새 사용자"
}
```

## 🐳 Docker PostgreSQL 설정

PostgreSQL을 Docker로 실행하는 경우:

```bash
docker run --name postgres-test \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=testdb \
  -p 5432:5432 \
  -d postgres:latest
```

## 📝 스크립트

- `npm run dev`: 개발 서버 실행 (ts-node-dev)
- `npm run build`: TypeScript 컴파일
- `npm start`: 프로덕션 서버 실행
- `npm test`: 테스트 실행
- `npm run test:watch`: 테스트 감시 모드

## 🔍 테스트 결과 예시

```
Test Suites: 2 passed, 2 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        2.743 s
```

모든 테스트가 성공적으로 통과하며, 미들웨어 체인이 순서대로 실행되는 것을 확인할 수 있습니다.

### 미들웨어 실행 순서 확인

콘솔 로그를 통해 미들웨어가 순서대로 실행되는 것을 확인할 수 있습니다:

```
[2025-08-03T09:01:44.673Z] GET /users - 요청 시작
⏱️ 요청 제한 확인 중: ::ffff:127.0.0.1
✅ 새로운 요청 윈도우 시작
🔐 인증 토큰 검증 중: 토큰 있음
✅ 토큰 검증 성공
🎯 사용자 목록 조회 핸들러 실행
[2025-08-03T09:01:44.687Z] GET /users - 응답 완료 (200)
```
