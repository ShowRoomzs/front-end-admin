import type { ReactNode } from "react";

/**
 * 시안 `.frow` — 라벨 140px · 행 패딩 9px · 구분선(어드민 공통 규격).
 * 마지막 행의 구분선을 빼는 `:last-child`는 쓰지 않는다 — 시안도 행 뒤에 경고·힌트가 따라와서
 * 마지막 행에 선이 남아 있다(행을 래퍼로 감싸지 말고 본문에 바로 놓을 것).
 */
export function DialogRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-sz-n-100 py-[9px] text-[12px] first:pt-0">
      <div className="w-[140px] shrink-0 text-sz-n-500">{props.label}</div>
      <div className="min-w-0 flex-1 text-sz-n-900">{props.children}</div>
    </div>
  );
}

/** 시안 `.t-sub` */
export function Sub(props: { children: ReactNode }) {
  return <span className="text-[11px] text-sz-n-500">{props.children}</span>;
}

/** 시안 `.t-dim` */
export function Dim(props: { children: ReactNode }) {
  return <span className="text-sz-n-400">{props.children}</span>;
}

/** 시안 `.mwarn` — 돌이킬 수 없음을 알리는 위험색 박스 */
export function DialogWarn(props: { children: ReactNode }) {
  return (
    <div className="mt-3 flex gap-2 rounded-[6px] bg-sz-danger-bg px-3 py-2.5 text-[11px] font-medium leading-[1.6] text-sz-danger-text">
      <span>!</span>
      <span>{props.children}</span>
    </div>
  );
}

/** 본문 자리에 놓는 불러오는 중 · 불러오기 실패 안내 */
export function DialogStatus(props: { children: ReactNode }) {
  return (
    <div className="py-6 text-center text-[12px] text-sz-n-500">
      {props.children}
    </div>
  );
}

export const DIALOG_BODY_CLASS =
  "max-h-[70vh] overflow-y-auto p-5 text-[12px] leading-[1.7] text-sz-n-700";
