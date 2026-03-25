#!/usr/bin/env node

import { generateClient } from "aws-amplify/api";
import { signUp, signInWithPassword } from "aws-amplify/auth";
import { uploadData } from "aws-amplify/storage";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json" assert { type: "json" };
import fs from "fs/promises";
import path from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
Amplify.configure(outputs);

const TEST_PASSWORD = "TestPassword123!";
const PICS_DIR = path.join(__dirname, "../pics");
const client = generateClient();

const departments = ["営業", "企画", "エンジニア", "デザイン", "マーケ"];

// 사진 분류
async function classifyImages() {
  const files = await fs.readdir(PICS_DIR);
  const facePhotos = files.filter((f) => f.includes("顔写真"));
  const moodPhotos = files.filter((f) => f.includes("雰囲気写真"));
  return { facePhotos, moodPhotos };
}

// 사진 업로드
async function uploadPhoto(filePath, userId, photoNum) {
  try {
    const fileData = readFileSync(filePath);
    const fileName = `photo${photoNum}.jpg`;
    const key = `${userId}/${fileName}`;

    const result = await uploadData({
      key,
      data: fileData,
      options: {
        contentType: "image/jpeg",
      },
    }).result;

    console.log(`  ✓ Uploaded photo${photoNum}`);
    return key;
  } catch (error) {
    console.error(`  ✗ Failed to upload photo${photoNum}:`, error.message);
    return null;
  }
}

// 사용자 생성
async function createTestUser(index, department, photos) {
  const email = `test${index}@example.com`;
  const displayName = `テストユーザー${index}`;

  console.log(`\n👤 Creating ${displayName}...`);

  try {
    // 1. Cognito 가입
    const signUpResult = await signUp({
      username: email,
      password: TEST_PASSWORD,
      options: {
        userAttributes: {
          email,
        },
      },
    });

    console.log(`  ✓ Signed up: ${email}`);

    // 2. 즉시 로그인
    await signInWithPassword({
      username: email,
      password: TEST_PASSWORD,
    });

    console.log(`  ✓ Signed in`);

    // 3. 사진 업로드
    const photoKeys = [];
    for (let i = 0; i < photos.length; i++) {
      const key = await uploadPhoto(path.join(PICS_DIR, photos[i]), email.split("@")[0], i + 1);
      if (key) photoKeys.push(key);
    }

    // 4. 프로필 생성
    const photoUrls = photoKeys.map((key) => `https://${outputs.storage.bucket_name}.s3.ap-northeast-1.amazonaws.com/public/${key}`);

    await client.models.UserProfile.create({
      userId: email.split("@")[0],
      displayName,
      department,
      photo1Url: photoUrls[0],
      photo2Url: photoUrls[1],
      photo3Url: photoUrls[2],
      preferences: ["和食", "カフェ"],
      preferenceFreeText: "テストユーザーです",
      lunchDays: ["月", "水", "金"],
      lunchTime: "12:00-13:00",
      lunchBudget: "1000-1500円",
      lunchArea: "丸の内",
    });

    console.log(`  ✓ Profile created`);

    return { email, password: TEST_PASSWORD, displayName };
  } catch (error) {
    console.error(`  ✗ Error:`, error.message);
    return null;
  }
}

// 메인
async function main() {
  console.log("🚀 테스트 유저 생성 시작...\n");

  const { facePhotos, moodPhotos } = await classifyImages();
  console.log(`📸 얼굴 사진: ${facePhotos.length}개, 분위기 사진: ${moodPhotos.length}개\n`);

  const credentials = [];

  for (let i = 1; i <= 10; i++) {
    const dept = departments[i % departments.length];
    const photoSet = [
      facePhotos[i % facePhotos.length],
      moodPhotos[i % moodPhotos.length],
      moodPhotos[(i + 5) % moodPhotos.length],
    ];

    const result = await createTestUser(i, dept, photoSet);
    if (result) {
      credentials.push(result);
    }
  }

  // CSV 저장
  if (credentials.length > 0) {
    const csv = ["이름,이메일,비밀번호", ...credentials.map((c) => `${c.displayName},${c.email},${c.password}`)].join("\n");
    await fs.writeFile(path.join(__dirname, "../test-credentials.csv"), csv);

    console.log("\n========================================");
    console.log("✓ 테스트 유저 생성 완료!");
    console.log("========================================\n");

    console.log(credentials.map((c) => `${c.displayName}: ${c.email} / ${c.password}`).join("\n"));

    console.log("\n✓ 자격증명이 저장되었습니다: test-credentials.csv");
  }
}

main().catch(console.error);
