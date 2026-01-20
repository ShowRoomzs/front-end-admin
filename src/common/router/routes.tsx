import type { RouteObject } from "react-router-dom";
import { MainLayout } from "@/common/components";
import LoginPage from "@/features/auth/pages/LoginPage";
import PlaceholderPage from "@/common/components/PlaceholderPage";
import CategoryManagement from "@/features/category/pages/CategoryManagement";
import CommonUserManagement from "@/features/user/pages/CommonUserManagement";
import SellerRegistrationManagement from "@/features/seller/pages/SellerRegistrationManagement";
import SellerRegistrationDetail from "@/features/seller/pages/SellerRegistrationDetail";
import SellerUserManagement from "@/features/seller/pages/SellerUserManagement";
import FilterManagement from "@/features/filter/pages/FilterManagement";
import SocialLoginManagement from "@/features/user/pages/SocialLoginManagement";

export const authRoutes: Array<RouteObject> = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "*",
    element: <LoginPage />,
  },
];

export const mainRoutes: Array<RouteObject> = [
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <PlaceholderPage title="대시보드" />,
      },
      // 일반 유저 관리
      {
        path: "user",
        children: [
          {
            path: "account",
            element: <CommonUserManagement />,
          },
          {
            path: "login-history",
            element: <PlaceholderPage title="로그인 이력" />,
          },
          {
            path: "social-login",
            element: <SocialLoginManagement />,
          },
        ],
      },
      // 마켓 관리
      {
        path: "market",
        children: [
          {
            path: "registration",
            element: <SellerRegistrationManagement />,
          },
          {
            path: "registration/:id",
            element: <SellerRegistrationDetail />,
          },
          {
            path: "account",
            element: <SellerUserManagement />,
          },
          {
            path: "product",
            element: <PlaceholderPage title="상품 관리" />,
          },
        ],
      },
      // 시스템 관리
      {
        path: "category",
        element: <CategoryManagement />,
      },
      {
        path: "filter",
        element: <FilterManagement />,
      },
      {
        path: "role",
        element: <PlaceholderPage title="role 관리" />,
      },
    ],
  },
];
