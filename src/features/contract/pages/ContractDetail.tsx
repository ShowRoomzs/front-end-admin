import { usePageSubtitle } from "@/common/components/MainLayout/usePageSubtitle";
import RecordNav from "@/common/components/RecordNav/RecordNav";
import {
  ContentCard,
  DocumentsCard,
  FileSlot,
  ItemsCard,
  TermsCard,
} from "@/features/contract/components/detail/ContractCards";
import ProgressCard, {
  type SignDrafts,
} from "@/features/contract/components/detail/ProgressCard";
import StatusRail from "@/features/contract/components/detail/StatusRail";
import ApproveModal from "@/features/contract/components/modals/ApproveModal";
import CancelModal from "@/features/contract/components/modals/CancelModal";
import ConcludeModal from "@/features/contract/components/modals/ConcludeModal";
import ExpireModal from "@/features/contract/components/modals/ExpireModal";
import RejectModal from "@/features/contract/components/modals/RejectModal";
import SignatureSaveModal from "@/features/contract/components/modals/SignatureSaveModal";
import Btn from "@/features/contract/components/shared/Btn";
import {
  CONTRACT_LIST_PATH,
  THREAD_PATH,
} from "@/features/contract/constants/params";
import {
  useApproveContract,
  useCancelContract,
  useConcludeContract,
  useExpireContract,
  useHandleResend,
  useRejectContract,
  useUpdateSignatures,
  useUploadDocument,
} from "@/features/contract/hooks/useAdminContractMutations";
import {
  useDocumentSizes,
  useGetAdminContractDetail,
} from "@/features/contract/hooks/useAdminContractQueries";
import { useContractNeighbors } from "@/features/contract/hooks/useContractNeighbors";
import { adminContractService } from "@/features/contract/services/adminContractService";
import type {
  AdminContractDetail,
  AdminContractDownloadResponse,
} from "@/features/contract/types";
import {
  getApiErrorCode,
  getApiErrorMessage,
} from "@/features/contract/utils/apiError";
import { headerEvent } from "@/features/contract/utils/contractView";
import {
  formatMonthDayTime,
  sameMinute,
  toParts,
  toServerDateTime,
} from "@/features/contract/utils/datetime";
import axios from "axios";
import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
} from "react-router-dom";

type ModalKind =
  "approve" | "reject" | "signature" | "conclude" | "expire" | "cancel" | null;

type UploadType = "SIGNED_PDF" | "AUDIT_TRAIL";

const EMPTY_DRAFTS: SignDrafts = { brand: null, creator: null };

function initialDrafts(detail: AdminContractDetail): SignDrafts {
  const { brandSignedAt, creatorSignedAt } = detail.signature;
  return {
    brand: brandSignedAt ? toParts(brandSignedAt) : null,
    creator: creatorSignedAt ? toParts(creatorSignedAt) : null,
  };
}

/** 체크된 칸은 날짜가 있어야 저장할 수 있다 — 비어 있으면 undefined(무효) */
function draftValue(draft: SignDrafts["brand"]): string | null | undefined {
  if (draft === null) {
    return null;
  }
  return toServerDateTime(draft) ?? undefined;
}

/**
 * 팝업 차단을 피하려고 클릭 시점에 창을 먼저 연 뒤 presigned URL로 보낸다.
 * 실패하면 빈 창을 닫는다(오류 토스트는 인터셉터가 띄운다).
 */
async function openDownload(
  load: () => Promise<AdminContractDownloadResponse>
) {
  const popup = window.open("", "_blank");
  try {
    const { downloadUrl } = await load();
    if (popup) {
      popup.location.href = downloadUrl;
    } else {
      window.location.href = downloadUrl;
    }
  } catch {
    popup?.close();
  }
}

/**
 * B1~B6 — 어드민 계약 상세. 한 페이지 스크롤 + 우측 sticky 레일.
 *
 * 운영자는 조건을 고치지 않는다(문제가 있으면 반려). 이 화면이 쓰는 값은 모두싸인에서 확인한
 * 사실뿐이다 — 발송 일시·서명 기한(C1), 서명 완료 일시·기준 시각(B3/C3), 체결 문서(B4), 종결(C4~C6).
 */
