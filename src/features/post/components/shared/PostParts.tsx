import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/*
  시안 ui-admin-11 화면 전용 원자 — `.mwarn` · `.mrow` · `.flink` · `.av` · `.photo` 등.
  공용 컴포넌트에 같은 규격이 없는 것만 둔다.
*/

/** 시안 `.mwarn` — 위험(기본) · 정보(`info`) 안내 박스 */
export function WarnBox(props: {
  children: ReactNode;
  tone?: "danger" | "info";
  className?: string;
}) {
  const { children, tone = "danger", className } = props;
  return (
    <div
      className={cn(
        "flex gap-2 rounded-[6px] px-3 py-2.5 text-[11px] font-medium leading-[1.6]",
        tone === "danger"
          ? "bg-sz-danger-bg text-sz-danger-text"
          : "bg-sz-info-bg text-sz-info-text",
        className
      )}
    >
      <span aria-hidden>{tone === "danger" ? "!" : "i"}</span>
      <span>{children}</span>
    </div>
  );
}

/** 시안 `.flink` — 값 옆 밑줄 링크 */
export function FLink(props: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  const { children, onClick, title } = props;
  if (!onClick) {
    return <span>{children}</span>;
  }
  return (
    <button
      type="button"
      title={title}
      onClick={(event) => {
        // 목록 행 클릭(상세 열기)과 겹치지 않게 한다
        event.stopPropagation();
        onClick();
      }}
      className="cursor-pointer text-sz-n-600 underline underline-offset-2 hover:text-sz-accent-600"
    >
      {children}
    </button>
  );
}

/** 시안 `.av` — 프로필 사진이 없으면 이름 첫 글자 */
export function Avatar(props: { name: string; imageUrl?: string | null }) {
  const { name, imageUrl } = props;
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="h-8 w-8 shrink-0 rounded-full bg-sz-n-200 object-cover"
      />
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sz-n-200 text-[11px] font-semibold text-sz-n-600">
      {name}
    </span>
  );
}

/** 시안 `.mrow` — 레일 메타 한 줄(왼쪽 라벨 · 오른쪽 값) */
export function RailRow(props: { label: string; children: ReactNode }) {
  const { label, children } = props;
  return (
    <div className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0">
      <span className="shrink-0 text-sz-n-500">{label}</span>
      <span className="text-right font-medium text-sz-n-900">{children}</span>
    </div>
  );
}

/** 시안 `.t-sub` — 값 뒤 회색 부기 */
export function Sub(props: { children: ReactNode }) {
  return <span className="text-[11px] text-sz-n-500">{props.children}</span>;
}

/**
 * 시안 `.photo` / `.pthumb` 자리 — 이미지 URL이 없으면 회색 칸에 문구를 둔다.
 * 격자 썸네일은 4:5 센터 크롭이다(스튜디오 목록 · 쇼룸 격자와 같은 비율).
 */
export function PhotoFill(props: {
  url: string | null | undefined;
  fallback: string;
  fit?: "cover" | "contain";
}) {
  const { url, fallback, fit = "cover" } = props;
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={cn(
          "h-full w-full",
          fit === "cover" ? "object-cover" : "object-contain"
        )}
      />
    );
  }
  return (
    <span className="flex h-full w-full items-center justify-center text-[11px] text-sz-n-500">
      {fallback}
    </span>
  );
}

/** 시안 `.ph-flag` — 「신고 지목」 */
export function FlagChip(props: { className?: string }) {
  return (
    <span
      className={cn(
        "whitespace-nowrap rounded-[10px] bg-sz-danger-bg px-[7px] py-px text-[10px] font-semibold text-sz-danger-text",
        props.className
      )}
    >
      신고 지목
    </span>
  );
}
