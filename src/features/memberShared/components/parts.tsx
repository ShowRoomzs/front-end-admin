import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { ELINK_CLASS } from "@/features/memberShared/constants/styles";
import {
  displayUrl,
  externalHref,
  toneVariant,
} from "@/features/memberShared/utils/format";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

/*
  시안 ui-admin-15 · 18 상세 카드의 원자 — `.card` · `.card-h` · `.card-b.two` · `.frow` · `.kpi4` · `.mrow` · `.wait`.
  공용 DetailCard는 헤더에 보조 텍스트 하나만 받아 「배지 + 보조 텍스트 + 버튼」 머리를 못 그려 따로 둔다.
*/

interface MemberCardProps {
  title: string;
  /** 제목 바로 뒤(「변경 요청 대기 1건」 배지) */
  badge?: ReactNode;
  /** `.ch-n` — 오른쪽으로 밀리는 보조 텍스트 */
  note?: ReactNode;
  /** 보조 텍스트 뒤 링크 · 버튼(메모 기입 · 운영자 채널 열기 ↗) */
  actions?: ReactNode;
  children: ReactNode;
  /** 본문 패딩 없이(표 · 칩 줄) */
  flush?: boolean;
}

export function MemberCard(props: MemberCardProps) {
  const { title, badge, note, actions, children, flush = false } = props;

  return (
    <section className="rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex items-center rounded-t-[8px] border-b border-sz-n-200 bg-sz-n-50 px-4 py-[11px]">
        <h2 className="shrink-0 text-[13px] font-semibold text-sz-n-900">
          {title}
        </h2>
        {badge && <span className="ml-2 flex items-center">{badge}</span>}
        {note && (
          <span className="ml-auto pl-3 text-right text-[11px] font-normal text-sz-n-500">
            {note}
          </span>
        )}
        {actions && (
          <span
            className={cn(
              "flex shrink-0 items-center gap-3",
              note ? "ml-3" : "ml-auto"
            )}
          >
            {actions}
          </span>
        )}
      </div>
      {flush ? children : <div className="p-4">{children}</div>}
    </section>
  );
}

export interface FieldItem {
  label: string;
  value: ReactNode;
}

/**
 * `.card-b.two` — 필드가 많은 카드를 2열 그리드로 접는다. 값이 열 폭을 넘으면 잘리지 않고 두 줄로 흐른다.
 * 각 열의 마지막 행은 아래 선을 지운다(시안 `:nth-last-child(2):nth-child(odd)`와 같은 결과).
 */
export function FieldGrid(props: {
  items: Array<FieldItem | null | false>;
  /** `.prof` 같은 머리 블록 — 두 열에 걸친다 */
  head?: ReactNode;
}) {
  const { head } = props;
  const items = props.items.filter((item): item is FieldItem => !!item);

  return (
    <div className="grid grid-cols-2 gap-x-6">
      {head && <div className="col-span-2">{head}</div>}
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            "flex items-start gap-3 py-[7px] text-[12px]",
            index < 2 && "pt-0",
            index + 2 < items.length && "border-b border-sz-n-100"
          )}
        >
          <span className="w-[140px] shrink-0 text-sz-n-500">{item.label}</span>
          <span className="min-w-0 flex-1 whitespace-normal break-keep leading-[1.5] text-sz-n-900 [overflow-wrap:anywhere]">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/** `.kpi4` — 4칸 지표. `warn`은 미정산액 · 조정 협의처럼 「돈이 걸린」 수치에만 */
export function Kpi4(props: {
  items: Array<{
    label: string;
    value: string;
    warn?: boolean;
    sub?: ReactNode;
  }>;
}) {
  const { items } = props;

  return (
    <div className="grid grid-cols-4 gap-px overflow-hidden rounded-[6px] bg-sz-n-200">
      {items.map((item) => (
        <div key={item.label} className="bg-white px-4 py-3.5">
          <div className="text-[11px] text-sz-n-600">{item.label}</div>
          <div
            className={cn(
              "mt-1 text-[16px] font-semibold tabular-nums tracking-[-0.01em]",
              item.warn ? "text-sz-warning-text" : "text-sz-n-900"
            )}
          >
            {item.value}
          </div>
          {item.sub && (
            <div className="mt-0.5 text-[11px] text-sz-n-500">{item.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}

/** `.st-line` — 「회원 [활성]」 · 「심사 [탈퇴 승인 대기]」 */
export function StatusLine(props: {
  label: string;
  tone: string;
  text: string;
}) {
  const { label, tone, text } = props;

  return (
    <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3">
      <span className="shrink-0 text-[12px] text-sz-n-500">{label}</span>
      <StatusBadge variant={toneVariant(tone)}>{text}</StatusBadge>
    </div>
  );
}

/** `.mrow` — 레일 「가입일 2026.07.28」 */
export function MetaRow(props: { label: string; children: ReactNode }) {
  const { label, children } = props;

  return (
    <div className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0">
      <span className="shrink-0 text-sz-n-500">{label}</span>
      <span className="text-right font-medium tabular-nums text-sz-n-900">
        {children}
      </span>
    </div>
  );
}

/** `.wait` — 경고 배경 안내(「탈퇴 사유 — …」) */
export function WaitBox(props: { children: ReactNode }) {
  return (
    <div className="mb-3 rounded-[6px] bg-sz-warning-bg px-3 py-2.5 text-[11px] leading-[1.7] text-sz-warning-text">
      {props.children}
    </div>
  );
}

/** `.gone` — 「— 파기됨」 · 「해당 없음」 · 「· 비공개」 */
export function Gone(props: { children?: ReactNode }) {
  return <span className="text-sz-n-500">{props.children ?? "— 파기됨"}</span>;
}

/** `.elink` — 외부 이동은 ↗ 아이콘을 붙인다 */
export function ExternalAnchor(props: { url: string; label?: string }) {
  const { url, label } = props;

  return (
    <a
      href={externalHref(url)}
      target="_blank"
      rel="noreferrer noopener"
      className={ELINK_CLASS}
    >
      {label ?? displayUrl(url)}
      <ExternalLink className="size-3" aria-hidden />
    </a>
  );
}

/** 표 · 카드의 빈 문구(`.t-sub` 6px 위아래) */
export function EmptyLine(props: { children: ReactNode }) {
  return (
    <div className="py-1.5 text-[11px] text-sz-n-500">{props.children}</div>
  );
}
