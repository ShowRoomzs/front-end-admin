import DetailCard, {
  FieldRow,
} from "@/common/components/DetailCard/DetailCard";
import HistoryList, {
  type HistoryItem,
} from "@/common/components/HistoryList/HistoryList";
import RecordNav from "@/common/components/RecordNav/RecordNav";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import ThreadMessage from "@/common/components/ThreadMessage/ThreadMessage";
import { formatDateTimeShort } from "@/common/utils/formatDate";
import DecisionModal from "@/features/productInquiry/components/DecisionModal/DecisionModal";
import {
  PRODUCT_INQUIRY_DELETE_REASONS,
  PRODUCT_INQUIRY_REJECT_REASONS,
} from "@/features/productInquiry/constants/params";
import { useGetProductInquiryDetail } from "@/features/productInquiry/hooks/useGetProductInquiryDetail";
import {
  useExecuteProductInquiryDelete,
  useRejectProductInquiryDeleteRequest,
} from "@/features/productInquiry/hooks/useProductInquiryDecision";
import type {
  ProductInquiryDetailParams,
  ProductInquiryHistoryEventType,
  ProductInquiryStatusFilter,
  ProductInquiryTypeCode,
} from "@/features/productInquiry/types/productInquiry";
import { getProductInquiryStatusVariant } from "@/features/productInquiry/utils/statusBadge";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
  useSearchParams,
} from "react-router-dom";

const LIST_PATH = "/support/product-inquiry";

/**
 * 이력 점 색 — 라벨은 서버가 내려주므로 여기서는 톤만 정한다.
 *
 * 삭제 집행만 위험색이다. 소비자 노출이 실제로 막힌 사건이라 이력에서도 즉시 눈에
 * 띄어야 한다(§18-1 삭제=위험색과 같은 이유).
 */
const HISTORY_TONE: Record<
  ProductInquiryHistoryEventType,
  HistoryItem["tone"]
> = {
  REGISTERED: "accent",
  ANSWERED: "muted",
  ANSWER_MODIFIED: "muted",
  DELETE_REQUESTED: "warn",
  DELETE_REJECTED: "accent",
  DELETE_EXECUTED: "danger",
};

/**
 * C2~C6 — 상품 문의 상세.
 *
 * 운영자 액션은 **삭제**와 **반려** 둘뿐이고 답변 입력란은 없다. 반려는 삭제 요청이
 * 있을 때만 성립한다 — 기각할 대상이 없으면 버튼을 노출하지 않는다(§18-4).
 *
 * 상태와 무관하게 **같은 레이아웃**을 쓰고 버튼만 달라진다. 카드를 상태별로 빼면
 * 전환할 때 레이아웃이 점프한다.
 */
