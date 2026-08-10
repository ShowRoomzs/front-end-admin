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
  type AdminProductDetail,
  type ProductHideReasonType,
  type ProductHistoryItem,
  type ProductNotice,
  type ProductProcessingHistoryType,
} from "@/features/product/services/productService";
import {
  getDisplayStatusBadge,
  getGroupBuyStatusBadge,
} from "@/features/product/utils/statusBadge";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

/**
 * 처리자 표기 — 서버는 **운영자가 처리한 이력에만** processorName을 채운다.
 * 브랜드가 일으킨 이력(상품 등록·정보 수정·미진열 요청·재검토 대기 전환)은 항상
 * null로 내려오므로 브랜드(마켓)명으로 대체한다. 시안의 "2026.06.02 10:14 · 글로우랩"이
 * 바로 이 경우다.
 */
function resolveActor(
  item: Pick<ProductHistoryItem, "processorName">,
  marketName: string | null
) {
  return item.processorName ?? marketName ?? null;
}

/** 특정 유형의 최신 이력 1건 — 배너에 붙는 "언제·누가"를 뽑는 데 쓴다 */
function findLatestHistory(
  detail: AdminProductDetail,
  types: Array<ProductProcessingHistoryType>
) {
  // 서버가 이미 최신순으로 정렬해 내려준다
  return (detail.processingHistory ?? []).find((item) =>
    types.includes(item.historyType)
  );
}

function joinMeta(at: string | null | undefined, actor: string | null) {
  const meta = [at ? formatDateTimeShort(at) : null, actor]
    .filter(Boolean)
    .join(" · ");
  return meta ? `(${meta})` : "";
}

