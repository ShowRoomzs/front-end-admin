/*
  05 변경 요청 DEV 목업 — 개발 서버(`pnpm dev`) 전용. 서비스가 `DEV_MOCK_ENABLED` 가드 뒤에서 동적 import 한다
  (배포 번들에 들어가지 않는다).

  ⚠ 백엔드 배포 후 삭제: origin/main의 새 응답(요청자 · 인플루언서 유형 3종 · compareItems · approvalImpact ·
  source)이 개발 서버에 배포되면 이 파일과 서비스의 `changeRequestMock()` 분기를 지운다.

  값은 시안 ui-admin-05-change-requests rev.8 C1 ~ C10, 모양은 `AdminChangeRequestDto`(origin/main) ·
  `CreatorChangeRequestDetailAssembler` · `BrandChangeRequestDetailAssembler`가 만드는 그대로다.
  시각은 서버처럼 UTC 벽시계로 둔다(화면은 parseServerDateTime으로 KST 표기 — 시안 시각과 같아진다).
*/
import type {
  ChangeRequestDetailInfo,
  ChangeRequestInfo,
  ChangeRequestListResponse,
  ChangeRequestParams,
  ChangeRequestProcessResponse,
  ChangeRequestRejectReasonOption,
  ChangeRequestStatus,
  ChangeRequestStatusFilter,
  ChangeRequestSummary,
  ChangeRequestType,
  RejectChangeRequestData,
} from "@/features/changeRequest/services/changeRequestService";

type Seed = Omit<ChangeRequestDetailInfo, "prevRequestId" | "nextRequestId">;

const TYPE_LABEL: Record<ChangeRequestType, string> = {
  BUSINESS_INFO: "사업자 정보",
  SETTLEMENT_ACCOUNT: "정산 계좌",
  TO_BUSINESS: "사업자 전환 (인플루언서)",
  TO_INDIVIDUAL: "비사업자 전환 (인플루언서)",
  CREATOR_ACCOUNT: "계좌 변경 (인플루언서)",
};

function evidence(
  documentLabel: string,
  fileName: string,
  fileSizeBytes: number,
  uploadedAt: string
) {
  return {
    documentLabel,
    fileName,
    fileSizeBytes,
    extension: fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase(),
    // 목업은 실제 파일이 없다 — 미리보기는 「불러오지 못했습니다」로 떨어진다
    fileUrl: `https://example.invalid/change-request/${encodeURIComponent(fileName)}`,
    uploadedAt,
  };
}

function requested(at: string, surface: string) {
  return [{ event: "REQUESTED" as const, occurredAt: at, actorLabel: surface }];
}

