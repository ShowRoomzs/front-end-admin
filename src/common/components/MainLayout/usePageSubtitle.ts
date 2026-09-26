import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";

/** 셸이 자식 화면에 내려주는 것 — 탑바 브레드크럼 하위 항목을 바꾸는 손잡이 하나뿐이다 */
export interface ShellOutletContext {
  setSubtitle: (subtitle: string | null) => void;
}

/**
 * 상세 화면이 자기 이름을 탑바 브레드크럼에 올린다(시안 「계약 관리 / 여름 수분 세럼 공구」).
 * 메뉴 표만으로는 레코드 이름을 알 수 없어 화면이 직접 넘긴다. `null`이면 메뉴 라벨로 되돌아간다.
 */
export function usePageSubtitle(subtitle: string | null) {
  const { setSubtitle } = useOutletContext<ShellOutletContext>();

  useEffect(() => {
    setSubtitle(subtitle);
    // 화면을 떠날 때 되돌리지 않으면 목록으로 돌아가서도 레코드 이름이 남는다
    return () => setSubtitle(null);
  }, [setSubtitle, subtitle]);
}
