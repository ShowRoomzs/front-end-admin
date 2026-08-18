import DetailCard, {
  FieldRow,
} from "@/common/components/DetailCard/DetailCard";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { formatDateOnly, formatDateTimeShort } from "@/common/utils/formatDate";
import EffectiveDateField from "@/features/terms/components/EffectiveDateField/EffectiveDateField";
import RegisterConfirmModal from "@/features/terms/components/RegisterConfirmModal/RegisterConfirmModal";
import { TERMS_NOTICE_PERIOD_DAYS } from "@/features/terms/constants/params";
import {
  useGetTermsDocument,
  useRegisterTermsVersion,
} from "@/features/terms/hooks/useTermsQueries";
import { TERMS_LIST_PATH } from "@/features/terms/pages/TermsManagement";
import { useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams as useRouteParams } from "react-router-dom";

/** 숫자와 점만 남긴다 — 공백·`v`·문자를 입력 단계에서 흘려버린다 */
function sanitizeVersionNumber(value: string) {
  return value.replace(/[^0-9.]/g, "");
}

/**
 * C4 — 새 버전 등록(개정).
 *
 * 문서명·유형·대상은 문서 속성이라 **고정 표시**하고 버전 번호·시행일·본문만 받는다.
 *
 * 접두 `v`는 필드 밖에 고정으로 둔다 — 입력 안에 두면 `v3.2`·`V3.2`·`3.2`가 섞여
 * 들어온다. 중복·역행 번호(예: 시행 v3.1 뒤에 v3.0)는 **서버가 검증한다**(§21-5).
 */
