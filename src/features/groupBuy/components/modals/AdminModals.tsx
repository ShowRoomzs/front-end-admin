import Btn from "@/features/contract/components/shared/Btn";
import { INPUT_CLASS } from "@/features/contract/components/shared/styles";
import {
  B,
  DateChip,
  GbModal,
  MHint,
  MLabel,
  MSelect,
  MTextarea,
  MWarn,
} from "@/features/groupBuy/components/shared/GbParts";
import {
  CLAUSE_OPTIONS,
  EMERGENCY_OPTIONS,
  HIDE_REASON_OPTIONS,
  ISSUE_TYPE_OPTIONS,
  REJECT_REASON_OPTIONS,
  WITHDRAW_OPTIONS,
} from "@/features/groupBuy/constants/params";
import {
  useGetNoticeOptions,
  useGetPostRevisions,
} from "@/features/groupBuy/hooks/useAdminGroupBuy";
import type {
  EmergencySuspensionBody,
  EmergencySuspensionReason,
  GroupBuyIssueType,
  IssueOpenBody,
  OpenRejectBody,
  PostHideBody,
  PostHideReason,
  PostRejectReason,
  PostRevision,
  SuspensionNoticeBody,
  SuspensionReasonClause,
  SuspensionWithdrawBody,
  SuspensionWithdrawReason,
} from "@/features/groupBuy/types";
import {
  type Detail,
  actorText,
  d,
  dt,
  md,
  num,
  won,
} from "@/features/groupBuy/utils/view";
import { type DiffPart, diffSentences } from "@/features/groupBuy/utils/diff";
import { parseServerDateTime } from "@/common/utils/formatDate";
import { cn } from "@/lib/utils";
import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import { useMemo, useState, type ReactNode } from "react";

dayjs.extend(utc);

/*
  시안 M1~M7 — 모달 규칙: 제목은 질문형, 좌측은 [닫기], 우측 확인 라벨은 진입 버튼과 같다.
  색은 결과의 성격이 정한다 — 판매를 실제로 끊는 처리(중단 승인 · 긴급 · 집행 · 반려)만 꽉 찬 위험색,
  예고·철회·요청 반려처럼 공구가 계속 가는 처리는 인디고. 필수 입력 전에는 비활성만.
*/

/** 로컬 시각 → 서버 LocalDateTime(UTC 벽시계) */
function toServer(value: Dayjs): string {
  return value.utc().format("YYYY-MM-DDTHH:mm:ss");
}

interface ModalBase {
  detail: Detail;
  isPending: boolean;
  onClose: () => void;
}

function Footer(props: { onClose: () => void; confirm: ReactNode }) {
  return (
    <>
      <Btn variant="secondary" onClick={props.onClose}>
        닫기
      </Btn>
      {props.confirm}
    </>
  );
}

// ── 오픈 승인(확인) ──────────────────────────────────

export function ApproveOpenModal(props: ModalBase & { onConfirm: () => void }) {
  const { detail, isPending, onClose, onConfirm } = props;
  return (
    <GbModal
      title="오픈 승인할까요?"
      onClose={onClose}
      footer={
        <Footer
          onClose={onClose}
          confirm={
            <Btn variant="primary" isLoading={isPending} onClick={onConfirm}>
              오픈 승인
            </Btn>
          }
        />
      }
    >
      <B>{detail.groupBuy.title}</B>의 게시물을 승인합니다 — 게이트 3개가 모두
      채워지면 공구가 <B>준비완료</B>가 되고{" "}
      {detail.timeline.startOverdue ? (
        // 시작 시각이 지났으면 준비완료 즉시 열린다(종료일은 그대로)
        <>
          시작 시각이 지나 <B>바로 열립니다</B> — 종료일은 그대로라 판매 기간이
          그만큼 줄어듭니다.
        </>
      ) : (
        <>
          시작일 <B className="tabular-nums">{dt(detail.timeline.startAt)}</B>에
          자동으로 열립니다.
        </>
      )}
      <MWarn info>
        승인 후에는 <B>인플루언서가 재승인 없이 본문을 수정</B>합니다. 문제가
        생기면 <B>게시물 숨김</B>으로 노출을 끊습니다. 고정 지급비는 브랜드 직접
        지급이라 승인과 무관합니다.
      </MWarn>
    </GbModal>
  );
}

// ── M1 오픈 승인 반려 ────────────────────────────────

