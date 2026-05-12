import {
  COMMENT_LIMITS,
  isCommentEmoji,
  type CommentEmoji,
} from "@/lib/comment-config";

type ValidationResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      message: string;
    };

export type CreateCommentInput = {
  postSlug: string;
  parentId: string | null;
  nickname: string;
  body: string;
  password: string;
  emoji: CommentEmoji | null;
};

export type UpdateCommentInput = {
  body: string;
  password: string;
  emoji: CommentEmoji | null;
};

const BLOCKED_NICKNAME_MESSAGE =
  "부적절한 단어가 포함된 닉네임은 사용할 수 없습니다.";

const blockedNicknameTerms = [
  "간나",
  "간나새끼",
  "갈보",
  "개간나",
  "개년",
  "개놈",
  "개돼지",
  "개소리",
  "개새끼",
  "개색기",
  "개쉐끼",
  "개씹",
  "개자식",
  "개잡년",
  "개잡놈",
  "개좆",
  "개지랄",
  "개차반",
  "거렁뱅이",
  "거지새끼",
  "걸레",
  "걸레년",
  "고아새끼",
  "고자",
  "광녀",
  "광년",
  "깜둥이",
  "꺼져",
  "닥쳐",
  "달창",
  "대구페페",
  "도요타다이쥬",
  "땅크",
  "띨빡",
  "띨빵",
  "띨띨이",
  "딸피",
  "또라이",
  "명뽕홍어",
  "미친놈",
  "미친년",
  "미친새끼",
  "민주화드립",
  "병신",
  "병쉰",
  "보빨",
  "보빨러",
  "븅신",
  "베충이",
  "베츙이",
  "빙신",
  "반일충",
  "별창",
  "빨갱이새끼",
  "새끼",
  "슨상",
  "슨상그라드",
  "슨삭절",
  "슨탄절",
  "시발",
  "씨바",
  "씨발",
  "씨팔",
  "씨방새",
  "씨부랄",
  "십새끼",
  "쌍간나",
  "쌍년",
  "쌍놈",
  "썅",
  "쓰레기",
  "씹",
  "씹구멍",
  "씹덕",
  "씹새끼",
  "씹쓰레기",
  "씹지랄",
  "씹창",
  "씹치남",
  "씹년",
  "씹놈",
  "아가리",
  "아다",
  "암베",
  "앙망",
  "애비충",
  "애새끼",
  "애자",
  "애미",
  "애미뒤진",
  "앱등이",
  "양공주",
  "양놈",
  "양키",
  "어저미",
  "언년이",
  "얼간이",
  "엑윽",
  "엑윽엑엑",
  "엔두",
  "엔젤두환",
  "엠생",
  "엠창",
  "엠창인생",
  "염병",
  "옘병",
  "오랑캐",
  "오스트랄로피테쿠스",
  "오유충",
  "운지",
  "우라질",
  "워마드",
  "왜놈",
  "유아틱",
  "유아퇴행",
  "유인원",
  "육변기",
  "육시랄",
  "육갑",
  "일게이",
  "일밍아웃",
  "일베충",
  "자지",
  "잡년",
  "잡놈",
  "잡종",
  "장뚜룸",
  "재기해",
  "저능아",
  "정박아",
  "정신병자",
  "전땅크",
  "전라디언",
  "전라민국",
  "전라민주주의인민공화국",
  "전라인민공화국",
  "절라디언",
  "젖",
  "제기랄",
  "제길",
  "조센징",
  "존나",
  "졸라",
  "좆",
  "좃",
  "좆같",
  "좆까",
  "좆나",
  "좆대가리",
  "좆도",
  "좆만",
  "좆물",
  "좆밥",
  "좆빨러",
  "좆심",
  "좆집",
  "종간나",
  "주둥아리",
  "주둥이",
  "쥐새끼",
  "지기미",
  "지랄",
  "지랄발광",
  "지랄병",
  "짱깨",
  "짱꼴라",
  "장궤",
  "쩌리",
  "쪼다",
  "쪽발이",
  "쪽바리",
  "쫄보",
  "찌랭이",
  "찌질이",
  "찐따",
  "찐찌버거",
  "창녀",
  "창남",
  "창년",
  "창놈",
  "처먹",
  "천치",
  "촛불좀비",
  "추남",
  "추녀",
  "코쟁이",
  "통구이",
  "통구이드립",
  "토착빨갱이",
  "토착왜구",
  "토착짱깨",
  "튀기",
  "틀딱",
  "틀딱충",
  "틀튜브",
  "파오후",
  "폐급",
  "폐녀자",
  "폭동드립",
  "폭동절",
  "피싸개",
  "한남",
  "한남충",
  "한녀",
  "한녀충",
  "항틀",
  "허접쓰레기",
  "허섭스레기",
  "호로자식",
  "호모",
  "혼모노",
  "홍어",
  "화냥년",
  "후레자식",
  "후빨",
  "후장",
  "후장빨개",
  "흑돼지",
  "니미",
  "니기미",
  "니애미",
  "느그애미",
  "느금마",
  "보지",
  "노알라",
  "노운지",
  "노탄절",
  "뇌물현",
  "두부외상",
  "두부박살",
  "고무통",
  "고무현",
  "응디시티",
  "김치녀",
  "나거한",
  "네다홍",
  "네다음홍어",
  "좌좀",
  "우좀",
  "물소",
  "맘충",
  "급식충",
];

