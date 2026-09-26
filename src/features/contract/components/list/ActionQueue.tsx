import { CONTRACT_QUEUES } from "@/features/contract/constants/params";
import type {
  AdminContractQueue,
  AdminContractSummary,
} from "@/features/contract/types";
import { cn } from "@/lib/utils";

interface ActionQueueProps {
  summary: AdminContractSummary | undefined;
  selected: AdminContractQueue | "";
  onSelect: (queue: AdminContractQueue | "") => void;
}

/**
 * 시안 `.actbar/.aq` — 조치 큐 4개. 운영자는 **처리할 것을 찾으러** 오므로 탭보다 위에 둔다.
 * 검색과 무관한 카운트라 검색 결과가 비어도(A2) 그대로 남는다.
 * 1건 이상이면 경고색(`.aq.on`), 0건이면 흐리게(`.aq.zero`) — 누르면 그 큐만 걸러 본다.
 */
export default function ActionQueue(props: ActionQueueProps) {
  const { summary, selected, onSelect } = props;

  return (
    <div className="mb-5 flex gap-2.5">
      {CONTRACT_QUEUES.map((queue) => {
        const count = summary?.queues[queue.value] ?? 0;
        const isSelected = selected === queue.value;
        return (
          <button
            key={queue.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(isSelected ? "" : queue.value)}
            className={cn(
              "flex-1 cursor-pointer rounded-[8px] border px-3.5 py-2.5 text-left",
              count > 0
                ? "border-sz-warning-text bg-sz-warning-bg"
                : "border-sz-n-200 bg-sz-n-50 hover:border-sz-n-400",
              isSelected && "ring-[3px] ring-sz-accent-100"
            )}
          >
            <div
              className={cn(
                "text-[20px] font-semibold leading-[1.1] tabular-nums tracking-[-0.01em]",
                count > 0 ? "text-sz-warning-text" : "text-sz-n-400"
              )}
            >
              {count}
            </div>
            <div className="mt-1 text-[11px] text-sz-n-600">{queue.label}</div>
            <div className="mt-0.5 text-[10px] text-sz-n-500">
              {queue.description}
            </div>
          </button>
        );
      })}
    </div>
  );
}
