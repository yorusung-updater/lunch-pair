#!/usr/bin/env python3

import os
import glob
import json
import subprocess
import sys

# 설정
PICS_DIR = "./pics"
API_ENDPOINT = "https://syemesvrifeplicdatbuxr6zm4.appsync-api.ap-northeast-1.amazonaws.com/graphql"
API_KEY = "da2-pcpxy3usxrhlbpxux2hej6w7zu"
S3_BUCKET = "amplify-dkcmgnfwojthr-mai-matchappphotosbucket780e-j4cocdxbwjwi"
AWS_REGION = "ap-northeast-1"
PROFILE = "mobile"

DEPARTMENTS = ["営業", "企画", "エンジニア", "デザイン", "マーケ"]

# 사진 분류
def get_photos():
    files = os.listdir(PICS_DIR)
    face_photos = sorted([f for f in files if "顔写真" in f])
    mood_photos = sorted([f for f in files if "雰囲気写真" in f])
    return face_photos, mood_photos

# S3에 업로드
def upload_to_s3(filepath, user_id, photo_num):
    try:
        key = f"public/{user_id}/photo{photo_num}.jpg"
        cmd = [
            "aws", "s3", "cp", filepath, f"s3://{S3_BUCKET}/{key}",
            "--profile", PROFILE,
            "--region", AWS_REGION,
            "--quiet"
        ]
        subprocess.run(cmd, check=True)
        url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"
        print(f"  ✓ Photo{photo_num} uploaded")
        return url
    except Exception as e:
        print(f"  ✗ Photo{photo_num} upload failed: {e}")
        return None

# GraphQL 프로필 생성
def create_profile_graphql(user_id, display_name, department, photo1_url, photo2_url, photo3_url):
    try:
        mutation = f'''
        mutation {{
          createUserProfile(input: {{
            userId: "{user_id}"
            displayName: "{display_name}"
            department: "{department}"
            photo1Url: "{photo1_url}"
            photo2Url: "{photo2_url}"
            photo3Url: "{photo3_url}"
            preferences: ["和食", "カフェ"]
            preferenceFreeText: "テストユーザーです"
            lunchDays: ["月", "水", "金"]
            lunchTime: "12:00-13:00"
            lunchBudget: "1000-1500円"
            lunchArea: "丸の内"
          }}) {{
            userId
            displayName
          }}
        }}
        '''

        payload = json.dumps({"query": mutation})

        cmd = [
            "curl", "-s", "-X", "POST", API_ENDPOINT,
            "-H", "Content-Type: application/json",
            "-H", f"x-api-key: {API_KEY}",
            "-d", payload
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        response = json.loads(result.stdout)

        if "data" in response and response["data"].get("createUserProfile"):
            print(f"  ✓ Profile created")
            return True
        else:
            error = response.get("errors", [{}])[0].get("message", "Unknown error")
            print(f"  ✗ Profile creation failed: {error}")
            return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

# 메인
def main():
    print("🚀 プロフィール作成開始...\n")

    face_photos, mood_photos = get_photos()
    print(f"📸 Found {len(face_photos)} face photos, {len(mood_photos)} mood photos\n")

    if not face_photos or not mood_photos:
        print("❌ Photos not found!")
        return

    credentials = []

    for i in range(1, 11):
        user_id = f"test{i}"
        email = f"test{i}@example.com"
        display_name = f"テストユーザー{i}"
        dept = DEPARTMENTS[i % len(DEPARTMENTS)]

        print(f"👤 [{i}/10] {display_name} ({email})")

        # 사진 할당
        face_idx = i % len(face_photos)
        mood_idx1 = i % len(mood_photos)
        mood_idx2 = (i + 5) % len(mood_photos)

        face_file = os.path.join(PICS_DIR, face_photos[face_idx])
        mood_file1 = os.path.join(PICS_DIR, mood_photos[mood_idx1])
        mood_file2 = os.path.join(PICS_DIR, mood_photos[mood_idx2])

        # S3 업로드
        print("  Uploading photos...")
        photo1_url = upload_to_s3(face_file, user_id, 1)
        photo2_url = upload_to_s3(mood_file1, user_id, 2)
        photo3_url = upload_to_s3(mood_file2, user_id, 3)

        if not all([photo1_url, photo2_url, photo3_url]):
            print("  Skipping profile creation due to upload failure")
            continue

        # 프로필 생성
        print("  Creating profile...")
        if create_profile_graphql(user_id, display_name, dept, photo1_url, photo2_url, photo3_url):
            credentials.append({
                "displayName": display_name,
                "email": email,
                "password": "TestPassword123!"
            })

        print()

    # 결과 출력
    print("=" * 50)
    print("✅ Complete!")
    print("=" * 50)
    print("\n📋 Test User Credentials:\n")

    for cred in credentials:
        print(f"{cred['displayName']}: {cred['email']} / {cred['password']}")

    # CSV 저장
    with open("test-credentials.csv", "w") as f:
        f.write("이름,이메일,비밀번호\n")
        for cred in credentials:
            f.write(f"{cred['displayName']},{cred['email']},{cred['password']}\n")

    print(f"\n✓ Saved to: test-credentials.csv")

if __name__ == "__main__":
    main()
