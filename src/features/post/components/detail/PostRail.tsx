import DetailCard from "@/common/components/DetailCard/DetailCard";
import HistoryList from "@/common/components/HistoryList/HistoryList";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import Btn from "@/features/contract/components/shared/Btn";
import {
  DELETE_REASON_LABEL,
  MONITORING_STATUS_LABEL,
  MONITORING_STATUS_TONE,
  TIMELINE_TONE,
} from "@/features/post/constants/labels";
import { FLink, RailRow } from "@/features/post/components/shared/PostParts";
import type {
  AdminPostDetail,
  AdminPostSuspension,
} from "@/features/post/types";
import {
  dLabel,
  dateOnly,
  dateTime,
  daysLeft,
  reasonText,
  reportsSummary,
  suspensionReasonWithTag,
  timelineActor,
} from "@/features/post/utils/view";
import type { ReactNode } from "react";

export type PostAction =
  | "suspend"
  | "closeReports"
  | "cancelSuspension"
  | "approveAppeal"
  | "rejectAppeal";

interface ProcessCardProps {
  detail: AdminPostDetail;
  suspension: AdminPostSuspension | null;
  origin: AdminPostSuspension | null;
  onAction: (action: PostAction) => void;
  onAuthor?: () => void;
}

function AuthorValue(props: { name: string; onAuthor?: () => void }) {
  return (
    <>
      {props.name}{" "}
      {props.onAuthor && (
        <FLink onClick={props.onAuthor} title="인플루언서 상세">
          ↗
        </FLink>
      )}
    </>
  );
}

/** 「경위」 — 작성자 삭제는 이의 신청 전 출구인지(원 조치 유무)를 함께 적는다 */
function deletionCause(detail: AdminPostDetail, hasOrigin: boolean): string {
  const type = detail.deletion?.type ?? detail.deleteReason;
  if (!type) {
    return "—";
  }
  if (type === "SELF") {
    return hasOrigin ? "작성자 삭제 · 이의 미신청" : "작성자 삭제";
  }
  return DELETE_REASON_LABEL[type];
}

/**
 * 시안 레일 「처리」 — 상태별 메타 + 액션. 조치는 상세에서만 실행한다(목록에 관리 열을 두지 않는다 · C1).
 * 영구 삭제(C8 · C10)는 조회 전용이라 버튼이 없다.
 */