export function RejectOpenModal(
  props: ModalBase & { onConfirm: (body: OpenRejectBody) => void }
) {
  const { detail, isPending, onClose, onConfirm } = props;
  const [reasonCode, setReasonCode] = useState<PostRejectReason | "">("");
  const [detailText, setDetailText] = useState("");
  const isValid = reasonCode !== "" && detailText.trim() !== "";
  return (
    <GbModal
      title="오픈 승인을 반려할까요?"
      onClose={onClose}
      footer={
        <Footer
          onClose={onClose}
          confirm={
            <Btn
              variant="dangerSolid"
              disabled={!isValid}
              isLoading={isPending}
              onClick={() =>
                reasonCode &&
                onConfirm({ reasonCode, detail: detailText.trim() })
              }
            >
              반려
            </Btn>
          }
        />
      }
    >
      <B>{detail.groupBuy.title}</B>의 게시물을 반려합니다.
      <MLabel required>반려 사유</MLabel>
      <MSelect
        value={reasonCode}
        onChange={(event) =>
          setReasonCode(event.target.value as PostRejectReason | "")
        }
      >
        <option value="">선택하세요</option>
        {REJECT_REASON_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </MSelect>
      <MLabel required>인플루언서에게 전달할 설명</MLabel>
      <MTextarea
        maxLength={1000}
        value={detailText}
        onChange={(event) => setDetailText(event.target.value)}
      />
      <MHint>
        고칠 문장을 지목해야 재등록이 한 번에 끝납니다 — 사유 코드만으로는
        무엇을 고칠지 알 수 없습니다.
      </MHint>
      <MWarn>
        반려하면 공구는 <B>준비중에서 멈추고</B> 게시물 상태가 <B>반려</B>가
        됩니다 — 인플루언서가 재등록해야 열립니다.{" "}
        {detail.timeline.startOverdue ? (
          <>
            시작 시각이 지나 재승인이 나는 즉시 열리지만, 종료일은 그대로라 판매
            기간이 그만큼 줄어듭니다.
          </>
        ) : (
          <>
            시작일 <B className="tabular-nums">{d(detail.timeline.startAt)}</B>
            까지 재등록·재심사가 끝나지 않으면 공구가 열리지 않습니다.
          </>
        )}
      </MWarn>
    </GbModal>
  );
}

// ── M5 게시물 숨김 · 숨김 해제 ───────────────────────

export function HidePostModal(
  props: ModalBase & { onConfirm: (body: PostHideBody) => void }
) {
  const { detail, isPending, onClose, onConfirm } = props;
  const [reasonCode, setReasonCode] = useState<PostHideReason | "">("");
  const [detailText, setDetailText] = useState("");
  const isValid = reasonCode !== "" && detailText.trim() !== "";
  return (
    <GbModal
      title="공구 게시물을 숨길까요?"
      width={560}
      onClose={onClose}
      footer={
        <Footer
          onClose={onClose}
          confirm={
            <Btn
              variant="delete"
              disabled={!isValid}
              isLoading={isPending}
              onClick={() =>
                reasonCode &&
                onConfirm({
                  reasonCode,
                  detail: detailText.trim(),
                  observedRevisionNo: detail.post.latestRevisionNo,
                })
              }
            >
              게시물 숨김
            </Btn>
          }
        />
      }
    >
      <B>{detail.groupBuy.title}</B>의 게시물을 <B>소비자 화면에서 내립니다</B>{" "}
      — 공구는 <B>진행중 그대로</B>이고 주문·배송은 계속됩니다.
      <MLabel required>숨김 사유</MLabel>
      <MSelect
        value={reasonCode}
        onChange={(event) =>
          setReasonCode(event.target.value as PostHideReason | "")
        }
      >
        <option value="">선택하세요</option>
        {HIDE_REASON_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </MSelect>
      <MLabel required>인플루언서에게 전달할 설명</MLabel>
      <MTextarea
        className="min-h-[64px]"
        maxLength={1000}
        value={detailText}
        onChange={(event) => setDetailText(event.target.value)}
      />
      <MHint>
        무엇을 고쳐야 다시 노출되는지 적습니다 — 이 글이 없으면 인플루언서가
        무엇을 고칠지 모른 채 게시물이 내려간 상태로 남습니다.
      </MHint>
      <MWarn>
        숨기면 소비자 화면에서 <B>즉시 내려가고</B> 게시물 상태가 <B>숨김</B>이
        됩니다. <B>공구는 진행중 그대로</B>라 소비자가 이미 담은 주문과 배송은
        영향받지 않지만, <B>새 소비자가 이 공구를 볼 경로가 사라집니다</B> —
        판매가 사실상 멈추므로 오래 두지 마세요. 인플루언서가 본문을 고치면{" "}
        <B>운영자가 숨김을 해제</B>해야 다시 노출됩니다.
      </MWarn>
    </GbModal>
  );
}

export function UnhidePostModal(props: ModalBase & { onConfirm: () => void }) {
  const { detail, isPending, onClose, onConfirm } = props;
  const hidden = detail.post.hidden;
  return (
    <GbModal
      title="게시물 숨김을 해제할까요?"
      onClose={onClose}
      footer={
        <Footer
          onClose={onClose}
          confirm={
            <Btn variant="primary" isLoading={isPending} onClick={onConfirm}>
              숨김 해제
            </Btn>
          }
        />
      }
    >
      <B>{detail.groupBuy.title}</B>의 게시물을 <B>다시 노출</B>합니다.
      {hidden && (
        <div className="mt-2.5 rounded-[6px] bg-sz-n-50 px-3 py-2.5 text-[11px] leading-[1.8] text-sz-n-700">
          숨김 사유 · <B>{hidden.label ?? hidden.code}</B>
          <br />
          {md(hidden.hiddenAt)} 숨김 · {hidden.hiddenDays}일 경과 · 숨김 당시{" "}
          {hidden.revisionNo ?? "—"}판 → 현재{" "}
          {detail.post.latestRevisionNo ?? "—"}판
        </div>
      )}
      <MWarn info>
        <B>지적한 문장이 고쳐졌는지 현재 본문을 읽고</B> 누르세요 — 자동 복귀가
        아니라 운영자 확인 후 해제입니다. 확인한 뒤 인플루언서가 다시 고쳤다면
        해제되지 않고 최신 본문을 다시 확인하라는 안내가 뜹니다.
      </MWarn>
    </GbModal>
  );
}

// ── M6 직권 중단 사전 통지 ───────────────────────────

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 다음 영업일 — 시안 「08.13(목) → 08.14(금)」. 주말만 건너뛴다(공휴일 달력은 서버만 안다) */
function nextBusinessDay(value: Dayjs): Dayjs {
  let next = value.add(1, "day");
  while (next.day() === 0 || next.day() === 6) {
    next = next.add(1, "day");
  }
  return next;
}

function chipLabel(value: Dayjs, withTime?: boolean) {
  const base = `${value.format("MM.DD")} (${WEEKDAYS[value.day()]})`;
  return withTime ? `${base} ${value.format("HH:mm")}` : base;
}

export function NoticeModal(
  props: ModalBase & { onConfirm: (body: SuspensionNoticeBody) => void }
) {
  const { detail, isPending, onClose, onConfirm } = props;
  const { data: options, isLoading } = useGetNoticeOptions(
    detail.groupBuy.groupBuyId,
    true
  );
  const [clause, setClause] = useState<SuspensionReasonClause | "">("");
  const [executeDate, setExecuteDate] = useState<string | null>(null);
  const [executeTime, setExecuteTime] = useState("10:00");
  const [customExecute, setCustomExecute] = useState(false);
  const [deadlineChoice, setDeadlineChoice] = useState<
    "default" | "plus1" | "custom"
  >("default");
  const [customDeadline, setCustomDeadline] = useState("");
  const [body, setBody] = useState("");

  const executeAt = useMemo(() => {
    if (!executeDate) {
      return null;
    }
    const [hour, minute] = executeTime.split(":").map(Number);
    return dayjs(executeDate).hour(hour).minute(minute).second(0);
  }, [executeDate, executeTime]);

  const defaultDeadline = options
    ? parseServerDateTime(options.appealDeadline.default)
    : null;
  const deadlineAt = useMemo(() => {
    if (!defaultDeadline) {
      return null;
    }
    if (deadlineChoice === "default") {
      return defaultDeadline;
    }
    if (deadlineChoice === "plus1") {
      return nextBusinessDay(defaultDeadline);
    }
    return customDeadline ? dayjs(customDeadline) : null;
  }, [defaultDeadline, deadlineChoice, customDeadline]);

  const latest = options
    ? parseServerDateTime(options.latestExecutionBefore)
    : null;
  const orderValid =
    !!executeAt &&
    !!deadlineAt &&
    executeAt.isAfter(deadlineAt) &&
    (!latest || executeAt.isBefore(latest));
  const isValid =
    options?.available === true &&
    clause !== "" &&
    orderValid &&
    body.trim() !== "";

  const selectable = options?.executionDates ?? [];

  /** 칩 날짜의 집행 시각 — 칩은 기본 시각(10:00)으로 집행한다 */
  const chipAt = (date: string) => {
    const [hour, minute] = executeTime.split(":").map(Number);
    return dayjs(date).hour(hour).minute(minute).second(0);
  };
  // 소명 기한보다 앞서는 날짜도 잠근다 — 에러 문구 대신 고를 수 없게(시안 M6 규칙)
  const isLocked = (item: { date: string; selectable: boolean }) =>
    !item.selectable ||
    (!!deadlineAt && !chipAt(item.date).isAfter(deadlineAt));

  // 시안 M6 — 고를 수 있는 첫 날짜를 기본으로 켠다(소명 기한 기본값과 같은 처리).
  // 소명 기한을 늦춰 고른 날짜가 잠기면 다음으로 열린 날짜로 옮긴다
  const firstOpen = selectable.find((item) => !isLocked(item))?.date ?? null;
  const selectedLocked = selectable.some(
    (item) => item.date === executeDate && isLocked(item)
  );
  if (
    !customExecute &&
    (executeDate === null || selectedLocked) &&
    executeDate !== firstOpen
  ) {
    setExecuteDate(firstOpen);
  }

  return (
    <GbModal
      title="직권 중단 사전 통지를 발송할까요?"
      onClose={onClose}
      footer={
        <Footer
          onClose={onClose}
          confirm={
            <Btn
              variant="primary"
              disabled={!isValid}
              isLoading={isPending}
              onClick={() =>
                clause &&
                executeAt &&
                deadlineAt &&
                onConfirm({
                  clause,
                  executeScheduledAt: toServer(executeAt),
                  appealDeadlineAt: toServer(deadlineAt),
                  noticeBody: body.trim(),
                })
              }
            >
              사전 통지 발송
            </Btn>
          }
        />
      }
    >
      <B>{detail.groupBuy.title}</B>의 직권 중단을{" "}
      <B>브랜드({detail.brand.name})에 예고</B>합니다 — 이 단계에서 판매는
      멈추지 않습니다.
      {options && !options.available && (
        <MWarn>
          지금은 통지할 수 없습니다 —{" "}
          {options.unavailableReason === "NO_WINDOW_BEFORE_END"
            ? "공구 종료 전까지 3영업일 뒤 집행할 수 있는 날이 없습니다."
            : options.unavailableReason === "REQUEST_PENDING"
              ? "검토 중인 중단·조기 마감 요청이 있습니다."
              : "진행중 공구에만 통지할 수 있습니다."}
        </MWarn>
      )}
      <MLabel required>중단 사유</MLabel>
      <MSelect
        value={clause}
        onChange={(event) =>
          setClause(event.target.value as SuspensionReasonClause | "")
        }
      >
        <option value="">선택하세요</option>
        {CLAUSE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </MSelect>
      <MHint>
        파트너 이용약관 <B>제17조①</B>의 4호 체계입니다 — 사유별 통계가{" "}
        <B>제25조 제재 단계</B> 판정에 그대로 쓰입니다.
      </MHint>
      <MLabel required>집행 예정 일시</MLabel>
      {isLoading ? (
        <div className="text-[11px] text-sz-n-500">날짜를 불러오는 중…</div>
      ) : (
        <div className="mt-[7px] flex flex-wrap gap-1.5">
          {selectable.map((item) => {
            const date = dayjs(item.date);
            return (
              <DateChip
                key={item.date}
                locked={isLocked(item)}
                on={!customExecute && executeDate === item.date}
                onClick={() => {
                  setCustomExecute(false);
                  setExecuteDate(item.date);
                }}
              >
                {chipLabel(date)}
              </DateChip>
            );
          })}
          <DateChip
            on={customExecute}
            onClick={() => {
              setCustomExecute(true);
              setExecuteDate(null);
            }}
          >
            직접 입력
          </DateChip>
        </div>
      )}
      {/* 칩은 기본 시각(10:00)으로 집행한다 — 날짜·시각을 직접 고를 때만 입력칸을 연다 */}
      {customExecute && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="date"
            aria-label="집행 날짜"
            className={cn(INPUT_CLASS, "h-8 w-[150px] px-2.5 py-1")}
            value={executeDate ?? ""}
            min={selectable.find((item) => !isLocked(item))?.date}
            onChange={(event) => setExecuteDate(event.target.value || null)}
          />
          <input
            type="time"
            aria-label="집행 시각"
            className={cn(INPUT_CLASS, "h-8 w-[130px] px-2.5 py-1")}
            value={executeTime}
            onChange={(event) => setExecuteTime(event.target.value || "10:00")}
          />
        </div>
      )}
      <MHint>
        오늘(
        <span className="tabular-nums">
          {options ? dayjs(options.today).format("MM.DD") : "—"}
        </span>
        )부터 <B>3영업일</B>이 지나지 않은 날짜는 고를 수 없습니다(제17조②) —
        주말은 영업일에서 빠집니다.
        {customExecute &&
          latest &&
          ` 소명 기한 뒤, 공구 종료(${md(options?.latestExecutionBefore)}) 전이어야 합니다.`}
      </MHint>
      <MLabel required>소명 제출 기한</MLabel>
      {defaultDeadline && (
        <div className="mt-[7px] flex flex-wrap gap-1.5">
          <DateChip
            on={deadlineChoice === "default"}
            onClick={() => setDeadlineChoice("default")}
          >
            {chipLabel(defaultDeadline, true)}
          </DateChip>
          <DateChip
            on={deadlineChoice === "plus1"}
            onClick={() => setDeadlineChoice("plus1")}
          >
            {chipLabel(nextBusinessDay(defaultDeadline), true)}
          </DateChip>
          <DateChip
            on={deadlineChoice === "custom"}
            onClick={() => setDeadlineChoice("custom")}
          >
            직접 입력
          </DateChip>
        </div>
      )}
      {deadlineChoice === "custom" && options && (
        <input
          type="datetime-local"
          className={cn(INPUT_CLASS, "mt-2 h-8 w-[220px] px-2.5 py-1")}
          min={parseServerDateTime(options.appealDeadline.min).format(
            "YYYY-MM-DDTHH:mm"
          )}
          value={customDeadline}
          onChange={(event) => setCustomDeadline(event.target.value)}
        />
      )}
      <MHint>
        기본값은 <B>통지 수신일 +3영업일</B>입니다(제17조④). 기한 내 미제출 시
        기존 자료를 기준으로 최종 판정합니다.
      </MHint>
      <MLabel required>통지 본문</MLabel>
      <MTextarea
        className="min-h-[76px]"
        maxLength={2000}
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
      <MHint>
        브랜드에게 <B>그대로 노출</B>됩니다 — 무엇을 고쳐야 철회되는지 지목하지
        않으면 소명이 겉돕니다.
      </MHint>
      <MWarn info>
        이 모달은 <B>통지만 발송하며 공구는 멈추지 않습니다</B> — 집행 예정
        일시까지 판매는 계속되고 그사이 들어온 주문의 배송·반품·응대 의무는{" "}
        <B>브랜드가 부담</B>합니다(제16조②). 공구 상태는 <B>중단 예정</B>으로
        바뀌고, 집행·철회는 <B>소명 기한 이후</B> 상세에서 누릅니다.
      </MWarn>
    </GbModal>
  );
}

// ── 중단 집행 ─────────────────────────────────────────

export function ExecuteModal(
  props: ModalBase & { onConfirm: (executionNote: string) => void }
) {
  const { detail, isPending, onClose, onConfirm } = props;
  const [note, setNote] = useState("");
  const suspension = detail.adminSuspension;
  return (
    <GbModal
      title="직권 중단을 집행할까요?"
      onClose={onClose}
      footer={
        <Footer
          onClose={onClose}
          confirm={
            <Btn
              variant="dangerSolid"
              disabled={note.trim() === ""}
              isLoading={isPending}
              onClick={() => onConfirm(note.trim())}
            >
              중단 집행
            </Btn>
          }
        />
      }
    >
      <B>{detail.groupBuy.title}</B>를 <B>중단</B>합니다 —{" "}
      {dt(suspension?.noticedAt)} 사전 통지(
      {suspension?.clauseLabel ?? "직권 중단"})의 집행입니다.
      <div className="mt-2.5 rounded-[6px] bg-sz-n-50 px-3 py-2.5 text-[11px] leading-[1.8] text-sz-n-700">
        소명 ·{" "}
        {suspension?.appeal ? (
          <>
            <B>{dt(suspension.appeal.submittedAt)} 제출</B> — “
            {suspension.appeal.content}”
          </>
        ) : (
          <B>미제출</B>
        )}
      </div>
      <MLabel required>브랜드에 전달할 집행 사유</MLabel>
      <MTextarea
        maxLength={1000}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <MWarn>
        집행하면 <B>신규 주문이 즉시 차단</B>되고 게시물은 <B>종료</B>로
        내려갑니다. <B>접수분의 배송·환불 의무는 남고</B> 이미 지급된 고정
        지급비는 <B>플랫폼이 회수해 주지 않습니다</B>. 공구 상태가 <B>중단</B>
        으로 확정되며 <B>재개할 수 없습니다</B>(제17조⑤).
      </MWarn>
    </GbModal>
  );
}

// ── M7 직권 중단 철회 ────────────────────────────────

export function WithdrawModal(
  props: ModalBase & { onConfirm: (body: SuspensionWithdrawBody) => void }
) {
  const { detail, isPending, onClose, onConfirm } = props;
  const [reasonCode, setReasonCode] = useState<SuspensionWithdrawReason | "">(
    ""
  );
  const [detailText, setDetailText] = useState("");
  const suspension = detail.adminSuspension;
  const isValid = reasonCode !== "" && detailText.trim() !== "";
  return (
    <GbModal
      title="직권 중단을 철회할까요?"
      onClose={onClose}
      footer={
        <Footer
          onClose={onClose}
          confirm={
            <Btn
              variant="primary"
              disabled={!isValid}
              isLoading={isPending}
              onClick={() =>
                reasonCode &&
                onConfirm({ reasonCode, detail: detailText.trim() })
              }
            >
              직권 중단 철회
            </Btn>
          }
        />
      }
    >
      <B>{detail.groupBuy.title}</B>의 직권 중단 예정을 <B>철회</B>합니다.
      {suspension && (
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="rounded-[6px] bg-sz-n-50 px-[13px] py-[11px]">
            <div className="mb-[5px] text-[11px] font-semibold text-sz-n-500">
              원 통지 · {md(suspension.noticedAt)}
            </div>
            <div className="text-[12px] leading-[1.75] text-sz-n-700">
              <B>{suspension.clauseLabel ?? "직권 중단"}</B>
              <br />
              {suspension.noticeBody}
            </div>
          </div>
          <div className="rounded-[6px] bg-sz-accent-50 px-[13px] py-[11px]">
            <div className="mb-[5px] text-[11px] font-semibold text-sz-accent-600">
              브랜드 소명 ·{" "}
              {suspension.appeal ? md(suspension.appeal.submittedAt) : "미제출"}
            </div>
            <div className="text-[12px] leading-[1.75] text-sz-n-700">
              {suspension.appeal ? (
                <>
                  {suspension.appeal.content}
                  {suspension.appeal.attachments.length > 0 && (
                    <>
                      {" "}
                      · <B>첨부 {suspension.appeal.attachments.length}건</B>
                    </>
                  )}
                </>
              ) : (
                "브랜드가 소명을 제출하지 않았습니다."
              )}
            </div>
          </div>
        </div>
      )}
      <MLabel required>철회 사유</MLabel>
      <MSelect
        value={reasonCode}
        onChange={(event) =>
          setReasonCode(event.target.value as SuspensionWithdrawReason | "")
        }
      >
        <option value="">선택하세요</option>
        {WITHDRAW_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </MSelect>
      <MLabel required>브랜드에 전달할 설명</MLabel>
      <MTextarea
        className="min-h-[64px]"
        maxLength={1000}
        value={detailText}
        onChange={(event) => setDetailText(event.target.value)}
      />
      <MWarn info>
        철회하면 공구는 <B>원래 일정대로 계속 진행</B>됩니다 — 상태가{" "}
        <B>진행중</B>으로 돌아가고 집행 예정·소명 기한은 사라집니다. 사유는
        브랜드에 전달되고 처리 이력에 <B>직권 중단 철회</B>로 남습니다. 같은
        사유로 다시 통지하려면 <B>절차를 처음부터</B> 밟아야 합니다.
      </MWarn>
    </GbModal>
  );
}

// ── M4 긴급 직권 중단 ────────────────────────────────

export function EmergencyModal(
  props: ModalBase & { onConfirm: (body: EmergencySuspensionBody) => void }
) {
  const { detail, isPending, onClose, onConfirm } = props;
  const [reason, setReason] = useState<EmergencySuspensionReason | "">("");
  const [body, setBody] = useState("");
  const isValid = reason !== "" && body.trim() !== "";
  return (
    <GbModal
      title="긴급 직권 중단 — 즉시 집행할까요?"
      onClose={onClose}
      footer={
        <Footer
          onClose={onClose}
          confirm={
            <Btn
              variant="dangerSolid"
              disabled={!isValid}
              isLoading={isPending}
              onClick={() =>
                reason &&
                onConfirm({ emergencyReason: reason, body: body.trim() })
              }
            >
              긴급 중단
            </Btn>
          }
        />
      }
    >
      <B>{detail.groupBuy.title}</B>를 <B>사전 통지 없이 즉시</B> 중단합니다 —{" "}
      <B>파트너 이용약관 제17조③</B>의 긴급 예외 경로입니다.
      <MLabel required>긴급 사유</MLabel>
      <MSelect
        value={reason}
        onChange={(event) =>
          setReason(event.target.value as EmergencySuspensionReason | "")
        }
      >
        <option value="">선택하세요</option>
        {EMERGENCY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </MSelect>
      <MLabel required>양측에 전달할 설명</MLabel>
      <MTextarea
        maxLength={2000}
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
      <MWarn>
        <B>사전 통지 절차를 건너뛰는 예외</B>입니다 — 일반 직권 중단은{" "}
        <B>집행 3영업일 전 사전 통지</B>(제17조②)를 거쳐야 하고, 이 모달은{" "}
        <B>제17조③의 긴급 사정</B>에만 씁니다. 집행 후{" "}
        <B>지체 없이 사후 통지</B>
        되며 브랜드는 소명을 제출할 수 있습니다. 신규 주문 차단 · 게시물 종료 ·{" "}
        <B>접수분 배송 의무 유지</B> · <B>재개 불가</B>(제17조⑤)는 요청 승인과
        같습니다. 이미 지급된 고정 지급비는 <B>플랫폼이 회수해 주지 않습니다</B>{" "}
        — 돈이 플랫폼을 지나가지 않으므로 되돌릴 대상이 없습니다. 처리 이력에{" "}
        <B>긴급 직권 중단(사후 통지)</B>으로 기록됩니다.
      </MWarn>
    </GbModal>
  );
}

// ── M2 · M3 요청 승인 · 반려 ─────────────────────────

export function DecideRequestModal(
  props: ModalBase & {
    decision: "approve" | "reject";
    onConfirm: (decisionReason: string) => void;
  }
) {
  const { detail, isPending, onClose, onConfirm, decision } = props;
  const [reason, setReason] = useState("");
  const request = detail.activeRequest;
  if (!request) {
    return null;
  }
  const isEarly = request.type === "EARLY_CLOSE";
  const approve = decision === "approve";
  const accepted = request.decisionBasis?.ordersNow;
  const fee = detail.fixedFee.amount;

  const title = approve
    ? isEarly
      ? "조기 마감을 승인할까요?"
      : "공구를 중단할까요?"
    : isEarly
      ? "조기 마감 요청을 반려할까요?"
      : "중단 요청을 반려할까요?";

  return (
    <GbModal
      title={title}
      onClose={onClose}
      footer={
        <Footer
          onClose={onClose}
          confirm={
            <Btn
              variant={approve && !isEarly ? "dangerSolid" : "primary"}
              disabled={reason.trim() === ""}
              isLoading={isPending}
              onClick={() => onConfirm(reason.trim())}
            >
              {approve
                ? isEarly
                  ? "조기 마감 승인"
                  : "중단 승인"
                : "요청 반려"}
            </Btn>
          }
        />
      }
    >
      {approve ? (
        <>
          <B>{detail.groupBuy.title}</B>를{" "}
          {isEarly ? "조기 마감합니다" : "중단합니다"} —{" "}
          {actorText(request.requesterType, request.requesterName)}의 요청을
          승인하는 처리입니다.
          <div className="mt-2.5 rounded-[6px] bg-sz-n-50 px-3 py-2.5 text-[11px] leading-[1.8] text-sz-n-700">
            요청 사유 · <B>{request.reasonLabel ?? request.reasonCode}</B>
            <br />
            {actorText(request.requesterType, request.requesterName)} ·{" "}
            <span className="tabular-nums">{dt(request.requestedAt)}</span> 접수
            · 검토 {request.elapsed}
          </div>
        </>
      ) : (
        <>
          <B>{detail.groupBuy.title}</B>의 {isEarly ? "조기 마감" : "중단"}{" "}
          요청을 기각합니다 — 공구는 <B>원래 일정대로 계속</B>됩니다.
        </>
      )}
      <MLabel required>
        {approve ? "양측에 전달할 결정 사유" : "요청자에게 전달할 사유"}
      </MLabel>
      {/* 시안 M3 — 재요청 조건은 안내 줄 대신 입력칸 안에서 유도한다 */}
      <MTextarea
        maxLength={1000}
        value={reason}
        placeholder={
          approve
            ? undefined
            : "재요청 조건을 함께 적어 주세요 — 예: 동일 사례 5건 이상 접수 시"
        }
        onChange={(event) => setReason(event.target.value)}
      />
      {approve && !isEarly && (
        <MWarn>
          중단하면 <B>신규 주문이 즉시 차단</B>되고 게시물은 <B>종료</B>로
          내려갑니다.{" "}
          <B>
            접수분
            {accepted !== null && accepted !== undefined
              ? ` ${num(accepted)}건`
              : ""}
            의 배송·환불 의무는 남습니다
          </B>
          . {/* 지급비가 없으면(0원) 회수 문장 자체가 의미 없다 */}
          {fee !== null && fee > 0 && (
            <>
              이미 지급된 고정 지급비 {won(fee)}은{" "}
              <B>플랫폼이 회수해 주지 않습니다</B> — 돈이 플랫폼을 지나가지
              않으므로 되돌릴 대상이 없습니다.{" "}
            </>
          )}
          공구 상태가 <B>중단</B>(위험)으로 확정되며 <B>되돌릴 수 없습니다</B>.
        </MWarn>
      )}
      {approve && isEarly && (
        <MWarn info>
          승인하면 <B>누르는 시각이 종료 시각</B>이 되고 상태는 <B>종료</B>
          입니다. 접수분은 <B>그대로 배송·정산</B>되며 환불은 발생하지 않습니다.
        </MWarn>
      )}
      {!approve && (
        <MWarn info>
          반려하면 공구 상태는 <B>{detail.groupBuy.statusLabel}</B> 그대로입니다
          — 요청만 기각된 결과 통보이며 요청자가 할 조치는 없습니다. 종료일{" "}
          <B className="tabular-nums">{d(detail.timeline.endAt)}</B>까지 판매가
          계속되고, <B>같은 사유로 재요청은 가능</B>합니다.
        </MWarn>
      )}
    </GbModal>
  );
}

// ── 이슈 스레드 열기 · 정산 확인 ─────────────────────

export function IssueModal(
  props: ModalBase & { onConfirm: (body: IssueOpenBody) => void }
) {
  const { detail, isPending, onClose, onConfirm } = props;
  const [issueType, setIssueType] = useState<GroupBuyIssueType | "">("");
  const [content, setContent] = useState("");
  const isValid = issueType !== "" && content.trim() !== "";
  return (
    <GbModal
      title="이슈 스레드를 열까요?"
      onClose={onClose}
      footer={
        <Footer
          onClose={onClose}
          confirm={
            <Btn
              variant="primary"
              disabled={!isValid}
              isLoading={isPending}
              onClick={() =>
                issueType && onConfirm({ issueType, content: content.trim() })
              }
            >
              이슈 스레드 열기
            </Btn>
          }
        />
      }
    >
      <B>{detail.groupBuy.title}</B>에 브랜드 · 인플루언서 · 운영자 3자 스레드를
      엽니다.
      <MLabel required>이슈 유형</MLabel>
      <MSelect
        value={issueType}
        onChange={(event) =>
          setIssueType(event.target.value as GroupBuyIssueType | "")
        }
      >
        <option value="">선택하세요</option>
        {ISSUE_TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </MSelect>
      <MLabel required>내용</MLabel>
      <MTextarea
        maxLength={2000}
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <MWarn info>
        적은 내용이 <B>스레드 첫 글</B>로 등록됩니다. 이슈는{" "}
        <B>상태가 아닙니다</B> — 스레드가 열려 있어도 공구 상태는 그대로입니다.
      </MWarn>
    </GbModal>
  );
}

export function ConfirmSettlementModal(
  props: ModalBase & { onConfirm: () => void }
) {
  const { detail, isPending, onClose, onConfirm } = props;
  return (
    <GbModal
      title="정산을 확인할까요?"
      onClose={onClose}
      footer={
        <Footer
          onClose={onClose}
          confirm={
            <Btn variant="primary" isLoading={isPending} onClick={onConfirm}>
              정산 확인
            </Btn>
          }
        />
      }
    >
      <B>{detail.groupBuy.title}</B>의 정산을 <B>운영자 확인</B> 단계로
      넘깁니다. 주문이 모두 종결되고 양측 이행 확인이 끝난 건입니다.
      <MWarn info>
        확인 후 <B>영업일 5일 내 이체</B>되고, 이체가 끝나면 공구가{" "}
        <B>정산완료</B>가 됩니다.
      </MWarn>
    </GbModal>
  );
}

// ── 수정 전후 본문 대조(B2c 브랜드 소명 · 시안 ⑩ 변경 대조 표) ──

/** 판본 표지 — 왜 이 판을 골라 봐야 하는지(통지 기준 · 승인 · 숨김 기준 · 최신) */
function revisionTags(revision: PostRevision): Array<string> {
  const tags: Array<string> = [];
  if (revision.noticeBasis) tags.push("통지 기준");
  if (revision.approved) tags.push("승인");
  if (revision.hiddenBasis) tags.push("숨김 기준");
  if (revision.unhiddenBasis) tags.push("해제 기준");
  if (revision.latest) tags.push("최신");
  return tags;
}

function revisionLabel(revision: PostRevision): string {
  return [
    `${revision.revisionNo}판`,
    revision.kind === "SUBMITTED" ? "제출" : "승인 후 수정",
    md(revision.createdAt),
    ...revisionTags(revision),
  ].join(" · ");
}

/**
 * 기본 대조 = 통지 기준 판 → 최신 판(서버 표지 그대로). 통지가 없으면 숨김 기준 · 승인 판 순.
 * 그 판이 곧 최신 판이면 같은 판끼리 비교가 되므로 건너뛴다 — 다 건너뛰면 직전 판과 비교한다.
 */
function defaultBaseNo(revisions: Array<PostRevision>): number | null {
  const latest = revisions[revisions.length - 1];
  if (!latest) {
    return null;
  }
  const base =
    [
      revisions.find((revision) => revision.noticeBasis),
      revisions.find((revision) => revision.hiddenBasis),
      revisions.find((revision) => revision.approved),
    ].find(
      (revision) => revision && revision.revisionNo !== latest.revisionNo
    ) ?? revisions[revisions.length - 2];
  return (base ?? latest).revisionNo;
}

/** 시안 `.dv` · `.dold` · `.dnew` */
const DIFF_PART_CLASS = {
  same: "text-sz-n-900",
  removed: "text-sz-n-500 line-through decoration-sz-n-400",
  added: "font-semibold text-sz-accent-600",
} as const;

function DiffText(props: { parts: Array<DiffPart> }) {
  return (
    <span className="whitespace-pre-wrap break-words">
      {props.parts.map((part, index) => (
        <span key={index} className={DIFF_PART_CLASS[part.kind]}>
          {part.text}
        </span>
      ))}
    </span>
  );
}

/** 시안 `table.diff` 한 행 — 바뀐 행만 `.chg`(accent-50) */
function DiffRow(props: {
  label: string;
  changed: boolean;
  before: ReactNode;
  after: ReactNode;
}) {
  return (
    <tr className={cn("align-top", props.changed && "bg-sz-accent-50")}>
      <td className="border-t border-sz-n-100 px-4 py-[11px] text-[11px] text-sz-n-500">
        {props.label}
      </td>
      <td className="border-t border-sz-n-100 px-4 py-[11px] text-[12px] leading-[1.75]">
        {props.before}
      </td>
      <td className="border-t border-sz-n-100 px-4 py-[11px] text-[12px] leading-[1.75]">
        {props.after}
      </td>
    </tr>
  );
}

/** 시안 `.dsame` */
function Unchanged() {
  return <span className="text-[11px] text-sz-n-400">변경 없음</span>;
}

export function PostRevisionModal(props: {
  groupBuyId: number;
  onClose: () => void;
}) {
  const { groupBuyId, onClose } = props;
  const {
    data: revisions,
    isLoading,
    isError,
  } = useGetPostRevisions(groupBuyId, true);
  // 고르기 전에는 서버 표지로 정한 기본 판(통지 기준 → 최신)을 쓴다
  const [pickedBaseNo, setPickedBaseNo] = useState<number | null>(null);
  const [pickedTargetNo, setPickedTargetNo] = useState<number | null>(null);

  const list = useMemo(() => revisions ?? [], [revisions]);
  const baseNo = pickedBaseNo ?? defaultBaseNo(list);
  const targetNo = pickedTargetNo ?? list[list.length - 1]?.revisionNo ?? null;
  const base = list.find((revision) => revision.revisionNo === baseNo) ?? null;
  const target =
    list.find((revision) => revision.revisionNo === targetNo) ?? null;

  const titleChanged =
    base !== null &&
    target !== null &&
    (base.title ?? "") !== (target.title ?? "");
  const body = useMemo(
    () =>
      base && target
        ? diffSentences(base.content ?? "", target.content ?? "")
        : null,
    [base, target]
  );
  const editedCount = list.filter(
    (revision) => revision.kind === "EDITED"
  ).length;

  const revisionOptions = list.map((revision) => (
    <option key={revision.revisionNo} value={revision.revisionNo}>
      {revisionLabel(revision)}
    </option>
  ));

  return (
    <GbModal
      title="수정 전후 본문 대조"
      width={880}
      onClose={onClose}
      footer={
        <Btn variant="secondary" onClick={onClose}>
          닫기
        </Btn>
      }
    >
      {isLoading ? (
        <div className="py-10 text-center text-sz-n-500">불러오는 중…</div>
      ) : isError ? (
        <div className="py-10 text-center text-sz-n-500">
          판본을 불러오지 못했습니다. 잠시 후 다시 열어 주세요.
        </div>
      ) : !base || !target ? (
        <div className="py-10 text-center text-sz-n-500">
          아직 제출된 게시물이 없어 대조할 판본이 없습니다.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <MLabel>기준 판</MLabel>
              <MSelect
                value={base.revisionNo}
                onChange={(event) =>
                  setPickedBaseNo(Number(event.target.value))
                }
              >
                {revisionOptions}
              </MSelect>
            </div>
            <div>
              <MLabel>비교 판</MLabel>
              <MSelect
                value={target.revisionNo}
                onChange={(event) =>
                  setPickedTargetNo(Number(event.target.value))
                }
              >
                {revisionOptions}
              </MSelect>
            </div>
          </div>
          <MHint>
            판본 {num(list.length)}개 · 승인 후 수정 {num(editedCount)}회 —
            제출과 승인 후 수정만 판본으로 남고 임시저장은 남지 않습니다. 빠진
            문장은 취소선, 새로 생긴 문장은 인디고로 표시합니다.
          </MHint>

          <table className="mt-4 w-full table-fixed border-separate border-spacing-0 overflow-hidden rounded-[6px] border border-sz-n-200">
            <colgroup>
              <col style={{ width: 180 }} />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr>
                {["항목", revisionLabel(base), revisionLabel(target)].map(
                  (head, index) => (
                    <td
                      key={index}
                      className="border-b border-sz-n-200 bg-sz-n-100 px-4 py-2.5 text-[11px] font-medium text-sz-n-600"
                    >
                      {head}
                    </td>
                  )
                )}
              </tr>
            </thead>
            <tbody className="[&>tr:first-child>td]:border-t-0">
              <DiffRow
                label="제목"
                changed={titleChanged}
                before={
                  <span
                    className={
                      titleChanged
                        ? DIFF_PART_CLASS.removed
                        : DIFF_PART_CLASS.same
                    }
                  >
                    {base.title ?? "—"}
                  </span>
                }
                after={
                  titleChanged ? (
                    <span className={DIFF_PART_CLASS.added}>
                      {target.title ?? "—"}
                    </span>
                  ) : (
                    <Unchanged />
                  )
                }
              />
              <DiffRow
                label="본문"
                changed={body?.changed ?? false}
                before={
                  body?.changed ? (
                    <DiffText parts={body.before} />
                  ) : (
                    <span className="whitespace-pre-wrap break-words text-sz-n-900">
                      {base.content ?? "—"}
                    </span>
                  )
                }
                after={
                  body?.changed ? (
                    <DiffText parts={body.after} />
                  ) : (
                    <Unchanged />
                  )
                }
              />
            </tbody>
          </table>
          {base.revisionNo === target.revisionNo && (
            <MWarn info className="mb-0">
              같은 판을 골랐습니다 — 다른 판을 골라야 차이가 보입니다.
            </MWarn>
          )}
        </>
      )}
    </GbModal>
  );
}
