import DetailCard from "@/common/components/DetailCard/DetailCard";
import HistoryList, {
  type HistoryItem,
} from "@/common/components/HistoryList/HistoryList";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { formatDateTimeShort } from "@/common/utils/formatDate";
import {
  PENDING_CHIP_KINDS,
  PENDING_TARGET_LABELS,
  PROVISIONAL,
} from "@/features/consumer/constants/detail";
import {
  BTN_DANGER_OUTLINE,
  BTN_PRIMARY,
  ST_HINT_CLASS,
} from "@/features/consumer/constants/styles";
import type {
  ConsumerDetail,
  ConsumerHistoryItem,
  ConsumerPendingChip,
} from "@/features/consumer/types/consumerDetail";
import { getConsumerStatusBadge } from "@/features/consumer/utils/statusBadge";
import {
  formatElapsed,
  formatKstDate,
  formatWon,
  historyTone,
  pendingLinkHref,
} from "@/features/consumer/utils/detailView";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

/** 시안 `.mrow` — 상태 카드 메타 한 줄 */
function MetaRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0">
      <span className="shrink-0 text-sz-n-500">{props.label}</span>
      <span className="text-right font-medium text-sz-n-900">
        {props.children}
      </span>
    </div>
  );
}

// ── 현재 상태 ───────────────────────────────────────────────────

interface StatusCardProps {
  detail: ConsumerDetail;
  onSuspend: () => void;
  onRelease: () => void;
}

/**
 * 현재 상태 — 활성 · 정지 · 탈퇴. 액션은 상태마다 하나뿐이다: 활성 = 정지(흰 배경 + 위험색 글자 ·
 * 꽉 찬 위험색은 M1 실행 버튼에만) / 정지 = 활성으로 변경(복구라 인디고) / 탈퇴 = 없음(셀프서비스).
 * 버튼 노출은 서버 `actions`가 정한다.
 */
export function StatusCard(props: StatusCardProps) {
  const { detail, onSuspend, onRelease } = props;
  const { statusCard } = detail;
  const { sanction, withdrawal, actions } = statusCard;
  const badge = getConsumerStatusBadge(statusCard.status);
  const term = sanction?.term ?? null;

  return (
    <DetailCard title="현재 상태">
      <div className="pt-3">
        <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3">
          <span className="shrink-0 text-[12px] text-sz-n-500">계정</span>
          <StatusBadge variant={badge.variant}>{badge.label}</StatusBadge>
        </div>

        {statusCard.status === "SUSPENDED" && sanction && (
          <>
            <div className="pt-2">
              <MetaRow label="정지 사유">{sanction.reasonLabel ?? "—"}</MetaRow>
              <MetaRow label="처리자">
                {sanction.suspendedByName ?? "—"}
              </MetaRow>
              <MetaRow label="정지 일시">
                <span className="tabular-nums">
                  {formatDateTimeShort(sanction.suspendedAt)}
                </span>
              </MetaRow>
              {/* 기-02 【잠정】 — 정지 기간 · 이의 신청 기한(KST 벽시계 그대로) */}
              {term && (
                <MetaRow label="정지 기간">
                  <span className="tabular-nums">
                    {term.endsOn
                      ? `~ ${formatKstDate(term.endsOn)}${term.periodDays ? ` (${term.periodDays}일)` : ""}`
                      : "기간 없음 (수동 해제)"}
                  </span>
                </MetaRow>
              )}
              {term?.appealDeadlineAt && (
                <MetaRow label="이의 신청 기한">
                  <span className="tabular-nums">
                    {formatKstDate(term.appealDeadlineAt)}까지
                  </span>
                </MetaRow>
              )}
            </div>
            {sanction.reasonDetail && (
              <p className={`${ST_HINT_CLASS} mb-3`}>
                <b className="font-semibold">상세 사유</b> —{" "}
                {sanction.reasonDetail}
              </p>
            )}
          </>
        )}

        {statusCard.status === "WITHDRAWN" && (
          <div className="pt-2">
            <MetaRow label="탈퇴 일시">
              <span className="tabular-nums">
                {formatDateTimeShort(withdrawal?.withdrawnAt ?? null)}
              </span>
            </MetaRow>
            <MetaRow label="탈퇴 경로">앱 셀프 탈퇴</MetaRow>
            <MetaRow label="보존 항목">주문·정산 기록 · 약관 동의</MetaRow>
            <MetaRow label="파기 항목">본인확인 정보 · 배송지</MetaRow>
          </div>
        )}

        {(actions.canSuspend || actions.canRelease) && (
          <div className="mt-4 flex gap-2">
            {actions.canSuspend && (
              <button
                type="button"
                className={`${BTN_DANGER_OUTLINE} w-full`}
                onClick={onSuspend}
              >
                {PROVISIONAL.suspendTitle}
              </button>
            )}
            {actions.canRelease && (
              <button
                type="button"
                className={`${BTN_PRIMARY} w-full`}
                onClick={onRelease}
              >
                활성으로 변경
              </button>
            )}
          </div>
        )}

        {statusCard.status === "NORMAL" && (
          <p className={ST_HINT_CLASS}>
            소비자 탈퇴는 <b className="font-semibold">셀프서비스</b>입니다 —
            운영자 승인·반려 액션이 없습니다.
          </p>
        )}
      </div>
    </DetailCard>
  );
}

