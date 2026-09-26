import type { HistoryItem } from "@/common/components/HistoryList/HistoryList";
import { formatDateTimeShort } from "@/common/utils/formatDate";
import {
  ACTOR_LABEL,
  DOCUMENT_LABEL,
  EVENT_LABEL,
  HISTORY_TONE,
} from "@/features/contract/constants/labels";
import type { AdminContractHistory } from "@/features/contract/types";

/** 상세 문자열에 서버 시각(ISO)·null이 섞여 오면 화면 표기로 바꾼다 */
const ISO_IN_TEXT =
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?/g;

function humanize(detail: string | null) {
  return detail
    ? detail
        .replace(ISO_IN_TEXT, (match) => formatDateTimeShort(match))
        .replace(/\bnull\b/g, "없음")
    : detail;
}

/**
 * 이력에서 숨기는 이벤트.
 * - 생성본 발급은 시스템 기록이라 시안 이력에 없다(파트너·스튜디오도 숨긴다).
 * - 브랜드/인플루언서 서명은 서명 현황 저장 한 번에 `SIGNATURE_UPDATED`와 함께 **이중으로** 남는다 —
 *   시안은 저장 한 번 = 한 줄(처리자·기준 시각)이라 변경 내역이 담긴 갱신 기록만 남긴다.
 */
const HIDDEN_EVENTS: Array<AdminContractHistory["eventType"]> = [
  "CONTRACT_PDF_GENERATED",
  "BRAND_SIGNED",
  "CREATOR_SIGNED",
  "BOTH_SIGNED_CONFIRMED",
  // 체결 처리와 같은 순간에 남는다 — 시안은 「체결 완료 처리 · 공구 생성」 한 줄이고 번호는 본문에 있다
  "GROUP_BUY_CREATED",
];

/** 모두싸인에서 운영자가 한 일 — 이력 메타에 「· 모두싸인」을 붙인다(시안 B3) */
const VIA_MODUSIGN: Array<AdminContractHistory["eventType"]> = [
  "SIGNATURE_SENT",
  "RESEND_HANDLED",
];

/**
 * 같은 시각에 찍힌 이벤트의 논리 순서 — 승인 모달 하나가 「검토 통과」와 「서명 요청 발송」을
 * 같은 순간에 남기는데 서버 저장 순서가 거꾸로 올 수 있다. 숫자가 클수록 나중 일이다.
 */
const SAME_TIME_RANK: Partial<
  Record<AdminContractHistory["eventType"], number>
> = {
  CREATED: 0,
  REVIEW_REQUESTED: 1,
  REVIEW_APPROVED: 2,
  REVIEW_REJECTED: 2,
  SIGNATURE_SENT: 3,
  CONCLUDED: 5,
  GROUP_BUY_CREATED: 6,
};

/**
 * 최신순으로 맞춘다 — 같은 분에 찍힌 이벤트는 서버 순서의 역순이 곧 최신순이므로
 * 서버 방향을 먼저 최신순으로 뒤집은 뒤 시각으로 안정 정렬한다.
 */
function newestFirst(history: Array<AdminContractHistory>) {
  const ascending =
    history.length > 1 &&
    history[0].occurredAt <= history[history.length - 1].occurredAt;
  const base = ascending ? [...history].reverse() : [...history];
  return base.sort((a, b) => {
    // 화면은 분 단위로 보이므로 같은 분 안에서는 논리 순서를 먼저 따른다(몇 초 차이로 뒤집히지 않게)
    const byMinute = b.occurredAt
      .slice(0, 16)
      .localeCompare(a.occurredAt.slice(0, 16));
    if (byMinute !== 0) {
      return byMinute;
    }
    const rankA = SAME_TIME_RANK[a.eventType];
    const rankB = SAME_TIME_RANK[b.eventType];
    if (rankA !== undefined && rankB !== undefined && rankA !== rankB) {
      return rankB - rankA;
    }
    return b.occurredAt.localeCompare(a.occurredAt);
  });
}

/**
 * 체결 문서 업로드·삭제 — 서버 상세 문자열에 문서 코드(SIGNED_PDF…)가 그대로 섞여 온다.
 * 시안은 「서명 PDF 업로드」 · 「감사추적인증서 업로드」 한 줄이다.
 */
function documentEventLabel(entry: AdminContractHistory) {
  if (
    entry.eventType !== "DOCUMENT_UPLOADED" &&
    entry.eventType !== "DOCUMENT_DELETED"
  ) {
    return null;
  }
  const action = entry.eventType === "DOCUMENT_UPLOADED" ? "업로드" : "삭제";
  const type = (
    Object.keys(DOCUMENT_LABEL) as Array<keyof typeof DOCUMENT_LABEL>
  ).find((key) => entry.detail?.includes(key));
  return type ? `${DOCUMENT_LABEL[type]} ${action}` : `체결 문서 ${action}`;
}

/**
 * 서버 이력 → 처리 이력(최신순). 어드민은 모든 수동 처리의 처리자를 **실명**으로 남긴다
 * (파트너·스튜디오 쪽은 「어드민」·「운영자」로 익명).
 */
export function toHistoryItems(
  history: Array<AdminContractHistory>
): Array<HistoryItem> {
  return newestFirst(
    history.filter((entry) => !HIDDEN_EVENTS.includes(entry.eventType))
  ).map((entry) => {
    const document = documentEventLabel(entry);
    if (document) {
      return {
        label: document,
        processedAt: entry.occurredAt,
        tone: HISTORY_TONE[entry.eventType] ?? "muted",
        processorName: entry.actorDisplayName ?? ACTOR_LABEL[entry.actorType],
      };
    }
    const label = EVENT_LABEL[entry.eventType] ?? entry.eventType;
    // 검토 요청의 확인 경고 코드(W1…)는 운영자 화면에서도 의미가 없어 붙이지 않는다
    const detail =
      entry.eventType === "REVIEW_REQUESTED" ||
      // 반려 사유는 코드(AGREEMENT_MISMATCH…)로 오고 본문 카드에 이미 풀어 적혀 있다
      entry.eventType === "REVIEW_REJECTED"
        ? null
        : humanize(entry.detail);
    const actor = entry.actorDisplayName ?? ACTOR_LABEL[entry.actorType];
    // 시안: 모두싸인에서 한 일은 「김운영 · 모두싸인」, 취소 사유는 「김운영 · 사유: …」로 메타 줄에 붙는다
    if (VIA_MODUSIGN.includes(entry.eventType)) {
      return {
        label: detail ? `${label} · ${detail}` : label,
        processedAt: entry.occurredAt,
        tone: HISTORY_TONE[entry.eventType] ?? "muted",
        processorName: `${actor} · 모두싸인`,
      };
    }
    if (entry.eventType === "CANCELED" && detail) {
      return {
        label,
        processedAt: entry.occurredAt,
        tone: HISTORY_TONE[entry.eventType] ?? "muted",
        processorName: `${actor} · 사유: ${detail}`,
      };
    }
    return {
      label: detail ? `${label} · ${detail}` : label,
      processedAt: entry.occurredAt,
      tone: HISTORY_TONE[entry.eventType] ?? "muted",
      processorName: actor,
    };
  });
}
