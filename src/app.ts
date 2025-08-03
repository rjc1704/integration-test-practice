import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

// 커스텀 미들웨어 import
import { verifyAccessToken } from "./middlewares/auth";
import {
  validateUserBody,
  validateUserId,
  validateLoginBody,
} from "./middlewares/validation";

const app = express();
const prisma = new PrismaClient();

// JWT 시크릿 키
const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";

// 미들웨어 3개 설정
app.use(helmet()); // 보안 헤더 설정
app.use(morgan("combined")); // 로깅
app.use(express.json()); // JSON 파싱

// 기본 라우트
app.get("/", (req, res) => {
  res.json({
    message: "Express 서버가 동작중입니다!",
    dbHost: process.env.DB_HOST,
  });
});

// 로그인 엔드포인트
app.post(
  "/login",
  validateLoginBody, // 1. 로그인 데이터 유효성 검사
  async (req, res) => {
    try {
      console.log("🎯 로그인 핸들러 실행");
      const { email, password } = req.body;

      // 실제 프로젝트에서는 bcrypt로 비밀번호 검증
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res
          .status(401)
          .json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
      }

      // 간단한 비밀번호 검증 (실제로는 bcrypt.compare 사용)
      if (password !== "password123") {
        return res
          .status(401)
          .json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
      }

      // JWT 토큰 생성
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
        },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      res.json({
        message: "로그인 성공",
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "로그인 중 오류가 발생했습니다." });
    }
  },
);

// 사용자 관련 라우트 - 여러 미들웨어 체인 적용
app.get(
  "/users",
  verifyAccessToken, // 1. 인증 토큰 검증
  async (req, res) => {
    try {
      console.log("🎯 사용자 목록 조회 핸들러 실행");
      const users = await prisma.user.findMany();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "사용자 조회 중 오류가 발생했습니다." });
    }
  },
);

app.post(
  "/users",
  validateUserBody, // 1. 요청 데이터 유효성 검사
  async (req, res) => {
    try {
      console.log("🎯 사용자 생성 핸들러 실행");
      const { email, name } = req.body;

      const user = await prisma.user.create({
        data: { email, name },
      });

      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: "사용자 생성 중 오류가 발생했습니다." });
    }
  },
);

// 개별 사용자 조회 - ID 유효성 검사 추가
app.get(
  "/users/:id",
  verifyAccessToken, // 1. 인증 토큰 검증
  validateUserId, // 2. ID 유효성 검사
  async (req, res) => {
    try {
      console.log("🎯 개별 사용자 조회 핸들러 실행");
      const userId = parseInt(req.params.id);

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "사용자 조회 중 오류가 발생했습니다." });
    }
  },
);

export default app;
