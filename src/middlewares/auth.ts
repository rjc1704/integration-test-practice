import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";

// Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
      };
    }
  }
}

export const verifyAccessToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  console.log(`🔐 인증 토큰 검증 중: ${token ? "토큰 있음" : "토큰 없음"}`);

  if (!token) {
    console.log("❌ 토큰이 없습니다. 인증 실패");
    return res.status(401).json({ error: "인증 토큰이 필요합니다." });
  }

  try {
    // JWT 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // 요청 객체에 사용자 정보 추가
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    console.log("✅ JWT 토큰 검증 성공");
    next();
  } catch (error) {
    console.log("❌ 유효하지 않은 토큰입니다. 인증 실패");
    return res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
};
