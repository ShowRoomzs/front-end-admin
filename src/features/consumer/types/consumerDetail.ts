import type {
  ConsumerProvider,
  ConsumerStatus,
} from "@/features/consumer/types/consumer";

/*
  13 소비자 상세 — 백엔드 origin/main `AdminUserDto`(UserAdminController)와 1:1.
  필드명 · nullable · enum 값은 서버 그대로다. 날짜는 두 종류가 섞인다:
  - UTC 벽시계(`now()` 이벤트) → `parseServerDateTime`: 가입 · 로그인 · 인증 · 주문 · 문의 · 메모 ·
    이력 · 정지 일시 · 해제 시각 · 탈퇴 일시
  - KST 벽시계(입력값 · 거기서 나온 기한) → 그대로: `term.endsOn` · `autoReleaseAt` ·
    `appealDeadlineAt` · `suspensionTerm.appealDeadlineAt`
*/

/** `UserSuspensionReason` — 정지 사유 6종(기타만 상세 필수) */
export type UserSuspensionReason =
  | "ABUSIVE_LANGUAGE"
  | "RETURN_ABUSE"
  | "FRAUDULENT_ORDER_SUSPECTED"
  | "PAYMENT_FRAUD_SUSPECTED"
  | "MULTIPLE_REPORTS"
  | "OTHER";

/** `UserReleaseReason` — 해제 사유 3종(상세 없음). TERM_ENDED는 자동 해제와 운영자가 함께 쓴다 */
export type UserReleaseReason = "RESOLVED" | "MISTAKE" | "TERM_ENDED";

/** `UserPrivacyAccessReason` — 마스킹 해제 사유 4종(기타 · 상세 없음) */
export type UserPrivacyAccessReason =
  | "CS_RESPONSE"
  | "DELIVERY_ACCIDENT"
  | "PAYMENT_RETURN_DISPUTE"
  | "INVESTIGATION_COOPERATION";

/** `UserAdminEventType` — 처리 이력 사건. 뒤 4종은 읽을 때 합치는 파생 행(historyId = null) */
export type UserAdminEventType =
  | "SUSPENDED"
  | "SUSPENSION_RELEASED"
  | "MEMO_CREATED"
  | "MEMO_UPDATED"
  | "MEMO_DELETED"
  | "PRIVACY_UNMASKED"
  | "SIGNED_UP"
  | "WITHDRAWN"
  | "REJOINED"
  | "APPEAL_RECEIVED";

export type UserAdminActorType = "ADMIN" | "CONSUMER" | "SYSTEM";

/** 처리 이력 · 진행 중 칩의 톤 — 서버가 대문자 문자열로 내린다 */
export type ServerTone = "NEUTRAL" | "INFO" | "WARNING" | "SUCCESS" | "DANGER";

/** `NotificationToggle` — C15 알림 설정의 광고성 토글 4개(화면 순서) */
export type NotificationToggle =
  "FOLLOW_GROUP_BUY" | "FOLLOW_POST" | "GROUP_BUY_ENDING" | "BENEFIT";

/** `UserPendingChip` — 레일 「진행 중」 칩 5종(1건 이상만 내려온다) */
export type UserPendingChipKey =
  | "OPEN_INQUIRY"
  | "SHIPPING"
  | "CANCEL_REQUESTED"
  | "RETURN_EXCHANGE"
  | "REFUND_FAILED";

/** `PendingChipLink.target` — 칩이 가리키는 어드민 목록 */
export type PendingChipTarget =
  "INQUIRIES" | "PRODUCT_INQUIRIES" | "ORDERS" | "CLAIMS" | "REFUNDS";

/** `AdminUserInquiryKind` — 최근 문의 구분 · 행 클릭 시 갈 화면 */
export type AdminUserInquiryKind = "ONE_TO_ONE" | "PRODUCT";

/** `DeviceType` — 최근 로그인 기기(User-Agent 판별) */
export type DeviceType =
  "ANDROID" | "IPHONE" | "DESKTOP_CHROME" | "DESKTOP_EDGE" | "UNKNOWN";

