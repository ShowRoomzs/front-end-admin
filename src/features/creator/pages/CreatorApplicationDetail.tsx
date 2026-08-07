import DetailCard, {
  FieldRow,
  PurgedValue,
} from "@/common/components/DetailCard/DetailCard";
import HistoryList, {
  type HistoryItem,
} from "@/common/components/HistoryList/HistoryList";
import RecordNav from "@/common/components/RecordNav/RecordNav";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { queryClient } from "@/common/lib/queryClient";
import { formatDateTimeShort } from "@/common/utils/formatDate";
import ApplicationApprovalModal from "@/features/creator/components/ApplicationApprovalModal/ApplicationApprovalModal";
import ApplicationRejectionModal from "@/features/creator/components/ApplicationRejectionModal/ApplicationRejectionModal";
import { CREATOR_REJECTION_REASON_LABELS } from "@/features/creator/constants/params";
import {
  CREATOR_APPLICATION_DETAIL_QUERY_KEY,
  CREATOR_APPLICATION_LIST_QUERY_KEY,
} from "@/features/creator/constants/queryKey";
import { useGetCreatorApplicationDetail } from "@/features/creator/hooks/useGetCreatorApplicationDetail";
import {
  creatorService,
  type CreatorRejectionReasonType,
} from "@/features/creator/services/creatorService";
import { markDummy } from "@/features/creator/utils/dummyField";
import { formatElapsed } from "@/features/creator/utils/elapsedTime";
import { getApplicationStatusBadge } from "@/features/creator/utils/statusBadge";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate, useParams } from "react-router-dom";

/**
 * 반려 건이면 파기 정책(§9-5)에 따라 "파기됨"으로 표시한다.
 * 값이 없을 뿐인 경우("—")와 구분된다.
 */
function renderValue(value: string | null | undefined, isPurged: boolean) {
  if (isPurged) {
    return <PurgedValue />;
  }
  return value || "—";
}

