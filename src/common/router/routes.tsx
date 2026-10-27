import type { RouteObject } from "react-router-dom";
import { MainLayout } from "@/common/components";
import LoginPage from "@/features/auth/pages/LoginPage";
import PlaceholderPage from "@/common/components/PlaceholderPage";
import CategoryManagement from "@/features/category/pages/CategoryManagement";
import ConsumerManagement from "@/features/consumer/pages/ConsumerManagement";
import ConsumerDetail from "@/features/consumer/pages/ConsumerDetail";
import SellerRegistrationManagement from "@/features/seller/pages/SellerRegistrationManagement";
import SellerRegistrationDetail from "@/features/seller/pages/SellerRegistrationDetail";
import BrandMemberList from "@/features/brandMember/pages/BrandMemberList";
import BrandMemberDetail from "@/features/brandMember/pages/BrandMemberDetail";
import InfluencerMemberList from "@/features/influencerMember/pages/InfluencerMemberList";
import InfluencerMemberDetail from "@/features/influencerMember/pages/InfluencerMemberDetail";
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
import ContractManagement from "@/features/contract/pages/ContractManagement";
import ContractDetail from "@/features/contract/pages/ContractDetail";
import GroupBuyManagement from "@/features/groupBuy/pages/GroupBuyManagement";
import GroupBuyDetail from "@/features/groupBuy/pages/GroupBuyDetail";
import SettlementManagement from "@/features/settlement/pages/SettlementManagement";
import SettlementDetail from "@/features/settlement/pages/SettlementDetail";
import OrderManagement from "@/features/order/pages/OrderManagement";
import ClaimManagement from "@/features/claim/pages/ClaimManagement";
import RefundManagement from "@/features/refund/pages/RefundManagement";
import ExceptionManagement from "@/features/exception/pages/ExceptionManagement";
import ThreadPage from "@/features/thread/pages/ThreadPage";
import AdminHome from "@/features/home/pages/AdminHome";
import MetricsPage from "@/features/metrics/pages/MetricsPage";
import PostMonitoring from "@/features/post/pages/PostMonitoring";
import PostDetail from "@/features/post/pages/PostDetail";

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
        // 홈(ui-admin-00) — 할 일 표 · 오늘 일정 · 오늘 지표 · 연동 상태
        element: <AdminHome />,
      },
      // 운영 지표(ui-admin-21 rev.5)
      {
        path: "metrics",
        element: <MetricsPage />,
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
          // 브랜드 회원 목록 · 상세(ui-admin-14 · 15 rev.7)
          {
            path: "list",
            element: <BrandMemberList />,
          },
          {
            path: "list/:marketId",
            element: <BrandMemberDetail />,
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
          // 인플루언서 회원 목록 · 상세(ui-admin-16 rev.7 · 18 rev.2)
          {
            path: "list",
            element: <InfluencerMemberList />,
          },
          {
            path: "list/:creatorId",
            element: <InfluencerMemberDetail />,
          },
        ],
      },
      // 계약 관리
      {
        path: "contract",
        element: <ContractManagement />,
      },
      {
        path: "contract/:id",
        element: <ContractDetail />,
      },
      // 공구 관리 — 목록 · 상세(B1~B6). 판정은 모두 상세의 모달을 거친다
      {
        path: "group-buy",
        element: <GroupBuyManagement />,
      },
      {
        path: "group-buy/:id",
        element: <GroupBuyDetail />,
      },
      // 게시물·소통 모니터링
      {
        path: "monitoring",
        children: [
          {
            path: "group-buy-posts",
            element: <PlaceholderPage title="공구 게시물" />,
          },
          // 일반 게시물 모니터링(ui-admin-11) — 목록 · 상세. 신고 · 노출 중지 · 이의 심사는 상세의 모달이다
          {
            path: "posts",
            element: <PostMonitoring />,
          },
          {
            path: "posts/:id",
            element: <PostDetail />,
          },
          {
            path: "threads",
            // 소통 스레드 — 운영팀 1:1 채널(ui-admin-20a) · 정산 조정 이슈 스레드(ui-admin-20b)
            element: <ThreadPage />,
          },
        ],
      },
      /*
        상품 검수 · 리뷰 · 배너 · 제재 · 수수료율 · 노출 옵션 요금 · 푸시 알림 자리 표시 라우트를 지웠다
        (2026-10-21 사용자 결정). 메뉴에서 닿지 않는 고아 경로였고 대응하는 시안이 없다 — 시안이 나오면
        그때 메뉴와 함께 만든다.
      */
      // 회원 관리
      {
        path: "member",
        children: [
          // 소비자 회원 목록(§25-3 · ui-admin-12) · 상세(ui-admin-13 rev.7)
          {
            path: "list",
            element: <ConsumerManagement />,
          },
          {
            path: "list/:userId",
            element: <ConsumerDetail />,
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
      // 거래 관리 — 주문 조회 · 반품·교환 · 환불 관리 · 예외 관리(ui-admin-06a~06d)
      {
        path: "order",
        children: [
          {
            path: "list",
            element: <OrderManagement />,
          },
          {
            path: "claim",
            element: <ClaimManagement />,
          },
          {
            path: "refund",
            element: <RefundManagement />,
          },
          {
            path: "exception",
            element: <ExceptionManagement />,
          },
        ],
      },
      /*
        정산 관리 — 하위 메뉴 없이 공구 정산 하나다(ui-admin-07a · 07b).
        「고정 지급비 정산」은 지웠다 — 고정 지급비는 브랜드가 인플루언서에게 직접 지급해(모델 B)
        플랫폼을 지나지 않으므로 정산 관리 대상이 아니다(§41-1 · 14). 다시 만들지 말 것.
      */
      {
        path: "settlement",
        children: [
          {
            path: "group-buy",
            element: <SettlementManagement />,
          },
          {
            path: "group-buy/:id",
            element: <SettlementDetail />,
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