/** `InquiryStatus` — 접수 → 답변완료 단방향 */
export type ConsumerInquiryStatus = "WAITING" | "ANSWERED";

// ── 공용 조각(api.admin.common · api.common.account) ─────────────────────

/** `AdminMemberNavigation` — 회원번호 순 인접 소비자(목록 필터와 무관) */
export interface AdminMemberNavigation {
  previousId: number | null;
  nextId: number | null;
}

/** `AdminReasonOption` — 모달 셀렉트 사유 한 줄 */
export interface AdminReasonOption<C extends string = string> {
  code: C;
  label: string;
  /** 기타(직접 입력)면 상세 필수 */
  detailRequired: boolean;
  /** 정지 사유의 지급 정지 여부 — 소비자는 지급과 무관해 항상 null */
  holdsPayout: boolean | null;
}

/** `AdminSuspensionTermPreview` — 정지 모달(M1) 미리보기(정지 전) */
export interface AdminSuspensionTermPreview {
  /** 이의 신청 기한 영업일 수 — 「통지 후 N영업일 이상」 */
  appealBusinessDays: number;
  /** 지금 정지하면 잡힐 이의 신청 기한(KST 벽시계 · 응답 시각 기준 미리보기) */
  appealDeadlineAt: string;
  /** 소명 검토 N영업일 — [정책값 미정]이면 null */
  appealReviewBusinessDays: number | null;
}

/** `MemberAccountStatusResponse.Term`(MemberSanctionTerm) — 정지 기간 · 자동 해제 · 이의 기한 */
export interface MemberSanctionTerm {
  /** 정지 종료일(포함 · KST 날짜) — 기간 없는 정지면 null */
  endsOn: string | null;
  /** 자동 해제 시각 = 종료일 다음 날 00:00(KST) */
  autoReleaseAt: string | null;
  /** 정지 기간(일) — 시작일 · 종료일 포함 */
  periodDays: number | null;
  /** 이의 신청 기한 — 통지 + N영업일 23:59:59(KST) */
  appealDeadlineAt: string | null;
  appealReviewBusinessDays: number | null;
}

// ── 사유 목록 · 요청 ─────────────────────────────────────────────

/** `AdminUserDto.ReasonOptions` — GET /v1/admin/users/reason-options */
export interface ConsumerReasonOptions {
  suspensionReasons: Array<AdminReasonOption<UserSuspensionReason>>;
  releaseReasons: Array<AdminReasonOption<UserReleaseReason>>;
  privacyUnmaskReasons: Array<AdminReasonOption<UserPrivacyAccessReason>>;
  suspensionTerm: AdminSuspensionTermPreview;
}

/** `AdminUserDto.SuspendRequest` */
export interface ConsumerSuspendRequest {
  reason: UserSuspensionReason;
  /** 기타(OTHER)일 때만 필수 · 500자 · 앱에 노출되지 않는다 */
  reasonDetail: string | null;
  /** 정지 종료일(yyyy-MM-dd · 오늘 이상) — 다음 날 00:00 자동 해제 */
  endsOn: string | null;
}

/** `AdminUserDto.ReleaseRequest` */
export interface ConsumerReleaseRequest {
  reason: UserReleaseReason;
}

/** `AdminUserDto.UnmaskRequest` */
export interface ConsumerUnmaskRequest {
  reason: UserPrivacyAccessReason;
}

/** `AdminUserDto.MemoRequest` — 300자 이내 */
export interface ConsumerMemoRequest {
  content: string;
}

// ── 상태 카드 ─────────────────────────────────────────────────

export interface ConsumerAppealInquiry {
  inquiryId: number;
  /** INQ-YYYYMMDD-NNN — 1:1 문의 관리와 같은 번호 */
  inquiryNumber: string;
  answered: boolean;
  createdAt: string;
}