export default function TermsVersionRegister() {
  const navigate = useNavigate();
  const { documentId: documentIdParam } = useRouteParams<{
    documentId: string;
  }>();
  const documentId = Number(documentIdParam);

  const { data: document, isLoading } = useGetTermsDocument(documentId);
  const { mutateAsync: registerVersion, isPending } = useRegisterTermsVersion();

  const [versionNumber, setVersionNumber] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [content, setContent] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const canSubmit =
    versionNumber.trim().length > 0 &&
    effectiveDate !== "" &&
    content.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || isPending) {
      return;
    }

    try {
      await registerVersion({
        documentId,
        data: {
          versionNumber: versionNumber.trim(),
          effectiveDate,
          content,
        },
      });
      setIsConfirmOpen(false);
      toast.success("새 버전을 등록했습니다. 시행일 00:00에 교체됩니다.");
      navigate(`${TERMS_LIST_PATH}/${documentId}`);
    } catch {
      // 중복·역행 번호는 서버가 잡는다 — 모달을 닫지 않아 번호만 고쳐 다시 낼 수 있다
      toast.error("새 버전 등록에 실패했습니다.");
    }
  };

  if (isLoading || !document) {
    return (
      <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center text-[12px] text-sz-n-500">
        {isLoading ? "불러오는 중…" : "문서를 찾을 수 없습니다."}
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-sz-n-900">
            새 버전 등록
          </h1>
          <p className="mt-0.5 text-[12px] text-sz-n-600">
            {document.name}
            {document.version ? ` · 현재 시행 ${document.version}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`${TERMS_LIST_PATH}/${documentId}`)}
          className="inline-flex h-8 items-center rounded-[6px] border border-sz-n-300 bg-white px-3 text-[12px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100 hover:text-sz-n-900"
        >
          목록
        </button>
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex flex-col gap-4">
          {/* 교체 대상을 먼저 보여준다 — 무엇을 갈아 끼우는지 모르고 등록하면 안 된다 */}
          <DetailCard title="현재 시행 버전">
            <FieldRow label="문서">{document.name}</FieldRow>
            <FieldRow label="유형">
              {document.typeName} · {document.targetName}
            </FieldRow>
            <FieldRow label="시행 버전">
              <span className="tabular-nums">{document.version ?? "—"}</span>
            </FieldRow>
            <FieldRow label="시행일">
              <span className="tabular-nums">
                {formatDateOnly(document.effectiveDate)}
              </span>
            </FieldRow>
            <FieldRow label="등록자">
              {document.registrantName ?? "—"}
              {document.versions[0]
                ? ` · ${formatDateTimeShort(document.versions[0].registeredAt)}`
                : ""}
            </FieldRow>

            <p className="mt-2.5 text-[11px] leading-[1.55] text-sz-n-500">
              새 버전이 시행되면 이 버전은 자동으로{" "}
              <b className="font-semibold text-sz-n-900">과거 버전</b>으로
              전환되어 계속 보관됩니다 — 동의 기록이 “동의한 버전”을 참조하므로
              삭제되지 않습니다.
            </p>
          </DetailCard>

          <DetailCard title="새 버전 작성">
            <FieldRow label="버전 번호 *">
              {/* 접두 v는 인풋 밖 고정 라벨이다 — 값에 포함시켜 보내지 않는다 */}
              <span className="inline-flex">
                <span className="inline-flex h-8 items-center rounded-l-[6px] border border-r-0 border-sz-n-300 bg-sz-n-50 px-[11px] text-[13px] text-sz-n-500">
                  v
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={versionNumber}
                  onChange={(event) =>
                    setVersionNumber(sanitizeVersionNumber(event.target.value))
                  }
                  placeholder="3.2"
                  className="h-8 w-[96px] rounded-r-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] tabular-nums text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
                />
              </span>
            </FieldRow>
            <FieldRow label="시행일 *">
              <EffectiveDateField
                value={effectiveDate}
                onChange={setEffectiveDate}
              />
            </FieldRow>
            <FieldRow label="본문 *">
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="문서 원문을 붙여 넣습니다."
                className="min-h-[250px] w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-[7px] text-[13px] leading-relaxed text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
              />
              <p className="mt-1.5 text-[11px] text-sz-n-500">
                등록 후 원문은 수정할 수 없습니다 — 내용을 고치려면 또 새 버전을
                등록해야 합니다.
              </p>
            </FieldRow>
          </DetailCard>
        </div>

        <div className="sticky top-0">
          <DetailCard title="등록">
            <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3 pt-2">
              <span className="text-[12px] text-sz-n-500">등록 후 상태</span>
              <StatusBadge variant="info">시행 예정</StatusBadge>
            </div>

            <div className="pt-2">
              <MetaRow
                label="새 버전"
                value={versionNumber ? `v${versionNumber}` : "—"}
              />
              <MetaRow
                label="시행일"
                value={effectiveDate ? formatDateOnly(effectiveDate) : "—"}
              />
              <MetaRow label="교체 대상" value={document.version ?? "—"} />
              <MetaRow
                label="사전 고지"
                value={`${TERMS_NOTICE_PERIOD_DAYS}일`}
              />
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                disabled={!canSubmit || isPending}
                className="inline-flex h-9 w-full items-center justify-center rounded-[6px] bg-sz-accent-500 px-3.5 text-[12px] font-medium text-white hover:bg-sz-accent-600 disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-400"
              >
                등록
              </button>
            </div>
            <p className="mb-2 mt-2.5 text-[11px] leading-[1.55] text-sz-n-500">
              버전 번호 중복·역행은 서버에서 검증합니다. 시행일 00:00에 시스템이
              자동으로 교체합니다.
            </p>
          </DetailCard>
        </div>
      </div>

      <RegisterConfirmModal
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="새 버전 등록"
        documentName={document.name}
        version={`v${versionNumber}`}
        effectiveDate={effectiveDate}
        replacingVersion={document.version}
        isSubmitting={isPending}
        onSubmit={handleSubmit}
      />
    </>
  );
}

interface MetaRowProps {
  label: string;
  value: ReactNode;
}

function MetaRow(props: MetaRowProps) {
  const { label, value } = props;

  return (
    <div className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0">
      <span className="text-sz-n-500">{label}</span>
      <span className="text-right font-medium tabular-nums text-sz-n-900">
        {value}
      </span>
    </div>
  );
}
