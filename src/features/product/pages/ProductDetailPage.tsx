import DetailCard, {
  FieldRow,
} from "@/common/components/DetailCard/DetailCard";
import HistoryList, {
  type HistoryItem,
} from "@/common/components/HistoryList/HistoryList";
import { PreviewModal } from "@/common/components/PreviewModal/PreviewModal";
import RecordNav from "@/common/components/RecordNav/RecordNav";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { queryClient } from "@/common/lib/queryClient";
import { formatDateTimeShort } from "@/common/utils/formatDate";
import RelistModal from "@/features/product/components/RelistModal/RelistModal";
import UnlistModal from "@/features/product/components/UnlistModal/UnlistModal";
import {
  PRODUCT_HIDE_REASON_LABELS,
  PRODUCT_NOTICE_FIELDS,
} from "@/features/product/constants/params";
import {
  PRODUCT_DETAIL_QUERY_KEY,
  PRODUCT_LIST_QUERY_KEY,
} from "@/features/product/constants/queryKey";
import { useGetProductDetail } from "@/features/product/hooks/useGetProductDetail";
import {
  parseProductNotice,
  productService,
  type ProductHideReasonType,
  type ProductNotice,
} from "@/features/product/services/productService";
import {
  getDisplayStatusBadge,
  getGroupBuyStatusBadge,
} from "@/features/product/utils/statusBadge";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

/** 상태별 상단 배너 — 진열중은 배너 없음(§12-3) */
function StatusBanner(props: {
  status: "HIDDEN" | "PENDING_REVIEW" | "HIDE_REQUEST";
  hideReasonLabel?: string;
  hiddenAt?: string | null;
  processorName?: string | null;
}) {
  const { status, hideReasonLabel, hiddenAt, processorName } = props;

  if (status === "PENDING_REVIEW") {
    return (
      <div className="mb-3 flex gap-2 rounded-[6px] bg-sz-warning-bg px-3.5 py-3 text-[11px] leading-relaxed text-[#6b4d16]">
        <span>⚠</span>
        <span>
          <b>브랜드가 상품 정보를 수정</b>해 재검토 대기 상태입니다. 아래 내용을
          확인하고 문제 없으면 다시 진열하세요.
        </span>
      </div>
    );
  }

  const meta = [hiddenAt ? formatDateTimeShort(hiddenAt) : null, processorName]
    .filter(Boolean)
    .join(" · ");

  if (status === "HIDE_REQUEST") {
    return (
      <div className="mb-3 flex gap-2 rounded-[6px] bg-sz-n-100 px-3.5 py-3 text-[11px] leading-relaxed text-sz-n-600">
        <span>ⓘ</span>
        <span>
          <b>브랜드 요청</b>으로 미진열 상태입니다{meta && `(${meta})`}. 정보
          오류로 인한 조치가 아니므로, 브랜드가 이후 상품 정보를 수정해도{" "}
          <b>재검토 대기로 전환되지 않습니다.</b>
        </span>
      </div>
    );
  }

  return (
    <div className="mb-3 flex gap-2 rounded-[6px] bg-sz-danger-bg px-3.5 py-3 text-[11px] leading-relaxed text-sz-danger-text">
      <span>⚠</span>
      <span>
        <b>{hideReasonLabel ?? "미진열"}</b>로 미진열 상태입니다
        {meta && `(${meta})`}. 브랜드가 이후 상품 정보를 수정하면{" "}
        <b>재검토 대기로 전환됩니다.</b>
      </span>
    </div>
  );
}