function seeds(scenario: string): Array<Seed> {
  const holderMismatch = scenario === "cr-holder-mismatch";
  const accountChangeRequired = scenario !== "cr-no-account-change";

  return [
    // C3 — ○○코스메틱 사업자 정보(SLA 초과)
    {
      requestId: 81,
      requestCode: "CHG-2026-0081",
      requester: { type: "BRAND", id: 7, name: "○○코스메틱" },
      brandName: "○○코스메틱",
      marketId: 7,
      type: "BUSINESS_INFO",
      status: "PENDING",
      slaExceeded: true,
      requestedAt: "2026-08-06T05:20:00",
      processedAt: null,
      requesterName: "박담당",
      elapsedText: "2일 3h",
      reason:
        "법인 소재지 이전으로 사업장 주소가 변경되었고, 대표자도 함께 변경되었습니다. 변경된 사업자등록증을 첨부합니다.",
      diff: [
        {
          fieldKey: "BUSINESS_TYPE",
          label: "사업자 유형",
          currentValue: "일반과세자",
          requestedValue: null,
          changed: false,
          locked: false,
          source: "LIVE",
        },
        {
          fieldKey: "MARKET_NAME",
          label: "브랜드명",
          currentValue: "○○코스메틱",
          requestedValue: null,
          changed: false,
          locked: false,
          source: "LIVE",
        },
        {
          fieldKey: "REPRESENTATIVE_NAME",
          label: "대표자명",
          currentValue: "김대표",
          requestedValue: "이대표",
          changed: true,
          locked: false,
          source: "REQUEST",
        },
        {
          fieldKey: "COMPANY_NAME",
          label: "사업자등록증 상호",
          currentValue: "주식회사 오오코스메틱",
          requestedValue: null,
          changed: false,
          locked: false,
          source: "LIVE",
        },
        {
          fieldKey: "BUSINESS_REG_NUMBER",
          label: "사업자등록번호",
          currentValue: "000-00-00000",
          requestedValue: null,
          changed: false,
          locked: true,
          source: "LIVE",
        },
        {
          fieldKey: "BUSINESS_CONDITION",
          label: "업태",
          currentValue: "도소매 · 화장품",
          requestedValue: null,
          changed: false,
          locked: false,
          source: "LIVE",
        },
        {
          fieldKey: "BUSINESS_ADDRESS",
          label: "사업장 주소",
          currentValue: "서울시 강남구 테헤란로 000 오오빌딩 5층",
          requestedValue: "서울시 성동구 성수이로 22 성수빌딩 3층",
          changed: true,
          locked: false,
          source: "REQUEST",
        },
        {
          fieldKey: "MAIL_ORDER_REG_NUMBER",
          label: "통신판매업 신고번호",
          currentValue: "2026-서울강남-0000",
          requestedValue: null,
          changed: false,
          locked: false,
          source: "LIVE",
        },
      ],
      changedFieldLabels: ["대표자명", "사업장 주소"],
      evidence: evidence(
        "사업자등록증",
        "사업자등록증_변경.jpg",
        1258291,
        "2026-08-06T05:20:00"
      ),
      referenceItems: [
        { label: "사업자등록증 상호", value: "주식회사 오오코스메틱" },
        { label: "사업자등록번호", value: "000-00-00000" },
      ],
      holderCheck: null,
      compareItems: null,
      approvalImpact: null,
      history: requested("2026-08-06T05:20:00", "브랜드 파트너센터"),
    },
    // C3a — 예린 뷰티 사업자 전환(비사업자 → 개인사업자)
    {
      requestId: 83,
      requestCode: "CHG-2026-0083",
      requester: { type: "CREATOR", id: 31, name: "예린 뷰티" },
      brandName: null,
      marketId: null,
      type: "TO_BUSINESS",
      status: "PENDING",
      slaExceeded: false,
      requestedAt: "2026-08-07T04:05:00",
      processedAt: null,
      requesterName: null,
      elapsedText: "1일 4h",
      // 서버는 사업자 구분 변경에 사유 입력란이 없어 null을 준다(백엔드 요청 — 시안은 사유를 보인다)
      reason: null,
      diff: [
        {
          fieldKey: "CREATOR_BUSINESS_TYPE",
          label: "사업자 구분",
          currentValue: "비사업자",
          requestedValue: "개인사업자",
          changed: true,
          locked: false,
          source: "REQUEST",
        },
        {
          fieldKey: "CREATOR_BUSINESS_REG_NUMBER",
          label: "사업자등록번호",
          currentValue: null,
          requestedValue: "214-37-55120",
          changed: true,
          locked: false,
          source: "REQUEST",
        },
        {
          fieldKey: "LICENSE_COMPANY_REPRESENTATIVE",
          label: "상호 · 대표자 (등록증)",
          currentValue: null,
          requestedValue: null,
          changed: false,
          locked: false,
          source: "DOCUMENT",
        },
        {
          fieldKey: "PAYOUT_METHOD",
          label: "지급 방식",
          currentValue: "원천징수 3.3%",
          requestedValue: "세금계산서 · 리워드 + 부가세 10%",
          changed: true,
          locked: false,
          source: "DERIVED",
        },
        {
          fieldKey: "ACCOUNT_HOLDER",
          label: "정산 계좌 예금주",
          currentValue: "오예린",
          requestedValue: null,
          changed: false,
          locked: false,
          source: "CHECK",
        },
        {
          fieldKey: "SETTLEMENT_ACCOUNT",
          label: "정산 계좌",
          currentValue: "국민 604***-**-2218",
          requestedValue: null,
          changed: false,
          locked: false,
          source: "LIVE",
        },
      ],
      changedFieldLabels: ["사업자 구분", "사업자등록번호"],
      evidence: evidence(
        "사업자등록증",
        "사업자등록증_예린스튜디오.pdf",
        838861,
        "2026-08-07T04:05:00"
      ),
      referenceItems: [{ label: "정산 계좌 예금주", value: "오예린" }],
      holderCheck: {
        currentHolder: "오예린",
        rule: "REPRESENTATIVE_NAME",
        mismatch: false,
      },
      compareItems: [
        {
          key: "REPRESENTATIVE_NAME",
          label: "대표자명",
          value: "오예린",
          mustBeBefore: null,
          serverCheck: null,
        },
        {
          key: "BUSINESS_REG_NUMBER",
          label: "사업자등록번호",
          value: "214-37-55120",
          mustBeBefore: null,
          serverCheck: null,
        },
        {
          key: "OPENING_DATE",
          label: "개업일",
          value: null,
          mustBeBefore: "2026-08-07T04:05:00",
          serverCheck: null,
        },
      ],
      approvalImpact: {
        appliesFrom: "NEXT_SETTLEMENT",
        payoutMethodBefore: "WITHHOLDING_3_3",
        payoutMethodAfter: "TAX_INVOICE",
        retainedSettlements: [
          {
            settlementId: 16,
            settlementNumber: "STL-2609-016",
            status: "REVIEWING",
          },
        ],
        accountChangeRequired: false,
        accountHolderRuleAfter: "REPRESENTATIVE_NAME",
      },
      history: requested("2026-08-07T04:05:00", "쇼룸 스튜디오"),
    },
    // C3b — 다은 데스크 비사업자 전환(개인사업자 → 비사업자)
    {
      requestId: 84,
      requestCode: "CHG-2026-0084",
      requester: { type: "CREATOR", id: 32, name: "다은 데스크" },
      brandName: null,
      marketId: null,
      type: "TO_INDIVIDUAL",
      status: "PENDING",
      slaExceeded: false,
      requestedAt: "2026-08-07T10:40:00",
      processedAt: null,
      requesterName: null,
      elapsedText: "22h",
      reason: null,
      diff: [
        {
          fieldKey: "CREATOR_BUSINESS_TYPE",
          label: "사업자 구분",
          currentValue: "개인사업자",
          requestedValue: "비사업자",
          changed: true,
          locked: false,
          source: "REQUEST",
        },
        {
          fieldKey: "CREATOR_BUSINESS_REG_NUMBER",
          label: "사업자등록번호",
          currentValue: "312-81-40177",
          requestedValue: "폐업",
          changed: true,
          locked: false,
          source: "DERIVED",
        },
        {
          fieldKey: "CREATOR_RESIDENT_NUMBER",
          label: "주민등록번호",
          currentValue: null,
          requestedValue: "950812-*******",
          changed: true,
          locked: false,
          source: "REQUEST",
        },
        {
          fieldKey: "PAYOUT_METHOD",
          label: "지급 방식",
          currentValue: "세금계산서 · 리워드 + 부가세 10%",
          requestedValue: "원천징수 3.3%",
          changed: true,
          locked: false,
          source: "DERIVED",
        },
        {
          fieldKey: "ACCOUNT_HOLDER",
          label: "정산 계좌 예금주",
          currentValue: accountChangeRequired ? "다은스튜디오" : "정다은",
          requestedValue: null,
          changed: false,
          locked: false,
          source: "CHECK",
        },
        {
          fieldKey: "SETTLEMENT_ACCOUNT",
          label: "정산 계좌",
          currentValue: "신한 110-***-**5520",
          requestedValue: null,
          changed: false,
          locked: false,
          source: "LIVE",
        },
      ],
      changedFieldLabels: ["사업자 구분", "주민등록번호"],
      evidence: evidence(
        "폐업사실증명원",
        "폐업사실증명원_다은스튜디오.pdf",
        419430,
        "2026-08-07T10:40:00"
      ),
      referenceItems: [
        { label: "주민등록번호", value: "950812-*******" },
        {
          label: "정산 계좌 예금주",
          value: accountChangeRequired ? "다은스튜디오" : "정다은",
        },
      ],
      holderCheck: {
        currentHolder: accountChangeRequired ? "다은스튜디오" : "정다은",
        rule: "REAL_NAME",
        mismatch: false,
      },
      compareItems: [
        {
          key: "REPRESENTATIVE_NAME",
          label: "대표자 성명",
          value: "정다은",
          mustBeBefore: null,
          serverCheck: null,
        },
        {
          key: "BIRTHDAY",
          label: "생년월일",
          value: "1995-08-12",
          mustBeBefore: null,
          serverCheck: "MATCH",
        },
        {
          key: "BUSINESS_REG_NUMBER",
          label: "사업자등록번호",
          value: "312-81-40177",
          mustBeBefore: null,
          serverCheck: null,
        },
        {
          key: "CLOSURE_DATE",
          label: "폐업일",
          value: null,
          mustBeBefore: "2026-08-07T10:40:00",
          serverCheck: null,
        },
      ],
      approvalImpact: {
        appliesFrom: "NEXT_SETTLEMENT",
        payoutMethodBefore: "TAX_INVOICE",
        payoutMethodAfter: "WITHHOLDING_3_3",
        retainedSettlements: [],
        // 서버는 상호 명의 계좌를 받기 전(§55 B-9)이라 항상 false — 시안 C3b를 보이려고 기본은 true
        accountChangeRequired,
        accountHolderRuleAfter: "REAL_NAME",
      },
      history: requested("2026-08-07T10:40:00", "쇼룸 스튜디오"),
    },
    // C4b — 하린_뷰티랩 계좌 변경(기-22)
    {
      requestId: 91,
      requestCode: "CHG-2026-0091",
      requester: { type: "CREATOR", id: 45, name: "하린_뷰티랩" },
      brandName: null,
      marketId: null,
      type: "CREATOR_ACCOUNT",
      status: "PENDING",
      slaExceeded: false,
      requestedAt: "2026-08-07T12:10:00",
      processedAt: null,
      requesterName: null,
      elapsedText: "14h",
      reason: null,
      diff: [
        {
          fieldKey: "BANK",
          label: "은행",
          currentValue: "카카오뱅크",
          requestedValue: "국민은행",
          changed: true,
          locked: false,
          source: "REQUEST",
        },
        {
          fieldKey: "ACCOUNT_NUMBER",
          label: "계좌번호",
          currentValue: "3333012345678",
          requestedValue: "604201045512",
          changed: true,
          locked: false,
          source: "REQUEST",
        },
        {
          fieldKey: "HOLDER",
          label: "예금주",
          currentValue: "박하린",
          requestedValue: holderMismatch ? "박하림" : "박하린",
          changed: false,
          locked: false,
          source: "CHECK",
        },
      ],
      changedFieldLabels: ["은행", "계좌번호"],
      evidence: evidence(
        "통장 사본",
        "통장_사본.jpg",
        838861,
        "2026-08-07T12:10:00"
      ),
      referenceItems: [{ label: "본인 인증 실명", value: "박하린" }],
      holderCheck: {
        currentHolder: "박하린",
        rule: "REAL_NAME",
        mismatch: holderMismatch,
      },
      compareItems: [
        {
          key: "HOLDER",
          label: "예금주(통장 사본) = 본인 실명",
          value: "박하린",
          mustBeBefore: null,
          serverCheck: null,
        },
        {
          key: "BANK",
          label: "은행",
          value: "국민은행",
          mustBeBefore: null,
          serverCheck: null,
        },
        {
          key: "ACCOUNT_NUMBER",
          label: "계좌번호",
          value: "604201045512",
          mustBeBefore: null,
          serverCheck: null,
        },
      ],
      approvalImpact: null,
      history: requested("2026-08-07T12:10:00", "쇼룸 스튜디오"),
    },
    // C4 · C6 — 글로우랩 정산 계좌(예금주 ≠ 상호)
    {
      requestId: 82,
      requestCode: "CHG-2026-0082",
      requester: { type: "BRAND", id: 12, name: "글로우랩" },
      brandName: "글로우랩",
      marketId: 12,
      type: "SETTLEMENT_ACCOUNT",
      status: "PENDING",
      slaExceeded: false,
      requestedAt: "2026-08-06T06:02:00",
      processedAt: null,
      requesterName: "최담당",
      elapsedText: "18h",
      reason: null,
      diff: [
        {
          fieldKey: "BANK_CODE",
          label: "은행",
          currentValue: "국민은행",
          requestedValue: "신한은행",
          changed: true,
          locked: false,
          source: "REQUEST",
        },
        {
          fieldKey: "ACCOUNT_NUMBER",
          label: "계좌번호",
          currentValue: "000123456789",
          requestedValue: "110234567890",
          changed: true,
          locked: false,
          source: "REQUEST",
        },
        {
          fieldKey: "ACCOUNT_HOLDER",
          label: "예금주",
          currentValue: "주식회사 오오코스메틱",
          requestedValue: "글로우랩",
          changed: true,
          locked: false,
          source: "REQUEST",
        },
      ],
      changedFieldLabels: ["은행", "계좌번호", "예금주"],
      evidence: evidence(
        "통장 사본",
        "통장_사본.jpg",
        838861,
        "2026-08-06T06:02:00"
      ),
      referenceItems: [
        { label: "사업자등록증 상호", value: "주식회사 글로우랩" },
      ],
      holderCheck: {
        requestedHolder: "글로우랩",
        companyName: "주식회사 글로우랩",
        mismatch: true,
      },
      compareItems: null,
      approvalImpact: null,
      history: requested("2026-08-06T06:02:00", "브랜드 파트너센터"),
    },
    // 처리 완료 — 네이처핏 사업자 정보(승인)
    {
      requestId: 75,
      requestCode: "CHG-2026-0075",
      requester: { type: "BRAND", id: 15, name: "네이처핏" },
      brandName: "네이처핏",
      marketId: 15,
      type: "BUSINESS_INFO",
      status: "APPROVED",
      slaExceeded: false,
      requestedAt: "2026-08-05T02:30:00",
      processedAt: "2026-08-05T07:44:00",
      requesterName: "정담당",
      elapsedText: null,
      reason: "브랜드명 변경에 맞춰 상호를 변경했습니다.",
      diff: [
        {
          fieldKey: "BUSINESS_TYPE",
          label: "사업자 유형",
          currentValue: "일반과세자",
          requestedValue: null,
          changed: false,
          locked: false,
          source: "LIVE",
        },
        {
          fieldKey: "MARKET_NAME",
          label: "브랜드명",
          currentValue: "네이처핏",
          requestedValue: null,
          changed: false,
          locked: false,
          source: "LIVE",
        },
        {
          fieldKey: "REPRESENTATIVE_NAME",
          label: "대표자명",
          currentValue: "정대표",
          requestedValue: null,
          changed: false,
          locked: false,
          source: "LIVE",
        },
        {
          fieldKey: "COMPANY_NAME",
          label: "사업자등록증 상호",
          currentValue: "네이처핏 주식회사",
          requestedValue: "주식회사 네이처핏",
          changed: true,
          locked: false,
          source: "REQUEST",
        },
        {
          fieldKey: "BUSINESS_REG_NUMBER",
          label: "사업자등록번호",
          currentValue: "000-00-00001",
          requestedValue: null,
          changed: false,
          locked: true,
          source: "LIVE",
        },
        {
          fieldKey: "BUSINESS_CONDITION",
          label: "업태",
          currentValue: "도소매 · 건강식품",
          requestedValue: null,
          changed: false,
          locked: false,
          source: "LIVE",
        },
        {
          fieldKey: "BUSINESS_ADDRESS",
          label: "사업장 주소",
          currentValue: "서울시 마포구 월드컵로 000",
          requestedValue: null,
          changed: false,
          locked: false,
          source: "LIVE",
        },
        {
          fieldKey: "MAIL_ORDER_REG_NUMBER",
          label: "통신판매업 신고번호",
          currentValue: "2026-서울마포-0000",
          requestedValue: null,
          changed: false,
          locked: false,
          source: "LIVE",
        },
      ],
      changedFieldLabels: ["사업자등록증 상호"],
      evidence: evidence(
        "사업자등록증",
        "사업자등록증_네이처핏.jpg",
        943718,
        "2026-08-05T02:30:00"
      ),
      referenceItems: [
        { label: "사업자등록증 상호", value: "주식회사 네이처핏" },
        { label: "사업자등록번호", value: "000-00-00001" },
      ],
      holderCheck: null,
      compareItems: null,
      approvalImpact: null,
      history: [
        ...requested("2026-08-05T02:30:00", "브랜드 파트너센터"),
        {
          event: "APPROVED",
          occurredAt: "2026-08-05T07:44:00",
          actorLabel: "김운영",
        },
      ],
    },
    // 처리 완료 — 수분케어랩 정산 계좌(반려)
    {
      requestId: 72,
      requestCode: "CHG-2026-0072",
      requester: { type: "BRAND", id: 18, name: "수분케어랩" },
      brandName: "수분케어랩",
      marketId: 18,
      type: "SETTLEMENT_ACCOUNT",
      status: "REJECTED",
      slaExceeded: false,
      requestedAt: "2026-08-04T00:18:00",
      processedAt: "2026-08-04T01:02:00",
      requesterName: "한담당",
      elapsedText: null,
      reason: null,
      diff: [
        {
          fieldKey: "BANK_CODE",
          label: "은행",
          currentValue: "우리은행",
          requestedValue: "하나은행",
          changed: true,
          locked: false,
          source: "REQUEST",
        },
        {
          fieldKey: "ACCOUNT_NUMBER",
          label: "계좌번호",
          currentValue: "1002-***-****21",
          requestedValue: "356-***-****08",
          changed: true,
          locked: false,
          source: "REQUEST",
        },
        {
          fieldKey: "ACCOUNT_HOLDER",
          label: "예금주",
          currentValue: "주식회사 수분케어랩",
          requestedValue: "주식회사 수분케어랩",
          changed: true,
          locked: false,
          source: "REQUEST",
        },
      ],
      changedFieldLabels: ["은행", "계좌번호", "예금주"],
      evidence: evidence(
        "통장 사본",
        "통장사본_수분케어랩.png",
        512000,
        "2026-08-04T00:18:00"
      ),
      referenceItems: [
        { label: "사업자등록증 상호", value: "주식회사 수분케어랩" },
      ],
      holderCheck: {
        requestedHolder: "주식회사 수분케어랩",
        companyName: "주식회사 수분케어랩",
        mismatch: false,
      },
      compareItems: null,
      approvalImpact: null,
      history: [
        ...requested("2026-08-04T00:18:00", "브랜드 파트너센터"),
        {
          event: "REJECTED",
          occurredAt: "2026-08-04T01:02:00",
          actorLabel: "김운영",
        },
      ],
    },
  ];
}

