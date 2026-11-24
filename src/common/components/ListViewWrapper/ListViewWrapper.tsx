import type { ReactNode } from "react";

interface ListViewWrapperProps {
  children: ReactNode;
}

/**
 * 목록 화면 감싸개 — 내용 높이대로 늘어나고 세로 스크롤은 MainLayout `main` 하나가 맡는다(11-24).
 * 예전엔 `h-full overflow-hidden`으로 높이를 화면에 묶어, 그 안의 카드 · 가로 스크롤 감싸개(`overflow-x-auto`는
 * 세로도 auto가 된다)가 따로 세로 스크롤바를 만들어 페이지 스크롤과 겹쳤다.
 */
export default function ListViewWrapper(props: ListViewWrapperProps) {
  const { children } = props;

  return <div className="flex flex-col">{children}</div>;
}
