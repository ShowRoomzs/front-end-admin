import type { MenuConfig } from "@/common/types";

export const ADMIN_MENU: MenuConfig = {
  menuType: "ADMIN",
  groups: [
    {
      id: "user-management",
      label: "일반 유저 관리",
      children: [
        {
          id: "user-account",
          label: "일반 유저 계정 관리",
          path: "/user/account",
        },
        {
          id: "user-login-history",
          label: "로그인 이력",
          path: "/user/login-history",
        },
        {
          id: "user-social-login",
          label: "간편 로그인 설정",
          path: "/user/social-login",
        },
      ],
    },
    {
      id: "market-management",
      label: "마켓 관리",
      children: [
        {
          id: "market-registration",
          label: "마켓 가입 신청 관리",
          path: "/market/registration",
        },
        {
          id: "market-account",
          label: "마켓 계정 관리",
          path: "/market/account",
        },
        {
          id: "market-product",
          label: "상품 관리",
          path: "/market/product",
        },
      ],
    },
    {
      id: "category",
      label: "카테고리 관리",
      path: "/category",
    },
    {
      id: "filter",
      label: "필터 관리",
      path: "/filter",
    },
    {
      id: "role",
      label: "role 관리",
      path: "/role",
    },
  ],
};
