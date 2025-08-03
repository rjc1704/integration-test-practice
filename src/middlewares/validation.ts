import { Request, Response, NextFunction } from "express";

export const validateUserBody = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log("📝 사용자 데이터 유효성 검사 시작");

  const { email, name } = req.body;

  // 이메일 형식 검사
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    console.log("❌ 이메일 형식이 올바르지 않습니다");
    return res.status(400).json({ error: "올바른 이메일 형식이 필요합니다." });
  }

  // 이름 길이 검사
  if (!name || name.length < 2) {
    console.log("❌ 이름은 최소 2자 이상이어야 합니다");
    return res
      .status(400)
      .json({ error: "이름은 최소 2자 이상이어야 합니다." });
  }

  console.log("✅ 사용자 데이터 유효성 검사 통과");
  next();
};

export const validateLoginBody = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log("🔐 로그인 데이터 유효성 검사 시작");

  const { email, password } = req.body;

  // 이메일 형식 검사
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    console.log("❌ 이메일 형식이 올바르지 않습니다");
    return res.status(400).json({ error: "올바른 이메일 형식이 필요합니다." });
  }

  // 비밀번호 검사
  if (!password || password.length < 6) {
    console.log("❌ 비밀번호는 최소 6자 이상이어야 합니다");
    return res
      .status(400)
      .json({ error: "비밀번호는 최소 6자 이상이어야 합니다." });
  }

  console.log("✅ 로그인 데이터 유효성 검사 통과");
  next();
};

export const validateUserId = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log("🆔 사용자 ID 유효성 검사 시작");

  const userId = parseInt(req.params.id);

  if (isNaN(userId) || userId <= 0) {
    console.log("❌ 유효하지 않은 사용자 ID입니다");
    return res.status(400).json({ error: "유효한 사용자 ID가 필요합니다." });
  }

  console.log("✅ 사용자 ID 유효성 검사 통과");
  next();
};
