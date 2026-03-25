#!/bin/bash

# AppSync API 설정
API_ENDPOINT="https://syemesvrifeplicdatbuxr6zm4.appsync-api.ap-northeast-1.amazonaws.com/graphql"
API_KEY="da2-pcpxy3usxrhlbpxux2hej6w7zu"
S3_BUCKET="amplify-dkcmgnfwojthr-main-s3storagec8-7sdt8drlhjms"
PICS_DIR="./pics"

# 파일 분류
mapfile -t FACE_PHOTOS < <(ls "$PICS_DIR" | grep "顔写真")
mapfile -t MOOD_PHOTOS < <(ls "$PICS_DIR" | grep "雰囲気写真")

echo "Found ${#FACE_PHOTOS[@]} face photos and ${#MOOD_PHOTOS[@]} mood photos"

DEPARTMENTS=("営業" "企画" "エンジニア" "デザイン" "マーケ")

# S3에 사진 업로드
upload_photo() {
  local file="$1"
  local user_id="$2"
  local photo_num="$3"

  local key="public/${user_id}/photo${photo_num}.jpg"

  aws s3 cp "$file" "s3://${S3_BUCKET}/${key}" \
    --profile mobile \
    --region ap-northeast-1 \
    --quiet

  echo "https://${S3_BUCKET}.s3.ap-northeast-1.amazonaws.com/${key}"
}

# GraphQL로 프로필 생성
create_profile() {
  local user_id="$1"
  local display_name="$2"
  local department="$3"
  local photo1_url="$4"
  local photo2_url="$5"
  local photo3_url="$6"

  local mutation=$(cat <<EOF
mutation {
  createUserProfile(input: {
    userId: "$user_id"
    displayName: "$display_name"
    department: "$department"
    photo1Url: "$photo1_url"
    photo2Url: "$photo2_url"
    photo3Url: "$photo3_url"
    preferences: ["和食", "カフェ"]
    preferenceFreeText: "テストユーザーです"
    lunchDays: ["月", "水", "金"]
    lunchTime: "12:00-13:00"
    lunchBudget: "1000-1500円"
    lunchArea: "丸の内"
  }) {
    userId
    displayName
  }
}
EOF
)

  curl -s -X POST "$API_ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "{\"query\": $(echo "$mutation" | jq -Rs .)}" \
    | jq -r '.data.createUserProfile.userId // .errors[0].message // "Error"'
}

echo "🚀 Creating profiles..."

for i in {1..10}; do
  USER_ID="test${i}"
  EMAIL="test${i}@example.com"
  DISPLAY_NAME="テストユーザー${i}"
  DEPT="${DEPARTMENTS[$((i % 5))]}"

  echo ""
  echo "👤 [$i/10] $DISPLAY_NAME ($EMAIL) - $DEPT"

  # 사진 할당
  FACE_IDX=$((i % ${#FACE_PHOTOS[@]}))
  MOOD_IDX1=$((i % ${#MOOD_PHOTOS[@]}))
  MOOD_IDX2=$(((i + 5) % ${#MOOD_PHOTOS[@]}))

  # S3에 업로드
  echo "  Uploading photos..."
  PHOTO1=$(upload_photo "${PICS_DIR}/${FACE_PHOTOS[$FACE_IDX]}" "$USER_ID" 1)
  PHOTO2=$(upload_photo "${PICS_DIR}/${MOOD_PHOTOS[$MOOD_IDX1]}" "$USER_ID" 2)
  PHOTO3=$(upload_photo "${PICS_DIR}/${MOOD_PHOTOS[$MOOD_IDX2]}" "$USER_ID" 3)

  # 프로필 생성
  echo "  Creating profile..."
  RESULT=$(create_profile "$USER_ID" "$DISPLAY_NAME" "$DEPT" "$PHOTO1" "$PHOTO2" "$PHOTO3")

  if [ "$RESULT" != "Error" ] && [ -n "$RESULT" ]; then
    echo "  ✓ Profile created"
  else
    echo "  ✗ Failed: $RESULT"
  fi
done

echo ""
echo "✅ Complete!"
echo ""
echo "========================================="
echo "Test User Credentials"
echo "========================================="
for i in {1..10}; do
  echo "test${i}@example.com / TestPassword123!"
done
echo "========================================="