export default function ContractDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useRouteParams<{ id: string }>();
  const contractId = Number(id);

  const {
    data: detail,
    isLoading,
    isError,
    refetch,
  } = useGetAdminContractDetail(contractId);
  const { prevId, nextId } = useContractNeighbors(contractId, location.search);
  const documentSizes = useDocumentSizes(contractId, detail?.documents ?? []);
  usePageSubtitle(detail ? (detail.contract.title ?? "(공구명 미입력)") : null);

  const [modal, setModal] = useState<ModalKind>(null);
  const closeModal = useCallback(() => setModal(null), []);

  // 서명 입력 초안 — 저장본(version)이 바뀌면 자동으로 서버 값으로 돌아간다
  const draftKey = `${contractId}:${detail?.version ?? ""}`;
  const [draftState, setDraftState] = useState<{
    key: string;
    drafts: SignDrafts;
  } | null>(null);
  const drafts =
    draftState?.key === draftKey
      ? draftState.drafts
      : detail
        ? initialDrafts(detail)
        : EMPTY_DRAFTS;
  const setDrafts = (next: SignDrafts) =>
    setDraftState({ key: draftKey, drafts: next });
  const revertDrafts = () => setDraftState(null);

  const brandAfter = draftValue(drafts.brand);
  const creatorAfter = draftValue(drafts.creator);
  const draftsValid = brandAfter !== undefined && creatorAfter !== undefined;
  const isDirty =
    !!detail &&
    (!draftsValid ||
      !sameMinute(brandAfter, detail.signature.brandSignedAt) ||
      !sameMinute(creatorAfter, detail.signature.creatorSignedAt));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickType, setPickType] = useState<UploadType | null>(null);

  const approve = useApproveContract();
  const reject = useRejectContract();
  const updateSignatures = useUpdateSignatures();
  const conclude = useConcludeContract();
  const expire = useExpireContract();
  const cancel = useCancelContract();
  const handleResend = useHandleResend();
  const upload = useUploadDocument();

  const goToList = useCallback(
    () => navigate({ pathname: CONTRACT_LIST_PATH, search: location.search }),
    [navigate, location.search]
  );
  const goTo = useCallback(
    (targetId: number) =>
      navigate({
        pathname: `${CONTRACT_LIST_PATH}/${targetId}`,
        search: location.search,
      }),
    [navigate, location.search]
  );

  if (isLoading || !detail) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center text-[12px] text-sz-n-500">
        {isLoading || !isError ? "불러오는 중…" : "계약을 찾을 수 없습니다."}
        {isError && (
          <Btn variant="secondary" onClick={goToList}>
            목록
          </Btn>
        )}
      </div>
    );
  }

  const { contract, documents } = detail;
  const threadId = contract.threadId;
  const openThread = threadId
    ? () => navigate(`${THREAD_PATH}?threadId=${threadId}`)
    : undefined;
  const openBrand = () =>
    navigate(
      `/market/list?marketName=${encodeURIComponent(contract.brand.name)}`
    );
  const openCreator = () => navigate("/showroom/list");
  const openGroupBuy = () => navigate("/group-buy");

  const openDraft = () =>
    openDownload(() => adminContractService.getDraft(contractId));
  const openDocument = (type: UploadType) =>
    openDownload(() => adminContractService.getDocument(contractId, type));

  const handlePick = (type: UploadType) => {
    setPickType(type);
    fileInputRef.current?.click();
  };

  const handleFile = (file: File | undefined) => {
    const type = pickType;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (!file || !type) {
      return;
    }
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
      toast.error("PDF 파일만 올릴 수 있습니다.");
      return;
    }
    upload.mutate(
      { contractId, documentType: type, file },
      {
        onSuccess: () => toast.success(`업로드했습니다 — ${file.name}`),
        onError: (error) => {
          // S3 업로드 실패는 axios 요청이 아니라 인터셉터가 알리지 못한다
          if (!axios.isAxiosError(error)) {
            toast.error(
              "파일을 올리지 못했습니다. 잠시 후 다시 시도해 주세요."
            );
          }
        },
        onSettled: () => setPickType(null),
      }
    );
  };

  const handleSaveSignatures = () => {
    if (brandAfter === undefined || creatorAfter === undefined) {
      return;
    }
    updateSignatures.mutate(
      {
        contractId,
        body: {
          brandSignedAt: brandAfter,
          creatorSignedAt: creatorAfter,
          version: detail.version,
        },
      },
      {
        onSuccess: () => {
          toast.success("서명 현황을 저장했습니다.");
          closeModal();
          revertDrafts();
        },
        onError: (error) => {
          closeModal();
          if (getApiErrorCode(error) === "CONTRACT_MODIFIED_ELSEWHERE") {
            toast.error(
              "다른 운영자가 먼저 저장했습니다 — 최신 내용을 불러왔습니다. 다시 확인해 주세요."
            );
            revertDrafts();
            refetch();
            return;
          }
          toast.error(
            getApiErrorMessage(error) ??
              "서명 현황을 저장하지 못했습니다. 다시 시도해 주세요."
          );
        },
      }
    );
  };

  const draftDoc = documents.find(
    (document) => document.type === "GENERATED_DRAFT" && document.exists
  );
  const draftSlot =
    contract.status === "REVIEW_PENDING" ? (
      <div className="mb-3">
        <FileSlot
          done
          name={
            draftDoc?.fileName ?? `계약서_${contract.contractNumber ?? ""}.pdf`
          }
          meta={
            draftDoc?.sourceReviewRequestedAt
              ? `아래 조건으로 생성 · ${formatMonthDayTime(draftDoc.sourceReviewRequestedAt)} 제출본 기준`
              : "아래 조건으로 생성"
          }
          action={
            <Btn variant="secondary" onClick={openDraft}>
              계약서 다운로드
            </Btn>
          }
        />
      </div>
    ) : undefined;

  const event = headerEvent(detail);
  const description = [
    contract.contractNumber,
    `${contract.brand.name} × ${contract.creator?.name ?? "—"}`,
    event,
  ]
    .filter(Boolean)
    .join(" · ");

  const showDocuments =
    contract.status === "CONCLUSION_PENDING" || contract.status === "CONCLUDED";

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-[20px] font-semibold text-sz-n-900">
            {contract.title ?? "(공구명 미입력)"}
          </h1>
          <p className="mt-0.5 text-[12px] tabular-nums text-sz-n-600">
            {description}
          </p>
        </div>
        <RecordNav
          onList={goToList}
          onPrev={prevId !== null ? () => goTo(prevId) : undefined}
          onNext={nextId !== null ? () => goTo(nextId) : undefined}
        />
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex min-w-0 flex-col gap-4">
          <ProgressCard
            detail={detail}
            drafts={drafts}
            onDraftsChange={setDrafts}
            isDirty={isDirty}
            onRevert={revertDrafts}
            onSave={() => draftsValid && setModal("signature")}
            onHandleResend={() =>
              handleResend.mutate(contractId, {
                onSuccess: () =>
                  toast.success(
                    "재발송 처리를 기록했습니다 — 소통 스레드에 답글이 남았습니다."
                  ),
              })
            }
            isHandlingResend={handleResend.isPending}
            onOpenThread={openThread}
            onOpenGroupBuy={openGroupBuy}
          />
          {showDocuments && (
            <DocumentsCard
              documents={documents}
              sizes={documentSizes}
              mode={
                contract.status === "CONCLUSION_PENDING" &&
                detail.permissions.canUploadDocument
                  ? "upload"
                  : "download"
              }
              uploadingType={upload.isPending ? pickType : null}
              onPick={handlePick}
              onDownload={openDocument}
            />
          )}
          <TermsCard
            detail={detail}
            draftSlot={draftSlot}
            onOpenThread={
              contract.status === "REVIEW_PENDING" ? openThread : undefined
            }
            onOpenBrand={openBrand}
            onOpenCreator={openCreator}
          />
          <ItemsCard detail={detail} />
          <ContentCard detail={detail} />
        </div>

        <StatusRail
          detail={detail}
          actions={{
            onApprove: () => setModal("approve"),
            onReject: () => setModal("reject"),
            onConclude: () => setModal("conclude"),
            onExpire: () => setModal("expire"),
            onCancel: () => setModal("cancel"),
            onOpenDraft: openDraft,
            onOpenSigned: () => openDocument("SIGNED_PDF"),
          }}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {modal === "approve" && (
        <ApproveModal
          detail={detail}
          isPending={approve.isPending}
          onClose={closeModal}
          onConfirm={(body) =>
            approve.mutate(
              { contractId, body },
              {
                onSuccess: () => {
                  closeModal();
                  toast.success(
                    "검토를 승인했습니다 — 서명 진행중으로 바뀌었습니다."
                  );
                },
              }
            )
          }
        />
      )}
      {modal === "reject" && (
        <RejectModal
          detail={detail}
          isPending={reject.isPending}
          onClose={closeModal}
          onConfirm={(reasonCode, reasonDetail) =>
            reject.mutate(
              { contractId, body: { reasonCode, reasonDetail } },
              {
                onSuccess: () => {
                  closeModal();
                  toast.success(
                    "검토를 반려했습니다 — 브랜드 편집이 다시 열렸습니다."
                  );
                },
              }
            )
          }
        />
      )}
      {modal === "signature" &&
        brandAfter !== undefined &&
        creatorAfter !== undefined && (
          <SignatureSaveModal
            detail={detail}
            brandAfter={brandAfter}
            creatorAfter={creatorAfter}
            isPending={updateSignatures.isPending}
            onClose={closeModal}
            onConfirm={handleSaveSignatures}
          />
        )}
      {modal === "conclude" && (
        <ConcludeModal
          detail={detail}
          isPending={conclude.isPending}
          onClose={closeModal}
          onConfirm={() =>
            conclude.mutate(contractId, {
              onSuccess: (result) => {
                closeModal();
                toast.success(
                  result.groupBuyNumber
                    ? `체결 완료 — 공구 ${result.groupBuyNumber}가 생성됐습니다.`
                    : "체결 완료 처리했습니다."
                );
              },
            })
          }
        />
      )}
      {modal === "expire" && (
        <ExpireModal
          detail={detail}
          isPending={expire.isPending}
          onClose={closeModal}
          onConfirm={() =>
            expire.mutate(contractId, {
              onSuccess: () => {
                closeModal();
                toast.success("만료로 종결했습니다.");
              },
            })
          }
        />
      )}
      {modal === "cancel" && (
        <CancelModal
          detail={detail}
          isPending={cancel.isPending}
          onClose={closeModal}
          onOpenThread={openThread}
          onConfirm={(body) =>
            cancel.mutate(
              { contractId, body },
              {
                onSuccess: () => {
                  closeModal();
                  toast.success("직권 취소했습니다 — 양측에 통지됩니다.");
                },
              }
            )
          }
        />
      )}
    </div>
  );
}
