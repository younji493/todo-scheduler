# AI 일정 백엔드

## 실행

프로젝트 루트의 `.env.local`에 아래 값을 설정합니다. 이 파일은 Git에서 제외됩니다.

```dotenv
OPENAI_API_KEY=발급받은_API_키
OPENAI_MODEL=gpt-5-mini
```

`OPENAI_MODEL`은 생략하면 `gpt-5-mini`를 사용합니다. 설정을 바꾸면 개발 서버를 재시작합니다.

```sh
npm install
npm run dev
```

## 완료 범위와 연결 방식

1. `POST /api/ai-schedule`이 자연어를 OpenAI Responses API의 strict JSON Schema로 분석합니다.
2. 기존 AIChat이 응답의 `todo`를 `POST /api/todos`로 보냅니다. 서버가 검증한 뒤 기존 `addTodo` 저장소에 추가합니다.
3. 기존 AIChat이 `refreshTodos()`를 호출하면 `GET /api/todos`로 저장 목록을 다시 읽습니다.

분석 API 자체는 저장하지 않습니다. 두 번째 요청에서 한 번만 저장되므로 기존 채팅창의 호출 방식을 그대로 사용할 수 있습니다.

```http
POST /api/ai-schedule
Content-Type: application/json

{"message":"2026년 10월 28일 오후 3시에 1시간 공부 일정 추가해줘"}
```

성공 응답 예시:

```json
{
  "success": true,
  "todo": {
    "title": "공부",
    "startDate": "2026-10-28",
    "dueDate": "2026-10-28",
    "durationMinutes": 60,
    "startAt": "2026-10-28T15:00:00+09:00",
    "endAt": "2026-10-28T16:00:00+09:00"
  }
}
```

`todo` 객체를 그대로 `POST /api/todos`의 본문에 보내면 HTTP 201과 저장된 TODO를 반환합니다. 저장된 항목에는 `id`, `priority`, `category`, `completed`도 포함됩니다.

- `startDate`, `dueDate`: 기존 수동 입력과 호환되는 날짜입니다.
- `startAt`, `endAt`: 한국 시간의 정확한 시작·종료 시각입니다. 기존 수동 입력에서는 생략할 수 있습니다.
- 상대 날짜는 서버의 현재 시각을 한국 시간으로 변환한 뒤 해석합니다.
- 소요 시간 기본값은 60분이며 기존 TODO 규칙대로 30~960분 사이의 30분 단위를 지원합니다.
- 날짜·시작 시각이 모호하거나 여러 일정이 포함되면 `success: false`로 재입력을 안내합니다. 저장 요청을 보내지 않아야 합니다.

잘못된 요청은 400, 잘못된 AI 일정은 422, 요청 한도 초과는 429, AI 연결·응답 오류는 502, 키 미설정·형식 오류·인증 실패는 503, 응답 지연은 504를 반환합니다. 모델의 거절이나 추가 정보가 필요한 응답은 HTTP 200의 `success: false`입니다.

## 검증

```sh
npm run test:ai
```

키 없이 모의 OpenAI 응답으로 변환, 한국 시간 기준, 자정 경계, 오류, 기존 TODO 저장·조회 연결을 검증합니다.

```sh
npm run test:ai:live
```

실제 `.env.local`의 키로 OpenAI를 한 번 호출하므로 API 요금이 발생합니다. 실제 분석 결과를 TODO 저장·조회 핸들러에 연결해 검증합니다. 테스트 레코드는 테스트 프로세스의 메모리에만 생성하며 종료 전에 제거합니다. 일반 테스트 실행에서는 실제 API 테스트를 건너뜁니다.

## 남은 범위

현재 저장소는 기존 `todoServerStore.js`의 메모리 저장소입니다. 서버 재시작 또는 인스턴스 변경 이후에는 데이터를 보장하지 않습니다. 데이터베이스 영구 저장은 별도 작업입니다.

이 검증은 1번(자연어 → JSON), 2번(JSON → 기존 TODO 저장)을 대상으로 합니다. 4번인 브라우저 캘린더의 즉시 반영 검증은 별도로 진행해야 합니다. 캘린더 시간 배치는 `startAt`, `endAt`을 사용할 수 있습니다.

참고: [OpenAI Structured Outputs 공식 문서](https://developers.openai.com/api/docs/guides/structured-outputs)