// ── 진행 중 ────────────────────────────────────────────────────

const CHIP_BASE =
  "inline-flex cursor-pointer items-center gap-1 rounded-[6px] px-2 py-[3px] text-[11px]";

/** 칩 하나 — 이동 목록이 둘(열린 문의: 1:1 · 상품 문의)이면 고르는 작은 메뉴를 연다 */
function PendingChipButton(props: { chip: ConsumerPendingChip }) {
  const { chip } = props;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const tone =
    chip.tone === "WARNING"
      ? "bg-sz-warning-bg text-sz-warning-text"
      : "bg-sz-n-100 text-sz-n-700";

  const handleClick = () => {
    if (chip.links.length === 1) {
      navigate(pendingLinkHref(chip.links[0]));
      return;
    }
    setOpen((value) => !value);
  };

  return (
    <span className="relative">
      <button
        type="button"
        className={`${CHIP_BASE} ${tone}`}
        onClick={handleClick}
      >
        {chip.label} <b className="tabular-nums">{chip.count}</b> ↗
      </button>
      {open && chip.links.length > 1 && (
        <span className="absolute left-0 top-full z-10 mt-1 flex min-w-[160px] flex-col rounded-[6px] border border-sz-n-200 bg-white py-1 shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]">
          {chip.links.map((link) => (
            <button
              key={link.target}
              type="button"
              className="flex items-center justify-between gap-3 px-3 py-1.5 text-left text-[12px] text-sz-n-700 hover:bg-sz-n-100"
              onClick={() => navigate(pendingLinkHref(link))}
            >
              {PENDING_TARGET_LABELS[link.target]}
              <b className="tabular-nums">{link.count} ↗</b>
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

/**
 * 진행 중 — 「응대 전 확인」. 1건 이상인 것만 칩으로(서버가 0건은 빼고 내린다), 나머지는
 * 「그 외 0건」 한 줄. 칩은 그 소비자로 거른 목록(서버가 준 쿼리 그대로)으로 간다.
 */
export function PendingCard(props: { chips: Array<ConsumerPendingChip> }) {
  const { chips } = props;

  return (
    <DetailCard title="진행 중" note="응대 전 확인">
      <div className="-mx-4 -mb-3 -mt-1 flex flex-wrap items-center gap-1.5 px-4 py-2.5">
        {chips.length === 0 ? (
          <span className="text-[11px] text-sz-n-500">진행 중인 건 없음</span>
        ) : (
          <>
            {chips.map((chip) => (
              <PendingChipButton key={chip.key} chip={chip} />
            ))}
            {chips.length < PENDING_CHIP_KINDS && (
              <span className="text-[11px] text-sz-n-500">그 외 0건</span>
            )}
          </>
        )}
      </div>
    </DetailCard>
  );
}

// ── 판단 메타 ───────────────────────────────────────────────────

/** 시안 `.kpi` */
function Kpi(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0">
      <span className="text-sz-n-600">{props.label}</span>
      {props.children}
    </div>
  );
}

const KPI_V = "font-semibold tabular-nums";
const KPI_SUB = "ml-1 text-[11px] font-normal text-sz-n-500";

/**
 * 판단 메타 — 정지(조치)의 근거라 액션 버튼과 같은 열에 둔다. 반품 · 교환은 건수만으로는 판단이
 * 안 서서 비율을 함께 적는다. 탈퇴 회원은 거래 값이 null(「—」)이고 경과 · 정지 이력만 남는다.
 */
export function JudgementCard(props: { detail: ConsumerDetail }) {
  const { judgement } = props.detail;
  const { sanctions } = judgement;
  const last = sanctions.last;

  return (
    <DetailCard title="판단 메타" note="조치 근거">
      <div className="pt-2">
        <Kpi label="누적 주문">
          <span className={KPI_V}>
            {judgement.orderCount === null
              ? "—"
              : `${judgement.orderCount.toLocaleString()}건`}
          </span>
        </Kpi>
        <Kpi label="누적 구매액">
          <span className={KPI_V}>{formatWon(judgement.purchaseAmount)}</span>
        </Kpi>
        <Kpi label="반품·교환">
          <span className={KPI_V}>
            {judgement.claimOrderCount === null ? (
              "—"
            ) : (
              <>
                {judgement.claimOrderCount.toLocaleString()}건
                {judgement.claimRate !== null && (
                  <span className={KPI_SUB}>{judgement.claimRate}%</span>
                )}
              </>
            )}
          </span>
        </Kpi>
        <Kpi label="가입 후 경과">
          <span className={KPI_V}>{formatElapsed(judgement.sinceJoined)}</span>
        </Kpi>
        <Kpi label="정지 이력">
          {sanctions.count === 0 ? (
            <span className="font-normal text-sz-n-500">없음</span>
          ) : (
            <span className={KPI_V}>
              {sanctions.count}회
              {last && (
                <span className={KPI_SUB}>
                  직전 {formatEventMonth(last.suspendedAt)}
                  {last.reasonLabel ? ` · ${last.reasonLabel}` : ""}
                </span>
              )}
            </span>
          )}
        </Kpi>
      </div>
    </DetailCard>
  );
}

/** 「직전 2026.05」 — 정지 시각(UTC 이벤트)을 월까지만 */
function formatEventMonth(value: string) {
  return formatDateTimeShort(value).slice(0, 7);
}

// ── 처리 이력 ───────────────────────────────────────────────────

/** 이력 한 줄 — 「일시 · 처리자 (사유: …)」(시안 `.hmeta`) */
function toHistoryItem(item: ConsumerHistoryItem): HistoryItem {
  const actor = item.actorName ?? null;
  return {
    label: item.label,
    tone: historyTone(item.tone),
    processedAt: item.occurredAt,
    processorName: item.detail
      ? `${actor ?? ""} (사유: ${item.detail})`.trim()
      : actor,
  };
}

/**
 * 처리 이력 — 최신순. 최대 높이 156px(3건)부터 자체 스크롤이라 정지 상태에서도 레일이 한 화면에 든다.
 * 열람(경고) · 정지(위험)처럼 조치급 사건은 서버 톤 그대로 점 색을 쓴다.
 */
export function HistoryCard(props: { items: Array<ConsumerHistoryItem> }) {
  return (
    <DetailCard title="처리 이력" note="최신순">
      <div className="-my-1.5 max-h-[156px] overflow-y-auto">
        <HistoryList items={props.items.map(toHistoryItem)} />
      </div>
    </DetailCard>
  );
}
