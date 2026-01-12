import type { RouteObject } from "react-router-dom";
import { MainLayout } from "@/common/components";
import LoginPage from "@/features/auth/pages/LoginPage";
import PlaceholderPage from "@/common/components/PlaceholderPage";
import CategoryManagement from "@/features/category/pages/CategoryManagement";
import CommonUserManagement from "@/features/user/pages/CommonUserManagement";
import SellerRegistrationManagement from "@/features/user/pages/SellerRegistrationManagement";

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
      {
        path: "user/account",
        element: <CommonUserManagement />,
      },
      {
        path: "user/login-history",
        element: <PlaceholderPage title="로그인 이력" />,
      },
      {
        path: "user/social-login",
        element: <PlaceholderPage title="간편 로그인 설정" />,
      },
      {
        path: "market/registration",
        element: <SellerRegistrationManagement />,
      },
      {
        path: "market/account",
        element: <PlaceholderPage title="마켓 계정 관리" />,
      },
      {
        path: "market/product",
        element: <PlaceholderPage title="상품 관리" />,
      },
      {
        path: "category",
        element: <CategoryManagement />,
      },
      {
        path: "role",
        element: <PlaceholderPage title="role 관리" />,
      },
      {
        path: "filter",
        element: <PlaceholderPage title="필터 관리" />,
      },
    ],
  },
];
