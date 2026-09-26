import { CONTRACT_TABS } from "@/features/contract/constants/params";
import type { AdminContractTab } from "@/features/contract/types";
import { cn } from "@/lib/utils";

interface ContractTabsProps {
  tab: AdminContractTab;
  counts: Partial<Record<AdminContractTab, number>> | undefined;
  /** 조치 큐를 고르면 탭은 무시된다 — 선택 표시를 끈다 */
  dimmed: boolean;
  onTabChange: (tab: AdminContractTab) => void;
}

/** 시안 `.tabs/.tab` — 밑줄 탭 + 카운트 칩. 작성중·검토 반려 탭은 없다 */
export default function ContractTabs(props: ContractTabsProps) {
  const { tab, counts, dimmed, onTabChange } = props;

  return (
    <div className="mb-4 flex border-b border-sz-n-200">
      {CONTRACT_TABS.map((item) => {
        const isActive = !dimmed && item.value === tab;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onTabChange(item.value)}
            className={cn(
              "-mb-px mr-[22px] flex items-center gap-1.5 border-b-2 px-0.5 pb-[9px] pt-2 text-[12px]",
              isActive
                ? "border-sz-accent-500 font-medium text-sz-accent-500"
                : "border-transparent text-sz-n-500 hover:text-sz-n-700"
            )}
          >
            {item.label}
            <span
              className={cn(
                "rounded-[8px] px-[5px] text-[10px]",
                isActive
                  ? "bg-sz-accent-50 text-sz-accent-600"
                  : "bg-sz-n-100 text-sz-n-600"
              )}
            >
              {counts?.[item.value] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