export default function ProductInquiryDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { inquiryId: inquiryIdParam } = useRouteParams<{ inquiryId: string }>();
  const [searchParams] = useSearchParams();
  const inquiryId = Number(inquiryIdParam);

  const detailParams = useMemo<ProductInquiryDetailParams>(
    () => ({
      status: (searchParams.get("status") ??
        "ALL") as ProductInquiryStatusFilter,
      type: (searchParams.get("type") || null) as ProductInquiryTypeCode | null,
      keyword: searchParams.get("keyword") ?? "",
    }),
    [searchParams]
  );

  const { data: detail, isLoading } = useGetProductInquiryDetail(
    inquiryId,
    detailParams
  );
  const { mutateAsync: executeDelete, isPending: isDeleting } =
    useExecuteProductInquiryDelete();
  const { mutateAsync: rejectRequest, isPending: isRejecting } =
    useRejectProductInquiryDeleteRequest();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const goToList = useCallback(() => {
    navigate({ pathname: LIST_PATH, search: location.search });
  }, [navigate, location.search]);

  const handleDelete = useCallback(
    async (reason: string, deleteDetail: string) => {
      // 다른 운영자가 먼저 집행한 캐시로 버튼이 살아 있을 수 있다
      if (!detail?.canExecuteDelete || isDeleting) {
        return;
      }
      try {
        await executeDelete({
          inquiryId: detail.inquiryId,
          data: { reason, detail: deleteDetail || undefined },
        });
        setIsDeleteOpen(false);
        toast.success(
          "문의를 삭제했습니다. 소비자·브랜드 화면에서 내려갑니다."
        );
      } catch {
        // 모달은 닫지 않는다 — 재시도가 가능해야 한다
        toast.error("삭제 처리에 실패했습니다.");
      }
    },
    [detail, isDeleting, executeDelete]
  );

  const handleReject = useCallback(
    async (reason: string, rejectDetail: string) => {
      if (!detail?.canReject || isRejecting) {
        return;
      }
      try {
        await rejectRequest({
          inquiryId: detail.inquiryId,
          data: { reason, detail: rejectDetail || undefined },
        });
        setIsRejectOpen(false);
        toast.success(
          "삭제 요청을 반려했습니다. 문의는 게시 상태로 유지됩니다."
        );
      } catch {
        toast.error("반려 처리에 실패했습니다.");
      }
    },
    [detail, isRejecting, rejectRequest]
  );

  if (isLoading || !detail) {
    return (
      <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center text-[12px] text-sz-n-500">
        {isLoading ? "불러오는 중…" : "문의를 찾을 수 없습니다."}
      </div>
    );
  }

  const { processingMeta: meta, deleteRequest } = detail;
  const isDeleted = detail.exposureStatus === "DELETED";
  const variant = getProductInquiryStatusVariant(
    detail.status,
    detail.exposureStatus
  );

  // 서버가 최신순으로 내려준다. 매핑에 없는 이벤트가 늘어도 화면이 죽지 않게 흘린다
  const historyItems: Array<HistoryItem> = detail.history.map((item) => ({
    label: item.label,
    tone: HISTORY_TONE[item.event] ?? "muted",
    processedAt: item.occurredAt,
    processorName: item.actorLabel,
  }));

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-sz-n-900">
            상품 문의 상세
          </h1>
          <p className="mt-0.5 text-[12px] text-sz-n-600">
            {detail.typeName} · {detail.inquiryNumber}
          </p>
        </div>

        <RecordNav
          onList={goToList}
          onPrev={
            detail.prevInquiryId
              ? () =>
                  navigate({
                    pathname: `${LIST_PATH}/${detail.prevInquiryId}`,
                    search: location.search,
                  })
              : undefined
          }
          onNext={
            detail.nextInquiryId
              ? () =>
                  navigate({
                    pathname: `${LIST_PATH}/${detail.nextInquiryId}`,
                    search: location.search,
                  })
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex flex-col gap-4">
          <DetailCard title="문의 정보" note={detail.inquiryNumber}>
            <FieldRow label="문의 유형">
              <StatusBadge variant="neutral" hideDot>
                {detail.typeName}
              </StatusBadge>
            </FieldRow>
            <FieldRow label="상품">
              {detail.productName}{" "}
              <InlineLink
                onClick={() => navigate(`/product/list/${detail.productId}`)}
              >
                상품 상세 보기
              </InlineLink>
            </FieldRow>
            <FieldRow label="브랜드">
              {detail.brandName}{" "}
              <InlineLink
                onClick={() =>
                  navigate(
                    `/market/list?marketName=${encodeURIComponent(detail.brandName)}`
                  )
                }
              >
                브랜드 상세 보기
              </InlineLink>
            </FieldRow>
            {/*
              시안의 `회원 상세 보기`는 아직 달지 않았다 — 어드민에 소비자 회원 상세
              라우트가 없어(목록만 있다) 링크를 걸면 없는 화면으로 보낸다.
            */}
            <FieldRow label="작성자">{detail.writerName}</FieldRow>
            <FieldRow label="공개 여부">
              {/* 비밀글은 상태가 아니라 분류라 점 없는 배지를 쓴다(시안 C1 주석) */}
              {detail.secret ? (
                <StatusBadge variant="neutral" hideDot>
                  {detail.visibilityName}
                </StatusBadge>
              ) : (
                detail.visibilityName
              )}
            </FieldRow>
            <FieldRow label="등록일시">
              <span className="tabular-nums">
                {formatDateTimeShort(detail.createdAt)}
              </span>
            </FieldRow>
          </DetailCard>

          <DetailCard
            title="문의 내용"
            note="소비자 입력 · 250자 이내 · 사진 최대 3장"
          >
            <div className="pt-2">
              <ThreadMessage
                authorName={detail.writerName}
                roleLabel="소비자"
                sentAt={detail.createdAt}
                content={detail.content}
                imageUrls={detail.imageUrls}
              />
            </div>
          </DetailCard>

          {/*
            답변대기면 이 카드가 비어 있다. 카드를 감추지 않는 건 의도된 것이다 —
            "브랜드가 아직 답하지 않았다"는 사실 자체가 운영자가 봐야 할 정보다.
          */}
          <DetailCard
            title="브랜드 답변"
            note={detail.answererName ?? undefined}
          >
            {detail.answerContent ? (
              <div className="pt-2">
                <ThreadMessage
                  authorName={detail.answererName ?? detail.brandName}
                  roleLabel="브랜드"
                  sentAt={detail.answeredAt ?? detail.createdAt}
                  content={detail.answerContent}
                  emphasized
                />
                {detail.answerModifiedAt && (
                  <p className="mt-1.5 text-[11px] text-sz-n-500">
                    {formatDateTimeShort(detail.answerModifiedAt)}에 수정됨
                  </p>
                )}
              </div>
            ) : (
              <p className="py-3 text-[12px] text-sz-n-500">
                브랜드가 아직 답변하지 않았습니다. 상품 문의 답변은 브랜드
                책임이라 운영자가 대신 작성하지 않습니다.
              </p>
            )}
          </DetailCard>

          {/*
            삭제 요청 카드는 요청이 있는 건에만 그린다. 요청을 거쳐 삭제된 뒤에도
            **지우지 않는다**(§18-7) — 브랜드가 왜 요청했고 운영자가 무엇을 근거로
            집행했는지가 한 화면에서 대조돼야 분쟁 시 소명이 된다.
          */}
          {deleteRequest && (
            <DetailCard title="삭제 요청" note="브랜드 제출">
              <FieldRow label="요청 사유">{deleteRequest.reasonName}</FieldRow>
              {deleteRequest.detail && (
                <FieldRow label="상세 설명">{deleteRequest.detail}</FieldRow>
              )}
              <FieldRow label="요청 브랜드">
                {deleteRequest.requesterBrandName}
              </FieldRow>
              <FieldRow label="요청일시">
                <span className="tabular-nums">
                  {formatDateTimeShort(deleteRequest.requestedAt)}
                </span>
              </FieldRow>
              {deleteRequest.rejected && (
                <>
                  <FieldRow label="반려 사유">
                    {deleteRequest.rejectReasonName}
                  </FieldRow>
                  {deleteRequest.rejectReasonDetail && (
                    <FieldRow label="반려 상세 사유">
                      {deleteRequest.rejectReasonDetail}
                    </FieldRow>
                  )}
                  <FieldRow label="반려 처리">
                    <span className="tabular-nums">
                      {formatDateTimeShort(deleteRequest.rejectedAt)}
                    </span>
                    {deleteRequest.rejectedByName
                      ? ` · ${deleteRequest.rejectedByName}`
                      : ""}
                  </FieldRow>
                </>
              )}
            </DetailCard>
          )}
        </div>

        <div className="sticky top-0 flex flex-col gap-4">
          <DetailCard title="처리">
            <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3 pt-2">
              <span className="text-[12px] text-sz-n-500">현재 상태</span>
              <StatusBadge variant={variant}>{detail.statusLabel}</StatusBadge>
            </div>

            {/* 레이아웃은 고정이고 표시 항목만 상태별로 달라진다 */}
            <div className="pt-2">
              <MetaRow
                label="등록일시"
                value={
                  <span className="tabular-nums">
                    {formatDateTimeShort(meta.createdAt)}
                  </span>
                }
              />
              {meta.answeredAt && (
                <MetaRow
                  label="답변일시"
                  value={
                    <span className="tabular-nums">
                      {formatDateTimeShort(meta.answeredAt)}
                    </span>
                  }
                />
              )}
              {meta.answererName && (
                <MetaRow label="답변자" value={meta.answererName} />
              )}
              {meta.deleteRequestedAt && (
                <MetaRow
                  label="요청일시"
                  value={
                    <span className="tabular-nums">
                      {formatDateTimeShort(meta.deleteRequestedAt)}
                    </span>
                  }
                />
              )}
              {meta.deleteRequesterName && (
                <MetaRow label="요청자" value={meta.deleteRequesterName} />
              )}
              {meta.deletedAt && (
                <MetaRow
                  label="삭제일시"
                  value={
                    <span className="tabular-nums">
                      {formatDateTimeShort(meta.deletedAt)}
                    </span>
                  }
                />
              )}
              {meta.processedByName && (
                <MetaRow label="처리자" value={meta.processedByName} />
              )}
            </div>

            {/* 삭제 사유는 내부 기록용이라 이 패널에서만 보인다(작성자 미통지) */}
            {meta.deleteReasonName && (
              <div className="mt-2 border-t border-sz-n-100 pt-2.5">
                <ReasonBlock label="삭제 사유" value={meta.deleteReasonName} />
                {meta.deleteReasonDetail && (
                  <ReasonBlock
                    label="상세 사유"
                    value={meta.deleteReasonDetail}
                  />
                )}
              </div>
            )}

            {isDeleted ? (
              <p className="mb-2 mt-2.5 text-[11px] leading-[1.55] text-sz-n-500">
                원문과 처리 내역은 내부 기록으로만 보관됩니다. 삭제를 되돌리는
                경로는 제공하지 않습니다.
              </p>
            ) : (
              <>
                <div className="mt-4 flex flex-col gap-2">
                  {detail.canExecuteDelete && (
                    <button
                      type="button"
                      onClick={() => setIsDeleteOpen(true)}
                      className="inline-flex h-9 w-full items-center justify-center rounded-[6px] bg-sz-danger-text px-3.5 text-[12px] font-medium text-white hover:bg-[#8f2828]"
                    >
                      삭제
                    </button>
                  )}
                  {/* 반려는 삭제 요청이 있을 때만 노출한다 — 없으면 기각할 대상이 없다 */}
                  {detail.canReject && (
                    <button
                      type="button"
                      onClick={() => setIsRejectOpen(true)}
                      className="inline-flex h-9 w-full items-center justify-center rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[12px] font-medium text-sz-n-900 hover:bg-sz-n-100"
                    >
                      반려
                    </button>
                  )}
                </div>
                <p className="mb-2 mt-2.5 text-[11px] leading-[1.55] text-sz-n-500">
                  상품 문의 답변은 브랜드 책임입니다. 운영자는 부적절한 게시물을
                  내리거나 브랜드의 삭제 요청을 기각하는 판단만 합니다.
                </p>
              </>
            )}
          </DetailCard>

          <DetailCard title="처리 이력" flushBody>
            <HistoryList items={historyItems} />
          </DetailCard>
        </div>
      </div>

      <DecisionModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="상품 문의 삭제 처리"
        reasonLabel="삭제 사유"
        reasons={PRODUCT_INQUIRY_DELETE_REASONS}
        hint="“기타(직접 입력)”를 선택한 경우에만 상세 사유가 필수입니다. 사유는 내부 기록용으로, 작성자에게 노출되지 않습니다."
        notice={
          <>
            삭제 즉시 소비자·브랜드 화면에서 비노출됩니다. 사유는{" "}
            <b className="font-semibold">내부 감사 기록용</b>이며 작성자에게
            통지하지 않습니다.
          </>
        }
        tone="danger"
        submitLabel="삭제"
        isSubmitting={isDeleting}
        onSubmit={handleDelete}
      />

      <DecisionModal
        open={isRejectOpen}
        onOpenChange={setIsRejectOpen}
        title="삭제 요청 반려"
        reasonLabel="반려 사유"
        reasons={PRODUCT_INQUIRY_REJECT_REASONS}
        hint="“기타(직접 입력)”를 선택한 경우에만 상세 사유가 필수입니다."
        notice={
          <>
            반려하면 문의는 <b className="font-semibold">게시 상태로 유지</b>
            되고 상태는 요청 직전으로 돌아갑니다. 반려 사유는{" "}
            <b className="font-semibold">요청 브랜드에 전달</b>되며 작성자에게는
            통지하지 않습니다.
          </>
        }
        tone="primary"
        submitLabel="반려"
        isSubmitting={isRejecting}
        onSubmit={handleReject}
      />
    </>
  );
}

