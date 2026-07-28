import type { ReactNode } from "react";

/**
 * 상태 배지 색상 토큰 (웹 디자인시스템 v1.1 · §9 4원칙)
 * - info    : 진행 중·대기 (심사 대기)
 * - success : 성공 (승인)
 * - warning : 경고 — 운영자 조치 필요 (SLA 초과)
 * - danger  : 위험 — 파괴적 액션 (반려 *버튼*)
 * - neutral : 종료된 상태 (반려된 건) — 조치가 불필요하므로 danger를 쓰지 않는다
 */
export type StatusBadgeVariant =
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  children: ReactNode;
  /** 좌측 점 숨김 */
  hideDot?: boolean;
}

const VARIANT_CLASS: Record<StatusBadgeVariant, string> = {
  info: "bg-sz-info-bg text-sz-info-text",
  success: "bg-sz-success-bg text-sz-success-text",
  warning: "bg-sz-warning-bg text-sz-warning-text",
  danger: "bg-sz-danger-bg text-sz-danger-text",
  neutral: "bg-sz-neutral-bg text-sz-neutral-text",
};

export default function StatusBadge(props: StatusBadgeProps) {
  const { variant, children, hideDot = false } = props;

  return (
    <span
      className={`inline-flex items-center gap-[5px] whitespace-nowrap rounded-[10px] px-[9px] py-0.5 text-[11px] font-medium ${VARIANT_CLASS[variant]}`}
    >
      {!hideDot && (
        <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-current opacity-75" />
      )}
      {children}
    </span>
  );
}
