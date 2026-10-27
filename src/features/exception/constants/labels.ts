import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import type { ExceptionKind, ExceptionTab } from "@/features/exception/types";

/**
 * 유형 셀렉트 선택지 — 백엔드 `ExceptionKind` enum의 선언 순서 · 라벨 · 소속 탭을 옮겼다.
 * 요약(`kindCounts`)은 건수만 내리고 라벨이 없어서다. 표의 유형 열은 행의 `kindLabel`(서버)을 쓴다.
 */
export const EXCEPTION_KINDS: Array<{
  value: ExceptionKind;
  label: string;
  tab: ExceptionTab;
}> = [
  { value: "SHIP_OVERDUE", label: "발송 기한 경과", tab: "DELAY" },
  { value: "INSPECT_OVERDUE", label: "검수 지연", tab: "DELAY" },
  { value: "RESHIP_DELAYED", label: "재발송 지연", tab: "DELAY" },
  { value: "PICKUP_UNCONFIRMED", label: "집화 확인 필요", tab: "DELIVERY" },
  { value: "TRACKING_STALLED", label: "추적 정지", tab: "DELIVERY" },
  { value: "RETURNING", label: "반송 중", tab: "DELIVERY" },
  { value: "COLLECTION_UNSCANNED", label: "회수 송장 미조회", tab: "DELIVERY" },
];

/**
 * 【잠정】 기-15 추적 정지 → 소비자 선택(재발송 / 환불) 개방 — 06d A2 경과 열 보조줄.
 * 변호사 확인 뒤 문구가 바뀔 수 있어 한 곳에 둔다. N은 서버 값만 쓴다(없으면 「N일 [정책값 미정]」).
 */
export const STALL_CHOICE_NOTE = {
  waitingPrefix: "선택 개방까지",
  unsetDays: "N일",
  unsetTag: "[정책값 미정]",
  open: "소비자 선택 가능",
  chosen: (choiceLabel: string | null) => `소비자 선택 · ${choiceLabel ?? "—"}`,
} as const;

/**
 * 배송 예외 유형 배지색 — 서버는 색을 내리지 않는다(40 설계서 1-2 「색(FE)」).
 * 시안 [상태색]: 집화 확인 필요 = 경고(24시간 판정), 추적 정지 · 반송 중 = 위험(소비자 물건이 멈춘 상태).
 * 회수 송장 미조회는 시안 예시가 없어 집화 확인과 같은 경고다(설계서 1-2).
 */
export const DELIVERY_KIND_VARIANT: Partial<
  Record<ExceptionKind, StatusBadgeVariant>
> = {
  PICKUP_UNCONFIRMED: "warning",
  TRACKING_STALLED: "danger",
  RETURNING: "danger",
  COLLECTION_UNSCANNED: "warning",
};
