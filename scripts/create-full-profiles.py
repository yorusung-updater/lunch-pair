#!/usr/bin/env python3

import json
import subprocess
import os

# 설정
API_ENDPOINT = "https://syemesvrifeplicdatbuxr6zm4.appsync-api.ap-northeast-1.amazonaws.com/graphql"
API_KEY = "da2-pcpxy3usxrhlbpxux2hej6w7zu"
S3_BUCKET = "amplify-dkcmgnfwojthr-mai-matchappphotosbucket780e-j4cocdxbwjwi"
AWS_REGION = "ap-northeast-1"

DEPARTMENTS = ["営業", "企画", "エンジニア", "デザイン", "マーケ"]
LUNCH_TIMES = ["11:30-12:30", "12:00-13:00", "12:30-13:30"]
LUNCH_BUDGETS = ["800-1000円", "1000-1500円", "1500-2000円"]
LUNCH_AREAS = ["丸の内", "銀座", "新宿", "渋谷", "六本木"]

def graphql_query(query):
    """GraphQL 쿼리 실행"""
    try:
        payload = json.dumps({"query": query})
        cmd = [
            "curl", "-s", "-X", "POST", API_ENDPOINT,
            "-H", "Content-Type: application/json",
            "-H", f"x-api-key: {API_KEY}",
            "-d", payload
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        return json.loads(result.stdout)
    except Exception as e:
        print(f"Error: {e}")
        return None

def create_profile(index):
    """프로필 생성"""
    user_id = f"test{index}"
    email = f"test{index}@example.com"
    display_name = f"テストユーザー{index}"
    department = DEPARTMENTS[index % len(DEPARTMENTS)]
    lunch_time = LUNCH_TIMES[index % len(LUNCH_TIMES)]
    lunch_budget = LUNCH_BUDGETS[index % len(LUNCH_BUDGETS)]
    lunch_area = LUNCH_AREAS[index % len(LUNCH_AREAS)]

    # 사진 URL
    photo1_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/public/{user_id}/photo1.jpg"
    photo2_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/public/{user_id}/photo2.jpg"
    photo3_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/public/{user_id}/photo3.jpg"

    # GraphQL 뮤테이션
    mutation = f'''
    mutation {{
      createUserProfile(input: {{
        userId: "{user_id}"
        displayName: "{display_name}"
        department: "{department}"
        photo1Url: "{photo1_url}"
        photo2Url: "{photo2_url}"
        photo3Url: "{photo3_url}"
        preferences: ["和食", "カフェ", "居酒屋"]
        preferenceFreeText: "ランチを一緒に食べられる同僚を探しています。カジュアルな雰囲気で、会話が弾むような人と一緒に過ごしたいです。"
        lunchDays: ["月", "水", "金"]
        lunchTime: "{lunch_time}"
        lunchBudget: "{lunch_budget}"
        lunchArea: "{lunch_area}"
        ethicalScale: "意識している"
        ethicalTags: ["サステナビリティ", "地域活性化"]
        ethicalMatchingStance: "価値観の違いを尊重しながら関係を深めたい"
      }}) {{
        userId
        displayName
        department
      }}
    }}
    '''

    print(f"👤 [{index}/10] {display_name}")

    response = graphql_query(mutation)

    if response and "data" in response and response["data"].get("createUserProfile"):
        profile = response["data"]["createUserProfile"]
        print(f"  ✅ {profile['displayName']} ({profile['department']})")
        print(f"     ランチ時間: {lunch_time}")
        print(f"     予算: {lunch_budget}")
        print(f"     エリア: {lunch_area}")
        return True
    else:
        error = response.get("errors", [{}])[0].get("message", "Unknown error") if response else "No response"
        print(f"  ❌ 作成失敗: {error}")
        return False

def main():
    print("=" * 60)
    print("🚀 フル プロフィール作成開始...")
    print("=" * 60)
    print()

    success_count = 0
    for i in range(1, 11):
        if create_profile(i):
            success_count += 1
        print()

    print("=" * 60)
    print(f"✅ 完了: {success_count}/10 プロフィール作成成功")
    print("=" * 60)

if __name__ == "__main__":
    main()