/** `AdminUserDto.SanctionInfo` — 열린 정지 */
export interface ConsumerSanctionInfo {
  sanctionId: number;
  reason: UserSuspensionReason | null;
  reasonLabel: string | null;
  /** 상세 사유 — 어드민 전용 */
  reasonDetail: string | null;
  suspendedAt: string;
  suspendedByName: string | null;
  /** 이 정지의 소명 문의(최신순) */
  appealInquiries: Array<ConsumerAppealInquiry>;
  term: MemberSanctionTerm | null;
}

/** `AdminUserDto.Withdrawal` — 탈퇴 계정만 */
export interface ConsumerWithdrawal {
  /** 탈퇴 일시 — 전이 기록이 없는 옛 탈퇴 회원은 null */
  withdrawnAt: string | null;
}

export interface ConsumerStatusActions {
  canSuspend: boolean;
  canRelease: boolean;
}

/** `AdminUserDto.StatusCard` */
export interface ConsumerStatusCard {
  status: ConsumerStatus;
  sanction: ConsumerSanctionInfo | null;
  withdrawal: ConsumerWithdrawal | null;
  actions: ConsumerStatusActions;
}

/** `AdminUserDto.StatusResult` — 정지 · 해제 응답 */
export interface ConsumerStatusResult {
  statusCard: ConsumerStatusCard;
  histories: ConsumerHistorySummary;
}

// ── 계정 · 본인확인 · 마스킹 해제 ───────────────────────────────────

export interface ConsumerNotificationToggleState {
  toggle: NotificationToggle;
  label: string;
  on: boolean;
  agreedAt: string | null;
}

/** `AdminUserNotificationStatus` — 탈퇴는 destroyed = true · 값 null */
export interface ConsumerNotificationStatus {
  destroyed: boolean;
  /** 앱 푸시 켬 = 기기 토큰 있음 ∧ 토글 하나라도 켬 */
  appPushOn: boolean | null;
  deviceRegistered: boolean | null;
  toggles: Array<ConsumerNotificationToggleState>;
  marketingAgree: boolean | null;
  /** 켜져 있으면 동의 일시, 꺼져 있으면 철회 일시 */
  marketingAgreeChangedAt: string | null;
}

/**
 * `AdminUserIdentity` — 본인확인 정보. **마스킹은 서버가 끝낸다** — 이 운영자의 열람 세션이
 * 있을 때만 실값이 온다. 화면에서 다시 가리거나 풀지 말 것.
 */
export interface ConsumerIdentity {
  destroyed: boolean;
  unmasked: boolean;
  name: string | null;
  /** 마스킹 중 연도만(1990.**.**) · 해제 시 전체 */
  birthday: string | null;
  /** 만 나이 — 해제 상태에서만 */
  age: number | null;
  gender: string | null;
  genderLabel: string | null;
  /** 내외국인 — 수집하지 않아 항상 null */
  nationality: string | null;
  phone: string | null;
  /** 통신사 — 수집하지 않아 항상 null */
  carrier: string | null;
  /** 최초 인증 — 재인증한 적이 없을 때만 */
  firstVerifiedAt: string | null;
  /** 최근 갱신 — 재인증 시각 */
  renewedAt: string | null;
}

/** `AdminUserUnmask` — 본인확인 카드 헤더의 해제 상태 */
export interface ConsumerUnmask {
  /** 해제 버튼 활성 — 최고관리자 한정(지금은 ADMIN이면 통과) · 탈퇴는 false */
  allowed: boolean;
  unmasked: boolean;
  operatorName: string | null;
  unmaskedAt: string | null;
  expiresAt: string | null;
  /** 자동 잠금까지 남은 초 — 10분 고정 만료(서버 정책값) */
  remainingSeconds: number | null;
  /** 직전 해제 사유 — 10분 자동 만료 뒤 재해제 프리필(A3) */
  lastReason: UserPrivacyAccessReason | null;
}

// ── 최근 주문 · 최근 문의 ───────────────────────────────────────────

