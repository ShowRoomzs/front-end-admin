export interface MenuItem {
  id: string;
  label: string;
  path?: string;
  /** 본문 h1으로 쓸 제목. 생략하면 label을 그대로 쓴다 */
  pageTitle?: string;
  /** 상위 메뉴 우측 빨간 뱃지(미처리 건수). 값이 없으면 렌더링하지 않는다 */
  badge?: number;
  /** 하위 메뉴 우측 회색 카운트(전체 건수). 값이 없으면 렌더링하지 않는다 */
  count?: number;
  children?: Array<MenuItem>;
}

export interface MenuConfig {
  menuType: string;
  groups: Array<MenuItem>;
}
