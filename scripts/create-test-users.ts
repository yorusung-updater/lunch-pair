import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } from "@aws-sdk/client-cognito-identity-provider";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, readdirSync } from "fs";
import { join, extname } from "path";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import outputs from "../amplify_outputs.json" assert { type: "json" };

const AWS_REGION = "ap-northeast-1";
const USER_POOL_ID = outputs.auth.user_pool_id;
const CLIENT_ID = outputs.auth.user_pool_client_id;
const S3_BUCKET = outputs.storage.bucket_name;

const cognito = new CognitoIdentityProviderClient({ region: AWS_REGION });
const s3 = new S3Client({ region: AWS_REGION });

// 설정
const TEST_USER_COUNT = 10;
const TEST_PASSWORD = "TestPassword123!";
const PICS_DIR = "./pics";

interface TestUser {
  email: string;
  username: string;
  password: string;
  displayName: string;
  department: string;
  photos: {
    photo1: string; // 얼굴
    photo2: string; // 분위기
    photo3: string; // 분위기
  };
}

// 사진 분류
function classifyImages() {
  const files = readdirSync(PICS_DIR);
  const facePhotos = files.filter((f) => f.includes("顔写真"));
  const moodPhotos = files.filter((f) => f.includes("雰囲気写真"));

  return { facePhotos, moodPhotos };
}

// Cognito 사용자 생성
async function createCognitoUser(email: string, tempPassword: string) {
  try {
    await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
        ],
        TemporaryPassword: tempPassword,
        MessageAction: "SUPPRESS",
      })
    );

    // 영구 비밀번호 설정
    await cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        Password: TEST_PASSWORD,
        Permanent: true,
      })
    );

    console.log(`✓ Cognito user created: ${email}`);
  } catch (error: any) {
    if (error.name === "UsernameExistsException") {
      console.log(`⚠ User already exists: ${email}`);
    } else {
      throw error;
    }
  }
}

// S3에 사진 업로드
async function uploadPhotoToS3(filePath: string, userId: string, photoNumber: number): Promise<string> {
  const fileBuffer = readFileSync(filePath);
  const ext = extname(filePath);
  const s3Key = `public/${userId}/photo${photoNumber}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: `image/${ext.slice(1)}`,
    })
  );

  const photoUrl = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
  console.log(`✓ Photo uploaded: ${s3Key}`);
  return photoUrl;
}

// 프로필 생성
async function createProfile(userId: string, user: TestUser, photoUrls: { photo1Url: string; photo2Url: string; photo3Url: string }) {
  Amplify.configure(outputs);
  const client = generateClient();

  await client.models.UserProfile.create({
    userId,
    displayName: user.displayName,
    department: user.department,
    photo1Url: photoUrls.photo1Url,
    photo2Url: photoUrls.photo2Url,
    photo3Url: photoUrls.photo3Url,
    preferences: ["和食", "カフェ"],
    preferenceFreeText: "テストユーザーです",
    lunchDays: ["月", "水", "金"],
    lunchTime: "12:00-13:00",
    lunchBudget: "1000-1500円",
    lunchArea: "丸の内",
  });

  console.log(`✓ Profile created: ${user.displayName}`);
}

// 메인 함수
async function main() {
  console.log("🚀 Test users 생성 시작...\n");

  const { facePhotos, moodPhotos } = classifyImages();
  console.log(`📸 Face photos: ${facePhotos.length}, Mood photos: ${moodPhotos.length}\n`);

  const testUsers: TestUser[] = [];
  const departments = ["営業", "企画", "エンジニア", "デザイン", "マーケ"];

  // 테스트 사용자 데이터 생성
  for (let i = 1; i <= TEST_USER_COUNT; i++) {
    testUsers.push({
      email: `test${i}@example.com`,
      username: `test${i}`,
      password: TEST_PASSWORD,
      displayName: `テストユーザー${i}`,
      department: departments[i % departments.length],
      photos: {
        photo1: join(PICS_DIR, facePhotos[i % facePhotos.length]),
        photo2: join(PICS_DIR, moodPhotos[i % moodPhotos.length]),
        photo3: join(PICS_DIR, moodPhotos[(i + 5) % moodPhotos.length]),
      },
    });
  }

  // 각 사용자 생성
  const credentials = [];

  for (const user of testUsers) {
    console.log(`\n👤 Creating ${user.displayName}...`);

    // 1. Cognito 사용자 생성
    await createCognitoUser(user.email, TEST_PASSWORD);

    // 2. S3에 사진 업로드 (임시로 userId 사용)
    const userId = user.email.split("@")[0];

    try {
      const photo1Url = await uploadPhotoToS3(user.photos.photo1, userId, 1);
      const photo2Url = await uploadPhotoToS3(user.photos.photo2, userId, 2);
      const photo3Url = await uploadPhotoToS3(user.photos.photo3, userId, 3);

      // 3. 프로필 생성
      await createProfile(userId, user, { photo1Url, photo2Url, photo3Url });

      credentials.push({
        displayName: user.displayName,
        email: user.email,
        password: user.password,
      });
    } catch (error) {
      console.error(`✗ Error creating profile for ${user.displayName}:`, error);
    }
  }

  // 결과 출력
  console.log("\n\n📋 Test User Credentials\n");
  console.log("========================================");
  credentials.forEach((cred) => {
    console.log(`\n이름: ${cred.displayName}`);
    console.log(`メール: ${cred.email}`);
    console.log(`パスワード: ${cred.password}`);
  });
  console.log("\n========================================\n");

  // CSV로 저장
  const csv = ["displayName,email,password", ...credentials.map((c) => `${c.displayName},${c.email},${c.password}`)].join("\n");

  const fs = await import("fs/promises");
  await fs.writeFile("./test-credentials.csv", csv);
  console.log("✓ Credentials saved to: test-credentials.csv\n");
}

main().catch(console.error);
