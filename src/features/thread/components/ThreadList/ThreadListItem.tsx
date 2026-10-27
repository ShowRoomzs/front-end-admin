import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { BUSINESS_TYPE_LABEL } from "@/features/thread/constants/params";
import type { ChannelListItem } from "@/features/thread/types";
import { formatListTime } from "@/features/thread/utils/format";
import { toBadgeVariant } from "@/features/thread/utils/tone";
import { cn } from "@/lib/utils";

interface ThreadListItemProps {
  item: ChannelListItem;
  isActive: boolean;
  onSelect: (threadId: number) => void;
}

/** 시안 `.cs-avatar` — 36px 원형. 이미지가 없으면 회색 원에 이름 첫 글자 */
function Avatar(props: { item: ChannelListItem }) {
  const { item } = props;

  if (item.issue) {
    // 이슈 행은 사각 「이슈」(`.cs-avatar.is`) — 시안 A3 · A4의 종결 행도 같은 경고색이다
    return (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-[6px] bg-sz-warning-bg text-[10px] font-semibold text-sz-warning-text">
        이슈
      </div>
    );
  }

  if (item.imageUrl) {
    return (
      <img
        src={item.imageUrl}
        alt=""
        className="size-9 shrink-0 rounded-full bg-sz-n-200 object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sz-n-200 text-[12px] font-semibold text-sz-n-500">
      {item.name.slice(0, 1)}
    </div>
  );
}

/** 보조 줄 — 브랜드 「BRD-1017 · 담당 이현」 · 인플루언서 「INF-3021 · 사업자」 · 이슈 subtitle */
function subLine(item: ChannelListItem) {
  if (item.issue) {
    return item.issue.subtitle;
  }
  const extra =
    item.tab === "BRAND"
      ? item.managerName && `담당 ${item.managerName}`
      : item.businessType && BUSINESS_TYPE_LABEL[item.businessType];
  return [item.memberNo, extra].filter(Boolean).join(" · ");
}

/** 시안 `.cs-item` */
export default function ThreadListItem(props: ThreadListItemProps) {
  const { item, isActive, onSelect } = props;
  const preview = item.lastMessagePreview
    ? `${item.lastMessageByOperator ? "운영팀: " : ""}${item.lastMessagePreview}`
    : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(item.threadId)}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "flex w-full gap-2.5 border-b border-sz-n-100 px-3.5 py-3 text-left",
        isActive
          ? "bg-sz-accent-50 shadow-[inset_3px_0_0_var(--sz-accent-500)]"
          : "hover:bg-sz-n-50"
      )}
    >
      <Avatar item={item} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <span className="truncate text-[13px] font-semibold text-sz-n-900">
            {item.name}
          </span>
          <span className="shrink-0 text-[11px] text-sz-n-400">
            {formatListTime(item.lastMessageAt)}
          </span>
        </div>
        <div className="mt-0.5 truncate text-[11px] tabular-nums text-sz-n-500">
          {subLine(item)}
          {/*
            시안 A7 「소명 미확인」 — 정지 회원의 미확인 말풍선(서버가 목록 맨 위에 고정한다).
            보조 줄 안에 들어가는 작은 배지라 공용 StatusBadge(11px · 9px 패딩) 대신 시안 인라인 값(10px · 0 6px)을 쓴다.
            개발 서버(main 미배포)는 필드가 없어 그리지 않는다.
          */}
          {item.appealUnconfirmed && (
            <>
              {" · "}
              <span className="inline-flex items-center whitespace-nowrap rounded-full bg-sz-warning-bg px-1.5 text-[10px] font-medium text-sz-warning-text">
                소명 미확인
              </span>
            </>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          {item.issue ? (
            <StatusBadge variant={toBadgeVariant(item.issue.badgeTone)} hideDot>
              {item.issue.badgeLabel}
            </StatusBadge>
          ) : (
            <span className="min-w-0 flex-1 truncate text-[12px] text-sz-n-500">
              {preview ?? "아직 메시지가 없습니다"}
            </span>
          )}
          {item.unreadCount > 0 && (
            <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-[9px] bg-sz-accent-500 px-[5px] text-[11px] font-semibold text-white">
              {item.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
