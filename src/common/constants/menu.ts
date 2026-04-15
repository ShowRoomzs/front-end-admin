import type { MenuConfig } from "@/common/types";

export const ADMIN_MENU: MenuConfig = {
  menuType: "ADMIN",
  groups: [
    {
      id: "dashboard",
      label: "대시보드",
      path: "/",
    },
    {
      id: "market-management",
      label: "마켓 관리",
      children: [
        {
          id: "market-registration",
          label: "입점 신청 관리",
          path: "/market/registration",
        },
        {
          id: "market-list",
          label: "마켓 목록",
          path: "/market/list",
        },
      ],
    },
    {
      id: "product-management",
      label: "상품 관리",
      children: [
        {
          id: "product-inspection",
          label: "상품 검수",
          path: "/product/inspection",
        },
        {
          id: "product-list",
          label: "전체 상품 목록",
          path: "/product/list",
        },
        {
          id: "product-category",
          label: "카테고리 관리",
          path: "/product/category",
        },
        {
          id: "product-filter",
          label: "필터 관리",
          path: "/product/filter",
        },
        {
          id: "product-review",
          label: "리뷰 관리",
          path: "/product/review",
        },
      ],
    },
    {
      id: "showroom-management",
      label: "쇼룸 관리",
      children: [
        {
          id: "showroom-registration",
          label: "쇼룸 신청 관리",
          path: "/showroom/registration",
        },
        {
          id: "showroom-list",
          label: "쇼룸 목록",
          path: "/showroom/list",
        },
      ],
    },
    {
      id: "banner-management",
      label: "배너/프로모션 관리",
      children: [
        {
          id: "banner-list",
          label: "배너 목록",
          path: "/banner/list",
        },
        {
          id: "banner-register",
          label: "배너 등록",
          path: "/banner/register",
        },
      ],
    },
    {
      id: "member-management",
      label: "회원 관리",
      children: [
        {
          id: "member-list",
          label: "회원 목록",
          path: "/member/list",
        },
        {
          id: "member-sanction",
          label: "제재 관리",
          path: "/member/sanction",
        },
        {
          id: "member-social-login",
          label: "간편 로그인 설정",
          path: "/member/social-login",
        },
        {
          id: "member-login-history",
          label: "로그인 이력 관리",
          path: "/member/login-history",
        },
      ],
    },
    {
      id: "order-management",
      label: "주문 관리",
      children: [
        {
          id: "order-list",
          label: "전체 주문 조회",
          path: "/order/list",
        },
        {
          id: "order-claim",
          label: "클레임 현황",
          path: "/order/claim",
        },
      ],
    },
    {
      id: "settlement-management",
      label: "정산 관리",
      children: [
        {
          id: "settlement-status",
          label: "정산 현황",
          path: "/settlement/status",
        },
        {
          id: "settlement-process",
          label: "정산 처리",
          path: "/settlement/process",
        },
      ],
    },
    {
      id: "fee-management",
      label: "수수료 정책 관리",
      children: [
        {
          id: "fee-rate",
          label: "수수료율 설정",
          path: "/fee/rate",
        },
        {
          id: "fee-exposure",
          label: "노출 옵션 요금 설정",
          path: "/fee/exposure",
        },
      ],
    },
    {
      id: "coupon-management",
      label: "쿠폰 관리",
      children: [
        {
          id: "coupon-list",
          label: "쿠폰 목록",
          path: "/coupon/list",
        },
      ],
    },
    {
      id: "support-management",
      label: "고객지원 관리",
      children: [
        {
          id: "support-inquiry",
          label: "문의 관리",
          path: "/support/inquiry",
        },
        {
          id: "support-faq",
          label: "자주 묻는 질문 관리",
          path: "/support/faq",
        },
        {
          id: "support-notice",
          label: "공지사항 관리",
          path: "/support/notice",
        },
        {
          id: "support-push",
          label: "푸시 알림",
          path: "/support/push",
        },
      ],
    },
    {
      id: "policy-management",
      label: "정책/약관 관리",
      children: [
        {
          id: "policy-terms",
          label: "이용약관",
          path: "/policy/terms",
        },
        {
          id: "policy-privacy",
          label: "개인정보처리방침",
          path: "/policy/privacy",
        },
        {
          id: "policy-seller-terms",
          label: "판매자 이용약관",
          path: "/policy/seller-terms",
        },
      ],
    },
    {
      id: "admin-management",
      label: "운영자 계정 관리",
      children: [
        {
          id: "admin-list",
          label: "운영자 계정 목록",
          path: "/admin/list",
        },
      ],
    },
  ],
};
