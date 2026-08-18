import DetailCard, {
  FieldRow,
} from "@/common/components/DetailCard/DetailCard";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/common/constants";
import { formatDateOnly } from "@/common/utils/formatDate";
import EffectiveDateField from "@/features/terms/components/EffectiveDateField/EffectiveDateField";
import RegisterConfirmModal from "@/features/terms/components/RegisterConfirmModal/RegisterConfirmModal";
import {
  TERMS_FIRST_VERSION,
  TERMS_NOTICE_PERIOD_DAYS,
  TERMS_TARGET_OPTIONS,
  TERMS_TYPE_OPTIONS,
} from "@/features/terms/constants/params";
import { useRegisterTermsDocument } from "@/features/terms/hooks/useTermsQueries";
import { TERMS_LIST_PATH } from "@/features/terms/pages/TermsManagement";
import type { TermsTarget, TermsType } from "@/features/terms/types/terms";
import { useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface FormState {
  name: string;
  type: TermsType | "";
  target: TermsTarget | "";
  effectiveDate: string;
  content: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  type: "",
  target: "",
  effectiveDate: "",
  content: "",
};

/**
 * C3 — 문서 등록(신규).
 *
 * 새 버전 등록(C4)과 **화면을 분리한다**(§21-5). 한 화면에서 분기하면 문서명·유형·대상의
 * 잠금 조건이 화면 전체에 퍼져 읽기 어려워진다.
 *
 * 이 화면에서만 문서명·유형·대상을 정하고, 그 뒤로는 문서 속성으로 고정된다.
 * 첫 버전은 v1.0 고정이며 입력받지 않는다 — 고르게 하면 `v0.9` 같은 값이 들어온다.
 */
export default function TermsDocumentRegister() {
  const navigate = useNavigate();
  const { mutateAsync: registerDocument, isPending } =
    useRegisterTermsDocument();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const canSubmit =
    form.name.trim().length > 0 &&
    form.type !== "" &&
    form.target !== "" &&
    form.effectiveDate !== "" &&
    form.content.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || isPending) {
      return;
    }

    try {
      await registerDocument({
        name: form.name.trim(),
        type: form.type as TermsType,
        target: form.target as TermsTarget,
        effectiveDate: form.effectiveDate,
        content: form.content,
      });
      setIsConfirmOpen(false);
      toast.success("문서를 등록했습니다. 시행일 00:00에 시행됩니다.");
      navigate(TERMS_LIST_PATH);
    } catch {
      // 모달은 닫지 않는다 — 서버가 시행일·중복을 되짚어 줄 수 있어 재시도가 가능해야 한다
      toast.error("문서 등록에 실패했습니다.");
    }
  };

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h1 className="text-[20px] font-semibold text-sz-n-900">문서 등록</h1>
        <button
          type="button"
          onClick={() => navigate(TERMS_LIST_PATH)}
          className="inline-flex h-8 items-center rounded-[6px] border border-sz-n-300 bg-white px-3 text-[12px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100 hover:text-sz-n-900"
        >
          목록
        </button>
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex flex-col gap-4">
          <DetailCard title="문서 정보">
            <FieldRow label="문서명 *">
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="예: 마케팅 목적 개인정보 수집·이용 동의"
                className="h-8 w-[340px] rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
              />
            </FieldRow>
            <FieldRow label="유형 *">
              <select
                aria-label="유형"
                value={form.type}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    type: event.target.value as TermsType,
                  }))
                }
                style={MODAL_SELECT_CHEVRON_STYLE}
                className="h-8 w-[200px] appearance-none rounded-[6px] border border-sz-n-300 bg-white py-1.5 pl-2.5 pr-[30px] text-[13px] text-sz-n-900 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
              >
                <option value="">선택</option>
                {TERMS_TYPE_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="대상 *">
              <select
                aria-label="대상"
                value={form.target}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    target: event.target.value as TermsTarget,
                  }))
                }
                style={MODAL_SELECT_CHEVRON_STYLE}
                className="h-8 w-[160px] appearance-none rounded-[6px] border border-sz-n-300 bg-white py-1.5 pl-2.5 pr-[30px] text-[13px] text-sz-n-900 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
              >
                <option value="">선택</option>
                {TERMS_TARGET_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FieldRow>

            {/*
              이 경고를 지우지 말 것. 대상이 바뀌면 동의 대상 집단이 달라져 같은 문서로
              볼 수 없고, 수정 경로가 없으니 문서를 새로 만드는 수밖에 없다(§21-2).
            */}
            <p className="mt-2.5 text-[11px] leading-[1.55] text-sz-n-500">
              유형·대상은 등록 후 문서 속성으로 고정됩니다 — 잘못 지정하면
              문서를 다시 만들어야 하므로 등록 전에 확인하세요.
            </p>
          </DetailCard>

          <DetailCard title="최초 버전 작성" note="버전 v1.0 · 시행일 · 원문">
            <FieldRow label="버전 번호">
              <b className="font-semibold tabular-nums">
                {TERMS_FIRST_VERSION}
              </b>{" "}
              <span className="text-sz-n-500">
                — 최초 등록이라 자동 부여됩니다
              </span>
            </FieldRow>
            <FieldRow label="시행일 *">
              <EffectiveDateField
                value={form.effectiveDate}
                onChange={(effectiveDate) =>
                  setForm((prev) => ({ ...prev, effectiveDate }))
                }
              />
            </FieldRow>
            <FieldRow label="본문 *">
              <textarea
                value={form.content}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, content: event.target.value }))
                }
                placeholder="문서 원문을 붙여 넣습니다."
                className="min-h-[250px] w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-[7px] text-[13px] leading-relaxed text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
              />
              <p className="mt-1.5 text-[11px] text-sz-n-500">
                등록 후 원문은 수정할 수 없습니다 — 내용을 고치려면 새 버전을
                등록합니다.
              </p>
            </FieldRow>
          </DetailCard>
        </div>

        <div className="sticky top-0">
          <DetailCard title="등록">
            <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3 pt-2">
              <span className="text-[12px] text-sz-n-500">등록 후 상태</span>
              {/* 등록 즉시 시행이 아니다 — 시행일 00:00까지는 소비자 화면에 안 뜬다 */}
              <StatusBadge variant="info">시행 예정</StatusBadge>
            </div>

            <div className="pt-2">
              <MetaRow label="버전" value={TERMS_FIRST_VERSION} />
              <MetaRow
                label="시행일"
                value={
                  form.effectiveDate ? formatDateOnly(form.effectiveDate) : "—"
                }
              />
              <MetaRow
                label="사전 고지"
                value={`${TERMS_NOTICE_PERIOD_DAYS}일`}
              />
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                // 필수 미입력은 에러 문구 없이 버튼 비활성만으로 표현한다(§21-5)
                disabled={!canSubmit || isPending}
                className="inline-flex h-9 w-full items-center justify-center rounded-[6px] bg-sz-accent-500 px-3.5 text-[12px] font-medium text-white hover:bg-sz-accent-600 disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-400"
              >
                등록
              </button>
            </div>
            <p className="mb-2 mt-2.5 text-[11px] leading-[1.55] text-sz-n-500">
              사전 고지 기간은 임시값입니다(법률 검토 대기). 시행일 00:00에
              시스템이 자동으로 시행합니다.
            </p>
          </DetailCard>
        </div>
      </div>

      <RegisterConfirmModal
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="문서 등록"
        documentName={form.name.trim()}
        version={TERMS_FIRST_VERSION}
        effectiveDate={form.effectiveDate}
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
