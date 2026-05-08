import type { ReactNode } from "react";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  readingTime: string;
  content: ReactNode;
};

export const posts: BlogPost[] = [
  {
    slug: "astro-nano-on-next",
    title: "Next.js 블로그 레이아웃 정리",
    description: "작고 조용한 블로그 레이아웃을 Next.js에 맞춰 다듬기.",
    category: "Build",
    date: "2026-05-08",
    readingTime: "3분 읽기",
    content: (
      <>
        <p>
          좋은 블로그 레이아웃은 글을 방해하지 않습니다. 화면의 폭은
          좁게, 대비는 차분하게, 움직임은 필요한 만큼만 남겨 읽는 흐름을
          우선했습니다.
        </p>
        <h2>옮겨온 것들</h2>
        <p>
          넓은 헤더와 좁은 본문, 목록 중심의 글 배열, 라이트/다크/시스템
          테마 전환은 Next.js 컴포넌트로 다시 구성했습니다.
        </p>
        <p>
          결과적으로 화면은 여전히 조용합니다. 인터페이스보다 글이 먼저
          보이고, 필요한 탐색만 가볍게 남겨두는 것이 목표였습니다.
        </p>
      </>
    ),
  },
  {
    slug: "designing-a-quieter-blog",
    title: "조용한 블로그 디자인하기",
    description: "읽기 편한 글쓰기 공간을 만드는 작은 인터페이스 선택들.",
    category: "Design",
    date: "2026-04-19",
    readingTime: "2분 읽기",
    content: (
      <>
        <p>
          조용한 블로그는 비어 있는 화면이 아니라 잘 덜어낸 화면에
          가깝습니다. 다음에 무엇을 읽을지 판단하는 데 필요하지 않은 장식은
          과감히 줄였습니다.
        </p>
        <h2>필요한 절제</h2>
        <p>
          좁은 행간, 분명한 포커스 상태, 예측 가능한 여백만으로도 충분히
          많은 인상을 만들 수 있습니다. 반복되는 항목은 카드보다 가벼운
          목록으로 두어 훑어보기 쉽게 했습니다.
        </p>
        <blockquote>
          좋은 미니멀 인터페이스는 남은 요소가 모두 이유를 가질 때
          차분해집니다.
        </blockquote>
      </>
    ),
  },
  {
    slug: "small-publishing-checklist",
    title: "작은 발행 체크리스트",
    description: "글을 공개하기 전에 읽기 흐름을 점검하는 간단한 목록.",
    category: "Notes",
    date: "2026-03-31",
    readingTime: "2분 읽기",
    content: (
      <>
        <p>
          발행 전에는 글을 두 번 읽습니다. 한 번은 구조를 보고, 한 번은
          읽는 사람이 걸릴 만한 부분을 찾습니다.
        </p>
        <h2>발행 전에</h2>
        <ul>
          <li>제목만 보아도 글의 방향을 짐작할 수 있는지 확인합니다.</li>
          <li>목록이나 검색 결과에서 설명이 충분히 도움이 되는지 봅니다.</li>
          <li>문단이 너무 길어지기 전에 자연스럽게 끊습니다.</li>
          <li>라이트 모드와 다크 모드에서 모두 읽어봅니다.</li>
        </ul>
      </>
    ),
  },
];

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}

export function getPosts() {
  return [...posts].sort(
    (a, b) =>
      new Date(`${b.date}T00:00:00`).valueOf() -
      new Date(`${a.date}T00:00:00`).valueOf(),
  );
}
