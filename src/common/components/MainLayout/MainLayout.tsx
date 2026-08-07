import { ADMIN_MENU } from "@/common/constants";
import type { MenuItem } from "@/common/types";
import { useGetCreatorPendingCount } from "@/features/creator/hooks/useGetCreatorPendingCount";
import { useGetSellerPendingCount } from "@/features/seller/hooks/useGetSellerPendingCount";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../Sidebar";
import Header from "./Header";

const MENUS = [ADMIN_MENU];
const GROUPS = MENUS.flatMap((menu) => menu.groups);
const ALL_ITEMS = GROUPS.flatMap((group) => group.children ?? [group]);

/**
 * 입점 관리 그룹에 심사 대기 건수를 채워 넣은 메뉴를 만든다.
 * 그룹 뱃지는 브랜드 + 인플루언서 합산이고, 하위 메뉴는 각자의 건수를 갖는다.
 */
function withOnboardingCounts(
  menus: Array<typeof ADMIN_MENU>,
  brandPending: number,
  influencerPending: number
) {
  // 0건이면 뱃지 자체를 렌더링하지 않는다(사이드바가 undefined를 그렇게 취급한다)
  const toBadge = (value: number) => (value > 0 ? value : undefined);
  const groupCount = toBadge(brandPending + influencerPending);

  const childCounts: Record<string, number | undefined> = {
    "onboarding-brand": toBadge(brandPending),
    "onboarding-influencer": toBadge(influencerPending),
  };

  return menus.map((menu) => ({
    ...menu,
    groups: menu.groups.map((group) => {
      if (group.id !== "onboarding") {
        return group;
      }
      return {
        ...group,
        badge: groupCount,
        children: group.children?.map((child) =>
          child.id in childCounts
            ? { ...child, count: childCounts[child.id] }
            : child
        ),
      };
    }),
  }));
}

/** 상세 화면(`/market/registration/12`)도 해당 메뉴에 속한 것으로 본다 */
function matches(item: MenuItem, pathname: string) {
  return (
    Boolean(item.path) &&
    (pathname === item.path || pathname.startsWith(`${item.path}/`))
  );
}

/** 현재 경로가 속한 그룹/하위 메뉴를 찾아 브레드크럼을 만든다 */
function resolveBreadcrumb(pathname: string) {
  for (const group of GROUPS) {
    const child = group.children?.find((item) => matches(item, pathname));
    if (child) {
      return { title: group.label, subtitle: child.label };
    }
    if (matches(group, pathname)) {
      return { title: group.label, subtitle: undefined };
    }
  }
  return { title: undefined, subtitle: undefined };
}

/**
 * 어드민 셸 — 사이드바(240px, 전체 높이) + 우측 [탑바 56px + 본문 24px 패딩].
 * 탑바는 브레드크럼만 담당하고, 상세 화면처럼 자체 헤더가 필요한 페이지는
 * 본문에서 직접 타이틀을 렌더링한다.
 */
export default function MainLayout() {
  const location = useLocation();
  const { title, subtitle } = resolveBreadcrumb(location.pathname);
  const { pendingCount: brandPending } = useGetSellerPendingCount();
  const { pendingCount: influencerPending } = useGetCreatorPendingCount();

  // 목록 화면은 메뉴에 지정된 제목을 페이지 타이틀로 쓴다.
  // 상세 화면(하위 경로)은 브랜드명 등 자체 타이틀을 렌더링하므로 비워둔다.
  const currentItem = ALL_ITEMS.find((item) => item.path === location.pathname);
  const pageTitle = currentItem?.pageTitle ?? currentItem?.label;
  const menus = withOnboardingCounts(MENUS, brandPending, influencerPending);

  return (
    <div className="flex h-screen bg-sz-n-50">
      <Sidebar menus={menus} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} subtitle={subtitle} operatorName="운영자" />
        <main className="flex min-h-0 flex-1 flex-col overflow-auto p-6">
          {pageTitle && (
            <h1 className="mb-4 shrink-0 text-[20px] font-semibold text-sz-n-900">
              {pageTitle}
            </h1>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
