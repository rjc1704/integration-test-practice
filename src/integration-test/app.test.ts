import request from "supertest";
import app from "../app";

describe("GET /", () => {
  test("기본 라우트가 정상적으로 응답해야 한다", async () => {
    const response = await request(app).get("/").expect(200);

    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Express 서버가 동작중입니다!");
  });

  test("보안 헤더가 설정되어야 한다", async () => {
    const response = await request(app).get("/").expect(200);

    // Helmet 미들웨어가 설정한 보안 헤더 확인
    expect(response.headers).toHaveProperty("x-frame-options"); // 클릭재킹 공격 방지
    expect(response.headers).toHaveProperty("x-content-type-options"); // MIME 타입 스니핑 공격을 방지
  });
});
