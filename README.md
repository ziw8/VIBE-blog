# Vibe Blog Astro

Astro 감성의 미니멀 개인 블로그입니다. 글을 빠르게 훑고 편하게 읽을 수 있도록 조용한 레이아웃, Pretendard 폰트, 라이트/다크 모드, 간결한 포스트 목록을 중심으로 구성했습니다.

## Features

- Astro 스타일의 좁은 본문 레이아웃
- Recent posts 목록형 인덱스
- 라이트 / 다크 / 시스템 테마 전환
- Pretendard 로컬 폰트 적용
- About, Contacts 섹션
- 정적 블로그 글 상세 페이지

## Getting Started

개발 서버를 실행합니다.

```bash
npm run dev
```

브라우저에서 아래 주소를 엽니다.

```text
http://localhost:3000
```

## Build

프로덕션 빌드를 확인합니다.

```bash
npm run build
```

## Structure

- `app/page.tsx` - 홈 화면
- `app/blog/page.tsx` - 블로그 목록
- `app/blog/[slug]/page.tsx` - 글 상세 페이지
- `components/` - 레이아웃과 UI 컴포넌트
- `lib/posts.tsx` - 블로그 글 데이터
- `public/fonts/` - Pretendard 폰트 파일

## Theme

이 블로그는 Astro 기반 블로그의 단정한 분위기를 참고해 만들었습니다. 화면의 장식은 줄이고, 글 목록과 본문 읽기에 집중할 수 있도록 구성했습니다.
