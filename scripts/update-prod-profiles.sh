#!/bin/bash

# Update production DynamoDB profiles with katakana names, bios, and photo URLs

TABLE_NAME="UserProfile-qurtyitckjetldy4sinorx6xti-NONE"
REGION="ap-northeast-1"
S3_BUCKET="amplify-dkcmgnfwojthr-mai-matchappphotosbucket780e-j4cocdxbwjwi"

# Profile data mapping
declare -A PROFILES=(
  ["test1"]="チャラ|ランチで新しい人間関係を作るのが好き。"
  ["test2"]="クリス|新しいお店やトレンドが大好きな企画職です。"
  ["test3"]="ハレ|ランチは気分転換、気軽に話せる仲間が欲しい。"
  ["test4"]="ジャンコ|素敵な雰囲気のお店で一緒にランチしたいです。"
  ["test5"]="ジェフ|ビジネス視点で語り合える人とランチしたい。"
  ["test6"]="レイ|グルメ好き。新しいお店の開拓仲間募集中です。"
  ["test7"]="マリー|アウトドア好きなアクティブ派、自然派と繋がりたい。"
  ["test8"]="マーク|ヘルシーな食生活と環境問題を考える仲間が欲しい。"
  ["test9"]="オクタ|ヨーロッパ文化や芸術を愛する感性派です。"
  ["test10"]="ラナ|心が通じる人とのランチが一番好きです。"
)

echo "🚀 Updating production profiles..."
echo "Table: $TABLE_NAME"
echo "Region: $REGION"
echo ""

SUCCESS=0
FAILED=0

for userId in test1 test2 test3 test4 test5 test6 test7 test8 test9 test10; do
  IFS='|' read -r displayName bioText <<< "${PROFILES[$userId]}"

  # Build photo URLs
  PHOTO1="https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/public/${userId}/photo1.jpg"
  PHOTO2="https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/public/${userId}/photo2.jpg"
  PHOTO3="https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/public/${userId}/photo3.jpg"

  echo "📝 Updating $userId → $displayName"

  # Use correct AWS CLI syntax with expression-attribute-values
  aws dynamodb update-item \
    --table-name "$TABLE_NAME" \
    --key "{\"userId\": {\"S\": \"$userId\"}}" \
    --update-expression "SET displayName = :name, preferenceFreeText = :bio, photo1Url = :p1, photo2Url = :p2, photo3Url = :p3" \
    --expression-attribute-values "{
      \":name\": {\"S\": \"$displayName\"},
      \":bio\": {\"S\": \"$bioText\"},
      \":p1\": {\"S\": \"$PHOTO1\"},
      \":p2\": {\"S\": \"$PHOTO2\"},
      \":p3\": {\"S\": \"$PHOTO3\"}
    }" \
    --region "$REGION" 2>&1

  if [ $? -eq 0 ]; then
    echo "✅ Success: $userId"
    ((SUCCESS++))
  else
    echo "❌ Failed: $userId"
    ((FAILED++))
  fi
  echo ""
done

echo "========================================"
echo "📊 Update Summary"
echo "========================================"
echo "✅ Succeeded: $SUCCESS"
echo "❌ Failed: $FAILED"
echo "Total: $((SUCCESS + FAILED))"

if [ $FAILED -eq 0 ]; then
  echo ""
  echo "🎉 All profiles updated successfully!"
fi