/** 상태별 상단 배너 — 진열중은 배너 없음(§12-3) */
function StatusBanner(props: {
  status: "HIDDEN" | "PENDING_REVIEW" | "HIDE_REQUEST";
  hideReasonLabel?: string;
  meta: string;
}) {
  const { status, hideReasonLabel, meta } = props;

  if (status === "PENDING_REVIEW") {
    return (
      <div className="flex gap-2 rounded-[6px] bg-sz-warning-bg px-3.5 py-3 text-[11px] leading-relaxed text-[#6b4d16]">
        <span>⚠</span>
        <span>
          <b>브랜드가 상품 정보를 수정</b>해 재검토 대기 상태입니다{meta}. 아래
          내용을 확인하고 문제 없으면 다시 진열하세요.
        </span>
      </div>
    );
  }

  if (status === "HIDE_REQUEST") {
    return (
      <div className="flex gap-2 rounded-[6px] bg-sz-n-100 px-3.5 py-3 text-[11px] leading-relaxed text-sz-n-600">
        <span>ⓘ</span>
        <span>
          <b>브랜드 요청</b>으로 미진열 상태입니다{meta}. 정보 오류로 인한 조치가
          아니므로, 브랜드가 이후 상품 정보를 수정해도{" "}
          <b>재검토 대기로 전환되지 않습니다.</b>
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-2 rounded-[6px] bg-sz-danger-bg px-3.5 py-3 text-[11px] leading-relaxed text-sz-danger-text">
      <span>⚠</span>
      <span>
        <b>{hideReasonLabel ?? "미진열"}</b>로 미진열 상태입니다{meta}. 브랜드가
        이후 상품 정보를 수정하면 <b>재검토 대기로 전환됩니다.</b>
      </span>
    </div>
  );
}

const SKU_HEAD_CLASS =
  "border-b border-sz-n-200 bg-sz-n-100 px-3 py-2.5 text-center text-[11px] font-medium text-sz-n-500";
const SKU_CELL_CLASS =
  "border-b border-sz-n-100 px-3 py-[9px] text-center text-[12px] text-sz-n-900 last:border-b-0";

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
    if (!detail) {
      return [];
    }

    // 서버가 이미 최신순 정렬 + title을 채워 내려준다 — 라벨을 다시 만들지 않는다
    return (detail.processingHistory ?? []).map((item) => {
      let tone: HistoryItem["tone"] = "accent";
      if (
        item.historyType === "HIDDEN" ||
        item.historyType === "HIDE_REQUESTED"
      ) {
        tone = "muted";
      } else if (item.historyType === "PENDING_REVIEW") {
        tone = "warn";
      } else if (
        item.historyType === "REDISPLAYED" ||
        item.historyType === "PRODUCT_CREATED"
      ) {
        tone = "success";
      }

      return {
        label: item.title,
        processedAt: item.createdAt,
        processorName: resolveActor(item, detail.marketName),
        tone,
        detail: item.hideReason?.detail
          ? { title: "상세 사유", text: item.hideReason.detail }
          : null,
      };
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
  const isHideRequest = detail.displayStatus === "HIDE_REQUEST";
  const hideReasonLabel = detail.latestHideInfo
    ? (PRODUCT_HIDE_REASON_LABELS[detail.latestHideInfo.hideReasonType] ??
      detail.latestHideInfo.hideReasonType)
    : undefined;

  // 배너의 "언제·누가"는 상태별로 근거가 되는 이력이 다르다
  let bannerMeta = "";
  if (detail.displayStatus === "PENDING_REVIEW") {
    const source = findLatestHistory(detail, [
      "PENDING_REVIEW",
      "PRODUCT_INFO_UPDATED",
    ]);
    bannerMeta = source
      ? joinMeta(source.createdAt, resolveActor(source, detail.marketName))
      : "";
  } else if (isHideRequest) {
    const source = findLatestHistory(detail, ["HIDE_REQUESTED"]);
    bannerMeta = source
      ? joinMeta(source.createdAt, resolveActor(source, detail.marketName))
      : "";
  } else if (detail.displayStatus === "HIDDEN") {
    bannerMeta = joinMeta(
      detail.latestHideInfo?.hiddenAt,
      detail.latestHideInfo?.processorName ?? null
    );
  }

  const optionGroupCount = detail.optionGroups?.length ?? 0;
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
              meta={bannerMeta}
            />
          )}

          {/*
            기본 정보는 시안 그대로 4행이다(상품명·브랜드·정가·카테고리).
            상품번호·브랜드상품코드는 목록 검색용 식별자라 상세에 두지 않는다(rev.2).
          */}
          <DetailCard title="기본 정보">
            <FieldRow label="상품명">{detail.name}</FieldRow>
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
              optionGroupCount > 0
                ? `옵션 그룹 사용 · 그룹 ${optionGroupCount}개 · 조합 ${variants.length}개`
                : "옵션 그룹 미사용"
            }
          >
            <table className="my-2 w-full table-fixed border-collapse">
              <thead>
                <tr>
                  {/* 헤더 기본 정렬은 가운데, 첫 열(조합명)만 왼쪽 — 명시도 문제로 어긋나기 쉬운 지점(§4-4) */}
                  <th className={`${SKU_HEAD_CLASS} text-left`}>조합명</th>
                  <th className={`w-[90px] ${SKU_HEAD_CLASS}`}>옵션가</th>
                  <th className={`w-[90px] ${SKU_HEAD_CLASS}`}>재고 수량</th>
                  <th className={`w-[60px] ${SKU_HEAD_CLASS}`}>대표</th>
                  <th className={`w-[100px] ${SKU_HEAD_CLASS}`}>조합 진열</th>
                </tr>
              </thead>
              <tbody>
                {variants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-[12px] text-sz-n-400"
                    >
                      등록된 옵션 조합이 없습니다.
                    </td>
                  </tr>
                ) : (
                  variants.map((variant) => {
                    /*
                      서버는 조합별 **절대 판매가**(옵션가가 이미 더해진 값)를 준다.
                      시안의 "옵션가"는 정가 대비 추가금이므로 차액으로 되돌린다 —
                      차액이 0이면 정가 그대로라는 뜻이라 "정가 적용"으로 표기한다.
                    */
                    const extraPrice = variant.regularPrice - detail.regularPrice;

                    return (
                      <tr key={variant.variantId}>
                        <td
                          className={`${SKU_CELL_CLASS} text-left`}
                        >
                          {variant.name || "기본 조합(옵션 없음)"}
                        </td>
                        <td className={SKU_CELL_CLASS}>
                          {extraPrice === 0 ? (
                            <span className="text-[11px] font-semibold text-sz-accent-600">
                              정가 적용
                            </span>
                          ) : (
                            `${extraPrice > 0 ? "+" : "-"}${Math.abs(extraPrice).toLocaleString()}원`
                          )}
                        </td>
                        <td className={SKU_CELL_CLASS}>
                          {/* 재고 0이면 품절 배지 자동 — 별도 필드가 아니라 재고에서 파생된다(§3-4) */}
                          {variant.stock === 0 ? (
                            <StatusBadge variant="neutral" hideDot>
                              품절
                            </StatusBadge>
                          ) : (
                            variant.stock.toLocaleString()
                          )}
                        </td>
                        <td className={SKU_CELL_CLASS}>
                          {variant.isRepresentative ? (
                            <span className="text-[11px] font-semibold text-sz-accent-600">
                              대표
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className={SKU_CELL_CLASS}>
                          {/*
                            조합 단위 진열은 **진열/미진열 2종뿐**이다(rev.7) —
                            "요청" 구분은 상품 단위 개념이라 SKU에 내려오면 안 된다.
                            서버에 조합별 플래그가 없어 상품 진열 상태에서 파생한다.
                          */}
                          <StatusBadge variant={isDisplayed ? "success" : "danger"}>
                            {isDisplayed ? "진열" : "미진열"}
                          </StatusBadge>
                        </td>
                      </tr>
                    );
                  })
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
            note="전자상거래법 필수 표시 · 화장품"
          >
            {/*
              11필드는 등록 시 전부 필수라 "누락" 상태가 성립하지 않는다(rev.8).
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
          <DetailCard title="상태 관리">
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
                  {isHideRequest ? (
                    <>
                      브랜드 요청으로 인한 미진열은 <b>운영자 재검수 없이도</b>{" "}
                      브랜드가 준비되는 대로 다시 진열을 요청할 수 있습니다. 다시
                      진열 처리 자체는 기존과 동일하게 <b>운영자만</b>{" "}
                      수행합니다.
                    </>
                  ) : (
                    <>
                      공구 연결 여부와 무관하게 <b>운영자만</b> 다시 진열할 수
                      있습니다(브랜드 화면엔 진열 토글 자체가 없음).
                    </>
                  )}
                </p>
              </>
            )}
          </DetailCard>

          {/*
            미진열 사유는 별도 카드로 빼지 않는다 — 시안은 처리 이력 항목 아래
            인용 박스(`.hist-sub`)로만 보여준다. 두 군데에 같은 내용을 두면
            어느 쪽이 최신인지 헷갈린다.
          */}
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