const blockedNicknameInitialisms = [
  "ㄱㅅㄲ",
  "ㄱㅅㄱ",
  "ㄱㅈㄹ",
  "ㄴㄷㅎ",
  "ㄲㅈ",
  "ㄷㅊ",
  "ㅁㅊ",
  "ㅁㅈㅎ",
  "ㅂㅅ",
  "ㅄ",
  "ㅅㄲ",
  "ㅅㅂ",
  "ㅅㅍ",
  "ㅆㄲ",
  "ㅆㅂ",
  "ㅆㅍ",
  "ㅇㅂ",
  "ㅈㄴ",
  "ㅈㄹ",
  "ㅈㄲ",
  "ㅈ까",
  "ㅈ같",
  "ㅂㅕㅇㅅㅣㄴ",
  "ㅅㅣㅂㅏㄹ",
  "ㅆㅣㅂㅏㄹ",
];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

const hangulInitials = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
] as const;
const hangulMedials = [
  "ㅏ",
  "ㅐ",
  "ㅑ",
  "ㅒ",
  "ㅓ",
  "ㅔ",
  "ㅕ",
  "ㅖ",
  "ㅗ",
  "ㅘ",
  "ㅙ",
  "ㅚ",
  "ㅛ",
  "ㅜ",
  "ㅝ",
  "ㅞ",
  "ㅟ",
  "ㅠ",
  "ㅡ",
  "ㅢ",
  "ㅣ",
] as const;
const hangulFinals = [
  "",
  "ㄱ",
  "ㄲ",
  "ㄳ",
  "ㄴ",
  "ㄵ",
  "ㄶ",
  "ㄷ",
  "ㄹ",
  "ㄺ",
  "ㄻ",
  "ㄼ",
  "ㄽ",
  "ㄾ",
  "ㄿ",
  "ㅀ",
  "ㅁ",
  "ㅂ",
  "ㅄ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
] as const;
const compatibilityJamoExpansions: Record<string, string> = {
  ㄲ: "ㄱㄱ",
  ㄳ: "ㄱㅅ",
  ㄵ: "ㄴㅈ",
  ㄶ: "ㄴㅎ",
  ㄸ: "ㄷㄷ",
  ㄺ: "ㄹㄱ",
  ㄻ: "ㄹㅁ",
  ㄼ: "ㄹㅂ",
  ㄽ: "ㄹㅅ",
  ㄾ: "ㄹㅌ",
  ㄿ: "ㄹㅍ",
  ㅀ: "ㄹㅎ",
  ㅄ: "ㅂㅅ",
  ㅃ: "ㅂㅂ",
  ㅆ: "ㅅㅅ",
  ㅉ: "ㅈㅈ",
};

function normalizeNicknameForModeration(value: string) {
  return value
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^가-힣ㄱ-ㅎㅏ-ㅣ]/g, "")
    .replace(/([ㄱ-ㅎㅏ-ㅣ가-힣])\1{2,}/g, "$1$1");
}

function decomposeHangulToJamo(value: string) {
  return Array.from(value.normalize("NFC").toLowerCase())
    .map((character) => {
      const codePoint = character.codePointAt(0);

      if (!codePoint) {
        return "";
      }

      if (codePoint >= 0xac00 && codePoint <= 0xd7a3) {
        const syllableIndex = codePoint - 0xac00;
        const initial = Math.floor(syllableIndex / 588);
        const medial = Math.floor((syllableIndex % 588) / 28);
        const final = syllableIndex % 28;

        return `${hangulInitials[initial]}${hangulMedials[medial]}${hangulFinals[final]}`;
      }

      if (/^[ㄱ-ㅎㅏ-ㅣ]$/.test(character)) {
        return compatibilityJamoExpansions[character] ?? character;
      }

      return "";
    })
    .join("")
    .replace(/([ㄱ-ㅎㅏ-ㅣ])\1{2,}/g, "$1$1");
}

