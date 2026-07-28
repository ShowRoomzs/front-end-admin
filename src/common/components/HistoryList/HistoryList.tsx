import { formatDateTimeShort } from "@/common/utils/formatDate";

export type HistoryDotTone = "accent" | "success" | "muted";

export interface HistoryItem {
  /** 처리 내용 (예: "신청 접수", "승인 처리 · 김운영") */
  label: string;
  /** 처리 일시 (ISO 문자열) */
  processedAt: string | null;
  tone: HistoryDotTone;
}

interface HistoryListProps {
  items: Array<HistoryItem>;
}

const DOT_CLASS: Record<HistoryDotTone, string> = {
  accent: "bg-sz-accent-500",
  success: "bg-sz-success-text",
  muted: "bg-sz-n-500",
};

// 처리 이력 — 점 + 텍스트 + 시각. 최신순(내림차순)으로 정렬해 전달받는다.
export default function HistoryList(props: HistoryListProps) {
  const { items } = props;

  if (items.length === 0) {
    return (
      <p className="py-2 text-[12px] text-sz-n-500">처리 이력이 없습니다.</p>
    );
  }

  return (
    <div>
      {items.map((item, index) => (
        <div
          key={`${item.label}-${item.processedAt}-${index}`}
          className="flex gap-2.5 border-b border-sz-n-100 py-[9px] last:border-b-0"
        >
          <span
            className={`mt-[6px] h-[7px] w-[7px] shrink-0 rounded-full ${DOT_CLASS[item.tone]}`}
          />
          <div>
            <div className="text-[12px] text-sz-n-900">{item.label}</div>
            <div className="text-[11px] text-sz-n-500">
              {formatDateTimeShort(item.processedAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
