import { MODAL_SELECT_CHEVRON_STYLE } from "@/common/constants";
import type { FaqCategory, FaqRequest } from "@/features/faq/types/faq";
import { useEffect, useState } from "react";

interface FaqFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 저장용 카테고리(ALL 제외) */
  categories: Array<FaqCategory>;
  /** 없으면 등록, 있으면 수정. 시안대로 모달은 하나이고 초기값만 다르다 */
  initialValue?: FaqRequest;
  isSubmitting?: boolean;
  onSubmit: (data: FaqRequest) => void;
}

const EMPTY_FORM: FaqRequest = {
  category: "",
  question: "",
  answer: "",
};

/**
 * C2 — FAQ 등록·수정 모달(520px).
 *
 * FAQ는 항목당 필드가 카테고리·질문·답변 3개뿐이라 상세 페이지를 두지 않는다.
 * 목록 → 상세 → 수정 3단계를 만들면 운영 비용만 늘어난다는 게 시안의 결정이라,
 * 이 모달을 페이지로 되돌리지 말 것.
 *
 * 필수 미입력은 **에러 문구 없이 저장 버튼 비활성만**으로 처리한다(다른 화면과 동일 원칙).
 * 여기에 빨간 문구를 덧붙이지 말 것 — 필드가 3개뿐이라 무엇이 비었는지 한눈에 보인다.
 */
export default function FaqFormModal(props: FaqFormModalProps) {
  const {
    open,
    onOpenChange,
    categories,
    initialValue,
    isSubmitting = false,
    onSubmit,
  } = props;

  const [form, setForm] = useState<FaqRequest>(EMPTY_FORM);
  const isEdit = !!initialValue;

  /*
    열릴 때마다 초기값을 다시 심는다. 닫을 때 비우는 방식으로는
    "A 수정 → 닫기 → B 수정"에서 A의 값이 잠깐 비쳤다 바뀐다.
  */
  useEffect(() => {
    if (open) {
      setForm(initialValue ?? EMPTY_FORM);
    }
  }, [open, initialValue]);

  if (!open) {
    return null;
  }

  const set = <K extends keyof FaqRequest>(key: K, value: FaqRequest[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit =
    form.category !== "" &&
    form.question.trim().length > 0 &&
    form.answer.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit || isSubmitting) {
      return;
    }
    onSubmit({
      category: form.category,
      question: form.question.trim(),
      answer: form.answer.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-sz-n-900/40 p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div className="w-[520px] max-w-full overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]">
        <div className="flex items-center justify-between border-b border-sz-n-200 px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-sz-n-900">
            {isEdit ? "FAQ 수정" : "FAQ 등록"}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="닫기"
            className="text-[13px] text-sz-n-400 hover:text-sz-n-700"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-5">
          <label
            htmlFor="faq-category"
            className="mb-1 block text-[12px] font-medium text-sz-n-600"
          >
            카테고리<span className="ml-0.5 text-sz-danger-text">*</span>
          </label>
          <select
            id="faq-category"
            value={form.category}
            onChange={(event) => set("category", event.target.value)}
            style={MODAL_SELECT_CHEVRON_STYLE}
            className="h-8 w-full appearance-none rounded-[6px] border border-sz-n-300 bg-white py-1.5 pl-2.5 pr-[30px] text-[13px] text-sz-n-900 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          >
            <option value="">선택</option>
            {categories.map((category) => (
              <option key={category.key} value={category.key}>
                {category.description}
              </option>
            ))}
          </select>

          <label
            htmlFor="faq-question"
            className="mb-1 mt-4 block text-[12px] font-medium text-sz-n-600"
          >
            질문<span className="ml-0.5 text-sz-danger-text">*</span>
          </label>
          {/*
            placeholder를 "소비자가 검색할 표현으로"라고 쓴 건 의도적이다.
            운영자가 내부 용어로 적으면 소비자 검색에 걸리지 않아, FAQ가 있어도
            1:1 문의로 유입된다. 문구를 줄이지 말 것.
          */}
          <input
            id="faq-question"
            type="text"
            value={form.question}
            onChange={(event) => set("question", event.target.value)}
            placeholder="소비자가 검색할 표현으로 작성합니다"
            className="h-8 w-full rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-1.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          />

          <label
            htmlFor="faq-answer"
            className="mb-1 mt-4 block text-[12px] font-medium text-sz-n-600"
          >
            답변<span className="ml-0.5 text-sz-danger-text">*</span>
          </label>
          <textarea
            id="faq-answer"
            value={form.answer}
            onChange={(event) => set("answer", event.target.value)}
            placeholder="소비자 앱 고객센터에 그대로 노출됩니다."
            className="min-h-[88px] w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-[7px] text-[13px] leading-relaxed text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          />

          {/* 등록에만 붙는 안내 — 수정은 이미 순서를 가진 항목이라 해당 없다 */}
          {!isEdit && (
            <p className="mt-1.5 text-[11px] leading-[1.55] text-sz-n-500">
              등록하면 선택한 카테고리의 <b className="text-sz-n-900">맨 위</b>
              에 배치되며, 순서는 목록에서 끌어 조정합니다.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-sz-n-200 px-5 py-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-8 items-center rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[12px] font-medium text-sz-n-900 hover:bg-sz-n-100"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="inline-flex h-8 items-center rounded-[6px] bg-sz-accent-500 px-3.5 text-[12px] font-medium text-white hover:bg-sz-accent-600 disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-400"
          >
            {isSubmitting ? "저장 중" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
