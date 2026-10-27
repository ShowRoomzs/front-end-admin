import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import {
  BUSINESS_TYPE_LABEL,
  MEMBER_STATUS_LABEL,
  TAB_ROLE_LABEL,
  THREAD_KIND_LABEL,
} from "@/features/thread/constants/params";
import {
  FLINK_CLASS,
  IP_TITLE_CLASS,
  TSUB_CLASS,
} from "@/features/thread/components/styles";
import type {
  ChannelInfo,
  ChannelProgress,
  OpenIssueThread,
} from "@/features/thread/types";
import { memberStatusVariant } from "@/features/thread/utils/tone";
import {
  formatDay,
  formatMonthDay,
  formatMonthDayTime,
} from "@/features/thread/utils/format";
import { cn } from "@/lib/utils";
import { Fragment, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface ChannelInfoBarProps {
  info: ChannelInfo;
  /** 「회원 상세 ↗」 — 회원 id가 없으면 null(글자로만 둔다) */
  memberDetailPath: string | null;
  /** 정산 조정 협의 스레드로 이동(이슈 탭) */
  onOpenIssueThread: (threadId: number) => void;
}

/** 정보 바 안 `.mrow` — 12px · 줄 간격 7px */
function Row(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0">
      <span className="shrink-0 text-sz-n-500">{props.label}</span>
      <span className="min-w-0 text-right font-medium text-sz-n-900">
        {props.children}
      </span>
    </div>
  );
}

/** null은 「집계할 수 없음」 — 그 조각을 빼고, 다 빠지면 null */
function joinCounts(parts: Array<[string, number | null]>) {
  const present = parts.filter(
    (part): part is [string, number] => part[1] !== null
  );
  return present.length > 0
    ? present.map(([label, value]) => `${label} ${value}`).join(" · ")
    : null;
}

function contractText(progress: ChannelProgress | null) {
  return progress
    ? joinCounts([
        ["서명 진행중", progress.contractSigning],
        ["체결", progress.contractConcluded],
      ])
    : null;
}

/**
 * 1:1 채널 상단 접이식 정보 바(시안 `.th-info`) — 기본 접힘.
 * 접혀 있어도 요약 한 줄(상태 · 계약 · 공구 · 미정산)이 보이고, 펼치면 ① 정보 · ② 진행 중 · ③ 열린 이슈 스레드 3칸.
 * `progress`의 null 행은 그리지 않는다(0은 「없다」는 사실이라 그대로 0).
 */
