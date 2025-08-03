import request from "supertest";
import app from "../app";
import { PrismaClient } from "@prisma/client";

// 통합테스트에서는 실제 데이터베이스를 사용합니다
const prisma = new PrismaClient();

describe("POST /login - 로그인 API 테스트", () => {
  // 로그인 테스트 전후로 데이터베이스 정리
  beforeAll(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 각 테스트 전에 사용자 데이터 정리 (테스트 격리)
    await prisma.user.deleteMany();
  });

  test("올바른 이메일과 비밀번호로 로그인할 수 있어야 한다", async () => {
    // Setup: API를 통해 테스트 사용자 생성
    const createUserResponse = await request(app)
      .post("/users")
      .send({
        email: "test@example.com",
        name: "테스트 사용자",
      })
      .expect(201);

    // Exercise: 로그인 요청
    const response = await request(app)
      .post("/login")
      .send({
        email: "test@example.com",
        password: "password123",
      })
      .expect(200);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("message", "로그인 성공");
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("user");
    expect(response.body.user.email).toBe("test@example.com");
    expect(response.body.user.name).toBe("테스트 사용자");
  });

  test("존재하지 않는 이메일로 로그인 시 401 에러를 반환해야 한다", async () => {
    // Exercise: 로그인 요청
    const response = await request(app)
      .post("/login")
      .send({
        email: "nonexistent@example.com",
        password: "password123",
      })
      .expect(401);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("이메일 또는 비밀번호");
  });

  test("잘못된 비밀번호로 로그인 시 401 에러를 반환해야 한다", async () => {
    // Setup: API를 통해 테스트 사용자 생성
    await request(app)
      .post("/users")
      .send({
        email: "test@example.com",
        name: "테스트 사용자",
      })
      .expect(201);

    // Exercise: 로그인 요청
    const response = await request(app)
      .post("/login")
      .send({
        email: "test@example.com",
        password: "wrongpassword",
      })
      .expect(401);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("이메일 또는 비밀번호");
  });

  test("잘못된 이메일 형식으로 로그인 시 400 에러를 반환해야 한다", async () => {
    // Exercise: 로그인 요청
    const response = await request(app)
      .post("/login")
      .send({
        email: "invalid-email",
        password: "password123",
      })
      .expect(400);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("이메일 형식");
  });

  test("비밀번호가 너무 짧으면 400 에러를 반환해야 한다", async () => {
    // Exercise: 로그인 요청
    const response = await request(app)
      .post("/login")
      .send({
        email: "test@example.com",
        password: "123",
      })
      .expect(400);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("비밀번호는 최소 6자");
  });
});

describe("GET /users - 사용자 목록 조회 API 테스트", () => {
  let agent: any;
  let authToken: string;

  // 사용자 목록 조회 테스트 전후로 데이터베이스 정리
  beforeAll(async () => {
    await prisma.user.deleteMany();

    // API를 통해 테스트 데이터 생성
    await request(app)
      .post("/users")
      .send({
        email: "test@example.com",
        name: "테스트 사용자",
      })
      .expect(201);

    // agent 생성 및 로그인
    agent = request.agent(app);

    const loginResponse = await agent.post("/login").send({
      email: "test@example.com",
      password: "password123",
    });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 각 테스트 전에 추가 사용자 데이터 정리 (기본 사용자는 유지)
    await prisma.user.deleteMany({
      where: {
        email: { not: "test@example.com" },
      },
    });
  });

  test("인증 토큰 없이 사용자 목록 조회 시 401 에러를 반환해야 한다", async () => {
    // Exercise: API 요청 실행
    const response = await request(app).get("/users").expect(401);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("인증 토큰");
  });

  test("유효한 토큰으로 사용자 목록을 조회할 수 있어야 한다", async () => {
    // Exercise: API 요청 실행
    const response = await agent
      .get("/users")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    // Assertion: 결과 검증
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty("email", "test@example.com");
  });

  test("잘못된 토큰으로 사용자 목록 조회 시 401 에러를 반환해야 한다", async () => {
    // Exercise: API 요청 실행
    const response = await agent
      .get("/users")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("유효하지 않은 토큰");
  });
});

