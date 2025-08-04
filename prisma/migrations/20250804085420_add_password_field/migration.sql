/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- 먼저 password 컬럼을 추가하고 기본값 설정
ALTER TABLE "public"."User" ADD COLUMN "password" TEXT NOT NULL DEFAULT 'password123';
-- 기본값 제거
ALTER TABLE "public"."User" ALTER COLUMN "password" DROP DEFAULT;
-- name 컬럼 삭제
ALTER TABLE "public"."User" DROP COLUMN "name";
