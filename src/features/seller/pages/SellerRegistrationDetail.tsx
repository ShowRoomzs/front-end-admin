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
import ApplicationApprovalModal from "@/features/seller/components/ApplicationApprovalModal/ApplicationApprovalModal";
import ApplicationRejectionModal from "@/features/seller/components/ApplicationRejectionModal/ApplicationRejectionModal";
import DocumentPreviewModal, {
  type SellerDocument,
} from "@/features/seller/components/DocumentPreviewModal/DocumentPreviewModal";
import {
  SELLER_REGISTRATION_DETAIL_QUERY_KEY,
  SELLER_REGISTRATION_LIST_QUERY_KEY,
} from "@/features/seller/constants/queryKey";
import { useGetSellerRegistrationDetail } from "@/features/seller/hooks/useGetSellerRegistrationDetail";
import {
  sellerService,
  type RejectionReason,
} from "@/features/seller/services/sellerService";
import { SELLER_REJECTION_REASON_LABELS } from "@/features/seller/constants/params";
import { formatElapsed } from "@/features/seller/utils/elapsedTime";
import { getApplicationStatusBadge } from "@/features/seller/utils/statusBadge";
import { formatFileSize } from "@/common/utils/formatFileSize";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate, useParams } from "react-router-dom";

/**
 * 반려 건이면 파기 정책(기능요구사항 §3-2)에 따라 "파기됨"으로 표시한다.
 *
 * 백엔드가 실제로 필드를 파기하므로 대부분 null로 내려오지만,
 * Seller.name·Market.csNumber처럼 리터럴 "파기됨" 문자열로 덮어쓰는 필드도 있어
 * 값 유무와 무관하게 상태로 판단한다. 값이 없을 뿐인 경우("—")와 구분된다.
 */
function renderValue(value: string | null | undefined, isPurged: boolean) {
  if (isPurged) {
    return <PurgedValue />;
  }
  return value || "—";
}

