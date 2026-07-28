import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface TableFooterProps {
  renderLeft: ReactNode;
  renderRight: ReactNode;
}

export default function TableFooter(props: TableFooterProps) {
  const { renderLeft, renderRight } = props;

  // 빈 상태에서는 페이지네이션이 없으므로 구분선만 남은 빈 띠가 생기지 않게 한다
  if (!renderLeft && !renderRight) {
    return null;
  }

  return (
    <div
      className={cn(
        "sticky bottom-0 left-0 z-10 flex w-full flex-row items-center border-t border-sz-n-200 bg-white p-3",
        // 좌측 콘텐츠가 없으면 시안대로 페이지네이션을 가운데 정렬한다
        renderLeft ? "justify-between" : "justify-center"
      )}
    >
      {renderLeft}
      {renderRight}
    </div>
  );
}