/*
  승인 · 반려로 바뀐 상태 — 새로고침하면 처음으로 돌아간다.
  시나리오마다 seed가 달라서(예금주 불일치 등) 상태만 따로 들고 seed 위에 덮는다.
*/
const processed = new Map<
  number,
  { status: ChangeRequestStatus; processedAt: string; actorLabel: string }
>();

function nowServerTime() {
  // 서버 now()처럼 UTC 벽시계 — 시간대 표기 없이
  return new Date().toISOString().slice(0, 19);
}

function records(scenario: string): Array<Seed> {
  if (scenario === "cr-empty") {
    // C2 — 검토 대기 0건 · 처리 완료 건만 남는다
    return seeds(scenario).filter((seed) => seed.status !== "PENDING");
  }
  return seeds(scenario).map((seed) => {
    const done = processed.get(seed.requestId);
    if (!done) {
      return seed;
    }
    return {
      ...seed,
      status: done.status,
      processedAt: done.processedAt,
      slaExceeded: false,
      elapsedText: null,
      approvalImpact: null,
      history: [
        ...seed.history,
        {
          event: done.status as "APPROVED" | "REJECTED",
          occurredAt: done.processedAt,
          actorLabel: done.actorLabel,
        },
      ],
    };
  });
}

/** 서버 정렬 — 검토 대기 우선 · 대기는 오래된 순 · 처리 완료는 최신 요청순 */
function sortLikeServer(items: Array<Seed>) {
  return [...items].sort((a, b) => {
    const ap = a.status === "PENDING";
    const bp = b.status === "PENDING";
    if (ap !== bp) return ap ? -1 : 1;
    // SLA 초과를 맨 위에 — 시안 C1 순서
    if (ap && a.slaExceeded !== b.slaExceeded) return a.slaExceeded ? -1 : 1;
    return ap
      ? a.requestedAt.localeCompare(b.requestedAt)
      : b.requestedAt.localeCompare(a.requestedAt);
  });
}

