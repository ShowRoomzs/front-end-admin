import type { MenuConfig } from "@/common/types";

export const ADMIN_MENU: MenuConfig = {
  menuType: "ADMIN",
  groups: [
    {
      id: "seller-user",
      label: "셀러유저 가입 관리",
      path: "/seller-user",
    },
    {
      id: "category",
      label: "카테고리 관리",
      path: "/category",
    },
    {
      id: "role",
      label: "role 관리",
      path: "/role",
    },
    {
      id: "filter",
      label: "필터 관리",
      path: "/filter",
    },
  ],
};
