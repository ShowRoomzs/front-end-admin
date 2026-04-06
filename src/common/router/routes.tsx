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
import LoginHistoryManagement from "@/features/user/pages/LoginHistoryManagement";
import CouponManagement from "@/features/coupon/pages/CouponManagement";
import NoticeManagement from "@/features/notice/pages/NoticeManagement";
import NoticeRegister from "@/features/notice/pages/NoticeRegister";
import CreatorApplicationManagement from "@/features/creator/pages/CreatorApplicationManagement";
import CreatorApplicationDetail from "@/features/creator/pages/CreatorApplicationDetail";
import ProductListManagement from "@/features/product/pages/ProductListManagement";
import ProductDetailPage from "@/features/product/pages/ProductDetailPage";

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
            path: "list",
            element: <SellerUserManagement />,
          },
        ],
      },
      // 상품 관리
      {
        path: "product",
        children: [
          {
            path: "inspection",
            element: <PlaceholderPage title="상품 검수" />,
          },
          {
            path: "list",
            element: <ProductListManagement />,
          },
          {
            path: "list/:productId",
            element: <ProductDetailPage />,
          },
          {
            path: "category",
            element: <CategoryManagement />,
          },
          {
            path: "filter",
            element: <FilterManagement />,
          },
          {
            path: "review",
            element: <PlaceholderPage title="리뷰 관리" />,
          },
        ],
      },
      // 쇼룸 관리
      {
        path: "showroom",
        children: [
          {
            path: "registration",
            element: <CreatorApplicationManagement />,
          },
          {
            path: "registration/:id",
            element: <CreatorApplicationDetail />,
          },
          {
            path: "list",
            element: <PlaceholderPage title="쇼룸 목록" />,
          },
        ],
      },
      // 배너/프로모션 관리
      {
        path: "banner",
        children: [
          {
            path: "list",
            element: <PlaceholderPage title="배너 목록" />,
          },
          {
            path: "register",
            element: <PlaceholderPage title="배너 등록" />,
          },
        ],
      },
      // 회원 관리
      {
        path: "member",
        children: [
          {
            path: "list",
            element: <CommonUserManagement />,
          },
          {
            path: "sanction",
            element: <PlaceholderPage title="제재 관리" />,
          },
          {
            path: "social-login",
            element: <SocialLoginManagement />,
          },
          {
            path: "login-history",
            element: <LoginHistoryManagement />,
          },
        ],
      },
      // 주문 관리
      {
        path: "order",
        children: [
          {
            path: "list",
            element: <PlaceholderPage title="전체 주문 조회" />,
          },
          {
            path: "claim",
            element: <PlaceholderPage title="클레임 현황" />,
          },
        ],
      },
      // 정산 관리
      {
        path: "settlement",
        children: [
          {
            path: "status",
            element: <PlaceholderPage title="정산 현황" />,
          },
          {
            path: "process",
            element: <PlaceholderPage title="정산 처리" />,
          },
        ],
      },
      // 수수료 정책 관리
      {
        path: "fee",
        children: [
          {
            path: "rate",
            element: <PlaceholderPage title="수수료율 설정" />,
          },
          {
            path: "exposure",
            element: <PlaceholderPage title="노출 옵션 요금 설정" />,
          },
        ],
      },
      // 쿠폰 관리
      {
        path: "coupon",
        children: [
          {
            path: "register",
            element: <PlaceholderPage title="쿠폰 등록" />,
          },
          {
            path: "list",
            element: <CouponManagement />,
          },
        ],
      },
      // 고객지원 관리
      {
        path: "support",
        children: [
          {
            path: "inquiry",
            element: <PlaceholderPage title="문의 관리" />,
          },
          {
            path: "faq",
            element: <PlaceholderPage title="자주 묻는 질문 관리" />,
          },
          {
            path: "notice",
            element: <NoticeManagement />,
          },
          {
            path: "notice/register",
            element: <NoticeRegister />,
          },
          {
            path: "push",
            element: <PlaceholderPage title="푸시 알림" />,
          },
        ],
      },
      // 정책/약관 관리
      {
        path: "policy",
        children: [
          {
            path: "terms",
            element: <PlaceholderPage title="이용약관" />,
          },
          {
            path: "privacy",
            element: <PlaceholderPage title="개인정보처리방침" />,
          },
          {
            path: "seller-terms",
            element: <PlaceholderPage title="판매자 이용약관" />,
          },
        ],
      },
      // 운영자 계정 관리
      {
        path: "admin",
        children: [
          {
            path: "list",
            element: <PlaceholderPage title="운영자 계정 목록" />,
          },
        ],
      },
    ],
  },
];
