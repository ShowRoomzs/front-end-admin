import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type { ExceptionColumn } from "@/features/exception/components/shared/ExceptionTable";
import OpenButton from "@/features/exception/components/shared/OpenButton";
import {
  DELAY_TYPE_LABEL,
  DELIVERY_BASIS_LABEL,
  DELIVERY_HANDLER_LABEL,
  DELIVERY_TYPE_LABEL,
  DELIVERY_TYPE_VARIANT,
} from "@/features/exception/constants/labels";
import type { DelayItem, DeliveryItem } from "@/features/exception/types";
import {
  deadlineText,
  deliveryElapsedText,
  nextNotifyText,
} from "@/features/exception/utils/format";

/** 시안 `.tnum` — 숫자 자릿수를 맞춘다 */
const TNUM = "tabular-nums tracking-[-0.1px]";

const OPEN_COLUMN_LABEL = "관리";

/**
 * 시안 A1 열 — 대상 100 · 유형 130 · 브랜드 100 · 기한 130 · 경과 92 · 자동 알림 86 · 다음 단계(가변) · 관리 84.
 * 합쳐서 722px라 1440 화면에서 다음 단계가 약 430px를 갖는다.
 */
export const DELAY_COLUMNS: Array<ExceptionColumn<DelayItem>> = [
  {
    key: "targetNo",
    label: "대상",
    width: 100,
    render: (row) => <span className={TNUM}>{row.targetNo}</span>,
  },
  {
    key: "delayType",
    label: "유형",
    width: 130,
    render: (row) => DELAY_TYPE_LABEL[row.delayType],
  },
  {
    key: "brandName",
    label: "브랜드",
    width: 100,
    render: (row) => row.brandName,
  },
  {
    key: "deadline",
    label: "기한",
    width: 130,
    align: "center",
    render: (row) => <span className={TNUM}>{deadlineText(row)}</span>,
  },
  {
    key: "elapsed",
    label: "경과",
    width: 92,
    align: "center",
    // 시안 [상태색] — 경과 열은 기한을 넘긴 값만 경고 글자. 이 탭의 행은 모두 기한을 넘겼다
    render: (row) => (
      <span
        className={`${TNUM} ${row.elapsedBusinessDays > 0 ? "text-sz-warning-text" : ""}`}
      >
        {row.elapsedBusinessDays}영업일
      </span>
    ),
  },
  {
    key: "notifyCount",
    label: "자동 알림",
    width: 86,
    align: "center",
    // 독촉 버튼은 없다 — 기한 경과 알림은 시스템 자동이고 횟수만 보여준다
    render: (row) => <span className={TNUM}>{row.notifyCount}회</span>,
  },
  {
    key: "nextStep",
    label: "다음 단계",
    align: "center",
    wrap: true,
    render: (row) =>
      row.proxyAvailable ? (
        <>
          <span>
            자동 알림 {row.notifyCount}회 무응답 · <b>대행 가능</b>
          </span>
          {/* 대행 가능은 상태가 아니라 조건이라 배지 없이 글자로 적는다 */}
          <span className="mt-[3px] block text-[11px] font-medium">
            {row.targetKind === "ORDER"
              ? "송장 대행 · 직권 취소 — 주문 상세"
              : "반품·교환 상세에서 확인"}
          </span>
        </>
      ) : (
        <span className="text-[11px] text-sz-n-500">{nextNotifyText(row)}</span>
      ),
  },
  {
    key: "open",
    label: OPEN_COLUMN_LABEL,
    width: 84,
    align: "center",
    render: () => <OpenButton />,
  },
];

/**
 * 시안 A2 열 — 주문번호 100 · 유형 130 · 브랜드 100 · 송장 170 · 기준 120 · 경과 100 · 처리 주체(가변) · 관리 84.
 * 「처리 주체」가 운영자가 CS 통화에서 답할 문장이다.
 */
export const DELIVERY_COLUMNS: Array<ExceptionColumn<DeliveryItem>> = [
  {
    key: "orderNo",
    label: "주문번호",
    width: 100,
    render: (row) => <span className={TNUM}>{row.orderNo}</span>,
  },
  {
    key: "exceptionType",
    label: "유형",
    width: 130,
    // 추적 정지 · 반송 중 = 위험(소비자 물건이 멈춘 상태), 집화 확인 필요 = 경고(24시간 판정)
    render: (row) => (
      <StatusBadge variant={DELIVERY_TYPE_VARIANT[row.exceptionType]}>
        {DELIVERY_TYPE_LABEL[row.exceptionType]}
      </StatusBadge>
    ),
  },
  {
    key: "brandName",
    label: "브랜드",
    width: 100,
    render: (row) => row.brandName,
  },
  {
    key: "tracking",
    label: "송장",
    width: 170,
    render: (row) => (
      <span className={TNUM}>
        {row.carrierName} {row.trackingNoMasked}
      </span>
    ),
  },
  {
    key: "basis",
    label: "기준",
    width: 120,
    align: "center",
    render: (row) => DELIVERY_BASIS_LABEL[row.exceptionType],
  },
  {
    key: "elapsed",
    label: "경과",
    width: 100,
    align: "center",
    render: (row) => (
      <span className={TNUM}>
        {deliveryElapsedText(row.exceptionType, row.elapsedHours)}
      </span>
    ),
  },
  {
    key: "handler",
    label: "처리 주체",
    align: "center",
    wrap: true,
    render: (row) => DELIVERY_HANDLER_LABEL[row.exceptionType],
  },
  {
    key: "open",
    label: OPEN_COLUMN_LABEL,
    width: 84,
    align: "center",
    render: () => <OpenButton />,
  },
];
