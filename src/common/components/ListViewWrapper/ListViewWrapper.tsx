import type { ReactNode } from "react";

interface ListViewWrapperProps {
  children: ReactNode;
}

/**
 * 테이블 높이 조절을 위한 wrapper 컴포넌트
 */
export default function ListViewWrapper(props: ListViewWrapperProps) {
  const { children } = props;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
    </div>
  );
}
