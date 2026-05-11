export const siteSectionKeys = [
  "blogName",
  "intro",
  "about",
  "contacts",
] as const;

export type SiteSectionKey = (typeof siteSectionKeys)[number];

export type SiteSection = {
  body: string;
  key: SiteSectionKey;
  title: string;
  updatedAt?: string;
};

export const defaultSiteSections: Record<SiteSectionKey, SiteSection> = {
  blogName: {
    key: "blogName",
    title: "블로그 이름",
    body: "지우 블로그",
  },
  intro: {
    key: "intro",
    title: "소개글",
    body: [
      "소프트웨어와 디자인, 그리고 일하면서 떠오른 생각을 짧게 기록하는 공간입니다.",
      "글을 빠르게 훑고 편하게 읽을 수 있도록 화면은 조용하게 유지합니다.",
    ].join("\n\n"),
  },
  about: {
    key: "about",
    title: "About",
    body: [
      "이 블로그는 소프트웨어, 디자인, 그리고 디지털 작업을 조금 더 낫게 만드는 작은 선택들을 기록하는 공간입니다.",
      "화면의 기본 구조는 Astro Nano의 미니멀한 리듬을 참고해 블로그에 맞게 적용했습니다.",
      "과한 장식보다 읽기 편한 간격과 목록 중심의 흐름을 우선합니다.",
    ].join("\n\n"),
  },
  contacts: {
    key: "contacts",
    title: "Contacts",
    body: "안녕하세요. 이지우입니다.",
  },
};

export function isSiteSectionKey(value: string): value is SiteSectionKey {
  return siteSectionKeys.includes(value as SiteSectionKey);
}

export function splitSectionParagraphs(body: string) {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function validateSiteSectionBody(
  value: unknown,
  key?: SiteSectionKey,
): { ok: true; value: string } | { ok: false; message: string } {
  const body = typeof value === "string" ? value.trim() : "";

  if (key === "blogName") {
    const name = body.replace(/\s+/g, " ");

    if (!name || name.length > 40) {
      return {
        ok: false,
        message: "블로그 이름은 40자 이하로 입력해주세요.",
      };
    }

    if (/[<>]/.test(name)) {
      return { ok: false, message: "블로그 이름을 다시 확인해주세요." };
    }

    return { ok: true, value: name };
  }

  if (!body || body.length > 4000) {
    return {
      ok: false,
      message: "내용은 4000자 이하로 입력해주세요.",
    };
  }

  return { ok: true, value: body };
}
