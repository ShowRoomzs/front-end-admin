import type { AdminHomeTodoRow } from "@/features/home/types";

/*
  할 일 행 → 어드민 화면 경로.

  서버 `target.filter`(예: `/group-buys?queue=OPEN_REVIEW`)는 서버 기준 표기라 FE 라우트와 다르다.
  그래서 **큐 코드**로 FE 목록 경로 · 쿼리를 고른다. 쿼리 키 · 값은 각 목록이 `useParams` 초기값으로
  읽는 것과 같다(refund `tab·route` · settlement `tab` · exception `tab` · claim `tab` · contract `queue` ·
  group-buy `tab` · inquiry · product-inquiry · 입점 · 변경 요청 `status` · post `tab`).
*/
const QUEUE_PATH: Record<string, string> = {
  REFUND_FAILED: "/order/refund?tab=FAILED",
  REFUND_EXECUTION: "/order/refund?tab=PENDING&route=OPERATOR",
  REFUND_TRANSFER: "/order/refund?tab=PENDING&route=FREIGHT",
  PAYOUT_FAILED: "/settlement/group-buy?tab=PAYOUT_FAILED",
  CLAWBACK_UNRECOVERABLE: "/settlement/group-buy?tab=CLAWBACK",
  TAX_INVOICE_ISSUE: "/settlement/group-buy?tab=EVIDENCE",
  TAX_INVOICE_VERIFY: "/settlement/group-buy?tab=EVIDENCE",
  INQUIRY: "/support/inquiry?status=WAITING",
  PRODUCT_INQUIRY_DELETE: "/support/product-inquiry?status=DELETE_REQUESTED",
  // 공구 목록은 큐 필터가 없다 — 조치 필요 탭이 네 큐(오픈 승인 · 중단 · 조기 마감 · 소명)를 모은다
  OPEN_REVIEW: "/group-buy?tab=ACTION_REQUIRED",
  SUSPEND_REQUEST: "/group-buy?tab=ACTION_REQUIRED",
  EARLY_CLOSE_REQUEST: "/group-buy?tab=ACTION_REQUIRED",
  APPEAL_REVIEW: "/group-buy?tab=ACTION_REQUIRED",
  BRAND_APPLICATION: "/market/registration?status=PENDING",
  CREATOR_APPLICATION: "/showroom/registration?status=PENDING",
  CHANGE_REQUEST: "/market/change-requests?status=PENDING",
  // 브랜드 · 인플루언서 탈퇴를 한 줄로 센다 — 브랜드 회원 목록 「탈퇴 승인 대기」 탭(서버 AdminMemberListTab)으로 보낸다
  WITHDRAWAL: "/market/list?tab=WITHDRAWAL_PENDING",
  PROCESSING_DELAY: "/order/exception?tab=DELAY",
  DELIVERY_EXCEPTION: "/order/exception?tab=DELIVERY",
  // 반려 이의는 반려 보류 탭에 있다(목록에 이의 전용 필터가 없다)
  CLAIM_DISPUTE: "/order/claim?tab=REJECT_HOLD",
  POST_REPORT: "/monitoring/posts?tab=REPORTED",
};

/** 큐 코드를 모를 때 — 메뉴의 첫 화면 */
const MENU_PATH: Record<string, string> = {
  ONBOARDING: "/market/registration",
  MEMBERS: "/market/list",
  CONTRACTS: "/contract",
  GROUP_BUYS: "/group-buy",
  TRANSACTIONS: "/order/list",
  SETTLEMENTS: "/settlement/group-buy",
  CS: "/support/inquiry",
  POSTS: "/monitoring/posts",
};

const CONTRACT_QUEUE_PREFIX = "CONTRACT_";

function queuePath(row: AdminHomeTodoRow) {
  if (row.queue.startsWith(CONTRACT_QUEUE_PREFIX)) {
    // 계약 조치 큐 5종 — CONTRACT_REVIEW → `/contract?queue=REVIEW`
    return `/contract?queue=${row.queue.slice(CONTRACT_QUEUE_PREFIX.length)}`;
  }
  return QUEUE_PATH[row.queue] ?? MENU_PATH[row.menu] ?? null;
}

/**
 * 행 클릭 이동 경로. 건별 행(id 있음)은 상세로, 큐 행은 필터를 건 목록으로 간다.
 * 환불은 상세 라우트가 없어 해당 탭 목록으로 보낸다.
 */
export function todoRowPath(row: AdminHomeTodoRow): string | null {
  const { type, id } = row.target;
  if (id != null) {
    switch (type) {
      case "GROUP_BUY":
        return `/group-buy/${id}`;
      case "SETTLEMENT":
        return `/settlement/group-buy/${id}`;
      case "INQUIRY":
        return `/support/inquiry/${id}`;
      case "SELLER_APPLICATION":
        return `/market/registration/${id}`;
      case "CREATOR_APPLICATION":
        return `/showroom/registration/${id}`;
      default:
        break;
    }
  }
  return queuePath(row);
}
