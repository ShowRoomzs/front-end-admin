import { FORM_SELECT_CLASS } from "@/features/order/components/shared/styles";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/features/order/constants/params";
import type { AdminOrderGroupDetail } from "@/features/order/types";
import { subOrderSuffix } from "@/features/order/utils/format";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

/*
  레일 인라인 폼의 조각 — 시안 `.ifm` · `.mlabel` · `.mwarn` · `.cbrow`.
  필수 미입력은 에러 문구 없이 버튼 비활성만이다. 에러 문구(FormError)는 형식 오류·중복에만 쓴다.
*/

/** 시안 `.ifm` — 연한 인디고 박스 */
export function FormShell({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[6px] border border-sz-accent-100 bg-sz-accent-50 p-2.5">
      {children}
    </div>
  );
}

/** 시안 `.ifm .mlabel` — 11px/500, 필수 표시는 라벨 뒤 */
export function FormLabel(props: {
  children: ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={props.htmlFor}
      className="mb-[3px] mt-[9px] block text-[11px] font-medium text-sz-n-600 first:mt-0"
    >
      {props.children}
      {props.required && <span className="ml-0.5 text-sz-danger-text">*</span>}
    </label>
  );
}

/** 시안 `.mwarn` — 되돌릴 수 없는 영향을 버튼 바로 위에 적는다(info는 안내) */
export function FormWarn(props: {
  tone?: "danger" | "info";
  children: ReactNode;
}) {
  const { tone = "danger", children } = props;
  return (
    <div
      className={cn(
        "mt-[9px] flex gap-2 rounded-[6px] px-[9px] py-2 text-[10px] font-medium leading-[1.6]",
        tone === "info"
          ? "bg-sz-info-bg text-sz-info-text"
          : "bg-sz-danger-bg text-sz-danger-text"
      )}
    >
      <span>{tone === "info" ? "i" : "!"}</span>
      <span>{children}</span>
    </div>
  );
}

/** 시안 `.merr` — 형식 오류·중복에만 */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-1 text-[10px] text-sz-danger-text">
      {children}
    </p>
  );
}

/** 시안 `.mhint`(레일 폼 안 10px) */
export function FormHint({ children }: { children: ReactNode }) {
  // 시안 p.mhint(10px) — 아래쪽 문단 여백 1em이 다음 경고 박스 위 여백과 겹쳐 10px이 된다
  return <p className="mb-2.5 mt-1 text-[10px] text-sz-n-500">{children}</p>;
}

/**
 * 시안 `.cbrow` — 체크 + 항목명 + 오른쪽 수량 칸.
 * 선택되면 수량을 고칠 수 있고(`editable`), 안 된 항목은 0으로 흐리게 접는다.
 */
export function CheckRow(props: {
  checked: boolean;
  label: string;
  qty: number;
  maxQty: number;
  onToggle: () => void;
  onQtyChange?: (qty: number) => void;
}) {
  const { checked, label, qty, maxQty, onToggle, onQtyChange } = props;
  // 입력 중에는 칸을 비우거나 한 자리씩 고칠 수 있어야 한다 — 문자열로 들고 있다가 벗어날 때 [1, 최대]로 맞춘다.
  // 부모에는 숫자로 읽히는 값만 범위 안으로 맞춰 올려서, 그대로 제출해도 수량이 범위를 벗어나지 않는다.
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (value: number) =>
    Math.min(maxQty, Math.max(1, Math.trunc(value)));
  return (
    <div className="flex items-center gap-[7px] py-1 text-[11px]">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
        className={cn(
          "size-[13px] shrink-0 cursor-pointer rounded-[3px] border",
          checked
            ? "border-sz-accent-500 bg-sz-accent-500"
            : "border-sz-n-400 bg-white"
        )}
      />
      <span className={cn(!checked && "text-[11px] text-sz-n-500")}>
        {label}
      </span>
      {checked && onQtyChange ? (
        <input
          type="number"
          min={1}
          max={maxQty}
          aria-label={`${label} 수량`}
          value={draft ?? String(qty)}
          onChange={(event) => {
            const raw = event.target.value;
            setDraft(raw);
            const value = Number(raw);
            if (raw.trim() !== "" && Number.isFinite(value)) {
              onQtyChange(clamp(value));
            }
          }}
          onBlur={() => {
            const value = Number(draft);
            if (
              draft !== null &&
              draft.trim() !== "" &&
              Number.isFinite(value)
            ) {
              onQtyChange(clamp(value));
            }
            // 비워 둔 채 벗어나면 마지막으로 맞춰 둔 값(최소 1)으로 돌아간다
            setDraft(null);
          }}
          className="ml-auto h-[22px] w-[38px] rounded-[4px] border border-sz-n-300 bg-white text-center text-[10px] tabular-nums text-sz-n-900 outline-none focus:border-sz-accent-500"
        />
      ) : (
        <span
          className={cn(
            "ml-auto flex h-[22px] w-[38px] items-center justify-center rounded-[4px] border border-sz-n-300 bg-white text-[10px] tabular-nums",
            "text-sz-n-900"
          )}
        >
          {checked ? qty : 0}
        </span>
      )}
    </div>
  );
}

/**
 * 대상 하위주문 — 조치는 하위주문 단위다. 열 수 있는 하위주문이 하나면 고정 문구,
 * 둘 이상이면 셀렉트로 고른다(직권 취소 · 사유 환불이 다른 브랜드를 건드리지 않게).
 */
export function TargetGroupField(props: {
  id: string;
  groups: Array<AdminOrderGroupDetail>;
  value: number;
  onChange: (deliveryGroupId: number) => void;
}) {
  const { id, groups, value, onChange } = props;
  const name = (group: AdminOrderGroupDetail) =>
    `${group.brandName} · 하위주문 ${subOrderSuffix(group.subOrderNumber)}`;
  return (
    <>
      <FormLabel required htmlFor={id}>
        대상 하위주문
      </FormLabel>
      {groups.length > 1 ? (
        <select
          id={id}
          className={FORM_SELECT_CLASS}
          style={MODAL_SELECT_CHEVRON_STYLE}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        >
          {groups.map((group) => (
            <option key={group.deliveryGroupId} value={group.deliveryGroupId}>
              {name(group)}
            </option>
          ))}
        </select>
      ) : (
        <p id={id} className="text-[11px] font-medium text-sz-n-900">
          {groups[0] ? name(groups[0]) : "—"}
        </p>
      )}
    </>
  );
}
