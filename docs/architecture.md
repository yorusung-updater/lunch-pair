# Lunch Pair - 아키텍처 문서

> 사내 점심 매칭 앱 (틴더 스타일 POC)

## 목차

- [프로젝트 개요](#프로젝트-개요)
- [기술 스택](#기술-스택)
- [시스템 아키텍처](#시스템-아키텍처)
- [프론트엔드 구조](#프론트엔드-구조)
- [백엔드 구조](#백엔드-구조)
- [데이터 모델](#데이터-모델)
- [주요 기능 플로우](#주요-기능-플로우)
- [인증 및 보안](#인증-및-보안)
- [배포](#배포)
- [디렉토리 구조](#디렉토리-구조)

---

## 프로젝트 개요

Lunch Pair는 같은 회사 직원들끼리 점심 파트너를 매칭해주는 모바일 웹 앱입니다.
틴더 스타일의 스와이프 인터페이스로 상대를 선택하고, 매칭되면 채팅으로 점심 약속을 잡을 수 있습니다.

### 핵심 특징

- **스와이프 매칭**: 프로필 카드를 좌/우로 스와이프하여 OK/SKIP 선택
- **조건부 프로필 공개**: 매칭 전에는 사진만 보이고, 매칭 후 이름/상세 정보 공개
- **실시간 채팅**: 매칭된 상대와 1:1 채팅 (1초 폴링)
- **프리미엄 기능**: 무제한 스와이프, 누가 나를 좋아했는지 확인
- **관리자 대시보드**: 사용자/매칭/스와이프 관리 및 분석
- **일본어 UI**: 일본 사내 환경 타겟

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 16.1.6 (App Router, SSG export) |
| UI | Tailwind CSS v4 + shadcn/ui + Motion |
| 상태 관리 | TanStack React Query v5 (서버 상태) + Zustand (UI 상태) |
| 인증 | AWS Cognito User Pool (이메일 기반) |
| API | AWS AppSync (GraphQL) |
| 서버리스 함수 | AWS Lambda (TypeScript) |
| 데이터베이스 | AWS DynamoDB |
| 스토리지 | AWS S3 (프로필 사진) |
| 인프라 | AWS Amplify Gen 2 (CDK 기반) |
| 호스팅 | AWS Amplify Hosting (정적 사이트) |

---

## 시스템 아키텍처

### 전체 아키텍처 다이어그램

```mermaid
graph TB
    subgraph Client["클라이언트 (브라우저)"]
        NextJS["Next.js SSG<br/>React + Tailwind"]
        RQ["React Query<br/>캐시 & 폴링"]
        Zustand["Zustand<br/>UI 상태"]
    end

    subgraph AWS["AWS Cloud (ap-northeast-1)"]
        subgraph Amplify["Amplify Hosting"]
            S3Static["S3 + CloudFront<br/>정적 사이트"]
        end

        subgraph Auth["인증"]
            Cognito["Cognito User Pool<br/>이메일 로그인"]
        end

        subgraph API["API 레이어"]
            AppSync["AppSync<br/>GraphQL API"]
        end

        subgraph Lambda["Lambda 함수"]
            RecordSwipe["record-swipe<br/>스와이프 기록 & 매칭"]
            GetCandidates["get-candidates<br/>후보 조회 & 필터"]
            GetProfile["get-profile<br/>프로필 조회"]
            GetUnread["get-unread-counts<br/>미읽음 카운트"]
            MarkAsRead["mark-as-read<br/>읽음 처리"]
            GetWhoLiked["get-who-liked-me<br/>좋아요 확인"]
            GetMyLikes["get-my-likes<br/>내 좋아요"]
        end

        subgraph Data["데이터"]
            DDB["DynamoDB<br/>7개 테이블"]
            S3Photos["S3 Bucket<br/>프로필 사진"]
        end
    end

    NextJS --> RQ
    NextJS --> Zustand
    RQ --> AppSync
    AppSync --> Cognito
    AppSync --> Lambda
    Lambda --> DDB
    Lambda --> S3Photos
    NextJS --> S3Static
    NextJS --> Cognito

    style Client fill:#fff3e0
    style AWS fill:#e3f2fd
    style Lambda fill:#e8f5e9
    style Data fill:#fce4ec
```

### 데이터 플로우 다이어그램

```mermaid
sequenceDiagram
    participant U as 사용자
    participant FE as 프론트엔드<br/>(React Query)
    participant AS as AppSync<br/>(GraphQL)
    participant LM as Lambda
    participant DB as DynamoDB
    participant S3 as S3

    Note over U,S3: 스와이프 플로우
    U->>FE: 앱 접속
    FE->>AS: getSwipeCandidates()
    AS->>LM: get-candidates Lambda
    LM->>DB: UserProfile 스캔 + Swipe 필터
    LM->>S3: Presigned URL 생성
    LM-->>FE: 후보 프로필 목록
    U->>FE: 스와이프 OK/SKIP
    FE->>AS: recordSwipe(targetId, direction)
    AS->>LM: record-swipe Lambda
    LM->>DB: Swipe PutItem
    LM->>DB: 상호 OK 확인
    alt 매칭 성공
        LM->>DB: Match PutItem
        LM-->>FE: isMatch: true
        FE->>U: 매칭 축하 모달 표시
    end

    Note over U,S3: 채팅 플로우
    U->>FE: 채팅방 입장
    FE->>AS: listChatMessages (1초 폴링)
    AS->>DB: ChatMessage 쿼리
    DB-->>FE: 메시지 목록
    U->>FE: 메시지 전송
    FE->>AS: ChatMessage.create()
    FE->>AS: markAsRead(chatId)
    AS->>LM: mark-as-read Lambda
    LM->>DB: ChatReadStatus PutItem
```

### 컴포넌트 구조 다이어그램

```mermaid
graph TD
    subgraph App["App (page.tsx)"]
        CA["ConfigureAmplify<br/>Amplify 초기화"]
        AG["AuthGate<br/>Cognito 로그인"]
        AS["AppShell<br/>메인 레이아웃"]
    end

    subgraph Pages["페이지"]
        SP["SwipePage<br/>스와이프"]
        MP["MatchesPage<br/>매칭 목록"]
        LP["LikesPage<br/>좋아요"]
        PP["ProfilePage<br/>프로필"]
        CP["ChatPage<br/>채팅"]
    end

    subgraph Components["공통 컴포넌트"]
        BN["BottomNav<br/>하단 네비게이션"]
        SD["SwipeDeck<br/>카드 덱"]
        SC["SwipeCard<br/>스와이프 카드"]
        MM["MatchModal<br/>매칭 모달"]
        PD["ProfileDetailPage<br/>프로필 상세"]
    end

    CA --> AG
    AG --> AS
    AS --> SP
    AS --> MP
    AS --> LP
    AS --> PP
    AS --> BN
    MP --> CP
    SP --> SD
    SD --> SC
    SP --> MM
    MP --> PD

    style App fill:#fff3e0
    style Pages fill:#e8f5e9
    style Components fill:#e3f2fd
```

---

## 프론트엔드 구조

### 상태 관리 전략

| 상태 유형 | 관리 도구 | 예시 |
|-----------|-----------|------|
| 서버 상태 | React Query | 프로필, 후보, 매칭, 채팅 메시지 |
| UI 상태 | Zustand | 매칭 모달 표시/숨김 |
| 로컬 상태 | useState | 폼 입력, 로딩 상태 |

### 폴링 전략

```mermaid
gantt
    title 데이터 폴링 주기
    dateFormat ss
    axisFormat %S초

    section 채팅 메시지
    1초 폴링 :active, 00, 01

    section 미읽음 카운트
    5초 폴링 :active, 00, 05

    section 최근 메시지 (매칭 목록)
    10초 폴링 :active, 00, 10

    section 후보/프로필
    수동 (on-demand) :milestone, 00, 00
```

| 데이터 | 폴링 주기 | 이유 |
|--------|-----------|------|
| 채팅 메시지 | 1초 | 실시간 대화 느낌 |
| 미읽음 카운트 | 5초 | 뱃지 업데이트 |
| 최근 메시지 미리보기 | 10초 | 매칭 목록 표시용 |
| 후보/프로필 | on-demand | 빈번하게 바뀌지 않음 |

### React Query 키 구조

```typescript
QUERY_KEYS = {
  myProfile:    (userId) => ["myProfile", userId]
  candidates:   (token)  => ["candidates", token]
  matches:      (userId) => ["matches", userId]
  unreadCounts: (userId) => ["unreadCounts", userId]
  chat:         (chatId) => ["chat", chatId]
  lastMessages: (userId) => ["lastMessages", userId]
}
```

---

## 백엔드 구조

### Lambda 함수 역할

```mermaid
graph LR
    subgraph Queries["쿼리 (읽기)"]
        GC["get-candidates<br/>후보 조회"]
        GP["get-profile<br/>프로필 조회"]
        GU["get-unread-counts<br/>미읽음 수"]
        GW["get-who-liked-me<br/>받은 좋아요"]
        GM["get-my-likes<br/>보낸 좋아요"]
    end

    subgraph Mutations["뮤테이션 (쓰기)"]
        RS["record-swipe<br/>스와이프 기록"]
        MR["mark-as-read<br/>읽음 처리"]
    end

    subgraph Tables["DynamoDB 테이블"]
        UP["UserProfile"]
        SW["Swipe"]
        MA["Match"]
        CM["ChatMessage"]
        CR["ChatReadStatus"]
        RP["Report"]
        IQ["Inquiry"]
    end

    GC --> UP
    GC --> SW
    GP --> UP
    GP --> MA
    GU --> MA
    GU --> CM
    GU --> CR
    GW --> SW
    GW --> UP
    GM --> SW
    GM --> UP
    GM --> MA
    RS --> SW
    RS --> MA
    RS --> UP
    MR --> CR

    style Queries fill:#e3f2fd
    style Mutations fill:#e8f5e9
    style Tables fill:#fce4ec
```

### Lambda 함수 상세

| 함수 | 역할 | 접근 테이블 | 특이 사항 |
|------|------|-------------|-----------|
| `record-swipe` | 스와이프 기록 + 매칭 감지 | Swipe, Match, UserProfile | ConditionExpression으로 중복 방지, 일일 스와이프 제한(3회) 서버 사이드 체크 |
| `get-candidates` | 후보 프로필 조회 | UserProfile, Swipe | こだわり(취향) 유사도로 정렬, Presigned URL 생성 |
| `get-profile` | 프로필 상세 조회 | UserProfile, Match | 매칭 여부에 따라 공개 범위 조절 |
| `get-unread-counts` | 미읽음 메시지 수 | Match, ChatMessage, ChatReadStatus | chatId별 카운트 반환 |
| `mark-as-read` | 채팅 읽음 처리 | ChatReadStatus | DynamoDB에 직접 PutItem |
| `get-who-liked-me` | 나를 좋아한 사람 | Swipe, UserProfile | 프리미엄 전용 (hasLikesReveal) |
| `get-my-likes` | 내가 좋아한 사람 | Swipe, UserProfile, Match | 매칭 상태 포함 |

---

## 데이터 모델

### ER 다이어그램

```mermaid
erDiagram
    UserProfile {
        string userId PK
        string displayName
        string photo1Key
        string photo2Key
        string photo3Key
        string photo4Key
        string[] preferences
        string preferenceFreeText
        string department
        string[] lunchDays
        string lunchTime
        string lunchBudget
        string lunchArea
        boolean hasUnlimitedSwipe
        boolean hasLikesReveal
        string[] ethicalTags
    }

    Swipe {
        string swiperId PK
        string targetId SK
        enum direction "OK | SKIP"
        datetime createdAt
    }

    Match {
        string user1Id PK
        string user2Id SK
        string user1DisplayName
        string user2DisplayName
        datetime createdAt
    }

    ChatMessage {
        string id PK
        string chatId "GSI: chatId+sentAt"
        string senderId
        string content
        enum messageType "TEXT | PLAN"
        datetime sentAt
    }

    ChatReadStatus {
        string chatId PK
        string userId SK
        datetime lastReadAt
    }

    Report {
        string id PK
        string reporterId
        string targetId
        string reason
        enum status "OPEN | REVIEWED | ACTIONED"
    }

    Inquiry {
        string id PK
        string userId
        string category
        string message
        enum status "OPEN | CLOSED"
    }

    UserProfile ||--o{ Swipe : "swiperId"
    UserProfile ||--o{ Swipe : "targetId"
    UserProfile ||--o{ Match : "user1Id / user2Id"
    UserProfile ||--o{ ChatMessage : "senderId"
    UserProfile ||--o{ Report : "reporterId / targetId"
    UserProfile ||--o{ Inquiry : "userId"
    Match ||--o{ ChatMessage : "chatId 생성"
    Match ||--o{ ChatReadStatus : "chatId 생성"
```

### chatId 생성 규칙

두 사용자의 ID를 정렬하여 일관된 chatId 생성:

```typescript
function getChatId(userId1: string, userId2: string): string {
  const [id1, id2] = [userId1, userId2].sort();
  return `${id1}_${id2}`;
}
```

---

## 주요 기능 플로우

### 1. 스와이프 매칭

```mermaid
flowchart TD
    A[앱 접속] --> B[get-candidates 호출]
    B --> C{후보 있음?}
    C -- 없음 --> D[후보 없음 표시]
    C -- 있음 --> E[SwipeDeck 표시]
    E --> F{사용자 액션}
    F -- 오른쪽 스와이프 --> G[recordSwipe OK]
    F -- 왼쪽 스와이프 --> H[recordSwipe SKIP]
    G --> I{상호 OK?}
    I -- Yes --> J[Match 생성]
    J --> K[매칭 모달 표시]
    I -- No --> L{스와이프 남음?}
    H --> L
    L -- Yes --> E
    L -- No --> M[일일 제한 도달 표시]
    K --> L

    style J fill:#4caf50,color:#fff
    style M fill:#f44336,color:#fff
```

### 2. 프로필 공개 정책

```mermaid
flowchart LR
    A[프로필 조회 요청] --> B{매칭 상태?}
    B -- 매칭됨 --> C[전체 공개]
    B -- 매칭 안됨 --> D[제한 공개]

    C --> C1[이름 공개]
    C --> C2[사진 전체 공개]
    C --> C3[상세 정보 공개]
    C --> C4[채팅 가능]

    D --> D1[이름 비공개]
    D --> D2[사진만 공개]
    D --> D3[기본 정보만]
    D --> D4[채팅 불가]

    style C fill:#4caf50,color:#fff
    style D fill:#ff9800,color:#fff
```

### 3. 미읽음 카운트

```mermaid
flowchart TD
    A[getUnreadCounts Lambda] --> B[Match 테이블에서<br/>내 매칭 조회]
    B --> C[chatId 목록 생성]
    C --> D[ChatReadStatus에서<br/>lastReadAt 조회]
    D --> E[각 chatId별<br/>ChatMessage 쿼리]
    E --> F{"sentAt > lastReadAt<br/>AND senderId != me"}
    F --> G[chatId별 카운트 합산]
    G --> H["{ counts: {...}, total: N }"]
```

---

## 인증 및 보안

### 인증 플로우

```mermaid
sequenceDiagram
    participant U as 사용자
    participant FE as 프론트엔드
    participant CG as Cognito
    participant AS as AppSync

    U->>FE: 이메일 입력
    FE->>CG: signUp(email, password)
    CG->>U: 인증 코드 이메일 발송
    U->>FE: 인증 코드 입력
    FE->>CG: confirmSignUp(code)
    CG-->>FE: JWT 토큰 발급
    FE->>AS: GraphQL 요청 (JWT 헤더)
    AS->>CG: 토큰 검증
    AS-->>FE: 응답
```

### 보안 정책

| 항목 | 정책 |
|------|------|
| API 인증 | Cognito JWT (기본), API Key (관리자용) |
| 프로필 접근 | 매칭된 사용자만 이름/상세 공개 |
| 사진 접근 | Presigned URL (1시간 만료) |
| 스와이프 제한 | 서버 사이드 일일 3회 체크 (클라이언트 우회 불가) |
| 관리자 | 패스코드 + Cognito 이중 인증 |
| 데이터 격리 | DynamoDB owner-based 접근 제어 |

---

## 배포

### 배포 아키텍처

```mermaid
flowchart LR
    subgraph Dev["로컬 개발"]
        Code["소스 코드"]
        Build["npm run build<br/>(SSG export)"]
        ZIP["deployment.zip"]
    end

    subgraph Backend["백엔드 배포"]
        AMPX["ampx pipeline-deploy"]
        CF["CloudFormation<br/>스택 업데이트"]
    end

    subgraph Frontend["프론트엔드 배포"]
        Console["Amplify Console<br/>드래그 & 드롭"]
    end

    subgraph Prod["프로덕션"]
        CFront["CloudFront CDN"]
        Lambda["Lambda 함수"]
        DDB["DynamoDB"]
    end

    Code --> Build
    Build --> ZIP
    ZIP --> Console
    Console --> CFront
    Code --> AMPX
    AMPX --> CF
    CF --> Lambda
    CF --> DDB

    style Dev fill:#fff3e0
    style Backend fill:#e8f5e9
    style Frontend fill:#e3f2fd
    style Prod fill:#fce4ec
```

### 배포 절차

**프론트엔드:**
1. `npm run build` → `out/` 디렉토리 생성
2. `out/` 내용을 ZIP 파일로 압축
3. Amplify Console에서 드래그 & 드롭 배포

**백엔드:**
```bash
# AWS 인증 정보 export
eval "$(aws configure export-credentials --format env)"

# CDK bootstrap (최초 1회)
AWS_REGION=ap-northeast-1 npx cdk bootstrap aws://ACCOUNT_ID/ap-northeast-1

# 백엔드 배포
CI=true AWS_REGION=ap-northeast-1 npx ampx pipeline-deploy \
  --branch main --app-id dkcmgnfwojthr
```

---

## 디렉토리 구조

```
lunch-pair/
├── amplify/                      # Amplify Gen 2 백엔드
│   ├── auth/resource.ts          # Cognito 인증 설정
│   ├── data/
│   │   ├── resource.ts           # GraphQL 스키마 + Lambda 정의
│   │   ├── record-swipe/         # 스와이프 기록 Lambda
│   │   ├── get-candidates/       # 후보 조회 Lambda
│   │   ├── get-profile/          # 프로필 조회 Lambda
│   │   ├── get-unread-counts/    # 미읽음 카운트 Lambda
│   │   ├── mark-as-read/         # 읽음 처리 Lambda
│   │   ├── get-who-liked-me/     # 받은 좋아요 Lambda
│   │   └── get-my-likes/         # 보낸 좋아요 Lambda
│   ├── storage/resource.ts       # S3 스토리지 설정
│   └── backend.ts                # 백엔드 정의 + IAM 정책
├── src/
│   ├── app/
│   │   ├── layout.tsx            # 루트 레이아웃
│   │   ├── page.tsx              # 메인 페이지 (인증 → 앱)
│   │   └── admin/page.tsx        # 관리자 대시보드
│   ├── components/
│   │   ├── pages/                # 페이지 컴포넌트
│   │   ├── admin/                # 관리자 패널
│   │   ├── profile/              # 프로필 관련 컴포넌트
│   │   └── ui/                   # shadcn/ui 공통 컴포넌트
│   ├── hooks/                    # 커스텀 훅 (데이터 페칭)
│   ├── lib/                      # Amplify 설정, API 클라이언트
│   ├── stores/                   # Zustand 상태 관리
│   ├── types/                    # TypeScript 타입 정의
│   ├── utils/                    # 유틸리티 함수
│   └── constants/                # 상수 (옵션, 제한, 키)
├── docs/                         # 프로젝트 문서
├── amplify_outputs.json          # Amplify 백엔드 설정 (자동 생성)
├── next.config.ts                # Next.js 설정 (SSG export)
└── package.json                  # 의존성 및 스크립트
```

---

## 상수 & 설정

| 상수 | 값 | 설명 |
|------|---|------|
| 일일 무료 스와이프 | 3회 | 프리미엄 사용자는 무제한 |
| Presigned URL 만료 | 1시간 | S3 사진 접근용 |
| 채팅 폴링 | 1초 | 실시간 메시지 |
| 미읽음 폴링 | 5초 | 뱃지 업데이트 |
| 관리자 패스코드 | 0316 | 관리자 접근용 |
| 앱 ID | dkcmgnfwojthr | Amplify 앱 식별자 |
| 리전 | ap-northeast-1 | 도쿄 리전 |
