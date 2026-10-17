import type {
  ClaimDetail,
  ClaimHistoryEntry,
  ClaimItem,
  ClaimListItem,
  ClaimListParams,
  ClaimListResponse,
  ClaimStage,
  ClaimSummary,
  ClaimTab,
  OperatorRefundRequest,
} from "@/features/claim/types";

/*
  반품·교환 DEV 목업 — 백엔드 API가 생기기 전까지의 데이터 원천(`common/utils/devMock.ts`).
  시안 `ui-admin-06b-claims` rev.1의 12건을 그대로 옮겼다(전체 12 = 3+2+2+1+1+3).
  이 파일 밖에서는 목업을 알지 못한다 — 화면은 `adminClaimService`만 부른다.

  시안 상태 도달법
    A1 · A2 · A3  목록 탭(전체 · 입고·검수 · 반려 보류)
    B1 CLM-3015   검수 지연 · 조치 없음
    B2 CLM-3008   반려 보류 · 소비자 이의 → 운영자 사유 환불(환불 대기 편입을 누르면 메모리 저장소가 바뀐다)
    B3 CLM-3002   일부 반려 · 환불 계산식
    B4 CLM-3018   운영자 개설 · 구매확정 후 하자
  시나리오(`?mock=`)  empty = 모든 목록이 빈 상태 · error = 목록 조회 실패
*/

/** 시안의 기준 시각 — 09.18 */
const NOW = "2026-09-18T16:30:00+09:00";

export const MOCK_OPERATOR_NAME = "김운영";

function at(monthDay: string, time = "00:00"): string {
  return `2026-${monthDay}T${time}:00+09:00`;
}

function item(
  name: string,
  option: string,
  quantity: number,
  price: number,
  status: ClaimItem["status"],
  dimmed = false
): ClaimItem {
  return { name, option, quantity, price, status, dimmed };
}

function entry(
  tone: ClaimHistoryEntry["tone"],
  label: string,
  actor: string | null,
  extra: string | null,
  when: string
): ClaimHistoryEntry {
  return { tone, label, actor, extra, at: when };
}

/** 모든 상세가 같은 뼈대에서 출발한다 — 단계마다 다른 블록만 덮어쓴다 */
function base(
  partial: Pick<
    ClaimDetail,
    | "claimNo"
    | "kind"
    | "stage"
    | "stageLabel"
    | "stageTone"
    | "fault"
    | "reason"
    | "orderNo"
    | "brandName"
    | "consumerName"
    | "appliedAt"
    | "items"
    | "statusRows"
    | "history"
  > &
    Partial<ClaimDetail>
): ClaimDetail {
  return {
    headerBadge: { label: partial.stageLabel, tone: partial.stageTone },
    detailText: null,
    confirmedAt: null,
    opened: null,
    refundableByOperator: false,
    refundAmountIfAccepted: null,
    orderedQty: partial.items.reduce((sum, row) => sum + row.quantity, 0),
    pickup: null,
    amount: null,
    purchaseConfirm: null,
    rejection: null,
    hold: null,
    objection: null,
    legalDeadline: null,
    settlement: null,
    refundCalc: null,
    ...partial,
  };
}

const WAITING_PICKUP = {
  carrier: null,
  trackingNo: null,
  pickedUpAt: null,
  receivedAt: null,
  receivedBy: null,
  inspectionDueDate: null,
  overdue: false,
};