export default function ProductDetailPage() {
  const { productId: productIdParam } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const productId = Number(productIdParam);

  const { data: detail } = useGetProductDetail(productId);

  const [isUnlistOpen, setIsUnlistOpen] = useState(false);
  const [isRelistOpen, setIsRelistOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  /** 대표 이미지가 앞, 커버가 뒤 — 미리보기 인덱스도 이 순서를 따른다 */
  const images = useMemo(() => {
    if (!detail) {
      return [];
    }
    return [detail.representativeImageUrl, ...(detail.coverImageUrls ?? [])]
      .filter((url): url is string => !!url);
  }, [detail]);

  const notice: ProductNotice = useMemo(
    () => parseProductNotice(detail?.productNotice ?? null),
    [detail]
  );

  const historyItems = useMemo<Array<HistoryItem>>(() => {
    const history = detail?.processingHistory ?? [];

    // 서버가 이미 최신순 정렬 + title을 채워 내려준다 — 라벨을 다시 만들지 않는다
    return history.map((item) => {
      const processedBy = item.processorName;
      const label = processedBy ? `${item.title} · ${processedBy}` : item.title;

      let tone: HistoryItem["tone"] = "accent";
      if (item.historyType === "HIDDEN" || item.historyType === "HIDE_REQUESTED") {
        tone = "muted";
      } else if (
        item.historyType === "REDISPLAYED" ||
        item.historyType === "PRODUCT_CREATED"
      ) {
        tone = "success";
      }

      return { label, processedAt: item.createdAt, tone };
    });
  }, [detail]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [PRODUCT_DETAIL_QUERY_KEY, productId],
    });
    queryClient.invalidateQueries({ queryKey: [PRODUCT_LIST_QUERY_KEY] });
  }, [productId]);

  const handleUnlist = useCallback(
    async (reasonType: ProductHideReasonType, reasonDetail: string) => {
      if (!detail) {
        return;
      }
      setIsSubmitting(true);
      try {
        await productService.updateDisplayStatus(detail.productId, {
          displayStatus: "HIDDEN",
          hideReasonType: reasonType,
          hideDetail: reasonDetail || undefined,
        });
        refresh();
        setIsUnlistOpen(false);
        toast.success(`${detail.name}을(를) 미진열 처리했습니다.`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [detail, refresh]
  );

  const handleRelist = useCallback(async () => {
    if (!detail) {
      return;
    }
    setIsSubmitting(true);
    try {
      await productService.updateDisplayStatus(detail.productId, {
        displayStatus: "DISPLAY",
      });
      refresh();
      setIsRelistOpen(false);
      toast.success(`${detail.name}을(를) 다시 진열했습니다.`);
    } finally {
      setIsSubmitting(false);
    }
  }, [detail, refresh]);

  if (!detail) {
    return null;
  }

  const displayBadge = getDisplayStatusBadge(detail.displayStatus);
  const groupBuyBadge = getGroupBuyStatusBadge(detail.groupBuyStatus);
  const isDisplayed = detail.displayStatus === "DISPLAY";
  const hideReasonLabel = detail.latestHideInfo
    ? (PRODUCT_HIDE_REASON_LABELS[detail.latestHideInfo.hideReasonType] ??
      detail.latestHideInfo.hideReasonType)
    : undefined;

  const hasOptionGroups = (detail.optionGroups?.length ?? 0) > 0;
  const variants = detail.variants ?? [];

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <h1 className="text-[20px] font-semibold text-sz-n-900">
          {detail.name}
        </h1>
        <RecordNav onList={() => navigate("/product/list")} />
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        {/* 좌측 — 상품 내용(조회 전용, 어드민은 상품 정보를 수정할 수 없다) */}
        <div className="flex flex-col gap-4">
          {detail.displayStatus !== "DISPLAY" && (
            <StatusBanner
              status={detail.displayStatus}
              hideReasonLabel={hideReasonLabel}
              hiddenAt={detail.latestHideInfo?.hiddenAt}
              processorName={detail.latestHideInfo?.processorName}
            />
          )}

          <DetailCard title="기본 정보">
            <FieldRow label="상품명">{detail.name}</FieldRow>
            <FieldRow label="상품번호">{detail.productNumber}</FieldRow>
            <FieldRow label="브랜드">{detail.marketName}</FieldRow>
            <FieldRow label="정가">
              {detail.regularPrice.toLocaleString()}원
            </FieldRow>
            <FieldRow label="카테고리">{detail.categoryName || "—"}</FieldRow>
          </DetailCard>

          <DetailCard title="상품 이미지" note="클릭하여 확대">
            {images.length === 0 ? (
              <p className="py-2 text-[12px] text-sz-n-500">
                등록된 이미지가 없습니다.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 pb-3 pt-1">
                {images.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setPreviewIndex(index)}
                    className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[6px] bg-sz-n-200 hover:ring-2 hover:ring-sz-accent-500"
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {index === 0 && (
                      <span className="absolute bottom-[3px] left-[3px] rounded-[4px] bg-sz-accent-500 px-[5px] py-px text-[9px] font-semibold text-white">
                        대표
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </DetailCard>

          <DetailCard
            title="옵션 · 재고(SKU)"
            note={
              hasOptionGroups
                ? `옵션 그룹 ${detail.optionGroups?.length}개 · 조합 ${variants.length}개`
                : "옵션 미사용"
            }
          >
            <table className="my-2 w-full table-fixed border-collapse">
              <thead>
                <tr>
                  {/* 헤더 기본 정렬은 가운데, 첫 열(조합명)만 왼쪽 — 명시도 문제로 어긋나기 쉬운 지점(§4-4) */}
                  <th className="border-b border-sz-n-200 bg-sz-n-50 px-2.5 py-2 text-left text-[11px] font-medium text-sz-n-500">
                    조합명
                  </th>
                  <th className="w-[90px] border-b border-sz-n-200 bg-sz-n-50 px-2.5 py-2 text-center text-[11px] font-medium text-sz-n-500">
                    판매가
                  </th>
                  <th className="w-[90px] border-b border-sz-n-200 bg-sz-n-50 px-2.5 py-2 text-center text-[11px] font-medium text-sz-n-500">
                    재고 수량
                  </th>
                  <th className="w-[60px] border-b border-sz-n-200 bg-sz-n-50 px-2.5 py-2 text-center text-[11px] font-medium text-sz-n-500">
                    대표
                  </th>
                </tr>
              </thead>
              <tbody>
                {variants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-2.5 py-4 text-center text-[12px] text-sz-n-400"
                    >
                      등록된 옵션 조합이 없습니다.
                    </td>
                  </tr>
                ) : (
                  variants.map((variant) => (
                    <tr key={variant.variantId}>
                      <td className="border-b border-sz-n-100 px-2.5 py-[9px] text-left text-[12px] text-sz-n-900">
                        {variant.name || "기본 조합(옵션 없음)"}
                      </td>
                      <td className="border-b border-sz-n-100 px-2.5 py-[9px] text-center text-[12px] text-sz-n-900">
                        {variant.regularPrice.toLocaleString()}원
                      </td>
                      <td className="border-b border-sz-n-100 px-2.5 py-[9px] text-center text-[12px] text-sz-n-900">
                        {/* 재고 0이면 품절 배지 자동 — 별도 필드가 아니라 재고에서 파생된다(§3-4) */}
                        {variant.stock === 0 ? (
                          <StatusBadge variant="neutral" hideDot>
                            품절
                          </StatusBadge>
                        ) : (
                          variant.stock.toLocaleString()
                        )}
                      </td>
                      <td className="border-b border-sz-n-100 px-2.5 py-[9px] text-center text-[12px]">
                        {variant.isRepresentative ? (
                          <span className="text-[11px] font-semibold text-sz-accent-600">
                            대표
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DetailCard>

          <DetailCard title="상품 설명">
            {detail.description ? (
              <div
                className="py-1 pb-3 text-[12px] leading-relaxed text-sz-n-700 [&_img]:max-w-full"
                // 브랜드가 리치텍스트 에디터로 입력한 HTML을 그대로 보여준다
                dangerouslySetInnerHTML={{ __html: detail.description }}
              />
            ) : (
              <p className="py-2 text-[12px] text-sz-n-500">
                등록된 설명이 없습니다.
              </p>
            )}
          </DetailCard>

          <DetailCard
            title="상품 정보 제공 고시"
            note="전자상거래법 표시 항목 · 화장품"
          >
            {/*
              11필드는 등록 시 전부 필수라 "누락" 상태가 성립하지 않는다(§4-6).
              값이 비면 결함 표시 없이 "—"로만 둔다.
            */}
            {PRODUCT_NOTICE_FIELDS.map((field) => (
              <FieldRow key={field.key} label={field.label}>
                {notice[field.key as keyof ProductNotice] || "—"}
              </FieldRow>
            ))}
          </DetailCard>
        </div>

        {/* 우측 — 상태 관리 레일 */}
        <div className="sticky top-0 flex flex-col gap-4">
          <DetailCard title="상품 관리">
            <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3 pt-2">
              <span className="shrink-0 text-[12px] text-sz-n-500">
                진열 상태
              </span>
              <StatusBadge variant={displayBadge.variant}>
                {displayBadge.label}
              </StatusBadge>
            </div>
            <div className="flex items-center justify-between gap-2.5 pb-3 pt-3">
              <span className="shrink-0 text-[12px] text-sz-n-500">
                공구 상태
              </span>
              <StatusBadge variant={groupBuyBadge.variant} hideDot>
                {groupBuyBadge.label}
              </StatusBadge>
            </div>

            {isDisplayed ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsUnlistOpen(true)}
                  className="mt-1 inline-flex h-9 w-full items-center justify-center rounded-[6px] bg-sz-danger-text px-4 text-[13px] font-medium text-white hover:bg-[#8f2828]"
                >
                  미진열 처리
                </button>
                <p className="mt-2.5 text-[11px] leading-relaxed text-sz-n-500">
                  진행중인 공구가 있어도 미진열 처리 시{" "}
                  <b>소비자 노출만 즉시 중단</b>됩니다(공구 게시물·계약은 유지).
                  공구 자체를 중단하려면 <b>공구 관리</b>에서 별도 취소하세요.
                </p>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsRelistOpen(true)}
                  className="mt-1 inline-flex h-9 w-full items-center justify-center rounded-[6px] bg-sz-accent-500 px-4 text-[13px] font-medium text-white hover:bg-sz-accent-600"
                >
                  다시 진열
                </button>
                <p className="mt-2.5 text-[11px] leading-relaxed text-sz-n-500">
                  진열 전환은 <b>운영자만</b> 수행할 수 있습니다(브랜드 화면에는
                  진열 토글 자체가 없습니다).
                </p>
              </>
            )}
          </DetailCard>

          {detail.latestHideInfo && (
            <DetailCard title="미진열 사유" note="브랜드에게 공개됨">
              <FieldRow label="사유">
                {hideReasonLabel ?? "—"}
              </FieldRow>
              <FieldRow label="상세 내용">
                {detail.latestHideInfo.hideDetail || "—"}
              </FieldRow>
              <FieldRow label="처리">
                {[
                  detail.latestHideInfo.processorName,
                  formatDateTimeShort(detail.latestHideInfo.hiddenAt),
                ]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </FieldRow>
            </DetailCard>
          )}

          <DetailCard title="처리 이력" note="최신순" flushBody>
            <HistoryList items={historyItems} />
          </DetailCard>
        </div>
      </div>

      <UnlistModal
        open={isUnlistOpen}
        onOpenChange={setIsUnlistOpen}
        productName={detail.name}
        isSubmitting={isSubmitting}
        onSubmit={handleUnlist}
      />
      <RelistModal
        open={isRelistOpen}
        onOpenChange={setIsRelistOpen}
        productName={detail.name}
        isSubmitting={isSubmitting}
        onSubmit={handleRelist}
      />
      <PreviewModal
        isOpen={previewIndex !== null}
        onOpenChange={(open) => setPreviewIndex(open ? (previewIndex ?? 0) : null)}
        imageUrl={images[previewIndex ?? 0] ?? ""}
        currentIndex={previewIndex ?? 0}
        fileLength={images.length}
        onIndexChange={setPreviewIndex}
      />
    </div>
  );
}
