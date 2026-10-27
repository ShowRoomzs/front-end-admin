import DetailCard, {
  FieldRow,
} from "@/common/components/DetailCard/DetailCard";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import {
  PHOTO_FOLD_LIMIT,
  PHOTO_COLUMNS,
} from "@/features/post/constants/params";
import { DELETE_REASON_LABEL } from "@/features/post/constants/labels";
import {
  ASPECT_RATIO_RULE,
  CLAUSE_NUMBER,
  CLAUSE_SHORT_TAG,
  RETENTION_PENDING_NOTE,
} from "@/features/post/constants/provisional";
import {
  Avatar,
  FLink,
  FlagChip,
  PhotoFill,
  Sub,
  WarnBox,
} from "@/features/post/components/shared/PostParts";
import type {
  AdminPostAppeal,
  AdminPostDetail,
  AdminPostImage,
  AdminPostMetrics,
  AdminPostPolicy,
  AdminPostReports,
  AdminPostSuspension,
  PostPolicyClause,
} from "@/features/post/types";
import {
  dLabel,
  dateOnly,
  dateTime,
  daysLeft,
  initialOf,
  monthDayTime,
  num,
  policyValue,
  reasonText,
  suspensionReasonWithTag,
} from "@/features/post/utils/view";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

/** DetailCard 본문 기본 패딩(pt-1 · pb-3)에 더해 시안 `.card-b` 16px을 맞춘다 */
function CardBody(props: { children: ReactNode }) {
  return <div className="pb-1 pt-3">{props.children}</div>;
}

// ------------------------------------------------------------------ 신고 내역

interface ReportsCardProps {
  reports: AdminPostReports;
  onReporter?: (userId: number) => void;
}

/** C3 · C5 신고 내역 — 무엇을 문제 삼았는지. 신고자는 마스킹(한*준) + 회원 상세 연결 */
export function ReportsCard(props: ReportsCardProps) {
  const { reports, onReporter } = props;
  const items = reports.items ?? [];

  return (
    <DetailCard title="신고 내역" note={`${items.length}건 · 접수 시각 기준`}>
      <CardBody>
        {items.map((item) => (
          <div
            key={item.reportId}
            className="flex items-start justify-between gap-3 border-t border-sz-n-200 py-2.5 first:border-t-0 first:pt-0"
          >
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-sz-n-900">
                {reasonText(item.reasonCode, item.reasonLabel)}
              </div>
              {item.reasonDetail && (
                <div className="mt-0.5 text-[11px] text-sz-n-600">
                  {item.reasonDetail}
                </div>
              )}
            </div>
            <div className="whitespace-nowrap text-[11px] tabular-nums text-sz-n-500">
              {dateTime(item.reportedAt)}
              {item.reporterMaskedName && (
                <>
                  {" · "}
                  <FLink
                    onClick={
                      onReporter && item.reporterUserId !== null
                        ? () => onReporter(item.reporterUserId as number)
                        : undefined
                    }
                  >
                    {item.reporterMaskedName}
                  </FLink>
                </>
              )}
            </div>
          </div>
        ))}
      </CardBody>
    </DetailCard>
  );
}

// ------------------------------------------------------------------ 게시물 원문

interface PostBodyCardProps {
  detail: AdminPostDetail;
  onAuthor?: () => void;
  onOpenPhoto: (index: number) => void;
}

function bannerOf(detail: AdminPostDetail): ReactNode {
  switch (detail.monitoringStatus) {
    case "SUSPENDED":
      return (
        <>
          이 게시물은 <b>노출 중지</b> 상태로 앱 쇼룸에 노출되지 않습니다 —
          작성자도 중지 중에는 사진·본문을 수정할 수 없습니다.
        </>
      );
    case "UNDER_REVIEW":
      return (
        <>
          이 게시물은 <b>노출 중지</b> 상태로 앱 쇼룸에 노출되지 않습니다 — 심사
          중에는 작성자도 사진·본문을 수정할 수 없습니다.
        </>
      );
    case "CLOSED":
      return (
        <>
          <b>영구 삭제</b>된 게시물입니다 — 작성자 목록·쇼룸·인사이트에서
          사라졌고 작성자도 복구할 수 없습니다. 이 원문은{" "}
          <b>운영자 콘솔에서만</b> 조회할 수 있으며{" "}
          <b className="tabular-nums">{dateOnly(detail.purgeAt)}</b>에
          파기됩니다.
        </>
      );
    default:
      return null;
  }
}

