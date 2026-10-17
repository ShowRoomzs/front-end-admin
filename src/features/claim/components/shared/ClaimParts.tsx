import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type { ClaimTone } from "@/features/claim/types";
import { toneToVariant } from "@/features/claim/utils/format";
import { cn } from "@/lib/utils";
import { Fragment, type ReactNode } from "react";

/*
  시안 ui-admin-06b-claims의 원자 조각 — 이 화면 안에서만 쓴다.
  상세는 `.mbk`(번호 블록) · `.rl`(우측 레일) · `.sc/.itrow`(항목 줄) · `.hitem`(이력)이 밀도 Compact로 짜여 있어
  공용 DetailCard·HistoryList(여백이 목록형)와 어긋난다 — 같은 값으로 이 안에 따로 둔다.
*/

export function ClaimBadge(props: {
  tone: ClaimTone;
  children: ReactNode;
  hideDot?: boolean;
}) {
  return (
    <StatusBadge variant={toneToVariant(props.tone)} hideDot={props.hideDot}>
      {props.children}
    </StatusBadge>
  );
}

/** `**굵게**` 표기를 <b>로 바꾼다 — 안내 문구를 데이터 대신 상수로 두기 위한 최소 마크업 */
export function Emphasis(props: { text: string }) {
  return (
    <>
      {props.text
        .split("**")
        .map((part, index) =>
          index % 2 === 1 ? (
            <b key={index}>{part}</b>
          ) : (
            <Fragment key={index}>{part}</Fragment>
          )
        )}
    </>
  );
}

/** 시안 `.t-sub` */
export function Sub(props: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("text-[11px] text-sz-n-500", props.className)}>
      {props.children}
    </span>
  );
}

/** 시안 `.t-dim` — 입력 대기 · 선택 입력 없음 같은 빈 값 */
export function Dim(props: { children: ReactNode }) {
  return <span className="text-sz-n-400">{props.children}</span>;
}

/** 시안 `.tnum` */
export function Num(props: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("tabular-nums tracking-[-0.1px]", props.className)}>
      {props.children}
    </span>
  );
}

const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"];

/** 시안 `.mbk` — 번호 붙은 상세 블록 */
export function Block(props: {
  index: number;
  title: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  const { index, title, aside, children } = props;
  return (
    <section className="mb-[5px] rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex items-center justify-between gap-2 rounded-t-[8px] border-b border-sz-n-200 bg-sz-n-50 px-3 py-[7px] text-[12px] font-semibold text-sz-n-900">
        <span>
          <span className="mr-1.5 text-[10px] font-semibold text-sz-n-400">
            {CIRCLED[index] ?? `${index + 1}`}
          </span>
          {title}
        </span>
        {aside}
      </div>
      <div className="px-3 py-[9px]">{children}</div>
    </section>
  );
}

/** 시안 `.grid2` — 두 칸 필드 격자(열 간격 20px) */
export function Grid2(props: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-5">{props.children}</div>;
}

/** 시안 `.mbk .frow` — 라벨 118px · 행 패딩 4px · 11px */
export function Frow(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-sz-n-100 py-1 text-[11px] last:border-b-0">
      <div className="w-[118px] shrink-0 text-sz-n-500">{props.label}</div>
      <div className="min-w-0 flex-1 text-sz-n-900">{props.children}</div>
    </div>
  );
}

/** 시안 `.sc` — 줄(`.itrow`)을 묶는 테두리 상자 */
export function Sc(props: { children: ReactNode }) {
  return (
    <div className="mb-1.5 overflow-hidden rounded-[6px] border border-sz-n-200 last:mb-0">
      {props.children}
    </div>
  );
}

/** 시안 `.itrow` — 항목 · 회수 · 계산 한 줄 */
export function ItRow(props: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-sz-n-100 px-2.5 py-1 text-[11px] last:border-b-0">
      {props.children}
    </div>
  );
}

/** 시안 `.itrow .ip` — 줄 오른쪽 끝 값 */
export function RowEnd(props: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("ml-auto tabular-nums text-sz-n-700", props.className)}>
      {props.children}
    </span>
  );
}

const HDOT_CLASS: Record<ClaimTone, string> = {
  INFO: "bg-sz-info-text",
  SUCCESS: "bg-sz-success-text",
  WARNING: "bg-sz-warning-text",
  DANGER: "bg-sz-danger-text",
  NEUTRAL: "bg-sz-n-400",
};

/** 시안 `.hitem` — 점 + 처리 내용 + 행위자 · 일시 */
export function HistoryItem(props: {
  tone: ClaimTone;
  label: string;
  meta: string;
}) {
  return (
    <div className="flex gap-2.5 py-1.5">
      <div
        className={cn(
          "mt-1.5 size-[7px] shrink-0 rounded-full",
          HDOT_CLASS[props.tone]
        )}
      />
      <div>
        <div className="text-[12px]">{props.label}</div>
        <div className="text-[11px] text-sz-n-500">{props.meta}</div>
      </div>
    </div>
  );
}

/** 시안 `.rl` — 우측 레일 카드 */
export function RailCard(props: { title: string; children: ReactNode }) {
  return (
    <section className="mb-2 rounded-[8px] border border-sz-n-200 bg-white">
      <div className="rounded-t-[8px] border-b border-sz-n-200 bg-sz-n-50 px-3 py-[9px] text-[12px] font-semibold">
        {props.title}
      </div>
      <div className="flex flex-col gap-[7px] p-3">{props.children}</div>
    </section>
  );
}

/** 시안 `.rl-t` */
export function RailText(props: { children: ReactNode; flushTop?: boolean }) {
  return (
    // 시안 .rl-t는 <p> 기본 여백(1em)을 그대로 둔다 — 위 여백만 「조치할 것이 없습니다」 문구가 inline으로 0으로 지운다
    <p
      className={cn(
        "mb-[11px] text-[11px] leading-[1.6] text-sz-n-500",
        props.flushTop ? "mt-0" : "mt-[11px]"
      )}
    >
      {props.children}
    </p>
  );
}

/** 시안 `.tlink` — 다른 화면으로 가는 링크 */
export function RailLink(props: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="cursor-pointer py-0.5 text-center text-[11px] text-sz-accent-500 hover:underline"
    >
      {props.children}
    </button>
  );
}

/** 시안 `.mwarn` — 모달 폼 안의 위험색 안내(!) */
export function Warn(props: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-2 rounded-[6px] bg-sz-danger-bg px-3 py-2.5 text-[11px] font-medium leading-[1.6] text-sz-danger-text",
        props.className
      )}
    >
      <span>!</span>
      <span>{props.children}</span>
    </div>
  );
}