export default function ChannelInfoBar(props: ChannelInfoBarProps) {
  const { info, memberDetailPath, onOpenIssueThread } = props;
  const [isOpen, setIsOpen] = useState(false);
  const isBrand = info.tab === "BRAND";
  const roleLabel = isBrand ? TAB_ROLE_LABEL.BRAND : TAB_ROLE_LABEL.INFLUENCER;
  const profile = info.profile;
  const progress = info.progress;
  // 개발 서버(main 미배포)는 sanction이 없다 — 정지여도 사유 줄 없이 배지만 그린다
  const sanction =
    info.memberStatus === "SUSPENDED" ? (info.sanction ?? null) : null;
  // 중단 예정 = 직권 중단 사전 통지 뒤 집행 · 철회 전(main). 0이면 요약에 붙이지 않는다
  const suspensionScheduled = progress?.groupBuySuspensionScheduled ?? null;

  const contract = contractText(progress);
  const groupBuyOngoing = progress?.groupBuyOngoing ?? null;
  const summaryParts: Array<ReactNode> = [
    // 시안 A7 — 정지 사유 · 정지 날짜가 상태 배지 바로 뒤에 붙는다
    sanction &&
      `${sanction.reasonLabel} · ${formatMonthDay(sanction.suspendedAt)}`,
    contract && `계약 ${contract}`,
    groupBuyOngoing === null
      ? null
      : groupBuyOngoing > 0
        ? [
            `공구 진행중 ${groupBuyOngoing}`,
            suspensionScheduled ? `중단 예정 ${suspensionScheduled}` : null,
          ]
            .filter(Boolean)
            .join(" · ")
        : "진행 중 공구 없음",
    progress?.unsettledCount !== null && progress?.unsettledCount !== undefined
      ? `미정산 ${progress.unsettledCount}건`
      : null,
  ].filter(Boolean);

  const groupBuyText = progress
    ? joinCounts([
        ["진행중", progress.groupBuyOngoing],
        ["종료", progress.groupBuyEnded],
        ["중단 예정", suspensionScheduled || null],
      ])
    : null;

  return (
    <div className="shrink-0 border-b border-sz-n-200 bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 px-5 py-[9px] text-left text-[12px] text-sz-n-700 hover:bg-sz-n-50"
      >
        <span className="flex min-w-0 flex-wrap items-center gap-1.5">
          <b className="font-semibold text-sz-n-900">{roleLabel} 정보</b>
          {info.memberStatus && (
            <>
              <span className="text-sz-n-300">|</span>
              <StatusBadge
                variant={memberStatusVariant(info.memberStatus)}
                hideDot
              >
                {MEMBER_STATUS_LABEL[info.memberStatus]}
              </StatusBadge>
            </>
          )}
          {summaryParts.map((part, index) => (
            <Fragment key={index}>
              <span className="text-sz-n-300">|</span>
              <span>{part}</span>
            </Fragment>
          ))}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1 text-[11px] font-medium text-sz-n-500">
          {isOpen ? "접기 ▴" : "펼치기 ▾"}
        </span>
      </button>

      {isOpen && (
        <div className="grid grid-cols-3 border-t border-sz-n-100">
          <section className="border-r border-sz-n-100 px-4 py-3">
            <div className={IP_TITLE_CLASS}>
              {roleLabel} 정보
              {memberDetailPath ? (
                <Link
                  to={memberDetailPath}
                  className={cn(FLINK_CLASS, "text-[11px] font-normal")}
                >
                  회원 상세 ↗
                </Link>
              ) : (
                <span className="text-[11px] font-normal text-sz-n-400">
                  회원 상세
                </span>
              )}
            </div>
            <Row label="회원번호">
              <span className="tabular-nums">{info.memberNo ?? "—"}</span>
            </Row>
            {info.memberStatus && (
              <Row label="상태">
                <StatusBadge
                  variant={memberStatusVariant(info.memberStatus)}
                  hideDot
                >
                  {MEMBER_STATUS_LABEL[info.memberStatus]}
                </StatusBadge>
                {sanction && (
                  <span className={cn(TSUB_CLASS, "tabular-nums")}>
                    {" "}
                    · {formatMonthDayTime(sanction.suspendedAt)}
                  </span>
                )}
              </Row>
            )}
            {isBrand ? (
              <Row label="담당자">
                {[profile?.managerName, profile?.managerContact]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </Row>
            ) : (
              <>
                <Row label="사업자 여부">
                  {profile?.businessType
                    ? BUSINESS_TYPE_LABEL[profile.businessType]
                    : "—"}
                  {profile?.taxType && (
                    <span className={TSUB_CLASS}> · {profile.taxType}</span>
                  )}
                </Row>
                <Row label="업무용 이메일">
                  <span className="tabular-nums">
                    {profile?.businessEmail ?? "—"}
                  </span>
                </Row>
              </>
            )}
            <Row label="가입일">
              <span className="tabular-nums">
                {profile?.joinedAt ? formatDay(profile.joinedAt) : "—"}
              </span>
            </Row>
          </section>

          <section className="border-r border-sz-n-100 px-4 py-3">
            <div className={IP_TITLE_CLASS}>진행 중</div>
            {contract && <Row label="계약">{contract}</Row>}
            {groupBuyText && <Row label="공구">{groupBuyText}</Row>}
            {progress?.unsettledCount !== null &&
              progress?.unsettledCount !== undefined && (
                <Row label="미정산">
                  <span className="tabular-nums">
                    {progress.unsettledCount}건
                  </span>
                </Row>
              )}
            {progress?.connectedBrandCount !== null &&
              progress?.connectedBrandCount !== undefined && (
                <Row label="연결 브랜드">
                  <span className="tabular-nums">
                    {progress.connectedBrandCount}
                  </span>
                  곳
                </Row>
              )}
            {!isBrand && profile?.instagramUrl && (
              <Row label="인스타">
                <a
                  href={profile.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={FLINK_CLASS}
                >
                  인스타 ↗
                </a>
              </Row>
            )}
          </section>

          <section className="px-4 py-3">
            <div className={IP_TITLE_CLASS}>열린 이슈 스레드</div>
            <OpenIssueList
              threads={info.openIssueThreads ?? []}
              onOpen={onOpenIssueThread}
            />
          </section>
        </div>
      )}
    </div>
  );
}

/**
 * ③ 열린 이슈 스레드 — 정산 조정 협의만 이슈 탭으로 이동한다.
 * 공구 이슈 · 이행 이견 스레드는 폐기 이력이라 메시지 API가 403이다 — 글자로만 남긴다.
 */
function OpenIssueList(props: {
  threads: Array<OpenIssueThread>;
  onOpen: (threadId: number) => void;
}) {
  const { threads, onOpen } = props;

  if (threads.length === 0) {
    return <span className={TSUB_CLASS}>없음</span>;
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {threads.map((thread) => {
        const isOpenable = thread.kind === "SETTLEMENT_ADJUSTMENT";
        const title = thread.groupBuyTitle ?? THREAD_KIND_LABEL[thread.kind];
        return (
          <li key={thread.threadId} className="text-[12px]">
            {isOpenable ? (
              <button
                type="button"
                onClick={() => onOpen(thread.threadId)}
                className={cn(FLINK_CLASS, "text-left")}
              >
                {title} ↗
              </button>
            ) : (
              <span className="text-sz-n-700">{title}</span>
            )}
            <span className={cn(TSUB_CLASS, "ml-1.5")}>
              {THREAD_KIND_LABEL[thread.kind]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