/** C2~C10 게시물 카드 — 원문은 조회 전용. 운영자는 게시물을 수정하지 않는다 */
export function PostBodyCard(props: PostBodyCardProps) {
  const { detail, onAuthor, onOpenPhoto } = props;
  const [expanded, setExpanded] = useState(false);
  const author = detail.author;
  const images = [...(detail.images ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
  const folded = images.length > PHOTO_FOLD_LIMIT && !expanded;
  const shown = folded ? images.slice(0, PHOTO_FOLD_LIMIT - 1) : images;
  const banner = bannerOf(detail);
  const isClosed = detail.monitoringStatus === "CLOSED";

  return (
    <DetailCard
      title="게시물"
      note={`${detail.postNo} · ${isClosed ? "비공개 보관 · 운영자 콘솔 전용" : "앱 쇼룸 게시"}`}
    >
      <CardBody>
        {banner && <WarnBox className="mb-4">{banner}</WarnBox>}

        <div className="flex items-center gap-2.5">
          <Avatar
            name={initialOf(author?.showroomName)}
            imageUrl={author?.profileImageUrl}
          />
          <div>
            <div className="text-[13px] font-semibold text-sz-n-900">
              <FLink onClick={onAuthor}>{author?.showroomName ?? "—"}</FLink>
            </div>
            <div className="text-[11px] tabular-nums text-sz-n-500">
              인플루언서 · 팔로워 {num(author?.followerCount)} ·{" "}
              {dateTime(detail.publishedAt)} 게시
            </div>
          </div>
        </div>

        {detail.content && (
          <div className="mt-4 whitespace-pre-line text-[13px] leading-[1.9] text-sz-n-900">
            {detail.content}
          </div>
        )}

        {images.length > 0 && (
          <div
            className="mt-3.5 grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${PHOTO_COLUMNS}, minmax(0, 1fr))`,
            }}
          >
            {shown.map((image, index) => (
              <PhotoTile
                key={image.imageId}
                image={image}
                index={index}
                total={images.length}
                onOpen={() => onOpenPhoto(index)}
              />
            ))}
            {folded && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="flex aspect-[4/5] cursor-pointer items-center justify-center rounded-[6px] border border-dashed border-sz-n-300 bg-sz-n-50 text-[11px] font-medium text-sz-n-700 hover:border-sz-accent-500 hover:text-sz-accent-600"
              >
                +{images.length - shown.length}장 더 보기
              </button>
            )}
          </div>
        )}

        <div className="mt-4 flex gap-[18px] border-t border-sz-n-200 pt-3 text-[11px] text-sz-n-500">
          <span>
            사진 {images.length}장
            {folded && (
              <Sub> · {shown.length}장 표시 · 썸네일을 누르면 원본</Sub>
            )}
          </span>
          {detail.aspectRatioLabel && (
            <span>
              게시물 비율 {detail.aspectRatioLabel}{" "}
              <Sub>({ASPECT_RATIO_RULE})</Sub>
            </span>
          )}
        </div>
      </CardBody>
    </DetailCard>
  );
}

/** 시안 `.photo` — 4:5 센터 크롭 · 「신고 지목」 · 장 번호 */
function PhotoTile(props: {
  image: AdminPostImage;
  index: number;
  total: number;
  onOpen: () => void;
}) {
  const { image, index, total, onOpen } = props;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-[6px] bg-sz-n-200"
    >
      <PhotoFill
        url={image.imageUrl ?? image.originalUrl}
        fallback={index === 0 ? "사진 1 · 대표" : `사진 ${index + 1}`}
      />
      {image.reportFlagged && (
        <FlagChip className="absolute left-1.5 top-1.5" />
      )}
      {total > PHOTO_COLUMNS && (
        <span className="absolute bottom-1.5 right-1.5 rounded-[6px] bg-white/85 px-[5px] text-[10px] tabular-nums text-sz-n-600">
          {index + 1}/{total}
        </span>
      )}
    </button>
  );
}

// ------------------------------------------------------------------ 지표

