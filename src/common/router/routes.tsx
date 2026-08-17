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
import FaqManagement from "@/features/faq/pages/FaqManagement";
import CreatorApplicationManagement from "@/features/creator/pages/CreatorApplicationManagement";
import CreatorApplicationDetail from "@/features/creator/pages/CreatorApplicationDetail";
import ProductListManagement from "@/features/product/pages/ProductListManagement";
import ProductDetailPage from "@/features/product/pages/ProductDetailPage";
import ChangeRequestManagement from "@/features/changeRequest/pages/ChangeRequestManagement";
import ChangeRequestDetail from "@/features/changeRequest/pages/ChangeRequestDetail";
import InquiryManagement from "@/features/inquiry/pages/InquiryManagement";
import InquiryDetail from "@/features/inquiry/pages/InquiryDetail";

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
        element: <PlaceholderPage title="홈" />,
      },
      // 입점 관리(브랜드) · 회원 관리(브랜드)
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
          // 입점 관리(변경 요청) — 브랜드가 요청한 사업자 정보·정산 계좌 변경 검토
          {
            path: "change-requests",
            element: <ChangeRequestManagement />,
          },
          {
            path: "change-requests/:id",
            element: <ChangeRequestDetail />,
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
      // 입점 관리(인플루언서) · 회원 관리(인플루언서)
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
            element: <PlaceholderPage title="인플루언서 회원 관리" />,
          },
        ],
      },
      // 공구 관리
      {
        path: "group-buy",
        element: <PlaceholderPage title="공구 관리" />,
      },
      // 게시물·소통 모니터링
      {
        path: "monitoring",
        children: [
          {
            path: "group-buy-posts",
            element: <PlaceholderPage title="공구 게시물" />,
          },
          {
            path: "posts",
            element: <PlaceholderPage title="일반 게시물" />,
          },
          {
            path: "threads",
            element: <PlaceholderPage title="소통 스레드" />,
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
          {
            path: "group-buy",
            element: <PlaceholderPage title="공구 정산" />,
          },
          {
            path: "fixed-payout",
            element: <PlaceholderPage title="고정 지급비 정산" />,
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
            element: <InquiryManagement />,
          },
          /*
            상세는 목록의 쿼리스트링(status·type·keyword)을 그대로 물려받는다 —
            서버가 그 범위로 이전/다음을 계산하므로 링크를 만들 때 검색 조건을 떼지 말 것.
          */
          {
            path: "inquiry/:inquiryId",
            element: <InquiryDetail />,
          },
          {
            path: "product-inquiry",
            element: <PlaceholderPage title="상품 문의 모니터링" />,
          },
          {
            path: "terms",
            element: <PlaceholderPage title="약관 관리" />,
          },
          /*
            FAQ는 등록·수정·삭제가 전부 모달이라 목록 라우트 하나뿐이다.
            상세/등록 페이지를 다시 만들지 말 것 — 항목당 필드가 3개뿐이라
            목록 → 상세 → 수정 3단계는 운영 비용만 늘린다(ui-admin-08-faq rev.2).
          */
          {
            path: "faq",
            element: <FaqManagement />,
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
