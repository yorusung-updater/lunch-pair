# 배포 가이드

## 환경 정보

| 항목 | 값 |
|------|-----|
| App ID | `dkcmgnfwojthr` |
| 리전 | `ap-northeast-1` |
| AWS Profile | `mobile` |
| 프론트엔드 URL | https://main.dkcmgnfwojthr.amplifyapp.com |
| 플랫폼 | Amplify Hosting (정적 배포) |

## 사전 준비

```bash
# AWS SSO 로그인 (세션 만료 시)
aws sso login --profile mobile
```

---

## 프론트엔드만 수정한 경우

UI, 스타일, 상수 등 `src/` 아래 파일만 변경한 경우.

```bash
# 1. 빌드
npm run build

# 2. zip 생성
cd out && zip -qr /tmp/deploy.zip . && cd ..

# 3. 배포 URL 발급 + 업로드 + 시작 (한 줄 스크립트)
DEPLOY=$(aws amplify create-deployment \
  --app-id dkcmgnfwojthr --branch-name main \
  --profile mobile --region ap-northeast-1 --output json)

JOB_ID=$(echo "$DEPLOY" | python3 -c "import json,sys; print(json.load(sys.stdin)['jobId'])")
URL=$(echo "$DEPLOY" | python3 -c "import json,sys; print(json.load(sys.stdin)['zipUploadUrl'])")

curl -s -X PUT -H "Content-Type: application/zip" --data-binary @/tmp/deploy.zip "$URL"

aws amplify start-deployment \
  --app-id dkcmgnfwojthr --branch-name main --job-id "$JOB_ID" \
  --profile mobile --region ap-northeast-1

# 4. 상태 확인
aws amplify get-job \
  --app-id dkcmgnfwojthr --branch-name main --job-id "$JOB_ID" \
  --profile mobile --region ap-northeast-1 \
  --query "job.summary.status" --output text
```

배포 완료까지 보통 10~20초 소요.

---

## 백엔드를 수정한 경우

스키마 변경(`amplify/data/resource.ts`), Lambda 수정(`amplify/data/*/handler.ts`), 인증/스토리지 설정 변경 등.

```bash
# 1. 백엔드 배포 (약 3~6분 소요)
CI=1 AWS_PROFILE=mobile npx ampx pipeline-deploy \
  --branch main --app-id dkcmgnfwojthr

# 2. amplify_outputs.json이 자동 갱신됨 -> 프론트도 재배포 필요
npm run build
cd out && zip -qr /tmp/deploy.zip . && cd ..

# 3. 프론트엔드 배포 (위의 프론트엔드 배포 절차와 동일)
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

## 주의사항

- **샌드박스와 프로덕션은 별개 환경**입니다. DB, Cognito, S3 모두 분리되어 있음.
- 로컬 개발 시에는 기존대로 `npx ampx sandbox --profile mobile` 사용.
- `amplify_outputs.json`은 백엔드 배포 시 자동 갱신됩니다. git에 커밋하지 않아도 됩니다.
- 프론트엔드는 `output: "export"` 정적 빌드이므로 SSR 기능(API Routes 등)은 사용 불가.

## 트러블슈팅

| 증상 | 해결 |
|------|------|
| `ExpiredToken` 에러 | `aws sso login --profile mobile` 재실행 |
| 배포 후 404 | SPA 리라이트 규칙 확인: Amplify 콘솔 > Rewrites and redirects |
| 백엔드 배포 실패 롤백 | CloudFormation 콘솔에서 스택 이벤트 확인 |
| `Branch main not found` | `aws amplify create-branch --app-id dkcmgnfwojthr --branch-name main --profile mobile --region ap-northeast-1` |