export default function CreatorApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // 크리에이터는 승인/반려도 신청서 ID로 처리한다(브랜드처럼 sellerId를 따로 쓰지 않는다)
  const applicationId = Number(id);

  const { data: detail } = useGetCreatorApplicationDetail(applicationId);

  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isRejectionOpen, setIsRejectionOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 목록에서 넘겨받은 형제 건 ID — 이전/다음 이동 계산용
  const siblingIds = (location.state as { siblingIds?: Array<number> } | null)
    ?.siblingIds;
  const currentSiblingIndex = siblingIds?.indexOf(applicationId) ?? -1;

  const isPending = detail?.status === "PENDING";
  const isRejected = detail?.status === "REJECTED";

  const historyItems = useMemo<Array<HistoryItem>>(() => {
    const history = detail?.processingHistory ?? [];

    const sorted = [...history].sort((a, b) =>
      (a.processedAt ?? "").localeCompare(b.processedAt ?? "")
    );

    const items: Array<HistoryItem> = [];
    for (const item of sorted) {
      const processedBy = item.processorEmail ?? "—";

      if (item.type === "APPLICATION_APPROVED") {
        items.push({
          label: `승인 처리 · ${processedBy}`,
          processedAt: item.processedAt,
          tone: "success",
        });
      } else if (item.type === "APPLICATION_REJECTED") {
        items.push({
          label: `반려 처리 · ${processedBy}`,
          processedAt: item.processedAt,
          tone: "muted",
        });
        // 반려와 파기는 같은 트랜잭션·같은 시각에 일어나지만 API는 이력 1건만 준다.
        // 정책상 항상 함께 일어나는 일이라 프론트에서 이력을 하나 더 만들어 보여준다.
        items.push({
          label: "제출 정보 파기 · 14일 재신청 제한 시작",
          processedAt: item.processedAt,
          tone: "muted",
        });
      } else {
        items.push({
          label: item.label,
          processedAt: item.processedAt,
          tone: "accent",
        });
      }
    }

    return items.reverse(); // 최신순
  }, [detail]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [CREATOR_APPLICATION_DETAIL_QUERY_KEY, applicationId],
    });
    queryClient.invalidateQueries({
      queryKey: [CREATOR_APPLICATION_LIST_QUERY_KEY],
    });
  }, [applicationId]);

  const handleApprove = useCallback(async () => {
    if (!detail) {
      return;
    }
    setIsSubmitting(true);
    try {
      await creatorService.approveCreatorApplication(detail.applicationId);
      refresh();
      setIsApprovalOpen(false);
      toast.success(`@${detail.accountId} 입점 신청을 승인했습니다.`);
    } finally {
      setIsSubmitting(false);
    }
  }, [detail, refresh]);

  const handleReject = useCallback(
    async (reasonType: CreatorRejectionReasonType, reasonDetail: string) => {
      if (!detail) {
        return;
      }
      setIsSubmitting(true);
      try {
        await creatorService.rejectCreatorApplication(detail.applicationId, {
          rejectReasonType: reasonType,
          rejectReasonDetail: reasonDetail || undefined,
        });
        refresh();
        setIsRejectionOpen(false);
        toast.success(`@${detail.accountId} 입점 신청을 반려했습니다.`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [detail, refresh]
  );

  const goSibling = useCallback(
    (offset: number) => {
      if (!siblingIds || currentSiblingIndex < 0) {
        return;
      }
      const nextId = siblingIds[currentSiblingIndex + offset];
      if (nextId === undefined) {
        return;
      }
      navigate(`/showroom/registration/${nextId}`, { state: { siblingIds } });
    },
    [currentSiblingIndex, navigate, siblingIds]
  );

  if (!detail) {
    return null;
  }

  const statusBadge = getApplicationStatusBadge(
    detail.status,
    detail.appliedAt,
    true
  );
  const hasPrev = currentSiblingIndex > 0;
  const hasNext =
    siblingIds !== undefined &&
    currentSiblingIndex >= 0 &&
    currentSiblingIndex < siblingIds.length - 1;

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <h1 className="text-[20px] font-semibold text-sz-n-900">
          @{detail.accountId}
        </h1>
        <RecordNav
          onList={() => navigate("/showroom/registration")}
          onPrev={hasPrev ? () => goSibling(-1) : undefined}
          onNext={hasNext ? () => goSibling(1) : undefined}
        />
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        {/* 좌측 — 신청 내용. 첨부 서류 카드는 없다(본인인증이 PASS로 자동화 · §9-2) */}
        <div className="flex flex-col gap-4">
          <DetailCard
            title="본인 인증"
            note={isRejected ? "파기됨" : undefined}
          >
            {isRejected && (
              <div className="my-2 flex gap-2 rounded-[6px] bg-sz-n-100 px-3.5 py-3 text-[11px] leading-relaxed text-sz-n-600">
                <span>ⓘ</span>
                <span>
                  반려 처리 시 <b>실명·생년월일 등 개인정보가 파기</b>됩니다. 단,{" "}
                  <b>연락처는 단방향 해시로 보존</b>해 동일인의 반복·악용 신청을
                  대조할 수 있게 합니다.
                </span>
              </div>
            )}
            <FieldRow label="실명">
              {renderValue(markDummy(detail.name), isRejected)}
            </FieldRow>
            <FieldRow label="생년월일">
              {renderValue(markDummy(detail.birthday), isRejected)}
            </FieldRow>
            {isRejected ? (
              <FieldRow label="연락처 해시">
                {detail.phoneNumberHash ? (
                  <>
                    <span className="font-mono">{detail.phoneNumberHash}</span>
                    <span className="ml-1.5 text-[11px] text-sz-n-500">
                      단방향 · 복원 불가
                    </span>
                  </>
                ) : (
                  "—"
                )}
              </FieldRow>
            ) : (
              <FieldRow label="연락처">
                {markDummy(detail.phoneNumber) || "—"}
              </FieldRow>
            )}
            <FieldRow label="인증 수단">
              {detail.verificationMethodLabel || "—"}
            </FieldRow>
          </DetailCard>

          <DetailCard title="활동 채널" note="계약 이후 검증 식별 키">
            <FieldRow label="플랫폼">{detail.snsType}</FieldRow>
            <FieldRow label="채널 주소">
              {/* 운영자가 실적을 바로 확인해야 하므로 실제 링크로 연다(§3-5).
                  반려 건도 공개 식별자라 파기하지 않으므로 동일하게 링크를 유지한다. */}
              {detail.channelUrl ? (
                <a
                  href={detail.channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sz-accent-600 hover:underline"
                >
                  {detail.channelUrl} ↗
                </a>
              ) : (
                "—"
              )}
            </FieldRow>
            <FieldRow label="계정 아이디">
              @{detail.accountId}
              {isRejected && (
                <span className="ml-1.5 text-[11px] text-sz-n-500">
                  차단 목록 대조용 · 개인정보 아님
                </span>
              )}
            </FieldRow>
            <FieldRow label="팔로워 수">
              {isRejected ? (
                <PurgedValue />
              ) : detail.followerCount === null ? (
                "—"
              ) : (
                <>
                  {detail.followerCount.toLocaleString()}명
                  <span className="ml-1.5 text-[11px] text-sz-n-500">
                    자기 신고값
                  </span>
                </>
              )}
            </FieldRow>
            <FieldRow label="업무용 이메일">
              {renderValue(detail.businessEmail, isRejected)}
            </FieldRow>
          </DetailCard>

          {/* 필수 약관 3종은 노출하지 않고 마케팅 동의만 확인한다(§9-2) */}
          <DetailCard title="약관 동의" note={isRejected ? "파기됨" : undefined}>
            <FieldRow label="마케팅 정보 수신 동의">
              {isRejected ? (
                <PurgedValue />
              ) : detail.marketingAgree === null ? (
                "—"
              ) : detail.marketingAgree ? (
                "동의 (선택)"
              ) : (
                "미동의 (선택)"
              )}
            </FieldRow>
          </DetailCard>
        </div>

        {/* 우측 — 심사 액션 레일 */}
        <div className="sticky top-0 flex flex-col gap-4">
          <DetailCard title="현재 상태">
            <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3 pt-2">
              <span className="shrink-0 text-[12px] text-sz-n-500">
                심사 상태
              </span>
              <StatusBadge variant={statusBadge.variant}>
                {statusBadge.label}
              </StatusBadge>
            </div>

            <div className="pt-2">
              <MetaRow label="신청번호" value={`INF-${detail.applicationId}`} />
              <MetaRow
                label="신청일"
                value={formatDateTimeShort(detail.appliedAt)}
              />
              {/* 승인 건은 처리일을 굳이 보여주지 않는다(반려 건은 파기 시각으로서 의미가 있어 유지) */}
              {detail.processedAt && detail.status !== "APPROVED" && (
                <MetaRow
                  label="처리일"
                  value={formatDateTimeShort(detail.processedAt)}
                />
              )}
              {/* 처리가 끝난 건은 경과 시간이 의미가 없어 행 자체를 뺀다 */}
              {isPending && (
                <MetaRow
                  label="경과"
                  value={formatElapsed(detail.appliedAt) ?? "—"}
                />
              )}
              {detail.processorEmail && (
                <MetaRow label="처리자" value={detail.processorEmail} />
              )}
            </div>

            {isRejected && detail.rejectReasonType && (
              <div className="mt-2.5 rounded-[6px] bg-sz-danger-bg px-3.5 py-3">
                <div className="mb-1 text-[11px] font-semibold text-sz-danger-text">
                  반려 사유 · 신청자 미노출
                </div>
                <div className="text-[11px] leading-relaxed text-sz-n-700">
                  {CREATOR_REJECTION_REASON_LABELS[detail.rejectReasonType] ??
                    detail.rejectReasonType}
                  {detail.rejectReasonDetail &&
                    ` - ${detail.rejectReasonDetail}`}
                </div>
              </div>
            )}

            {isPending ? (
              <>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRejectionOpen(true)}
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-[6px] bg-sz-danger-text px-4 text-[13px] font-medium text-white hover:bg-[#8f2828]"
                  >
                    반려
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsApprovalOpen(true)}
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-[6px] bg-sz-accent-500 px-4 text-[13px] font-medium text-white hover:bg-sz-accent-600"
                  >
                    승인
                  </button>
                </div>
                <p className="mt-2.5 text-[11px] leading-relaxed text-sz-n-500">
                  승인 시 계정이 즉시 활성화되어 온보딩(쇼룸명·사업자
                  여부·정산계좌)이 강제됩니다.{" "}
                  <b className="text-sz-danger-text">
                    반려 시 이번 신청 건이 종료
                  </b>
                  되며, <b>14일 후</b>에만 새 신청이 가능합니다.
                </p>
              </>
            ) : (
              <p className="mt-3 text-[11px] leading-relaxed text-sz-n-500">
                {isRejected ? (
                  <>
                    <b>반려일로부터 14일 후</b>에만 재신청이 가능합니다. 재신청
                    시 <b>신규 건으로 새 행이 생성</b>되며, 본 건에는 누적되지
                    않습니다.
                  </>
                ) : (
                  <>
                    처리가 완료된 건입니다. 추가 조치가 필요하면{" "}
                    <b>회원 관리</b>에서 계정 상태를 변경하세요.
                  </>
                )}
              </p>
            )}
          </DetailCard>

          <DetailCard title="처리 이력" note="최신순" flushBody>
            <HistoryList items={historyItems} />
          </DetailCard>
        </div>
      </div>

      <ApplicationApprovalModal
        open={isApprovalOpen}
        onOpenChange={setIsApprovalOpen}
        accountId={detail.accountId}
        isSubmitting={isSubmitting}
        onApprove={handleApprove}
      />
      <ApplicationRejectionModal
        open={isRejectionOpen}
        onOpenChange={setIsRejectionOpen}
        accountId={detail.accountId}
        isSubmitting={isSubmitting}
        onReject={handleReject}
      />
    </div>
  );
}

function MetaRow(props: { label: string; value: string }) {
  const { label, value } = props;
  return (
    <div className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0">
      <span className="text-sz-n-500">{label}</span>
      <span className="text-right font-medium text-sz-n-900">{value}</span>
    </div>
  );
}