function seed(): Array<ClaimDetail> {
  return [
    // CLM-3021 · 반품 · 회수 대기
    base({
      claimNo: "CLM-3021",
      kind: "RETURN",
      stage: "PICKUP_WAIT",
      stageLabel: "회수 대기",
      stageTone: "INFO",
      fault: "CONSUMER",
      reason: "단순 변심",
      orderNo: "ORD-24201",
      brandName: "데일리랩",
      consumerName: "최**",
      appliedAt: at("09-17", "11:20"),
      items: [
        item("데일리 선크림", "50ml", 1, 16000, {
          label: "회수 대기",
          tone: "INFO",
        }),
      ],
      pickup: WAITING_PICKUP,
      amount: {
        productAmount: 16000,
        firstShippingDeduction: 3000,
        refundOnPass: 13000,
        freeShipping: true,
      },
      purchaseConfirm: { timer: "STOPPED", remainingDays: 4 },
      statusRows: [
        { label: "회수 송장", value: "소비자 입력 대기", emphasis: false },
        {
          label: "통과 시",
          value: "PG 자동 환불 13,000원",
          emphasis: false,
        },
      ],
      history: [
        entry(
          "INFO",
          "반품 신청 · 구매확정 타이머 정지",
          "소비자 최**",
          "단순 변심",
          at("09-17", "11:20")
        ),
      ],
    }),
    // CLM-3020 · 교환 · 회수 대기
    base({
      claimNo: "CLM-3020",
      kind: "EXCHANGE",
      stage: "PICKUP_WAIT",
      stageLabel: "회수 대기",
      stageTone: "INFO",
      fault: "CONSUMER",
      reason: "사이즈가 맞지 않음",
      orderNo: "ORD-24198",
      brandName: "무드코스메틱",
      consumerName: "강**",
      appliedAt: at("09-17", "10:05"),
      items: [
        item("립 틴트", "03 → 05", 1, 14000, {
          label: "회수 대기",
          tone: "INFO",
        }),
      ],
      pickup: WAITING_PICKUP,
      purchaseConfirm: { timer: "STOPPED", remainingDays: 5 },
      statusRows: [
        { label: "회수 송장", value: "소비자 입력 대기", emphasis: false },
        { label: "통과 시", value: "교환 상품 재발송", emphasis: false },
      ],
      history: [
        entry(
          "INFO",
          "교환 신청 · 구매확정 타이머 정지",
          "소비자 강**",
          "사이즈가 맞지 않음",
          at("09-17", "10:05")
        ),
      ],
    }),
    // CLM-3018 · 반품 · 회수 대기 · 운영자 개설 · 구매확정 후 하자 (B4)
    base({
      claimNo: "CLM-3018",
      kind: "RETURN",
      stage: "PICKUP_WAIT",
      stageLabel: "회수 대기",
      stageTone: "INFO",
      headerBadge: { label: "운영자 개설", tone: "INFO" },
      fault: "BRAND",
      reason: "배송 상품 파손 및 불량",
      orderNo: "ORD-24112",
      brandName: "글로우코스",
      consumerName: "최**",
      appliedAt: at("09-18", "16:10"),
      confirmedAt: "2026-09-03",
      opened: {
        operatorName: MOCK_OPERATOR_NAME,
        openedAt: at("09-18", "16:10"),
        basis: { inquiryNo: "#4521", summary: "내용물 변색", photoCount: 3 },
      },
      items: [
        item("글로우 세럼", "30ml", 1, 45000, {
          label: "회수 대기",
          tone: "INFO",
        }),
      ],
      orderedQty: null,
      legalDeadline: {
        suppliedAt: "2026-08-27",
        suppliedLimit: "2026-11-27",
        defectKnownAt: "2026-09-17",
        defectLimit: "2026-10-17",
        appliedDeadline: "2026-10-17",
        trackingEntered: false,
      },
      settlement: {
        confirmedRound: "2026-09-10",
        deductTargets: ["브랜드 수취액", "리워드"],
      },
      statusRows: [
        { label: "출처", value: "운영자 개설", emphasis: true },
        { label: "귀책", value: "브랜드 · 착불 · 차감 없음", emphasis: false },
        { label: "기한", value: "10.17", emphasis: false },
      ],
      history: [
        entry(
          "WARNING",
          "반품 대신 개설 · 확정 후 하자",
          `운영자 ${MOCK_OPERATOR_NAME}`,
          "브랜드 귀책",
          at("09-18", "16:10")
        ),
        entry(
          "WARNING",
          "1:1 문의 접수 · 하자 주장",
          "소비자 최**",
          "#4521",
          at("09-18", "15:20")
        ),
        entry("SUCCESS", "구매확정 (자동)", "시스템", null, "2026-09-03"),
      ],
    }),
    // CLM-3016 · 교환 · 회수 중
    base({
      claimNo: "CLM-3016",
      kind: "EXCHANGE",
      stage: "IN_TRANSIT",
      stageLabel: "회수 중",
      stageTone: "INFO",
      fault: "CONSUMER",
      reason: "단순 변심",
      orderNo: "ORD-24180",
      brandName: "글로우코스",
      consumerName: "한**",
      appliedAt: at("09-15", "14:40"),
      items: [
        item("톤업 쿠션", "21호 → 23호", 1, 32000, {
          label: "회수 중",
          tone: "INFO",
        }),
      ],
      pickup: {
        ...WAITING_PICKUP,
        carrier: "CJ대한통운",
        trackingNo: "6512****4417",
        pickedUpAt: at("09-16"),
      },
      purchaseConfirm: { timer: "STOPPED", remainingDays: 6 },
      statusRows: [
        {
          label: "회수 송장",
          value: "CJ대한통운 · 집화 09.16",
          emphasis: false,
        },
        { label: "통과 시", value: "교환 상품 재발송", emphasis: false },
      ],
      history: [
        entry("INFO", "집화 완료", "택배사", null, at("09-16", "10:30")),
        entry(
          "INFO",
          "회수 송장 입력",
          "소비자 한**",
          null,
          at("09-15", "18:05")
        ),
        entry(
          "INFO",
          "교환 신청 · 구매확정 타이머 정지",
          "소비자 한**",
          "단순 변심",
          at("09-15", "14:40")
        ),
      ],
    }),
    // CLM-3014 · 반품 · 회수 중
    base({
      claimNo: "CLM-3014",
      kind: "RETURN",
      stage: "IN_TRANSIT",
      stageLabel: "회수 중",
      stageTone: "INFO",
      fault: "BRAND",
      reason: "오배송 및 배송 지연",
      orderNo: "ORD-24175",
      brandName: "퓨어네이처",
      consumerName: "송**",
      appliedAt: at("09-16", "09:12"),
      items: [
        item("하이드라 앰플", "30ml · 3개입", 1, 42000, {
          label: "회수 중",
          tone: "INFO",
        }),
      ],
      pickup: {
        ...WAITING_PICKUP,
        carrier: "한진택배",
        trackingNo: "4082****1130",
        pickedUpAt: at("09-17"),
      },
      amount: {
        productAmount: 42000,
        firstShippingDeduction: 0,
        refundOnPass: 42000,
        freeShipping: true,
      },
      purchaseConfirm: { timer: "STOPPED", remainingDays: 3 },
      statusRows: [
        {
          label: "회수 송장",
          value: "한진택배 · 집화 09.17",
          emphasis: false,
        },
        {
          label: "통과 시",
          value: "PG 자동 환불 42,000원",
          emphasis: false,
        },
      ],
      history: [
        entry("INFO", "집화 완료", "택배사", null, at("09-17", "13:10")),
        entry(
          "INFO",
          "회수 송장 입력",
          "소비자 송**",
          null,
          at("09-16", "20:20")
        ),
        entry(
          "INFO",
          "반품 신청 · 구매확정 타이머 정지",
          "소비자 송**",
          "오배송 및 배송 지연",
          at("09-16", "09:12")
        ),
      ],
    }),
    // CLM-3015 · 반품 · 검수 지연 (B1)
    base({
      claimNo: "CLM-3015",
      kind: "RETURN",
      stage: "INSPECT_OVERDUE",
      stageLabel: "검수 지연",
      stageTone: "WARNING",
      fault: "CONSUMER",
      reason: "단순 변심",
      orderNo: "ORD-24190",
      brandName: "데일리랩",
      consumerName: "이**",
      appliedAt: at("09-11", "20:14"),
      items: [
        item("선크림 리필", "50ml", 2, 16000, {
          label: "입고·검수",
          tone: "WARNING",
        }),
      ],
      pickup: {
        carrier: "CJ대한통운",
        trackingNo: "6512****9902",
        pickedUpAt: at("09-12"),
        receivedAt: at("09-14", "11:20"),
        receivedBy: "브랜드 데일리랩",
        inspectionDueDate: "2026-09-16",
        overdue: true,
      },
      amount: {
        productAmount: 16000,
        firstShippingDeduction: 3000,
        refundOnPass: 13000,
        freeShipping: true,
      },
      purchaseConfirm: { timer: "STOPPED", remainingDays: 3 },
      statusRows: [
        { label: "검수 기한", value: "09.16 · 2영업일 초과", emphasis: false },
        { label: "자동 알림", value: "1회", emphasis: false },
        {
          label: "통과 시",
          value: "PG 자동 환불 13,000원",
          emphasis: false,
        },
      ],
      history: [
        entry(
          "WARNING",
          "검수 기한 경과 · 자동 알림 1회",
          "시스템 · 브랜드 데일리랩",
          null,
          at("09-17")
        ),
        entry(
          "INFO",
          "입고 확인",
          "브랜드 데일리랩",
          null,
          at("09-14", "11:20")
        ),
        entry(
          "INFO",
          "회수 송장 입력",
          "소비자 이**",
          null,
          at("09-12", "08:40")
        ),
        entry(
          "INFO",
          "반품 신청 · 구매확정 타이머 정지",
          "소비자 이**",
          "단순 변심",
          at("09-11", "20:14")
        ),
      ],
    }),
    // CLM-3012 · 반품 · 검수 대기
    base({
      claimNo: "CLM-3012",
      kind: "RETURN",
      stage: "INSPECT_WAIT",
      stageLabel: "검수 대기",
      stageTone: "INFO",
      fault: "BRAND",
      reason: "배송 상품 파손 및 불량",
      orderNo: "ORD-24163",
      brandName: "퓨어랩",
      consumerName: "문**",
      appliedAt: at("09-12", "13:48"),
      items: [
        item("클렌징 밤", "100ml", 1, 24000, {
          label: "입고·검수",
          tone: "INFO",
        }),
      ],
      pickup: {
        carrier: "롯데택배",
        trackingNo: "2417****8806",
        pickedUpAt: at("09-15"),
        receivedAt: at("09-17", "10:05"),
        receivedBy: "브랜드 퓨어랩",
        inspectionDueDate: "2026-09-21",
        overdue: false,
      },
      amount: {
        productAmount: 24000,
        firstShippingDeduction: 0,
        refundOnPass: 24000,
        freeShipping: true,
      },
      purchaseConfirm: { timer: "STOPPED", remainingDays: 2 },
      statusRows: [
        { label: "검수 기한", value: "09.21", emphasis: false },
        {
          label: "통과 시",
          value: "PG 자동 환불 24,000원",
          emphasis: false,
        },
      ],
      history: [
        entry("INFO", "입고 확인", "브랜드 퓨어랩", null, at("09-17", "10:05")),
        entry("INFO", "집화 완료", "택배사", null, at("09-15", "09:30")),
        entry(
          "INFO",
          "회수 송장 입력",
          "소비자 문**",
          null,
          at("09-14", "21:10")
        ),
        entry(
          "INFO",
          "반품 신청 · 구매확정 타이머 정지",
          "소비자 문**",
          "배송 상품 파손 및 불량",
          at("09-12", "13:48")
        ),
      ],
    }),
    // CLM-3010 · 교환 · 교환 재발송 대기
    base({
      claimNo: "CLM-3010",
      kind: "EXCHANGE",
      stage: "RESHIP_WAIT",
      stageLabel: "교환 재발송 대기",
      stageTone: "INFO",
      fault: "CONSUMER",
      reason: "주문 실수",
      orderNo: "ORD-24150",
      brandName: "무드코스메틱",
      consumerName: "윤**",
      appliedAt: at("09-10", "17:25"),
      items: [
        item("립 틴트", "02 → 04", 1, 14000, {
          label: "재발송 대기",
          tone: "INFO",
        }),
      ],
      pickup: {
        carrier: "CJ대한통운",
        trackingNo: "6512****2275",
        pickedUpAt: at("09-12"),
        receivedAt: at("09-16", "15:00"),
        receivedBy: "브랜드 무드코스메틱",
        inspectionDueDate: "2026-09-18",
        overdue: false,
      },
      purchaseConfirm: { timer: "STOPPED", remainingDays: 1 },
      statusRows: [
        { label: "검수", value: "통과 09.17", emphasis: false },
        { label: "재발송", value: "브랜드 발송 대기", emphasis: false },
      ],
      history: [
        entry(
          "INFO",
          "검수 통과 · 교환 재발송 대기",
          "브랜드 무드코스메틱",
          null,
          at("09-17", "11:40")
        ),
        entry(
          "INFO",
          "입고 확인",
          "브랜드 무드코스메틱",
          null,
          at("09-16", "15:00")
        ),
        entry(
          "INFO",
          "교환 신청 · 구매확정 타이머 정지",
          "소비자 윤**",
          "주문 실수",
          at("09-10", "17:25")
        ),
      ],
    }),
    // CLM-3008 · 반품 · 반려 보류 · 소비자 이의 (B2)
    base({
      claimNo: "CLM-3008",
      kind: "RETURN",
      stage: "REJECT_HOLD",
      stageLabel: "반려 보류",
      stageTone: "INFO",
      fault: "CONSUMER",
      reason: "단순 변심",
      orderNo: "ORD-24171",
      brandName: "글로우코스",
      consumerName: "정**",
      appliedAt: at("09-08", "21:30"),
      items: [
        item("글로우 크림", "50ml", 1, 27200, {
          label: "반려",
          tone: "NEUTRAL",
        }),
      ],
      refundableByOperator: true,
      refundAmountIfAccepted: 27200,
      rejection: {
        reason: "사용 흔적 · 재판매 불가",
        legalBasis: "전자상거래법 제17조② 1호",
        scope: "ALL",
        rejectedQty: 1,
        claimedQty: 1,
        rejectedFault: "CONSUMER",
        passedFault: null,
        faultChanged: false,
        evidence: "사진 2장 · 펌프 내부 잔량 · 용기 외부 오염",
        consumerMessage:
          "용기 내부에 사용 흔적이 있어 반품이 어렵습니다. 재발송비 결제 후 원래 상품을 보내 드립니다.",
      },
      hold: {
        reshipFee: 3000,
        payDueDays: 12,
        noticeCount: 1,
        lastNoticeAt: at("09-15"),
        rejectedAt: at("09-15", "16:40"),
        retainUntil: "2026-12-15",
      },
      objection: {
        text: "펌프는 시향만 1회 했고 사용하지 않았습니다. 배송 당시부터 펌프 입구에 내용물이 묻어 있었어요.",
        inquiryNo: "#4527",
        photoCount: 1,
        receivedAt: at("09-17", "10:05"),
      },
      purchaseConfirm: { timer: "STOPPED", remainingDays: null },
      statusRows: [
        { label: "재발송비", value: "결제 대기 · D-12", emphasis: false },
        { label: "이의", value: "1건 · 09.17", emphasis: false },
      ],
      history: [
        entry(
          "WARNING",
          "소비자 이의 접수",
          null,
          "1:1 문의 #4527",
          at("09-17", "10:05")
        ),
        entry(
          "WARNING",
          "검수 반려 · 재발송비 결제 고지",
          "브랜드 글로우코스",
          "6항목 제출",
          at("09-15", "16:40")
        ),
        entry(
          "INFO",
          "입고 확인",
          "브랜드 글로우코스",
          null,
          at("09-14", "10:10")
        ),
      ],
    }),
    // CLM-3006 · 반품 · 환불 완료
    base({
      claimNo: "CLM-3006",
      kind: "RETURN",
      stage: "REFUNDED",
      stageLabel: "환불 완료",
      stageTone: "SUCCESS",
      fault: "CONSUMER",
      reason: "주문 실수",
      orderNo: "ORD-24120",
      brandName: "글로우코스",
      consumerName: "조**",
      appliedAt: at("09-05", "12:10"),
      items: [
        item("클렌징 밤", "100ml", 1, 18000, {
          label: "통과",
          tone: "SUCCESS",
        }),
      ],
      refundCalc: {
        title: "환불 계산 (PG 자동 · 완료)",
        lines: [
          {
            label: "상품 금액",
            amount: 18000,
            kind: "PLUS",
            note: "소비자 귀책",
          },
          {
            label: "최초 배송비 차감",
            amount: 3000,
            kind: "MINUS",
            note: "무료배송 · 소비자 귀책",
          },
          {
            label: "환불",
            amount: 15000,
            kind: "TOTAL",
            note: "PG 자동 · 09.12 10:20 · 원래 결제 취소",
          },
        ],
      },
      purchaseConfirm: null,
      statusRows: [
        { label: "종결", value: "09.12", emphasis: false },
        { label: "환불 출처", value: "PG 자동", emphasis: false },
      ],
      history: [
        entry(
          "SUCCESS",
          "PG 자동 환불 15,000원",
          "시스템",
          "원래 결제 취소",
          at("09-12", "10:20")
        ),
        entry(
          "INFO",
          "검수 통과",
          "브랜드 글로우코스",
          null,
          at("09-11", "17:30")
        ),
        entry(
          "INFO",
          "입고 확인",
          "브랜드 글로우코스",
          null,
          at("09-10", "11:00")
        ),
        entry(
          "INFO",
          "반품 신청 · 구매확정 타이머 정지",
          "소비자 조**",
          "주문 실수",
          at("09-05", "12:10")
        ),
      ],
    }),
    // CLM-3004 · 교환 · 교환 완료
    base({
      claimNo: "CLM-3004",
      kind: "EXCHANGE",
      stage: "EXCHANGED",
      stageLabel: "교환 완료",
      stageTone: "SUCCESS",
      fault: "CONSUMER",
      reason: "사이즈가 맞지 않음",
      orderNo: "ORD-24101",
      brandName: "퓨어네이처",
      consumerName: "서**",
      appliedAt: at("09-02", "09:50"),
      items: [
        item("하이드라 앰플", "30ml → 50ml", 1, 38000, {
          label: "교환 완료",
          tone: "SUCCESS",
        }),
      ],
      purchaseConfirm: { timer: "RESTARTED", remainingDays: 7 },
      statusRows: [
        { label: "종결", value: "09.10", emphasis: false },
        { label: "구매확정", value: "7일 새로 시작", emphasis: false },
      ],
      history: [
        entry(
          "SUCCESS",
          "교환 완료 · 구매확정 타이머 7일 새로 시작",
          "시스템",
          null,
          at("09-10", "14:00")
        ),
        entry(
          "INFO",
          "교환 상품 재발송",
          "브랜드 퓨어네이처",
          null,
          at("09-08", "16:20")
        ),
        entry(
          "INFO",
          "입고 확인 · 검수 통과",
          "브랜드 퓨어네이처",
          null,
          at("09-06", "10:30")
        ),
        entry(
          "INFO",
          "교환 신청 · 구매확정 타이머 정지",
          "소비자 서**",
          "사이즈가 맞지 않음",
          at("09-02", "09:50")
        ),
      ],
    }),
    // CLM-3002 · 반품 · 일부 반려 · 환불 완료 (B3)
    base({
      claimNo: "CLM-3002",
      kind: "RETURN",
      stage: "REFUNDED_PARTIAL",
      stageLabel: "일부 반려 · 환불 완료",
      stageTone: "SUCCESS",
      headerBadge: { label: "환불 완료", tone: "SUCCESS" },
      fault: "BRAND",
      reason: "배송 상품 파손 및 불량",
      orderNo: "ORD-24133",
      brandName: "데일리랩",
      consumerName: "배**",
      appliedAt: at("08-29", "19:20"),
      detailText: "2개 중 1개 용기 깨짐, 1개는 뚜껑 헐거움",
      items: [
        item("데일리 선크림", "50ml", 1, 16000, {
          label: "통과",
          tone: "SUCCESS",
        }),
        item(
          "데일리 선크림",
          "50ml",
          1,
          16000,
          { label: "반려 · 반송 완료", tone: "NEUTRAL" },
          true
        ),
      ],
      rejection: {
        reason: "정상 제품 · 하자 미확인",
        legalBasis: "전자상거래법 제17조② 1호",
        scope: "PARTIAL",
        rejectedQty: 1,
        claimedQty: 2,
        rejectedFault: "CONSUMER",
        passedFault: "BRAND",
        faultChanged: false,
        evidence: "사진 1장 · 뚜껑 체결 정상",
        consumerMessage: null,
      },
      refundCalc: {
        title: "환불 계산 (PG 자동 · 완료)",
        lines: [
          {
            label: "통과분 상품 금액",
            amount: 16000,
            kind: "PLUS",
            note: "브랜드 귀책 · 배송비 차감 없음",
          },
          {
            label: "반려분 재발송비",
            amount: 3000,
            kind: "MINUS",
            note: "일부 반려 → 통과분 환불에서 차감",
          },
          {
            label: "환불",
            amount: 13000,
            kind: "TOTAL",
            note: "PG 자동 · 09.08 10:02 · 원래 결제 부분 취소",
          },
        ],
      },
      statusRows: [
        { label: "종결", value: "09.08", emphasis: false },
        { label: "환불 출처", value: "PG 자동", emphasis: false },
        { label: "정산", value: "통과분 차감 · 반려분 정상", emphasis: false },
      ],
      history: [
        entry(
          "SUCCESS",
          "PG 자동 환불 13,000원",
          "시스템",
          "원래 결제 부분 취소",
          at("09-08", "10:02")
        ),
        entry(
          "INFO",
          "반려분 반송 완료",
          "브랜드 데일리랩",
          null,
          at("09-07", "15:00")
        ),
        entry(
          "WARNING",
          "검수 · 일부 반려 (통과 1 · 반려 1)",
          "브랜드 데일리랩",
          null,
          at("09-04", "16:10")
        ),
        entry(
          "INFO",
          "반품 신청 · 구매확정 타이머 정지",
          "소비자 배**",
          null,
          at("08-29", "19:20")
        ),
      ],
    }),
  ];
}