function inTab(status: ChangeRequestStatus, tab: ChangeRequestStatusFilter) {
  return tab === "ALL" ? true : status === tab;
}

function matchesKeyword(seed: Seed, keyword: string) {
  return !keyword || (seed.requester?.name ?? "").includes(keyword.trim());
}

function toListItem(seed: Seed): ChangeRequestInfo {
  return {
    requestId: seed.requestId,
    requestCode: seed.requestCode,
    requester: seed.requester,
    brandName: seed.brandName,
    type: seed.type,
    typeLabel: TYPE_LABEL[seed.type],
    requestedAt: seed.requestedAt,
    processedAt: seed.processedAt,
    elapsedText: seed.elapsedText,
    slaExceeded: seed.slaExceeded,
    status: seed.status,
  };
}

export function mockChangeRequestList(
  scenario: string,
  params: ChangeRequestParams
): ChangeRequestListResponse {
  const searched = records(scenario).filter((seed) =>
    matchesKeyword(seed, params.keyword)
  );
  const rows = sortLikeServer(
    searched.filter((seed) => inTab(seed.status, params.status))
  );
  const size = params.size || 20;
  const page = params.page || 1;
  const count = (status: ChangeRequestStatus) =>
    searched.filter((seed) => seed.status === status).length;

  return {
    content: rows.slice((page - 1) * size, page * size).map(toListItem),
    pageInfo: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(rows.length / size)),
      totalResults: rows.length,
      limit: size,
      hasNext: page * size < rows.length,
    },
    statusCounts: {
      pending: count("PENDING"),
      approved: count("APPROVED"),
      rejected: count("REJECTED"),
      canceled: count("CANCELED"),
      all: searched.length,
    },
  };
}