export function ProcessCard(props: ProcessCardProps) {
  const { detail, suspension, origin, onAction, onAuthor } = props;
  const status = detail.monitoringStatus;
  const author = detail.author;
  const authorName = author?.showroomName ?? "—";
  const sanction = author
    ? `노출 중지 ${author.suspensionCount}회 · 삭제 ${author.sanctionDeleteCount}회`
    : "—";

  let rows: ReactNode = null;
  let actions: ReactNode = null;

  if (status === "PUBLISHED" || status === "REPORTED" || status === "DRAFT") {
    rows = (
      <>
        <RailRow label="등록일시">
          <span className="tabular-nums">{dateTime(detail.publishedAt)}</span>
        </RailRow>
        {status === "REPORTED" ? (
          <RailRow label="최초 신고">
            <span className="tabular-nums">
              {dateTime(detail.reports?.firstPendingAt)}
            </span>
          </RailRow>
        ) : (
          <RailRow label="최종 수정">
            <span className="tabular-nums">{dateTime(detail.editedAt)}</span>
          </RailRow>
        )}
        <RailRow label="작성자">
          <AuthorValue name={authorName} onAuthor={onAuthor} />
        </RailRow>
        <RailRow label="작성자 조치 이력">{sanction}</RailRow>
        <RailRow label="신고">{reportsSummary(detail.reports)}</RailRow>
      </>
    );
    if (status === "PUBLISHED") {
      actions = (
        <Btn
          variant="dangerSolid"
          className="w-full flex-1"
          onClick={() => onAction("suspend")}
        >
          노출 중지
        </Btn>
      );
    }
    if (status === "REPORTED") {
      actions = (
        <>
          <Btn
            variant="dangerSolid"
            className="w-full flex-1"
            onClick={() => onAction("suspend")}
          >
            노출 중지
          </Btn>
          <Btn
            variant="secondary"
            className="w-full flex-1"
            onClick={() => onAction("closeReports")}
          >
            신고 종결
          </Btn>
        </>
      );
    }
  }

  if (status === "SUSPENDED" && suspension) {
    const left = daysLeft(suspension.appealDeadline);
    rows = (
      <>
        <RailRow label="조치 시각">
          <span className="tabular-nums">
            {dateTime(suspension.suspendedAt)}
          </span>
        </RailRow>
        <RailRow label="처리자">{suspension.suspendedByName ?? "—"}</RailRow>
        <RailRow label="사유">
          {reasonText(suspension.reasonCode, suspension.reasonLabel)}
        </RailRow>
        <RailRow label="이의 신청">미신청 · 기한 {dLabel(left)}</RailRow>
        <RailRow label="알림 발송">
          {suspension.notifiedAt ? (
            <span className="tabular-nums">
              {suspension.notificationDelivered === false ? "미발송" : "완료"} ·{" "}
              {dateTime(suspension.notifiedAt)}
            </span>
          ) : (
            "—"
          )}
        </RailRow>
      </>
    );
    actions = (
      <Btn
        variant="primary"
        className="w-full flex-1"
        onClick={() => onAction("cancelSuspension")}
      >
        조치 취소 · 재게시
      </Btn>
    );
  }

  if (status === "UNDER_REVIEW") {
    const appeal = detail.appeal;
    rows = (
      <>
        <RailRow label="신청 접수">
          <span className="tabular-nums">{dateTime(appeal?.submittedAt)}</span>
        </RailRow>
        <RailRow label="심사 기한">
          <span className="tabular-nums">
            {dateOnly(appeal?.reviewDueAt)} ·{" "}
            {dLabel(daysLeft(appeal?.reviewDueAt))}
          </span>
        </RailRow>
        <RailRow label="신청자">{authorName}</RailRow>
        <RailRow label="원 조치">
          {suspension
            ? `노출 중지 · ${suspensionReasonWithTag(suspension)}`
            : "—"}
        </RailRow>
        {/* 심사 담당 배정 필드가 서버에 없다 — 심사가 끝나면 심사한 운영자가 남는다(백엔드 요청) */}
        <RailRow label="심사 담당">{appeal?.reviewedByName ?? "—"}</RailRow>
      </>
    );
    actions = appeal ? (
      <>
        <Btn
          variant="primary"
          className="w-full flex-1"
          onClick={() => onAction("approveAppeal")}
        >
          승인 · 재게시
        </Btn>
        <Btn
          variant="dangerSolid"
          className="w-full flex-1"
          onClick={() => onAction("rejectAppeal")}
        >
          반려
        </Btn>
      </>
    ) : null;
  }

  if (status === "CLOSED") {
    const deletion = detail.deletion;
    rows = (
      <>
        <RailRow label="삭제 확정">
          <span className="tabular-nums">
            {dateTime(deletion?.deletedAt ?? detail.deletedAt)}
          </span>
        </RailRow>
        <RailRow label="처리자">
          {deletion?.deletedBySelf
            ? "인플루언서 본인"
            : (deletion?.deletedByName ?? "—")}
        </RailRow>
        <RailRow label="경위">{deletionCause(detail, Boolean(origin))}</RailRow>
        <RailRow label="보관 만료">
          <span className="tabular-nums">
            {dateOnly(deletion?.purgeAt ?? detail.purgeAt)}
          </span>
        </RailRow>
      </>
    );
  }

  return (
    <DetailCard title="처리">
      <div className="pb-1 pt-3">
        <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3">
          <span className="shrink-0 text-[12px] text-sz-n-500">상태</span>
          <StatusBadge variant={MONITORING_STATUS_TONE[status]}>
            {detail.monitoringStatusLabel || MONITORING_STATUS_LABEL[status]}
          </StatusBadge>
        </div>
        <div className="pt-2">{rows}</div>
        {actions && <div className="mt-4 flex gap-2">{actions}</div>}
      </div>
    </DetailCard>
  );
}

/** 처리 이력 — 서버가 7개 원천을 합쳐 최신순으로 내린다. 알림 이력은 영구 보존 */
export function HistoryCard(props: { detail: AdminPostDetail }) {
  const items = (props.detail.timeline ?? []).map((item) => ({
    label: item.label,
    processedAt: item.at,
    tone: TIMELINE_TONE[item.tone ?? ""] ?? "muted",
    processorName: timelineActor(item),
  }));
  return (
    <DetailCard title="처리 이력" note="알림 이력은 영구 보존" flushBody>
      <HistoryList items={items} />
    </DetailCard>
  );
}
