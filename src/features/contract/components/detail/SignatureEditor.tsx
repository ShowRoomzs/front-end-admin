import { formatDateTimeShort } from "@/common/utils/formatDate";
import Check from "@/features/contract/components/shared/CheckRow";
import DateTimeField from "@/features/contract/components/shared/DateTimeField";
import type { DateTimeParts } from "@/features/contract/utils/datetime";
import { cn } from "@/lib/utils";

/** 한쪽 서명 입력값 — null이면 미서명 */
export type SignDraft = DateTimeParts | null;

interface SignBoxProps {
  who: string;
  name: string;
  value: SignDraft;
  /** 저장된 서명 시각(읽기 전용 표시용) */
  savedAt: string | null;
  editable: boolean;
  /** 종결(B6) — 서명 기록을 잠그고 「없음 · 취소로 종결」로 적는다 */
  closedText?: string;
  onToggle: (checked: boolean) => void;
  onChange: (value: DateTimeParts) => void;
}

/**
 * 시안 `.sbox.edit` — 양측과 **완전히 같은 서명 박스**에 체크 + 일시 입력만 더했다.
 * 체크 해제가 가능하다: 오입력한 서명 완료가 양측 화면에 박히면 되돌릴 경로가 있어야 한다
 * (체결 완료를 누른 순간부터 잠긴다).
 */
function SignBox(props: SignBoxProps) {
  const {
    who,
    name,
    value,
    savedAt,
    editable,
    closedText,
    onToggle,
    onChange,
  } = props;

  return (
    <div
      className={cn(
        // 좁은 화면에서 날짜·시·분 칸이 박스 밖으로 넘치지 않게 최소 폭을 두고 줄바꿈한다
        "min-w-[250px] flex-1 rounded-[6px] border p-3.5",
        editable ? "border-sz-n-300 bg-white" : "border-sz-n-200 bg-sz-n-50"
      )}
    >
      <div className="text-[11px] text-sz-n-500">{who}</div>
      <div className="mb-2.5 mt-1 text-[12px] font-semibold text-sz-n-900">
        {name}
      </div>
      <Check
        checked={editable ? value !== null : savedAt !== null}
        disabled={!editable}
        onChange={onToggle}
      >
        서명 완료
      </Check>
      {editable ? (
        value !== null ? (
          <div className="mt-[9px] flex items-center gap-1.5">
            <DateTimeField
              ariaLabel={`${who} 서명 완료 일시`}
              value={value}
              onChange={onChange}
            />
          </div>
        ) : (
          <div className="mt-[9px] text-[11px] text-sz-n-400">
            체크하면 서명 완료 일시를 입력합니다 — 모두싸인 대시보드의 값을
            그대로 옮기세요.
          </div>
        )
      ) : (
        <div className="mt-[9px] text-[11px] text-sz-n-400">
          {savedAt
            ? `서명 완료 · ${formatDateTimeShort(savedAt)}`
            : (closedText ?? "서명 없음")}
        </div>
      )}
    </div>
  );
}

interface SignatureEditorProps {
  brandName: string;
  creatorName: string;
  brand: SignDraft;
  creator: SignDraft;
  brandSavedAt: string | null;
  creatorSavedAt: string | null;
  editable: boolean;
  closedText?: string;
  onChange: (next: { brand: SignDraft; creator: SignDraft }) => void;
  /** 체크를 새로 켤 때 채울 기본 일시 */
  makeDefault: () => DateTimeParts;
}

/** 시안 `.signs` — 브랜드 / 인플루언서 2칸 */
export default function SignatureEditor(props: SignatureEditorProps) {
  const {
    brandName,
    creatorName,
    brand,
    creator,
    brandSavedAt,
    creatorSavedAt,
    editable,
    closedText,
    onChange,
    makeDefault,
  } = props;

  return (
    <div className="flex flex-wrap gap-3">
      <SignBox
        who="브랜드"
        name={brandName}
        value={brand}
        savedAt={brandSavedAt}
        editable={editable}
        closedText={closedText}
        onToggle={(checked) =>
          onChange({ brand: checked ? makeDefault() : null, creator })
        }
        onChange={(value) => onChange({ brand: value, creator })}
      />
      <SignBox
        who="인플루언서"
        name={creatorName}
        value={creator}
        savedAt={creatorSavedAt}
        editable={editable}
        closedText={closedText}
        onToggle={(checked) =>
          onChange({ brand, creator: checked ? makeDefault() : null })
        }
        onChange={(value) => onChange({ brand, creator: value })}
      />
    </div>
  );
}
