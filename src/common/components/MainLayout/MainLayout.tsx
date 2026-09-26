import { ADMIN_MENU } from "@/common/constants";
import type { MenuItem } from "@/common/types";
import { useGetAdminContractSummary } from "@/features/contract/hooks/useAdminContractQueries";
import { useGetChangeRequestPendingCount } from "@/features/changeRequest/hooks/useGetChangeRequestPendingCount";
import { useGetCreatorPendingCount } from "@/features/creator/hooks/useGetCreatorPendingCount";
import { useGetInquiryUnansweredCount } from "@/features/inquiry/hooks/useGetInquiryUnansweredCount";
import { useGetSellerPendingCount } from "@/features/seller/hooks/useGetSellerPendingCount";
import { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../Sidebar";
import Header from "./Header";
import type { ShellOutletContext } from "./usePageSubtitle";

const MENUS = [ADMIN_MENU];
const GROUPS = MENUS.flatMap((menu) => menu.groups);
const ALL_ITEMS = GROUPS.flatMap((group) => group.children ?? [group]);

/**
 * 입점 관리 그룹에 대기 건수를 채워 넣은 메뉴를 만든다.
 * 그룹 뱃지는 브랜드 + 인플루언서 + 변경 요청 합산이고, 하위 메뉴는 각자의 건수를 갖는다.
 */
function withOnboardingCounts(
  menus: Array<typeof ADMIN_MENU>,
  brandPending: number,
  influencerPending: number,
  changeRequestPending: number
) {
  // 0건이면 뱃지 자체를 렌더링하지 않는다(사이드바가 undefined를 그렇게 취급한다)
  const toBadge = (value: number) => (value > 0 ? value : undefined);
  const groupCount = toBadge(
    brandPending + influencerPending + changeRequestPending
  );

  const childCounts: Record<string, number | undefined> = {
    "onboarding-brand": toBadge(brandPending),
    "onboarding-influencer": toBadge(influencerPending),
    "onboarding-change-request": toBadge(changeRequestPending),
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

/**
 * CS·콘텐츠 관리 그룹에 1:1 문의 미답변 건수를 채워 넣는다.
 *
 * 그룹 뱃지 = 1:1 문의 미답변 건수 **그대로**다. 상품 문의 답변대기는 브랜드가 할
 * 일이라 운영자 뱃지에 더하지 않는다 — 더하면 운영자가 손댈 수 없는 숫자가 GNB에
 * 남아 배지가 줄지 않는다(§17-7).
 */
function withCsCounts(
  menus: Array<typeof ADMIN_MENU>,
  inquiryUnanswered: number
) {
  const badge = inquiryUnanswered > 0 ? inquiryUnanswered : undefined;

  return menus.map((menu) => ({
    ...menu,
    groups: menu.groups.map((group) => {
      if (group.id !== "cs-content") {
        return group;
      }
      return {
        ...group,
        badge,
        children: group.children?.map((child) =>
          child.id === "cs-inquiry" ? { ...child, count: badge } : child
        ),
      };
    }),
  }));
}

/**
 * 계약 관리 GNB 뱃지 = 조치 큐 합계(검토 대기 · 체결 처리 대기 · 만료 확인 · 재발송 요청).
 * 단일 메뉴라 하위 count 없이 그룹 뱃지만 채운다.
 */
function withContractCount(
  menus: Array<typeof ADMIN_MENU>,
  actionRequired: number
) {
  const badge = actionRequired > 0 ? actionRequired : undefined;
  return menus.map((menu) => ({
    ...menu,
    groups: menu.groups.map((group) =>
      group.id === "contract" ? { ...group, badge } : group
    ),
  }));
}

/** 제목 아래 설명 줄이 붙어 화면이 h1을 직접 그리는 목록 */
const SELF_TITLED_PATHS = ["/contract"];

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
  const { title, subtitle: menuSubtitle } = resolveBreadcrumb(
    location.pathname
  );
  // 상세 화면이 올린 레코드 이름(usePageSubtitle) — 없으면 메뉴 하위 라벨
  const [pageSubtitle, setPageSubtitle] = useState<string | null>(null);
  const subtitle = pageSubtitle ?? menuSubtitle;
  const outletContext = useMemo<ShellOutletContext>(
    () => ({ setSubtitle: setPageSubtitle }),
    []
  );
  const { pendingCount: brandPending } = useGetSellerPendingCount();
  const { pendingCount: influencerPending } = useGetCreatorPendingCount();
  const { pendingCount: changeRequestPending } =
    useGetChangeRequestPendingCount();
  const { unansweredCount: inquiryUnanswered } = useGetInquiryUnansweredCount();
  const { data: contractSummary } = useGetAdminContractSummary();

  // 목록 화면은 메뉴에 지정된 제목을 페이지 타이틀로 쓴다.
  // 상세 화면(하위 경로)은 브랜드명 등 자체 타이틀을 렌더링하므로 비워둔다.
  const currentItem = ALL_ITEMS.find((item) => item.path === location.pathname);
  const pageTitle = SELF_TITLED_PATHS.includes(location.pathname)
    ? undefined
    : (currentItem?.pageTitle ?? currentItem?.label);
  const menus = withContractCount(
    withCsCounts(
      withOnboardingCounts(
        MENUS,
        brandPending,
        influencerPending,
        changeRequestPending
      ),
      inquiryUnanswered
    ),
    contractSummary?.actionRequiredCount ?? 0
  );

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
          <Outlet context={outletContext} />
        </main>
      </div>
    </div>
  );
}
