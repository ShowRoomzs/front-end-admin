import type { RouteObject } from "react-router-dom";
import { MainLayout } from "@/common/components";
import LoginPage from "@/features/auth/pages/LoginPage";
import PlaceholderPage from "@/common/components/PlaceholderPage";
import CategoryManagement from "@/features/category/pages/CategoryManagement";

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
        path: "seller-user",
        element: <PlaceholderPage title="셀러유저 가입 관리" />,
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
