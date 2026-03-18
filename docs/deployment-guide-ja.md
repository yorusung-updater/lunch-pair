# デプロイガイド

## 環境情報

| 項目 | 値 |
|------|-----|
| App ID | `dkcmgnfwojthr` |
| リージョン | `ap-northeast-1` |
| AWS Profile | `mobile` |
| フロントエンドURL | https://main.dkcmgnfwojthr.amplifyapp.com |
| プラットフォーム | Amplify Hosting（静的デプロイ） |

## 事前準備

```bash
# AWS SSO ログイン（セッション切れの場合）
aws sso login --profile mobile
```

---

## フロントエンドのみ変更した場合

UI、スタイル、定数など `src/` 配下のファイルのみ変更した場合。

```bash
# 1. ビルド
npm run build

# 2. zip作成
cd out && zip -qr /tmp/deploy.zip . && cd ..

# 3. デプロイURL発行 + アップロード + 開始
DEPLOY=$(aws amplify create-deployment \
  --app-id dkcmgnfwojthr --branch-name main \
  --profile mobile --region ap-northeast-1 --output json)

JOB_ID=$(echo "$DEPLOY" | python3 -c "import json,sys; print(json.load(sys.stdin)['jobId'])")
URL=$(echo "$DEPLOY" | python3 -c "import json,sys; print(json.load(sys.stdin)['zipUploadUrl'])")

curl -s -X PUT -H "Content-Type: application/zip" --data-binary @/tmp/deploy.zip "$URL"

aws amplify start-deployment \
  --app-id dkcmgnfwojthr --branch-name main --job-id "$JOB_ID" \
  --profile mobile --region ap-northeast-1

# 4. ステータス確認
aws amplify get-job \
  --app-id dkcmgnfwojthr --branch-name main --job-id "$JOB_ID" \
  --profile mobile --region ap-northeast-1 \
  --query "job.summary.status" --output text
```

デプロイ完了まで通常10〜20秒。

---

## バックエンドを変更した場合

スキーマ変更（`amplify/data/resource.ts`）、Lambda修正（`amplify/data/*/handler.ts`）、認証・ストレージ設定変更など。

```bash
# 1. バックエンドデプロイ（約3〜6分）
CI=1 AWS_PROFILE=mobile npx ampx pipeline-deploy \
  --branch main --app-id dkcmgnfwojthr

# 2. amplify_outputs.json が自動更新 → フロントも再デプロイが必要
npm run build
cd out && zip -qr /tmp/deploy.zip . && cd ..

# 3. フロントエンドデプロイ（上記の手順と同じ）
DEPLOY=$(aws amplify create-deployment \
  --app-id dkcmgnfwojthr --branch-name main \
  --profile mobile --region ap-northeast-1 --output json)

JOB_ID=$(echo "$DEPLOY" | python3 -c "import json,sys; print(json.load(sys.stdin)['jobId'])")
URL=$(echo "$DEPLOY" | python3 -c "import json,sys; print(json.load(sys.stdin)['zipUploadUrl'])")

curl -s -X PUT -H "Content-Type: application/zip" --data-binary @/tmp/deploy.zip "$URL"

aws amplify start-deployment \
  --app-id dkcmgnfwojthr --branch-name main --job-id "$JOB_ID" \
  --profile mobile --region ap-northeast-1
```

---

## 注意事項

- **サンドボックスと本番は別環境**です。DB、Cognito、S3はすべて分離されています。
- ローカル開発時は従来通り `npx ampx sandbox --profile mobile` を使用。
- `amplify_outputs.json` はバックエンドデプロイ時に自動更新されます。gitにコミット不要。
- フロントエンドは `output: "export"` の静的ビルドのため、SSR機能（API Routesなど）は使用不可。

## トラブルシューティング

| 症状 | 解決 |
|------|------|
| `ExpiredToken` エラー | `aws sso login --profile mobile` を再実行 |
| デプロイ後に404 | SPAリライトルール確認：Amplifyコンソール > Rewrites and redirects |
| バックエンドデプロイ失敗・ロールバック | CloudFormationコンソールでスタックイベントを確認 |
| `Branch main not found` | `aws amplify create-branch --app-id dkcmgnfwojthr --branch-name main --profile mobile --region ap-northeast-1` |