export default function SellerRegistrationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // 라우트 파라미터는 신청서 ID다. 승인/반려는 응답의 sellerId로 처리한다.
  const applicationId = Number(id);

  const { data: detail } = useGetSellerRegistrationDetail(applicationId);

  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isRejectionOpen, setIsRejectionOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // 목록에서 넘겨받은 형제 건 ID — 이전/다음 이동 계산용
  const siblingIds = (location.state as { siblingIds?: Array<number> } | null)
    ?.siblingIds;
  const currentSiblingIndex = siblingIds?.indexOf(applicationId) ?? -1;

  const isPending = detail?.status === "PENDING";
  const isRejected = detail?.status === "REJECTED";

  const documents = useMemo<Array<SellerDocument>>(() => {
    if (!detail) {
      return [];
    }
    const candidates: Array<SellerDocument> = [
      {
        key: "businessLicense",
        label: "사업자등록증 사본",
        fileName: "사업자등록증_사본.jpg",
        url: detail.businessLicenseImageUrl ?? "",
        compareRows: [
          {
            label: "사업자등록번호",
            value: detail.businessRegistrationNumber ?? "—",
          },
          {
            label: "사업자등록증 상호명",
            value: detail.businessCompanyName ?? "—",
          },
          { label: "대표자명", value: detail.representativeName ?? "—" },
          { label: "업태", value: detail.businessCategory ?? "—" },
          { label: "사업장 주소", value: detail.businessAddress ?? "—" },
        ],
      },
      {
        key: "mailOrderLicense",
        label: "통신판매업신고증 사본",
        fileName: "통신판매업신고증_사본.jpg",
        url: detail.mailOrderLicenseImageUrl ?? "",
        compareRows: [
          {
            label: "통신판매업 신고번호",
            value: detail.mailOrderSalesNumber ?? "—",
          },
          {
            label: "사업자등록증 상호명",
            value: detail.businessCompanyName ?? "—",
          },
        ],
      },
      {
        key: "bankBook",
        label: "통장 사본",
        fileName: "통장_사본.jpg",
        url: detail.bankBookImageUrl ?? "",
        compareRows: [
          { label: "은행명", value: detail.settlementBankName ?? "—" },
          { label: "예금주명", value: detail.accountHolderName ?? "—" },
          { label: "계좌번호", value: detail.accountNumber ?? "—" },
        ],
      },
    ];
    // 반려 건의 첨부는 파기 대상 — 서버가 아직 URL을 지우지 않아도 노출하지 않는다
    if (detail.status === "REJECTED") {
      return [];
    }
    return candidates.filter((document_) => document_.url);
  }, [detail]);

  // 파일 용량은 API에 없어 문서 URL에 HEAD 요청을 보내 Content-Length로 추정한다.
  // CORS로 헤더를 못 읽으면 조용히 표시하지 않는다(에러 노출 안 함).
  const [fileSizes, setFileSizes] = useState<Record<string, number>>({});
  const fetchedDocumentKeys = useRef<Set<string>>(new Set());
  useEffect(() => {
    let cancelled = false;
    documents.forEach((document_) => {
      if (!document_.url || fetchedDocumentKeys.current.has(document_.key)) {
        return;
      }
      fetchedDocumentKeys.current.add(document_.key);
      fetch(document_.url, { method: "HEAD" })
        .then((res) => {
          const length = res.headers.get("content-length");
          if (!cancelled && length) {
            setFileSizes((prev) => ({ ...prev, [document_.key]: Number(length) }));
          }
        })
        .catch(() => {
          // CORS 차단 등 — 용량 표시를 생략할 뿐 오류로 취급하지 않는다
        });
    });
    return () => {
      cancelled = true;
    };
  }, [documents]);

  const historyItems = useMemo<Array<HistoryItem>>(() => {
    const history = detail?.processingHistory ?? [];
    // 처리자 이름 필드가 API에 없어 로그인 아이디(이메일)로 대신 표기한다.
    // 이름 필드가 생기면 여기 processedBy만 바꾸면 된다.
    const processedBy = detail?.processorLoginId ?? "—";

    const sorted = [...history].sort((a, b) =>
      (a.processedAt ?? "").localeCompare(b.processedAt ?? "")
    );

    const items: Array<HistoryItem> = [];
    for (const item of sorted) {
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
          label: "계정 · 제출 정보 파기",
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
      queryKey: [SELLER_REGISTRATION_DETAIL_QUERY_KEY, applicationId],
    });
    queryClient.invalidateQueries({
      queryKey: [SELLER_REGISTRATION_LIST_QUERY_KEY],
    });
  }, [applicationId]);

  const handleApprove = useCallback(async () => {
    if (!detail) {
      return;
    }
    setIsSubmitting(true);
    try {
      await sellerService.updateSellerRegistrationStatus(detail.sellerId, {
        status: "APPROVED",
      });
      refresh();
      setIsApprovalOpen(false);
      toast.success(`${detail.marketName} 입점 신청을 승인했습니다.`);
    } finally {
      setIsSubmitting(false);
    }
  }, [detail, refresh]);

  const handleReject = useCallback(
    async (reasonType: RejectionReason, reasonDetail: string) => {
      if (!detail) {
        return;
      }
      setIsSubmitting(true);
      try {
        await sellerService.updateSellerRegistrationStatus(detail.sellerId, {
          status: "REJECTED",
          rejectionReasonType: reasonType,
          rejectionReasonDetail: reasonDetail || undefined,
        });
        refresh();
        setIsRejectionOpen(false);
        toast.success(`${detail.marketName} 입점 신청을 반려했습니다.`);
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
      navigate(`/market/registration/${nextId}`, { state: { siblingIds } });
    },
    [currentSiblingIndex, navigate, siblingIds]
  );

  if (!detail) {
    return null;
  }

  const statusBadge = getApplicationStatusBadge(
    detail.status,
    detail.applicationDate,
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
          {detail.marketName}
        </h1>
        <RecordNav
          onList={() => navigate("/market/registration")}
          onPrev={hasPrev ? () => goSibling(-1) : undefined}
          onNext={hasNext ? () => goSibling(1) : undefined}
        />
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        {/* 좌측 — 신청 내용 */}
        <div className="flex flex-col gap-4">
          <DetailCard title="기본 정보" note={isRejected ? "파기됨" : undefined}>
            {isRejected && (
              <div className="my-2 flex gap-2 rounded-[6px] bg-sz-n-100 px-3.5 py-3 text-[11px] leading-relaxed text-sz-n-600">
                <span>ⓘ</span>
                <span>
                  반려 처리 시 <b>계정·제출 정보가 파기</b>되어 조회할 수
                  없습니다. 사업자등록번호는 <b>단방향 해시</b>로만 보존됩니다.
                </span>
              </div>
            )}
            <FieldRow label="브랜드명">{detail.marketName}</FieldRow>
            <FieldRow label="고객센터 전화">
              {renderValue(detail.csNumber, isRejected)}
            </FieldRow>
            <FieldRow label="판매 담당자">
              {renderValue(
                [detail.sellerName, detail.sellerContact]
                  .filter(Boolean)
                  .join(" · "),
                isRejected
              )}
            </FieldRow>
            <FieldRow label="계정 이메일">
              {renderValue(detail.email, isRejected)}
            </FieldRow>
          </DetailCard>

          <DetailCard
            title="사업자 정보"
            note={isRejected ? "파기됨" : undefined}
          >
            <FieldRow label="사업자 구분">
              {renderValue(detail.businessType, isRejected)}
            </FieldRow>
            <FieldRow label="사업자등록증 상호명">
              {renderValue(detail.businessCompanyName, isRejected)}
            </FieldRow>
            <FieldRow label="사업자등록번호">
              {renderValue(detail.businessRegistrationNumber, isRejected)}
            </FieldRow>
            <FieldRow label="업태">
              {renderValue(detail.businessCategory, isRejected)}
            </FieldRow>
            <FieldRow label="대표자명">
              {renderValue(detail.representativeName, isRejected)}
            </FieldRow>
            <FieldRow label="대표자 연락처">
              {renderValue(detail.representativeContact, isRejected)}
            </FieldRow>
            <FieldRow label="통신판매업 신고번호">
              {renderValue(detail.mailOrderSalesNumber, isRejected)}
            </FieldRow>
            <FieldRow label="사업장 주소">
              {renderValue(detail.businessAddress, isRejected)}
            </FieldRow>
            <FieldRow label="상세주소">
              {renderValue(detail.businessDetailAddress, isRejected)}
            </FieldRow>
            <FieldRow label="이메일 (tax용)">
              {renderValue(detail.taxEmail, isRejected)}
            </FieldRow>
            {detail.businessRegistrationNumberHash && (
              <FieldRow label="사업자등록번호 해시">
                <span className="font-mono">
                  {detail.businessRegistrationNumberHash}
                </span>
                <span className="ml-1.5 text-[11px] text-sz-n-500">
                  단방향 · 복원 불가
                </span>
              </FieldRow>
            )}
          </DetailCard>

          <DetailCard title="정산 정보" note={isRejected ? "파기됨" : undefined}>
            <FieldRow label="은행명">
              {renderValue(detail.settlementBankName, isRejected)}
            </FieldRow>
            <FieldRow label="예금주명">
              {renderValue(detail.accountHolderName, isRejected)}
            </FieldRow>
            {/* 통장 사본과 대조해야 하므로 계좌번호는 마스킹하지 않는다 */}
            <FieldRow label="계좌번호">
              {renderValue(detail.accountNumber, isRejected)}
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
              <MetaRow label="신청번호" value={`BRD-${detail.applicationId}`} />
              <MetaRow
                label="신청일"
                value={formatDateTimeShort(detail.applicationDate)}
              />
              {/* 승인 건은 처리일을 굳이 보여주지 않는다(반려 건은 파기 시각으로서 의미가 있어 유지) */}
              {detail.processedDate && detail.status !== "APPROVED" && (
                <MetaRow
                  label="처리일"
                  value={formatDateTimeShort(detail.processedDate)}
                />
              )}
              {/* 승인/반려로 처리가 끝난 건은 경과 시간이 의미가 없어 행 자체를 뺀다 */}
              {isPending && (
                <MetaRow
                  label="경과"
                  value={formatElapsed(detail.applicationDate) ?? "—"}
                />
              )}
              {detail.processorLoginId && (
                <MetaRow label="처리자" value={detail.processorLoginId} />
              )}
            </div>

            {isRejected && detail.rejectionReason && (
              <div className="mt-2.5 rounded-[6px] bg-sz-danger-bg px-3.5 py-3">
                <div className="mb-1 text-[11px] font-semibold text-sz-danger-text">
                  반려 사유
                </div>
                <div className="text-[11px] leading-relaxed text-sz-n-700">
                  {SELLER_REJECTION_REASON_LABELS[detail.rejectionReason] ??
                    detail.rejectionReason}
                  {detail.rejectionReasonDetail &&
                    ` - ${detail.rejectionReasonDetail}`}
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
                  승인 시 계정이 즉시 활성화됩니다.{" "}
                  <b className="text-sz-danger-text">
                    반려 시 계정·제출 정보가 파기
                  </b>
                  되며 되돌릴 수 없습니다.
                </p>
              </>
            ) : (
              <p className="mt-3 text-[11px] leading-relaxed text-sz-n-500">
                {isRejected ? (
                  <>
                    동일 이메일로 <b>재가입 가능</b>합니다. 재신청 시{" "}
                    <b>신규 건으로 새 행이 생성</b>되며, 본 건에는 누적되지
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

          <DetailCard
            title="심사 첨부 서류"
            note={isRejected ? "파기됨" : `${documents.length}종`}
          >
            {documents.length === 0 ? (
              <div className="py-2 text-[12px]">
                {isRejected ? (
                  <>
                    <PurgedValue />
                    <span className="ml-1.5 text-[11px] text-sz-n-500">
                      사업자등록증 · 통신판매업신고증 · 통장 사본
                    </span>
                  </>
                ) : (
                  <span className="text-sz-n-500">첨부된 서류가 없습니다.</span>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2 py-2">
                {documents.map((document_, index) => (
                  <div
                    key={document_.key}
                    className="flex items-center gap-2 rounded-[6px] border border-sz-n-200 px-2.5 py-2"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-sz-accent-50 text-[8px] font-bold text-sz-accent-600">
                      JPG
                    </span>
                    <span className="flex-1 text-[11px] leading-tight text-sz-n-900">
                      {document_.label}
                    </span>
                    {fileSizes[document_.key] !== undefined && (
                      <span className="text-[11px] text-sz-n-500">
                        {formatFileSize(fileSizes[document_.key])}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPreviewIndex(index)}
                      className="inline-flex h-[26px] items-center rounded-[6px] border border-sz-n-300 bg-white px-[9px] text-[11px] font-medium text-sz-n-900 hover:bg-sz-n-100"
                    >
                      미리보기
                    </button>
                  </div>
                ))}
              </div>
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
        marketName={detail.marketName}
        isSubmitting={isSubmitting}
        onApprove={handleApprove}
      />
      <ApplicationRejectionModal
        open={isRejectionOpen}
        onOpenChange={setIsRejectionOpen}
        marketName={detail.marketName}
        isSubmitting={isSubmitting}
        onReject={handleReject}
      />
      <DocumentPreviewModal
        open={previewIndex !== null}
        onOpenChange={(open) => setPreviewIndex(open ? (previewIndex ?? 0) : null)}
        documents={documents}
        currentIndex={previewIndex ?? 0}
        onIndexChange={setPreviewIndex}
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