/** 목록 경과 표기 — 영업일 계산은 서버 몫이라 목업은 시안 값을 그대로 쓴다 */
const ELAPSED: Record<string, { label: string; overdue: boolean }> = {
  "CLM-3021": { label: "신청 1일", overdue: false },
  "CLM-3020": { label: "신청 1일", overdue: false },
  "CLM-3018": { label: "신청 1일", overdue: false },
  "CLM-3016": { label: "집화 2일", overdue: false },
  "CLM-3014": { label: "집화 1일", overdue: false },
  "CLM-3015": { label: "입고 3영업일", overdue: true },
  "CLM-3012": { label: "입고 1영업일", overdue: false },
  "CLM-3010": { label: "통과 1영업일", overdue: false },
  "CLM-3008": { label: "고지 1회", overdue: false },
  "CLM-3006": { label: "09.12", overdue: false },
  "CLM-3004": { label: "09.10", overdue: false },
  "CLM-3002": { label: "09.08", overdue: false },
};

const store: Array<ClaimDetail> = seed();

const STAGE_TAB: Record<ClaimStage, ClaimTab | null> = {
  PICKUP_WAIT: "PICKUP_WAIT",
  IN_TRANSIT: "IN_TRANSIT",
  INSPECT_WAIT: "INSPECTION",
  INSPECT_OVERDUE: "INSPECTION",
  RESHIP_WAIT: "RESHIP",
  REJECT_HOLD: "REJECT_HOLD",
  // 환불 관리로 넘어간 건 — 시안에 탭이 없어 전체에서만 보인다
  REFUND_PENDING: null,
  REFUNDED: "DONE",
  REFUNDED_PARTIAL: "DONE",
  EXCHANGED: "DONE",
  REJECT_CLOSED: "DONE",
};

