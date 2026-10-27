import type { MenuConfig, MenuItem } from "@/common/types";
import type { AdminBadges } from "@/features/home/types";

/*
  사이드바 배지를 `GET /v1/admin/badges` 한 번으로 채운다(1017 설계서 6-0 ① — 홈 할 일과 같은 계산이라
  「할 일 합계 = 배지 합」이 어긋나지 않는다). MainLayout이 메뉴별 `/summary` 여러 개 대신 이 함수를 쓴다.

  - 그룹 빨간 배지(`badge`) = 할 일 건수. 0이면 숨긴다(undefined).
  - 하위 회색 숫자(`count`) = 시안 사이드바: 입점 하위는 대기 건수, 회원 하위는 회원 수(탈퇴 제외 · 0이어도 남는다),
    CS 1:1 문의 = 답변 대기, 상품 문의 = 삭제 요청(cs.total − inquiries), 일반 게시물 = 신고 · 이의 대기,
    소통 스레드 = 안 읽은 메시지(할 일이 아니라 그룹 배지에는 더하지 않는다 — 서버 posts.total 규칙).
  - 거래 관리 하위(반품·교환 · 환불 · 예외)는 서버가 나눠 주지 않는다 — 호출부가 기존 요약 값을 그대로 둔다.
*/

const badgeOf = (value: number) => (value > 0 ? value : undefined);

type Patch = { badge?: number; counts?: Record<string, number | undefined> };

function patchesOf(badges: AdminBadges): Record<string, Patch> {
  return {
    onboarding: {
      badge: badgeOf(badges.onboarding.total),
      counts: {
        "onboarding-brand": badgeOf(badges.onboarding.brand),
        "onboarding-influencer": badgeOf(badges.onboarding.creator),
        "onboarding-change-request": badgeOf(badges.onboarding.changeRequests),
      },
    },
    member: {
      badge: badgeOf(badges.members.todo),
      counts: {
        "member-brand": badges.members.brandCount,
        "member-influencer": badges.members.creatorCount,
        "member-consumer": badges.members.userCount,
      },
    },
    contract: { badge: badgeOf(badges.contracts) },
    "group-buy": { badge: badgeOf(badges.groupBuys) },
    transaction: { badge: badgeOf(badges.transactions) },
    settlement: { badge: badgeOf(badges.settlements) },
    "cs-content": {
      badge: badgeOf(badges.cs.total),
      counts: {
        "cs-inquiry": badgeOf(badges.cs.inquiries),
        "cs-product-inquiry": badgeOf(badges.cs.total - badges.cs.inquiries),
      },
    },
    monitoring: {
      badge: badgeOf(badges.posts.total),
      counts: {
        "monitoring-post": badgeOf(badges.posts.general),
        "monitoring-thread": badgeOf(badges.posts.threads),
      },
    },
  };
}

function applyPatch(group: MenuItem, patch: Patch | undefined): MenuItem {
  if (!patch) return group;
  const counts = patch.counts;
  return {
    ...group,
    badge: patch.badge,
    children: group.children?.map((child) =>
      counts && child.id in counts
        ? { ...child, count: counts[child.id] }
        : child
    ),
  };
}

/** 배지 응답이 없으면(로딩 · 실패) 메뉴를 그대로 돌려준다 — 호출부의 기존 값이 남는다 */
export function withAdminBadges<T extends MenuConfig>(
  menus: Array<T>,
  badges: AdminBadges | undefined
): Array<T> {
  if (!badges) return menus;
  const patches = patchesOf(badges);
  return menus.map((menu) => ({
    ...menu,
    groups: menu.groups.map((group) => applyPatch(group, patches[group.id])),
  }));
}
