#!/usr/bin/env python3

import json
import subprocess
import sys

TABLE_NAME = "UserProfile-qurtyitckjetldy4sinorx6xti-NONE"
REGION = "ap-northeast-1"
S3_BUCKET = "amplify-dkcmgnfwojthr-mai-matchappphotosbucket780e-j4cocdxbwjwi"

# Profile data mapping: userId -> (displayName, bio)
PROFILES = {
    "test1": ("チャラ", "ランチで新しい人間関係を作るのが好き。"),
    "test2": ("クリス", "新しいお店やトレンドが大好きな企画職です。"),
    "test3": ("ハレ", "ランチは気分転換、気軽に話せる仲間が欲しい。"),
    "test4": ("ジャンコ", "素敵な雰囲気のお店で一緒にランチしたいです。"),
    "test5": ("ジェフ", "ビジネス視点で語り合える人とランチしたい。"),
    "test6": ("レイ", "グルメ好き。新しいお店の開拓仲間募集中です。"),
    "test7": ("マリー", "アウトドア好きなアクティブ派、自然派と繋がりたい。"),
    "test8": ("マーク", "ヘルシーな食生活と環境問題を考える仲間が欲しい。"),
    "test9": ("オクタ", "ヨーロッパ文化や芸術を愛する感性派です。"),
    "test10": ("ラナ", "心が通じる人とのランチが一番好きです。"),
}

print("🚀 Updating production profiles...")
print(f"Table: {TABLE_NAME}")
print(f"Region: {REGION}")
print()

success_count = 0
failed_count = 0

for user_id, (display_name, bio_text) in PROFILES.items():
    # Build photo URLs
    photo1 = f"https://{S3_BUCKET}.s3.{REGION}.amazonaws.com/public/{user_id}/photo1.jpg"
    photo2 = f"https://{S3_BUCKET}.s3.{REGION}.amazonaws.com/public/{user_id}/photo2.jpg"
    photo3 = f"https://{S3_BUCKET}.s3.{REGION}.amazonaws.com/public/{user_id}/photo3.jpg"

    print(f"📝 Updating {user_id} → {display_name}")

    # Build AWS CLI command
    cmd = [
        "aws", "dynamodb", "update-item",
        "--table-name", TABLE_NAME,
        "--key", json.dumps({"userId": {"S": user_id}}),
        "--update-expression",
        "SET displayName = :name, preferenceFreeText = :bio, photo1Url = :p1, photo2Url = :p2, photo3Url = :p3",
        "--expression-attribute-values",
        json.dumps({
            ":name": {"S": display_name},
            ":bio": {"S": bio_text},
            ":p1": {"S": photo1},
            ":p2": {"S": photo2},
            ":p3": {"S": photo3},
        }),
        "--region", REGION,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode == 0:
        print(f"✅ Success: {user_id}")
        success_count += 1
    else:
        print(f"❌ Failed: {user_id}")
        print(f"   Error: {result.stderr}")
        failed_count += 1
    print()

print("=" * 40)
print("📊 Update Summary")
print("=" * 40)
print(f"✅ Succeeded: {success_count}")
print(f"❌ Failed: {failed_count}")
print(f"Total: {success_count + failed_count}")

if failed_count == 0:
    print()
    print("🎉 All profiles updated successfully!")
    sys.exit(0)
else:
    sys.exit(1)