export function mockChangeRequestSummary(
  scenario: string
): ChangeRequestSummary {
  const pending = records(scenario).filter((seed) => seed.status === "PENDING");
  return {
    pendingCount: pending.length,
    brandPendingCount: pending.filter((s) => s.requester?.type === "BRAND")
      .length,
    creatorPendingCount: pending.filter((s) => s.requester?.type === "CREATOR")
      .length,
  };
}

export function mockChangeRequestDetail(
  scenario: string,
  requestId: number,
  status: ChangeRequestStatusFilter
): ChangeRequestDetailInfo {
  const all = records(scenario);
  const seed = all.find((item) => item.requestId === requestId);
  if (!seed) {
    throw new Error(`목업에 없는 변경 요청입니다: ${requestId}`);
  }
  // 이전/다음은 서버처럼 현재 탭 순서(검색어 무관)
  const ordered = sortLikeServer(
    all.filter((item) => inTab(item.status, status))
  );
  const index = ordered.findIndex((item) => item.requestId === requestId);
  return {
    ...seed,
    prevRequestId: index > 0 ? ordered[index - 1].requestId : null,
    nextRequestId:
      index >= 0 && index < ordered.length - 1
        ? ordered[index + 1].requestId
        : null,
  };
}

/** 서버 ChangeRequestRejectReason · descriptionFor(type) 그대로 */
export function mockChangeRequestRejectReasons(
  type: ChangeRequestType
): Array<ChangeRequestRejectReasonOption> {
  const option = (code: string, label: string) => ({
    code,
    label,
    detailRequired: false,
  });
  const other = { code: "OTHER", label: "기타", detailRequired: true };
  switch (type) {
    case "BUSINESS_INFO":
      return [
        option("EVIDENCE_MISSING", "증빙 서류 미첨부"),
        option(
          "EVIDENCE_VALUE_MISMATCH",
          "증빙 서류와 요청 값이 일치하지 않음"
        ),
        option("EVIDENCE_UNREADABLE", "서류 판독 불가 (흐림·잘림)"),
        option("EVIDENCE_EXPIRED", "서류 유효기간 경과"),
        option("REASON_INSUFFICIENT", "변경 사유 불충분"),
        other,
      ];
    case "SETTLEMENT_ACCOUNT":
    case "CREATOR_ACCOUNT":
      return [
        option("BANKBOOK_MISSING", "통장 사본 미첨부"),
        option(
          "HOLDER_NAME_MISMATCH",
          type === "CREATOR_ACCOUNT"
            ? "예금주가 본인 실명과 일치하지 않음"
            : "예금주와 사업자 명의 불일치"
        ),
        option("ACCOUNT_NUMBER_INVALID", "계좌번호 오류·미개설 계좌"),
        option("BANKBOOK_UNREADABLE", "통장 사본 판독 불가"),
        other,
      ];
    default:
      return [
        option("LICENSE_UNREADABLE", "사업자등록증 판독 불가 (흐림·잘림)"),
        option(
          "LICENSE_OWNER_NAME_MISMATCH",
          "등록증의 대표자명이 본인 실명과 다름"
        ),
        option("BUSINESS_NUMBER_MISMATCH", "사업자등록번호가 등록증과 다름"),
        option("BUSINESS_SUSPENDED_OR_CLOSED", "휴업 · 폐업 상태의 사업자"),
        option(
          "CLOSURE_NOT_CONFIRMED",
          "폐업 사실이 확인되지 않음 (비사업자 전환)"
        ),
        other,
      ];
  }
}