const TABS: Array<ClaimTab> = [
  "ALL",
  "PICKUP_WAIT",
  "IN_TRANSIT",
  "INSPECTION",
  "RESHIP",
  "REJECT_HOLD",
  "DONE",
];

function toListItem(detail: ClaimDetail): ClaimListItem {
  const first = detail.items[0];
  const elapsed = ELAPSED[detail.claimNo] ?? {
    label: "—",
    overdue: false,
  };
  return {
    claimNo: detail.claimNo,
    kind: detail.kind,
    consumerName: detail.consumerName,
    brandName: detail.brandName,
    productName: first.name,
    optionText: first.option,
    quantity: detail.items.reduce((sum, row) => sum + row.quantity, 0),
    reason: detail.reason,
    fault: detail.fault,
    stage: detail.stage,
    // 목록 단계 열은 결제를 기다린다는 사실을, 상세는 단계 이름(반려 보류)을 보인다
    stageLabel:
      detail.stage === "REJECT_HOLD" ? "재발송비 결제 대기" : detail.stageLabel,
    stageTone: detail.stageTone,
    operatorOpened: detail.opened !== null,
    afterPurchaseConfirm: detail.confirmedAt !== null,
    objectionAt: detail.refundableByOperator
      ? (detail.objection?.receivedAt ?? null)
      : null,
    elapsedLabel: elapsed.label,
    elapsedOverdue: elapsed.overdue,
    hold:
      detail.hold && detail.rejection
        ? {
            rejectReason: detail.rejection.reason,
            rejectedAt: detail.hold.rejectedAt,
            reshipFee: detail.hold.reshipFee,
            payDueDays: detail.hold.payDueDays,
            noticeCount: detail.hold.noticeCount,
            retainUntil: detail.hold.retainUntil,
          }
        : null,
  };
}