function containsBlockedNicknameTerm(nickname: string) {
  const normalized = normalizeNicknameForModeration(nickname);
  const normalizedJamo = decomposeHangulToJamo(nickname);

  return [...blockedNicknameTerms, ...blockedNicknameInitialisms].some(
    (term) =>
      normalized.includes(normalizeNicknameForModeration(term)) ||
      normalizedJamo.includes(decomposeHangulToJamo(term)),
  );
}

function normalizeParentId(value: unknown): ValidationResult<string | null> {
  if (value === null || value === undefined || value === "") {
    return { ok: true, value: null };
  }

  if (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    return { ok: true, value };
  }

  return { ok: false, message: "답글을 달 댓글 정보를 다시 확인해주세요." };
}

function normalizeEmoji(value: unknown): ValidationResult<CommentEmoji | null> {
  if (value === null || value === undefined || value === "") {
    return { ok: true, value: null };
  }

  if (!isCommentEmoji(value)) {
    return { ok: false, message: "선택할 수 없는 이모지입니다." };
  }

  return { ok: true, value };
}

export function validatePassword(password: unknown): ValidationResult<string> {
  const normalized = normalizeString(password);

  if (
    normalized.length < COMMENT_LIMITS.passwordMin ||
    normalized.length > COMMENT_LIMITS.passwordMax
  ) {
    return {
      ok: false,
      message: `비밀번호는 ${COMMENT_LIMITS.passwordMin}자 이상 ${COMMENT_LIMITS.passwordMax}자 이하로 입력해주세요.`,
    };
  }

  return { ok: true, value: normalized };
}

export function validateCreateComment(
  payload: unknown,
): ValidationResult<CreateCommentInput> {
  const record = asRecord(payload);

  if (!record) {
    return { ok: false, message: "댓글 정보를 다시 확인해주세요." };
  }

  const postSlug = normalizeString(record.postSlug);
  const parentId = normalizeParentId(record.parentId);
  const nickname = normalizeString(record.nickname);
  const body = normalizeString(record.body);
  const password = validatePassword(record.password);
  const emoji = normalizeEmoji(record.emoji);

  if (!postSlug || postSlug.length > COMMENT_LIMITS.postSlugMax) {
    return { ok: false, message: "게시글 정보를 다시 확인해주세요." };
  }

  if (!parentId.ok) {
    return parentId;
  }

  if (!nickname || nickname.length > COMMENT_LIMITS.nicknameMax) {
    return {
      ok: false,
      message: `닉네임은 ${COMMENT_LIMITS.nicknameMax}자 이하로 입력해주세요.`,
    };
  }

  if (containsBlockedNicknameTerm(nickname)) {
    return { ok: false, message: BLOCKED_NICKNAME_MESSAGE };
  }

  if (!body || body.length > COMMENT_LIMITS.bodyMax) {
    return {
      ok: false,
      message: `댓글은 ${COMMENT_LIMITS.bodyMax}자 이하로 입력해주세요.`,
    };
  }

  if (!password.ok) {
    return password;
  }

  if (!emoji.ok) {
    return emoji;
  }

  return {
    ok: true,
    value: {
      postSlug,
      parentId: parentId.value,
      nickname,
      body,
      password: password.value,
      emoji: emoji.value,
    },
  };
}

export function validateUpdateComment(
  payload: unknown,
): ValidationResult<UpdateCommentInput> {
  const record = asRecord(payload);

  if (!record) {
    return { ok: false, message: "댓글 정보를 다시 확인해주세요." };
  }

  const body = normalizeString(record.body);
  const password = validatePassword(record.password);
  const emoji = normalizeEmoji(record.emoji);

  if (!body || body.length > COMMENT_LIMITS.bodyMax) {
    return {
      ok: false,
      message: `댓글은 ${COMMENT_LIMITS.bodyMax}자 이하로 입력해주세요.`,
    };
  }

  if (!password.ok) {
    return password;
  }

  if (!emoji.ok) {
    return emoji;
  }

  return {
    ok: true,
    value: {
      body,
      password: password.value,
      emoji: emoji.value,
    },
  };
}
