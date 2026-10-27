import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type { ExceptionColumn } from "@/features/exception/components/shared/ExceptionTable";
import OpenButton from "@/features/exception/components/shared/OpenButton";
import StallNote from "@/features/exception/components/shared/StallNote";
import { DELIVERY_KIND_VARIANT } from "@/features/exception/constants/labels";
import type { ExceptionItem } from "@/features/exception/types";
import {
  formatMonthDayTime,
  splitLastSegment,
} from "@/features/exception/utils/format";

/** 시안 `.tnum` — 숫자 자릿수를 맞춘다 */
const TNUM = "tabular-nums tracking-[-0.1px]";
/** 시안 `.t-sub` — 11px · n-500 */
const SUB = "text-[11px] text-sz-n-500";
/** 시안 `.t-note` — 다음 단계의 보조 줄 */
const NOTE = "mt-[3px] block text-[11px] font-medium";

const OPEN_COLUMN_LABEL = "관리";
const EMPTY = "—";

/**
 * 대상 · 주문번호 열 — 시안은 100px(「ORD-24190」)이지만 서버 주문번호는 「20261003-000123」(15자)라
 * 잘리지 않게 넓힌다. 그만큼 가변 열(다음 단계 · 처리 주체)이 줄어든다.
 */
const TARGET_WIDTH = 130;

/**
 * 시안 A1 열 — 대상 · 유형 130 · 브랜드 100 · 기한 130 · 경과 92 · 자동 알림 86 · 다음 단계(가변) · 관리 84.
 * 문장(기한 보조 · 경과 · 다음 단계)은 서버가 만든다 — FE는 날짜 포맷과 색만 정한다.
 */
export const DELAY_COLUMNS: Array<ExceptionColumn<ExceptionItem>> = [
  {
    key: "targetNumber",
    label: "대상",
    width: TARGET_WIDTH,
    render: (row) => (
      <span className={TNUM} title={row.subOrderNumber ?? undefined}>
        {row.targetNumber}
      </span>
    ),
  },
  {
    key: "kind",
    label: "유형",
    width: 130,
    render: (row) => row.kindLabel,
  },
  {
    key: "brandName",
    label: "브랜드",
    width: 100,
    render: (row) => row.brandName,
  },
  {
    key: "due",
    label: "기한",
    width: 130,
    align: "center",
    render: (row) => (
      <>
        <span className={`${SUB} ${TNUM}`}>
          {formatMonthDayTime(row.dueAt)}
        </span>
        {row.dueBasisLabel && (
          <span className={`${SUB} block truncate`} title={row.dueBasisLabel}>
            {row.dueBasisLabel}
          </span>
        )}
      </>
    ),
  },
  {
    key: "elapsed",
    label: "경과",
    width: 92,
    align: "center",
    // 시안 [상태색] — 경과 열은 기한을 넘긴 값만 경고 글자(서버 `overdue`)
    render: (row) => (
      <span className={`${TNUM} ${row.overdue ? "text-sz-warning-text" : ""}`}>
        {row.elapsedLabel}
      </span>
    ),
  },
  {
    key: "noticeCount",
    label: "자동 알림",
    width: 86,
    align: "center",
    // 독촉 버튼은 없다 — 기한 경과 알림은 시스템 자동이고 횟수만 보여준다. 재발송 지연은 알림이 없다(null)
    render: (row) => (
      <span className={TNUM}>
        {row.noticeCount === null ? EMPTY : `${row.noticeCount}회`}
      </span>
    ),
  },
  {
    key: "nextStep",
    label: "다음 단계",
    align: "center",
    wrap: true,
    render: (row) => {
      if (!row.nextStepLabel) {
        return <span className={SUB}>{EMPTY}</span>;
      }
      // 대행 가능은 상태가 아니라 조건이라 배지 없이 글자로 적고 결론만 굵게 한다
      const { head, tail } = splitLastSegment(row.nextStepLabel);
      return (
        <>
          {row.actOnBehalfAvailable ? (
            <span>
              {head}
              <b>{tail}</b>
            </span>
          ) : (
            <span className={SUB}>{row.nextStepLabel}</span>
          )}
          {row.nextStepNote && <span className={NOTE}>{row.nextStepNote}</span>}
        </>
      );
    },
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
 * 시안 A2 열 — 주문번호 · 유형 130 · 브랜드 100 · 송장 170 · 기준 120 · 경과 100 · 처리 주체(가변) · 관리 84.
 * 「처리 주체」(서버 `handlerLabel`)가 운영자가 CS 통화에서 답할 문장이다.
 */
export const DELIVERY_COLUMNS: Array<ExceptionColumn<ExceptionItem>> = [
  {
    key: "targetNumber",
    label: "주문번호",
    width: TARGET_WIDTH,
    render: (row) => (
      <span className={TNUM} title={row.subOrderNumber ?? undefined}>
        {row.targetNumber}
      </span>
    ),
  },
  {
    key: "kind",
    label: "유형",
    width: 130,
    render: (row) => (
      <StatusBadge variant={DELIVERY_KIND_VARIANT[row.kind] ?? "warning"}>
        {row.kindLabel}
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
    key: "invoice",
    label: "송장",
    width: 170,
    // 서버는 송장번호를 가리지 않는다(CS가 택배사에 조회할 번호 · 40 설계서 1-2)
    render: (row) => {
      const text = [row.invoice?.carrierLabel, row.invoice?.trackingNumber]
        .filter(Boolean)
        .join(" ");
      return (
        <span className={`${SUB} ${TNUM}`} title={text || undefined}>
          {text || EMPTY}
        </span>
      );
    },
  },
  {
    key: "basis",
    label: "기준",
    width: 120,
    align: "center",
    render: (row) => <span className={SUB}>{row.basisLabel ?? EMPTY}</span>,
  },
  {
    key: "elapsed",
    label: "경과",
    width: 100,
    align: "center",
    // 시안 A2의 경과 열은 색이 없다 — 위험 · 경고는 유형 배지가 맡는다.
    // 추적 정지는 아래에 소비자 선택 개방까지 남은 일수(기-15 【잠정】)를 붙인다
    render: (row) => (
      <>
        <span className={TNUM}>{row.elapsedLabel}</span>
        {row.kind === "TRACKING_STALLED" && row.stallChoice && (
          <StallNote choice={row.stallChoice} />
        )}
      </>
    ),
  },
  {
    key: "handler",
    label: "처리 주체",
    align: "center",
    wrap: true,
    render: (row) => <span className={SUB}>{row.handlerLabel ?? EMPTY}</span>,
  },
  {
    key: "open",
    label: OPEN_COLUMN_LABEL,
    width: 84,
    align: "center",
    render: () => <OpenButton />,
  },
];