interface InlineLinkProps {
  onClick: () => void;
  children: ReactNode;
}

/** 시안 `.flink` — 필드 값 옆 인라인 이동 링크. 우상단 이동 버튼군과 섞지 않는다 */
function InlineLink(props: InlineLinkProps) {
  const { onClick, children } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[12px] text-sz-n-600 underline underline-offset-2 hover:text-sz-accent-600"
    >
      {children}
    </button>
  );
}

interface MetaRowProps {
  label: string;
  value: ReactNode;
}

/** 시안 `.mrow` — 라벨 좌 · 값 우 정렬의 메타 정보 한 줄 */
function MetaRow(props: MetaRowProps) {
  const { label, value } = props;

  return (
    <div className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0">
      <span className="text-sz-n-500">{label}</span>
      <span className="text-right font-medium text-sz-n-900">{value}</span>
    </div>
  );
}

interface ReasonBlockProps {
  label: string;
  value: string;
}

/** 시안 `.st-rsn` — 라벨을 위에 두고 사유 원문을 아래 줄에 그대로 보여준다 */
function ReasonBlock(props: ReasonBlockProps) {
  const { label, value } = props;

  return (
    <div className="mt-2 first:mt-0">
      <span className="mb-[3px] block text-[11px] text-sz-n-500">{label}</span>
      <span className="block text-[12px] leading-[1.6] text-sz-n-900">
        {value}
      </span>
    </div>
  );
}