/** `AdminOrderGroupSummary` 중 이 화면이 쓰는 필드 — 행 모양은 어드민 주문 목록과 같다 */
export interface ConsumerOrderGroupSummary {
  deliveryGroupId: number;
  subOrderNumber: string;
  brandName: string;
  status: string;
  statusLabel: string;
  statusTone: ServerTone;
  itemSummary: string;
  /** 반품 · 교환 요약 — 상태 칸 「반품완료」 · 「교환완료」(56 C2). 없으면 null */
  claim?: {
    claimId: number;
    claimNumber: string;
    /** 종결 전이면 null */
    result: string | null;
    label: string;
    count: number;
  } | null;
}

/** `AdminOrderListItem` 중 이 화면이 쓰는 필드 */
export interface ConsumerRecentOrder {
  orderId: number;
  orderNumber: string;
  paidAt: string;
  totalAmount: number;
  groups: Array<ConsumerOrderGroupSummary>;
}

/** `AdminUserRecentOrders` — 최근 5건 + 결제된 주문 전체 수 */
export interface ConsumerRecentOrders {
  total: number;
  content: Array<ConsumerRecentOrder>;
}

export interface ConsumerRecentInquiry {
  kind: AdminUserInquiryKind;
  kindLabel: string;
  inquiryId: number;
  /** 1:1 INQ- · 상품 QNA- */
  inquiryNumber: string;
  typeLabel: string | null;
  /** 본문 앞 40자 */
  title: string | null;
  status: ConsumerInquiryStatus;
  statusLabel: string;
  createdAt: string;
}

/** `AdminUserRecentInquiries` — 최근 3건 + 두 문의 합 */
export interface ConsumerRecentInquiries {
  total: number;
  content: Array<ConsumerRecentInquiry>;
}

// ── 배송지 ──────────────────────────────────────────────────────

/** `AdminUserAddress` — 마스킹 중 시 · 군 · 구까지 · 상세 · 우편번호 null */
export interface ConsumerAddress {
  addressId: number;
  defaultAddress: boolean;
  address: string;
  detailAddress: string | null;
  zipCode: string | null;
  recipientName: string;
  phoneNumber: string;
  /** 최근 사용 주문일 — 주문에 배송지 id가 없어 항상 null(보류) */
  lastUsedOrderAt: string | null;
}

/** `AdminUserAddresses` — 탈퇴는 destroyed = true · 빈 배열 */
export interface ConsumerAddresses {
  destroyed: boolean;
  total: number;
  content: Array<ConsumerAddress>;
}

// ── 레일 ───────────────────────────────────────────────────────

export interface ConsumerPendingChipLink {
  target: PendingChipTarget;
  /** 그 목록 API에 그대로 붙일 쿼리(탭 · 상태 · userId) — 값은 문자열 */
  query: Record<string, string>;
  count: number;
}

/** `AdminUserPendingChip` */
export interface ConsumerPendingChip {
  key: UserPendingChipKey;
  label: string;
  /** 열린 문의만 WARNING · 나머지 NEUTRAL */
  tone: ServerTone;
  count: number;
  target: PendingChipTarget;
  links: Array<ConsumerPendingChipLink>;
}

export interface ConsumerPastSanction {
  sanctionId: number;
  reason: UserSuspensionReason | null;
  reasonLabel: string | null;
  suspendedAt: string;
  releasedAt: string | null;
}

export interface ConsumerSanctionHistory {
  /** 정지 횟수 — 지금 열린 정지 포함 · 0이면 「없음」 */
  count: number;
  /** 직전(해제된) 정지 */
  last: ConsumerPastSanction | null;
}

export interface ConsumerElapsed {
  months: number;
  days: number;
  totalDays: number;
}

/** `AdminUserJudgement` — 탈퇴 회원은 거래 값이 null(「—」) */
export interface ConsumerJudgement {
  orderCount: number | null;
  purchaseAmount: number | null;
  claimOrderCount: number | null;
  /** 반품 · 교환률(%) 소수 1자리 — 주문이 없으면 null */
  claimRate: number | null;
  sanctions: ConsumerSanctionHistory;
  sinceJoined: ConsumerElapsed | null;
}

