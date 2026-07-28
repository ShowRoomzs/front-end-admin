import type { MenuConfig } from "@/common/types";

/**
 * 어드민 GNB 정본 (ui-admin-02-onboarding-brand rev.6 사이드바 기준, 10개 대분류)
 * 배열 순서가 곧 사이드바 번호이며, children이 있으면 아코디언으로 렌더링된다.
 * badge/count는 집계 API가 없어 아직 비워둔다(값이 들어오면 사이드바가 자동 노출).
 */
export const ADMIN_MENU: MenuConfig = {
  menuType: "ADMIN",
  groups: [
    {
      id: "home",
      label: "홈",
      path: "/",
    },
    {
      id: "onboarding",
      label: "입점 관리",
      children: [
        {
          id: "onboarding-brand",
          label: "브랜드",
          pageTitle: "브랜드 입점 신청",
          path: "/market/registration",
        },
        {
          id: "onboarding-influencer",
          label: "인플루언서",
          pageTitle: "인플루언서 입점 신청",
          path: "/showroom/registration",
        },
      ],
    },
    {
      id: "member",
      label: "회원 관리",
      children: [
        {
          id: "member-brand",
          label: "브랜드",
          pageTitle: "브랜드 회원 관리",
          path: "/market/list",
        },
        {
          id: "member-influencer",
          label: "인플루언서",
          pageTitle: "인플루언서 회원 관리",
          path: "/showroom/list",
        },
        {
          id: "member-consumer",
          label: "소비자",
          pageTitle: "소비자 회원 관리",
          path: "/member/list",
        },
      ],
    },
    {
      id: "product",
      label: "상품 관리",
      path: "/product/list",
    },
    {
      id: "group-buy",
      label: "공구 관리",
      path: "/group-buy",
    },
    {
      id: "transaction",
      label: "거래 관리",
      path: "/order/list",
      pageTitle: "거래 관리",
    },
    {
      id: "settlement",
      label: "정산 관리",
      children: [
        {
          id: "settlement-group-buy",
          label: "공구 정산",
          path: "/settlement/group-buy",
        },
        {
          id: "settlement-fixed-payout",
          label: "고정 지급비 정산",
          path: "/settlement/fixed-payout",
        },
      ],
    },
    {
      id: "cs-content",
      label: "CS·콘텐츠 관리",
      children: [
        {
          id: "cs-inquiry",
          label: "1:1 문의",
          path: "/support/inquiry",
        },
        {
          id: "cs-product-inquiry",
          label: "상품 문의 모니터링",
          path: "/support/product-inquiry",
        },
        {
          id: "cs-faq",
          label: "FAQ 관리",
          path: "/support/faq",
        },
        {
          id: "cs-notice",
          label: "공지 관리",
          path: "/support/notice",
        },
        {
          id: "cs-terms",
          label: "약관 관리",
          path: "/support/terms",
        },
      ],
    },
    {
      id: "monitoring",
      label: "게시물·소통 모니터링",
      children: [
        {
          id: "monitoring-group-buy-post",
          label: "공구 게시물",
          path: "/monitoring/group-buy-posts",
        },
        {
          id: "monitoring-post",
          label: "일반 게시물",
          path: "/monitoring/posts",
        },
        {
          id: "monitoring-thread",
          label: "소통 스레드",
          path: "/monitoring/threads",
        },
      ],
    },
    {
      id: "settings",
      label: "설정",
      children: [
        {
          id: "settings-social-login",
          label: "소셜 로그인 설정",
          path: "/member/social-login",
        },
        {
          id: "settings-admin-account",
          label: "운영자 계정 관리",
          path: "/admin/list",
        },
      ],
    },
  ],
};