function process(
  requestId: number,
  status: "APPROVED" | "REJECTED",
  reason?: { label: string | null; detail: string | null }
): ChangeRequestProcessResponse {
  const seed = seeds("cr").find((item) => item.requestId === requestId);
  if (!seed) {
    throw new Error(`목업에 없는 변경 요청입니다: ${requestId}`);
  }
  const processedAt = nowServerTime();
  processed.set(requestId, { status, processedAt, actorLabel: "김운영" });
  return {
    requestId,
    requestCode: seed.requestCode,
    requester: seed.requester,
    brandName: seed.brandName,
    type: seed.type,
    status,
    processedAt,
    rejectReason: reason?.label ?? null,
    rejectReasonDetail: reason?.detail ?? null,
  };
}

export function mockApproveChangeRequest(requestId: number) {
  return process(requestId, "APPROVED");
}

export function mockRejectChangeRequest(
  requestId: number,
  data: RejectChangeRequestData
) {
  const seed = seeds("cr").find((item) => item.requestId === requestId);
  const label =
    mockChangeRequestRejectReasons(seed?.type ?? "BUSINESS_INFO").find(
      (option) => option.code === data.reasonType
    )?.label ?? null;
  return process(requestId, "REJECTED", {
    label,
    detail: data.reasonDetail ?? null,
  });
}
