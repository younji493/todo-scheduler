# Supabase 인증·회원별 일정 저장

## 구성

- 회원가입·로그인·로그아웃은 Supabase Auth로 처리합니다. 이름은 Auth user metadata에 저장하고 비밀번호를 별도 테이블에 저장하지 않습니다.
- 일정은 `public.todos`에 사용자 ID와 함께 저장합니다. 서버에서 로그인 사용자를 확인하고 DB의 RLS로 본인 일정만 조회·등록·완료 처리하도록 제한합니다.
- 관리자 비밀 키(service_role)는 사용하지 않습니다. 로그인 세션은 서버 전용 HttpOnly 쿠키로 유지합니다.
- 일정과 임시 로그인 상태를 브라우저 localStorage/sessionStorage나 앱 프로세스 메모리에 저장하지 않습니다.

## 팀 개발 프로젝트

현재 개발용 프로젝트는 `todo-scheduler`입니다.

- 대시보드: https://supabase.com/dashboard/project/pswgpgkovgrtscvryqmj
- 프로젝트 URL: https://pswgpgkovgrtscvryqmj.supabase.co
- 서울 지역의 Free 프로젝트입니다. GitHub 자동 배포 연동은 사용하지 않습니다.
- `supabase/migrations/202611110001_create_todos.sql`의 테이블·제약 조건·권한·RLS 정책을 이미 적용했습니다. **기존 개발 프로젝트에는 이 SQL을 다시 실행하지 마세요.** 새 Supabase 프로젝트에 연결할 때만 한 번 적용하세요.
- 새 테이블 자동 공개는 껐고 자동 RLS는 켰습니다.
- 개발 편의를 위해 이메일 확인 없이 바로 가입하도록 설정되어 있습니다. 실제 서비스 전에는 메일 발송 서비스와 이메일 확인 정책을 설정하세요. 앱은 이메일 인증을 켠 경우의 대기 화면과 callback도 지원합니다.

## 팀원 로컬 실행

1. `.env.example`을 복사해 `.env.local`을 만듭니다.
2. `NEXT_PUBLIC_SUPABASE_URL`에 위 프로젝트 URL을 넣습니다.
3. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`에 프로젝트의 publishable key를 넣습니다. 기존 anon key를 쓰는 경우 `NEXT_PUBLIC_SUPABASE_ANON_KEY`도 지원합니다.
4. 채팅 일정 해석을 사용할 때는 본인의 `OPENAI_API_KEY`를 설정합니다. Supabase 로그인·일정 DB API는 OpenAI 키 없이도 동작합니다.
5. `npm ci` 후 `npm run dev`를 실행합니다. 환경 변수를 바꾸면 개발 서버를 재시작하세요.
6. `http://localhost:3000/signup`에서 각자 계정을 만듭니다. 현재 개발 설정에서는 가입하면 자동 로그인됩니다.

`.env.local`, API 비밀 키, DB 비밀번호는 Git이나 공개 메시지에 올리지 마세요. 저장소에는 값이 비어 있는 `.env.example`만 포함합니다. 공개 키만으로 다른 회원의 일정을 읽을 수 없도록 DB 권한과 RLS를 설정했습니다.

이메일 인증을 켤 경우 Site URL은 `http://localhost:3000`, 허용된 Redirect URL은 `http://localhost:3000/auth/callback`으로 설정합니다.

## 확인 방법

1. 회원가입 후 이름이 화면에 표시되는지 확인합니다.
2. 채팅에 `오늘 오후 6시부터 1시간 팀 회의`처럼 입력합니다. 시간표에 표시되고 Supabase Table Editor의 `public.todos`에 로그인 계정의 `user_id`로 저장되어야 합니다.
3. 완료 체크 후 새로고침, 로그아웃·재로그인, 앱 서버 재시작을 해도 일정과 완료 상태가 유지되는지 확인합니다.
4. 다른 계정으로 로그인하면 앞 계정의 일정이 보이지 않아야 합니다.
5. Supabase Authentication → Users에서 가입한 이메일·이름을 확인할 수 있습니다. 이 관리 화면은 앱 계정과 별개의 Supabase 조직 초대 권한이 필요합니다.

## 검증

- `npm test -- --maxWorkers=2`: 인증 요청·실패 처리, API 인증, 일정 저장, 캘린더 통합 테스트.
- `tests/features/todos/todoDatabase.test.js`: 실제 migration을 일회성 PostgreSQL(PGlite)에 적용하여 사용자별 RLS, 권한과 날짜·시간 제약을 확인합니다. Supabase Auth의 사용자 ID 조회만 테스트 환경에서 재현합니다.
- `npm run build`: 배포용 빌드.
- 실제 개발 프로젝트에서 회원가입 → 자동 로그인 → 재로그인, AI 채팅 일정 등록·완료 처리, 새로고침 및 앱 재시작 후 유지, 다른 계정과의 분리를 확인했습니다.
- 비로그인 앱 API와 Supabase REST의 일정 테이블 접근이 401로 차단되는 것을 확인했습니다.

과거 서버 메모리에만 있던 일정은 자동 이관되지 않습니다. 다른 사용자의 소유자가 불명확한 기존 데이터를 임의로 가져오지 않습니다.