export const claimMock = {
  summary(scenario: string | null): ClaimSummary {
    const empty = scenario === "empty";
    const rows = empty ? [] : store;
    const tabCounts = Object.fromEntries(
      TABS.map((tab) => [
        tab,
        tab === "ALL"
          ? // 시안 12 = 3+2+2+1+1+3 — 환불 대기로 편입한 건은 이 합에만 들어간다(탭 칸이 없다)
            rows.length
          : rows.filter((row) => STAGE_TAB[row.stage] === tab).length,
      ])
    ) as Record<ClaimTab, number>;
    return {
      tabCounts,
      delayCount: rows.filter((row) => row.stage === "INSPECT_OVERDUE").length,
      objectionCount: rows.filter((row) => row.refundableByOperator).length,
    };
  },

  list(params: ClaimListParams, scenario: string | null): ClaimListResponse {
    const page = Number(params.page) || 1;
    const size = Number(params.size) || 20;
    const keyword = params.keyword.trim().toLowerCase();

    let rows = scenario === "empty" ? [] : store;
    if (params.tab !== "ALL") {
      rows = rows.filter((row) => STAGE_TAB[row.stage] === params.tab);
    }
    if (params.kind) {
      rows = rows.filter((row) => row.kind === params.kind);
    }
    if (keyword) {
      rows = rows.filter((row) =>
        [row.claimNo, row.orderNo, row.brandName, row.consumerName].some(
          (value) => value.toLowerCase().includes(keyword)
        )
      );
    }

    // 최신순은 저장소 순서(신청일시 최신순) 그대로. 경과 오래된순은 검수 지연이 먼저(운영자가 모니터하는 건) → 신청이 오래된 순
    const sorted =
      params.sort === "ELAPSED_DESC"
        ? [...rows].sort(
            (a, b) =>
              Number(b.stage === "INSPECT_OVERDUE") -
                Number(a.stage === "INSPECT_OVERDUE") ||
              a.appliedAt.localeCompare(b.appliedAt)
          )
        : rows;

    const totalResults = sorted.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / size));
    const content = sorted
      .slice((page - 1) * size, page * size)
      .map(toListItem);

    return {
      content,
      pageInfo: {
        currentPage: page,
        totalPages,
        totalResults,
        limit: size,
        hasNext: page < totalPages,
      },
      delayCount: sorted.filter((row) => row.stage === "INSPECT_OVERDUE")
        .length,
      objectionCount: sorted.filter((row) => row.refundableByOperator).length,
    };
  },

  detail(claimNo: string): ClaimDetail {
    const found = store.find((row) => row.claimNo === claimNo);
    if (!found) throw new Error("해당 반품·교환을 찾을 수 없습니다.");
    return found;
  },

  /** 반려 이의 인용 — 환불 대기로 편입하고 귀책을 브랜드로 바꾼다(집행은 환불 관리) */
  refundByOperator(claimNo: string, body: OperatorRefundRequest) {
    const target = store.find((row) => row.claimNo === claimNo);
    if (!target) throw new Error("해당 반품·교환을 찾을 수 없습니다.");
    if (!target.refundableByOperator) {
      throw new Error("운영자 사유 환불을 입력할 수 없는 상태입니다.");
    }

    const reasonLabel =
      body.reason === "ACCEPT_OBJECTION"
        ? "반려 이의 인용"
        : body.reason === "RECALL"
          ? "위해성 리콜"
          : "기타";

    target.stage = "REFUND_PENDING";
    target.stageLabel = "환불 대기";
    target.stageTone = "INFO";
    target.headerBadge = { label: "환불 대기", tone: "INFO" };
    target.refundableByOperator = false;
    target.hold = null;
    target.fault = "BRAND";
    if (target.rejection) {
      target.rejection.faultChanged = true;
      target.rejection.rejectedFault = "BRAND";
    }
    target.items = target.items.map((row) => ({
      ...row,
      status: { label: "환불 대기", tone: "INFO" },
      dimmed: false,
    }));
    target.statusRows = [
      { label: "환불", value: "환불 관리 편입 · 집행 대기", emphasis: false },
      { label: "사유", value: reasonLabel, emphasis: false },
    ];
    target.history = [
      entry(
        "INFO",
        `운영자 사유 환불 · ${reasonLabel}`,
        `운영자 ${MOCK_OPERATOR_NAME}`,
        "환불 대기 편입",
        NOW
      ),
      ...target.history,
    ];

    return { claimNo };
  },
};
