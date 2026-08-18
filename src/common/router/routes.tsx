import type { RouteObject } from "react-router-dom";
import { MainLayout } from "@/common/components";
import LoginPage from "@/features/auth/pages/LoginPage";
import PlaceholderPage from "@/common/components/PlaceholderPage";
import CategoryManagement from "@/features/category/pages/CategoryManagement";
import ConsumerManagement from "@/features/consumer/pages/ConsumerManagement";
import SellerRegistrationManagement from "@/features/seller/pages/SellerRegistrationManagement";
import SellerRegistrationDetail from "@/features/seller/pages/SellerRegistrationDetail";
import SellerUserManagement from "@/features/seller/pages/SellerUserManagement";
import FilterManagement from "@/features/filter/pages/FilterManagement";
import SocialLoginManagement from "@/features/user/pages/SocialLoginManagement";
import LoginHistoryManagement from "@/features/user/pages/LoginHistoryManagement";
import CouponManagement from "@/features/coupon/pages/CouponManagement";
import NoticeManagement from "@/features/notice/pages/NoticeManagement";
import NoticeFormPage from "@/features/notice/pages/NoticeFormPage";
import FaqManagement from "@/features/faq/pages/FaqManagement";
import CreatorApplicationManagement from "@/features/creator/pages/CreatorApplicationManagement";
import CreatorApplicationDetail from "@/features/creator/pages/CreatorApplicationDetail";
import ProductListManagement from "@/features/product/pages/ProductListManagement";
import ProductDetailPage from "@/features/product/pages/ProductDetailPage";
import ChangeRequestManagement from "@/features/changeRequest/pages/ChangeRequestManagement";
import ChangeRequestDetail from "@/features/changeRequest/pages/ChangeRequestDetail";
import InquiryManagement from "@/features/inquiry/pages/InquiryManagement";
import InquiryDetail from "@/features/inquiry/pages/InquiryDetail";
import ProductInquiryManagement from "@/features/productInquiry/pages/ProductInquiryManagement";
import ProductInquiryDetail from "@/features/productInquiry/pages/ProductInquiryDetail";
import TermsManagement from "@/features/terms/pages/TermsManagement";
import TermsDocumentDetail from "@/features/terms/pages/TermsDocumentDetail";
import TermsDocumentRegister from "@/features/terms/pages/TermsDocumentRegister";
import TermsVersionRegister from "@/features/terms/pages/TermsVersionRegister";
import TermsVersionDetail from "@/features/terms/pages/TermsVersionDetail";

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
          /*
            소비자 회원 목록 (§25-3). 상세(§25-4)는 아직 라우트를 두지 않는다 —
            서버 상세 응답이 구버전이라 마스킹 해제·본인확인 정보·배송지 목록이 없다.
          */
          {
            path: "list",
            element: <ConsumerManagement />,
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
            element: <ProductInquiryManagement />,
          },
          {
            path: "product-inquiry/:inquiryId",
            element: <ProductInquiryDetail />,
          },
          /*
            [v0.29] 약관은 `/settings/terms`로 옮겼다(§21) — 여기에 다시 만들지 말 것.
          */
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
          /*
            등록·수정이 같은 화면이다(§20-4) — 우측 게시 설정 카드만 달라진다.
            `register`가 `:noticeId`보다 먼저 매칭되는 건 리액트 라우터가 정적 세그먼트를
            우선하기 때문이다. 순서를 바꿔도 동작하지만 읽기 순서를 위해 위에 둔다.
          */
          {
            path: "notice/register",
            element: <NoticeFormPage />,
          },
          {
            path: "notice/:noticeId",
            element: <NoticeFormPage />,
          },
          {
            path: "push",
            element: <PlaceholderPage title="푸시 알림" />,
          },
        ],
      },
      /*
        약관·정책 관리 (§21) — `10. 설정` 하위다.

        예전 `/policy/terms`·`/policy/privacy`·`/policy/seller-terms` 자리 표시
        라우트 3개를 지웠다. 메뉴에서 닿을 수 없는 고아 경로였고, 문서를 유형별
        고정 화면으로 나누는 구조 자체가 §21과 맞지 않는다 — 문서는 8종이고 각각
        여러 버전을 갖는 목록형 데이터라 화면을 문서마다 만들 수 없다.
      */
      {
        path: "settings",
        children: [
          {
            path: "terms",
            element: <TermsManagement />,
          },
          {
            path: "terms/register",
            element: <TermsDocumentRegister />,
          },
          {
            path: "terms/:documentId",
            element: <TermsDocumentDetail />,
          },
          {
            path: "terms/:documentId/versions/register",
            element: <TermsVersionRegister />,
          },
          /* 조회 전용이다 — 수정·삭제 라우트는 서버에도 없다 */
          {
            path: "terms/:documentId/versions/:versionId",
            element: <TermsVersionDetail />,
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