export function MetricsCard(props: {
  metrics: AdminPostMetrics;
  note: string;
}) {
  const { metrics, note } = props;
  const items: Array<[string, string]> = [
    ["노출", num(metrics.impressions)],
    ["좋아요", num(metrics.likes)],
    [
      "좋아요율",
      metrics.likeRate === null ? "—" : `${metrics.likeRate.toFixed(1)}%`,
    ],
    ["쇼룸 방문", num(metrics.showroomVisits)],
    ["팔로우", num(metrics.follows)],
  ];
  return (
    <DetailCard title="지표" note={note}>
      <CardBody>
        <div className="flex flex-wrap gap-7 pb-1 text-[13px] text-sz-n-600">
          {items.map(([label, value]) => (
            <span key={label}>
              {label}{" "}
              <b className="font-bold tabular-nums text-sz-n-900">{value}</b>
            </span>
          ))}
        </div>
      </CardBody>
    </DetailCard>
  );
}

// ------------------------------------------------------------------ 운영자 조치 내역

/** 「허위 · 과장 정보 · 의약품 오인 (3조 4항)」 — 조항으로 갈라 읽는 사유만 부기 */
function ReasonWithClause(props: { suspension: AdminPostSuspension }) {
  const { suspension } = props;
  const clause = suspension.policyClauseCode as PostPolicyClause | null;
  const tag = clause ? CLAUSE_SHORT_TAG[clause] : undefined;
  return (
    <>
      {reasonText(suspension.reasonCode, suspension.reasonLabel)}
      {tag && clause && (
        <Sub>
          {" "}
          · {tag} ({CLAUSE_NUMBER[clause]})
        </Sub>
      )}
    </>
  );
}

/** C5 · C6 운영자 조치 내역 — 조치 기록 5항목(사유 · 근거 규정 · 조치 시각 · 처리자 · 이의 신청 기한) */
export function ActionRecordCard(props: { suspension: AdminPostSuspension }) {
  const { suspension } = props;
  const left = daysLeft(suspension.appealDeadline);

  return (
    <DetailCard
      title="운영자 조치 내역"
      note="작성자에게 동일 내용이 알림으로 발송됨"
    >
      <FieldRow label="조치">
        <StatusBadge variant="danger">노출 중지</StatusBadge>
      </FieldRow>
      <FieldRow label="사유">
        <ReasonWithClause suspension={suspension} />
      </FieldRow>
      <FieldRow label="근거 규정">{suspension.policyRef ?? "—"}</FieldRow>
      {suspension.reasonDetail && (
        <FieldRow label="작성자에게 전달할 설명">
          {suspension.reasonDetail}
        </FieldRow>
      )}
      <FieldRow label="조치 시각">
        <span className="tabular-nums">{dateTime(suspension.suspendedAt)}</span>
      </FieldRow>
      <FieldRow label="처리자">{suspension.suspendedByName ?? "—"}</FieldRow>
      <FieldRow label="이의 신청 기한">
        <b className="font-bold tabular-nums">
          {dateTime(suspension.appealDeadline)}
        </b>
        {suspension.deadlinePaused ? (
          <Sub> (신청 접수로 정지)</Sub>
        ) : (
          <>
            {" · "}
            <span
              className={cn(
                "tabular-nums",
                left !== null &&
                  left < 0 &&
                  "font-semibold text-sz-warning-text"
              )}
            >
              {dLabel(left)}
            </span>{" "}
            <Sub>(기한 내 미신청 시 영구 삭제)</Sub>
          </>
        )}
      </FieldRow>
    </DetailCard>
  );
}

// ------------------------------------------------------------------ 이의 신청

export function AppealCard(props: {
  appeal: AdminPostAppeal;
  policy: AdminPostPolicy | null;
}) {
  const { appeal, policy } = props;
  const left = daysLeft(appeal.reviewDueAt);

  return (
    <DetailCard
      title="이의 신청"
      note={`게시물당 1회 · ${dateTime(appeal.submittedAt)} 접수`}
    >
      <CardBody>
        <WarnBox tone="info" className="mb-3.5">
          심사 기한{" "}
          <b className="font-bold tabular-nums">
            {dateOnly(appeal.reviewDueAt)}
          </b>{" "}
          ·{" "}
          <span
            className={cn(
              "tabular-nums",
              left !== null && left < 0 && "font-semibold text-sz-warning-text"
            )}
          >
            {dLabel(left)}
          </span>{" "}
          — {policyValue(policy?.appealReviewBusinessDays)}영업일 이내 결과를
          통지합니다. 승인하면 <b>좋아요·인사이트를 유지한 채 재게시</b>되고,
          반려하면 <b>유예 {policyValue(policy?.downloadGraceDays)}일</b> 뒤{" "}
          <b>영구 삭제</b>됩니다(유예 중 작성자만 원본 내려받기).
        </WarnBox>
        <FieldRow label="신청 내용">{appeal.content ?? "—"}</FieldRow>
      </CardBody>
    </DetailCard>
  );
}