describe("POST /users - 사용자 생성 API 테스트", () => {
  // 사용자 생성 테스트 전후로 데이터베이스 정리
  beforeAll(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 각 테스트 전에 사용자 데이터 정리 (테스트 격리)
    await prisma.user.deleteMany();
  });

  test("잘못된 이메일 형식으로 사용자 생성 시 400 에러를 반환해야 한다", async () => {
    // Setup: 잘못된 테스트 데이터 준비
    const invalidData = {
      email: "invalid-email",
      name: "테스트 사용자",
    };

    // Exercise: API 요청 실행
    const response = await request(app)
      .post("/users")
      .send(invalidData)
      .expect(400);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("이메일 형식");

    // Assertion: DB에 저장되지 않았는지 확인
    const users = await prisma.user.findMany({
      where: { email: "invalid-email" },
    });
    expect(users.length).toBe(0);
  });

  test("이름이 너무 짧으면 400 에러를 반환해야 한다", async () => {
    // Setup: 잘못된 테스트 데이터 준비
    const invalidData = {
      email: "test@example.com",
      name: "A", // 1자만
    };

    // Exercise: API 요청 실행
    const response = await request(app)
      .post("/users")
      .send(invalidData)
      .expect(400);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("최소 2자");

    // Assertion: DB에 저장되지 않았는지 확인
    const users = await prisma.user.findMany({
      where: { email: "test@example.com" },
    });
    expect(users.length).toBe(0);
  });

  test("올바른 데이터로 사용자를 생성할 수 있어야 한다", async () => {
    // Setup: 테스트 데이터 준비
    const userData = {
      email: "test@example.com",
      name: "테스트 사용자",
    };

    // Exercise: API 요청 실행
    const response = await request(app)
      .post("/users")
      .send(userData)
      .expect(201);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("id");
    expect(response.body.email).toBe(userData.email);
    expect(response.body.name).toBe(userData.name);

    // Assertion: DB에 실제로 저장되었는지 확인 (통합테스트의 핵심)
    const savedUser = await prisma.user.findUnique({
      where: { id: response.body.id },
    });
    expect(savedUser).toBeTruthy();
    expect(savedUser?.email).toBe(userData.email);
    expect(savedUser?.name).toBe(userData.name);
  });

  test("중복된 이메일로 사용자 생성 시 에러를 반환해야 한다", async () => {
    // Setup: 중복 테스트를 위한 첫 번째 사용자 생성
    await request(app)
      .post("/users")
      .send({
        email: "duplicate@example.com",
        name: "첫 번째 사용자",
      })
      .expect(201);

    const duplicateData = {
      email: "duplicate@example.com",
      name: "두 번째 사용자",
    };

    // Exercise: API 요청 실행
    const response = await request(app)
      .post("/users")
      .send(duplicateData)
      .expect(500); // Prisma unique constraint 에러

    // Assertion: 결과 검증 - 실제로 DB에 중복 사용자가 없어야 함
    const users = await prisma.user.findMany({
      where: { email: "duplicate@example.com" },
    });
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("첫 번째 사용자");
  });
});

describe("GET /users/:id - 개별 사용자 조회 API 테스트", () => {
  let agent: any;
  let testUser: any;
  let authToken: string;

  // 개별 사용자 조회 테스트 전후로 데이터베이스 정리
  beforeAll(async () => {
    await prisma.user.deleteMany();

    // API를 통해 테스트용 사용자 생성
    const createUserResponse = await request(app)
      .post("/users")
      .send({
        email: "test@example.com",
        name: "테스트 사용자",
      })
      .expect(201);

    testUser = createUserResponse.body;

    // agent 생성 및 로그인
    agent = request.agent(app);

    const loginResponse = await agent.post("/login").send({
      email: "test@example.com",
      password: "password123",
    });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 각 테스트 전에 추가 사용자 데이터 정리 (기본 사용자는 유지)
    await prisma.user.deleteMany({
      where: {
        email: { not: "test@example.com" },
      },
    });
  });

  test("인증 토큰 없이 개별 사용자 조회 시 401 에러를 반환해야 한다", async () => {
    // Exercise: API 요청 실행
    const response = await request(app).get("/users/1").expect(401);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("인증 토큰");
  });

  test("유효한 토큰과 올바른 ID로 사용자를 조회할 수 있어야 한다", async () => {
    // Exercise: API 요청 실행
    const response = await agent
      .get(`/users/${testUser.id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("email");
    expect(response.body).toHaveProperty("name");
    expect(response.body.id).toBe(testUser.id);
    expect(response.body.email).toBe("test@example.com");
  });

  test("존재하지 않는 사용자 ID로 조회 시 404 에러를 반환해야 한다", async () => {
    // Exercise: API 요청 실행
    const response = await agent
      .get("/users/999")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(404);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("사용자를 찾을 수 없습니다");
  });

  test("잘못된 ID 형식으로 사용자 조회 시 400 에러를 반환해야 한다", async () => {
    // Exercise: API 요청 실행
    const response = await agent
      .get("/users/invalid-id")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(400);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("유효한 사용자 ID");
  });

  test("음수 ID로 사용자 조회 시 400 에러를 반환해야 한다", async () => {
    // Exercise: API 요청 실행
    const response = await agent
      .get("/users/-1")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(400);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("유효한 사용자 ID");
  });

  test("로그인된 agent로 다른 사용자도 조회할 수 있어야 한다", async () => {
    // Setup: API를 통해 추가 사용자 생성
    const anotherUserResponse = await request(app)
      .post("/users")
      .send({
        email: "another@example.com",
        name: "다른 사용자",
      })
      .expect(201);

    const anotherUser = anotherUserResponse.body;

    // Exercise: 로그인된 agent로 다른 사용자 조회
    const response = await agent
      .get(`/users/${anotherUser.id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("id", anotherUser.id);
    expect(response.body).toHaveProperty("email", "another@example.com");
    expect(response.body).toHaveProperty("name", "다른 사용자");
  });

  test("로그인된 agent로 토큰 없이 요청하면 401 에러를 반환해야 한다", async () => {
    // Exercise: 토큰 없이 요청
    const response = await agent.get("/users").expect(401);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("인증 토큰");
  });

  test("로그인된 agent로 잘못된 토큰으로 요청하면 401 에러를 반환해야 한다", async () => {
    // Exercise: 잘못된 토큰으로 요청
    const response = await agent
      .get("/users")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);

    // Assertion: 결과 검증
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("유효하지 않은 토큰");
  });
});