// ── 메모 · 처리 이력 ─────────────────────────────────────────────

export interface ConsumerMemo {
  memoId: number;
  authorName: string;
  content: string;
  createdAt: string;
  modifiedAt: string | null;
  /** 작성자 본인 ∧ 24시간 이내 ∧ 탈퇴 아님(요청 운영자 기준) */
  editable: boolean;
}

/** `AdminUserDto.MemoPage` — 상세에는 최신 3건 + 전체 건수 */
export interface ConsumerMemoPage {
  total: number;
  content: Array<ConsumerMemo>;
}

export interface ConsumerHistoryItem {
  /** 파생 행(가입 · 탈퇴 · 재가입 · 소명 접수)은 null */
  historyId: number | null;
  eventType: UserAdminEventType;
  label: string;
  tone: ServerTone;
  detail: string | null;
  actorType: UserAdminActorType;
  actorName: string | null;
  refType: string | null;
  refId: number | null;
  occurredAt: string;
}

/** `AdminUserDto.HistorySummary` — 상세에는 최신 5건 + 전체 건수 */
export interface ConsumerHistorySummary {
  total: number;
  content: Array<ConsumerHistoryItem>;
}

/** `AdminUserDto.HistoryPage` — GET /{userId}/histories */
export interface ConsumerHistoryPage extends ConsumerHistorySummary {
  page: number;
  size: number;
}

// ── 상세 응답 ───────────────────────────────────────────────────

/** `AdminUserDto.UserDetailResponse` — GET /v1/admin/users/{userId} */
export interface ConsumerDetail {
  userId: number;
  /** CST-88231 — 서버가 포맷한다 */
  memberNo: string;
  navigation: AdminMemberNavigation;
  nickname: string;
  providerType: ConsumerProvider;
  status: ConsumerStatus;
  /** @deprecated identity.birthday와 같은 값(마스킹) — identity를 쓴다 */
  birthday: string | null;
  gender: string | null;
  /** 기본 배송지 시 · 군 · 구 — addresses가 대신한다 */
  defaultAddress: string | null;
  /** 가입일(UTC 이벤트) */
  createdAt: string;
  /** 탈퇴는 파기라 null */
  lastLoginAt: string | null;
  lastLoginDevice: DeviceType | null;
  notification: ConsumerNotificationStatus;
  identity: ConsumerIdentity;
  unmask: ConsumerUnmask;
  marketingAgree: boolean;
  profileImageUrl: string | null;
  statusCard: ConsumerStatusCard;
  memos: ConsumerMemoPage;
  histories: ConsumerHistorySummary;
  totalPurchaseAmount: number | null;
  thisMonthPurchaseAmount: number | null;
  totalOrderCount: number | null;
  thisMonthOrderCount: number | null;
  averageOrderAmount: number | null;
  lastOrderDate: string | null;
  /** 상품 위시리스트 수 — 화면의 「좋아요」 */
  productWishlistCount: number | null;
  followedShowroomCount: number | null;
  writtenReviewCount: number | null;
  inquiryCount: number | null;
  recentOrders: ConsumerRecentOrders;
  recentInquiries: ConsumerRecentInquiries;
  addresses: ConsumerAddresses;
  /** 1건 이상만 — 빈 배열이면 「진행 중인 건 없음」 */
  pendingChips: Array<ConsumerPendingChip>;
  judgement: ConsumerJudgement;
}

// ── 약관 동의 내역(서버 없음) ───────────────────────────────────────

/**
 * 【서버 없음】 약관 동의 내역 — 약관 버전 테이블이 법률 자문 뒤로 보류됐다(55 계획서 4-3-4 · D16).
 * 서버 모양이 정해지지 않아 화면이 그리는 최소 형태만 둔다. DEV 목업 전용 · 배포본 「준비 중」.
 */
export interface ConsumerTermsAgreement {
  title: string;
  version: string;
  agreedAt: string;
}
