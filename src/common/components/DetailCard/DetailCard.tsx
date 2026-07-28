import type { ReactNode } from "react";

interface DetailCardProps {
  title: string;
  /** 카드 헤더 우측 보조 텍스트 (예: "3종", "최신순", "파기됨") */
  note?: ReactNode;
  children: ReactNode;
  className?: string;
  /** 본문 패딩 제거 (처리 이력처럼 자체 패딩을 갖는 콘텐츠용) */
  flushBody?: boolean;
}

// 카드 헤더 + 본문 슬롯. 상세형 화면 전부에서 재사용.
export default function DetailCard(props: DetailCardProps) {
  const { title, note, children, className = "", flushBody = false } = props;

  return (
    <section
      className={`rounded-[8px] border border-sz-n-200 bg-white ${className}`}
    >
      <div className="flex items-center justify-between rounded-t-[8px] border-b border-sz-n-200 bg-sz-n-50 px-4 py-[11px]">
        <h2 className="text-[13px] font-semibold text-sz-n-900">{title}</h2>
        {note && <span className="text-[11px] text-sz-n-500">{note}</span>}
      </div>
      <div className={flushBody ? "px-4 py-2" : "px-4 pb-3 pt-1"}>
        {children}
      </div>
    </section>
  );
}

interface FieldRowProps {
  label: string;
  children: ReactNode;
}

// 상세 필드 행 — 9px 패딩 · 라벨 140px · gap 12px (rev.6 행 간격 규격)
export function FieldRow(props: FieldRowProps) {
  const { label, children } = props;

  return (
    <div className="flex items-baseline gap-3 border-b border-sz-n-100 py-[9px] text-[12px] last:border-b-0">
      <span className="w-[140px] shrink-0 text-sz-n-500">{label}</span>
      <span className="flex-1 text-sz-n-900">{children}</span>
    </div>
  );
}

/**
 * 파기된 값 표시 — 값이 "없는 것"과 "지워진 것"을 구분한다.
 * (반려 시 계정·제출 정보 파기 정책 · 기능요구사항 §3-2)
 */
export function PurgedValue() {
  return <span className="text-sz-n-400">— 파기됨</span>;
}