// ------------------------------------------------------------------ 삭제 경위

function RetentionRow(props: {
  purgeAt: string | null;
  policy: AdminPostPolicy | null;
}) {
  const { purgeAt, policy } = props;
  return (
    <FieldRow label="보관 만료">
      <b className="font-bold tabular-nums">{dateOnly(purgeAt)}</b>{" "}
      <Sub>
        ({policyValue(policy?.retentionMonths)}개월 · {RETENTION_PENDING_NOTE})
      </Sub>
    </FieldRow>
  );
}

function OriginRow(props: { origin: AdminPostSuspension | null }) {
  const { origin } = props;
  if (!origin) {
    return null;
  }
  return (
    <FieldRow label="원 조치">
      노출 중지 · {suspensionReasonWithTag(origin)}{" "}
      <Sub>
        ({dateTime(origin.suspendedAt)} · {origin.suspendedByName ?? "—"})
      </Sub>
    </FieldRow>
  );
}

/** C8 반려 삭제 · C10 작성자 삭제 · 기한 경과 삭제 — 삭제돼도 증거(원 조치 · 원문)는 남는다 */
export function DeletionCard(props: {
  detail: AdminPostDetail;
  origin: AdminPostSuspension | null;
}) {
  const { detail, origin } = props;
  const deletion = detail.deletion;
  if (!deletion) {
    return null;
  }
  const purgeAt = deletion.purgeAt ?? detail.purgeAt;

  if (deletion.type === "SELF") {
    const deadlineLeft = daysLeft(
      deletion.appealDeadlineAtDeletion,
      deletion.deletedAt
    );
    return (
      <DetailCard title="삭제 경위">
        <FieldRow label="삭제 유형">
          작성자 삭제
          {origin && <Sub> · 노출 중지 중 · 이의 미신청</Sub>}
        </FieldRow>
        <OriginRow origin={origin} />
        <FieldRow label="삭제 시각">
          <span className="tabular-nums">{dateTime(deletion.deletedAt)}</span> ·
          인플루언서 본인
          {origin && (
            <Sub>
              {deletion.daysAfterSuspension !== null &&
                ` · 중지 후 ${deletion.daysAfterSuspension}일`}
              {deletion.appealDeadlineAtDeletion &&
                ` · 이의 기한 ${dLabel(deadlineLeft)}`}
            </Sub>
          )}
        </FieldRow>
        <RetentionRow purgeAt={purgeAt} policy={detail.policy} />
      </DetailCard>
    );
  }

  const typeLabel = deletion.type ? DELETE_REASON_LABEL[deletion.type] : "—";
  const downloads = deletion.originalDownloads ?? [];

  return (
    <DetailCard title="삭제 경위">
      <FieldRow label="삭제 유형">
        <StatusBadge variant="neutral">{typeLabel}</StatusBadge>
      </FieldRow>
      <OriginRow origin={origin} />
      {deletion.type === "APPEAL_REJECTED" ? (
        <>
          <FieldRow label="반려 사유">{deletion.rejectReason ?? "—"}</FieldRow>
          <FieldRow label="반려 시각">
            <span className="tabular-nums">{dateTime(deletion.deletedAt)}</span>{" "}
            · {deletion.deletedByName ?? "—"}
          </FieldRow>
          <FieldRow label="유예 · 원본 내려받기">
            <span className="tabular-nums">
              {dateOnly(deletion.graceFrom)} ~{" "}
              {deletion.graceUntil
                ? dateOnly(deletion.graceUntil).slice(5)
                : "—"}
            </span>{" "}
            <Sub>
              · 작성자 내려받기 {downloads.length}회
              {downloads.length > 0 &&
                `(${downloads.map((item) => monthDayTime(item.downloadedAt)).join(", ")})`}{" "}
              · 유예 종료 후 영구 삭제
            </Sub>
          </FieldRow>
        </>
      ) : (
        <FieldRow label="삭제 시각">
          <span className="tabular-nums">{dateTime(deletion.deletedAt)}</span> ·{" "}
          {deletion.deletedByName ?? "시스템"}
        </FieldRow>
      )}
      <RetentionRow purgeAt={purgeAt} policy={detail.policy} />
    </DetailCard>
  );
}
