/*
  일반 게시물 모니터링 목업 — 개발 서버 전용(서비스가 `?mock=`일 때만 동적 import 한다 · 배포 번들에 들어가지 않는다).
  백엔드 배포 후 삭제.

  값은 시안 ui-admin-11-general-posts rev.7 C1~C11과 54 설계서 4-3 예시를 DTO 모양 그대로 옮겼다.
  시각은 서버처럼 UTC 벽시계 문자열로 만든다 — 화면이 parseServerDateTime으로 KST로 되돌려 시안 시각(21:05 등)이 보인다.
  기한 D-n이 시안과 같게 보이도록 날짜는 오늘 기준 상대값이다.

  쓰기(노출 중지 · 신고 종결 · 조치 취소 · 이의 승인/반려 · 신고 지목)는 서버로 보내지 않고 이 저장소만 바꾼다
  (새로고침하면 초기화).
*/

import { mockDelay } from "@/common/utils/devMock";
import type {
  AdminPostActionResponse,
  AdminPostDetail,
  AdminPostImage,
  AdminPostListItem,
  AdminPostListParams,
  AdminPostReport,
  AdminPostSummary,
  AdminPostSuspension,
  AdminPostTimelineItem,
  PolicyClauseItem,
  PostDetailNavParams,
  PostMonitoringTab,
  SuspendPostBody,
  SuspensionReasonItem,
} from "@/features/post/types";
import type { PageResponse } from "@/common/types/page";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/** 오늘 기준 `offset`일 · KST `hh:mm` → 서버 형식(UTC 벽시계) */
function at(offset: number, time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  return dayjs()
    .add(offset, "day")
    .hour(hour)
    .minute(minute)
    .second(0)
    .millisecond(0)
    .utc()
    .format("YYYY-MM-DDTHH:mm:ss");
}

function plusMonths(value: string, months: number): string {
  return dayjs.utc(value).add(months, "month").format("YYYY-MM-DDTHH:mm:ss");
}

const POLICY = {
  appealDeadlineDays: 7,
  appealReviewBusinessDays: 3,
  downloadGraceDays: 7,
  retentionMonths: 6,
};

const CHAPTER = "서비스 운영정책 — 커뮤니티 장";

export const MOCK_SUSPENSION_REASONS: Array<SuspensionReasonItem> = [
  {
    code: "MISLEADING_INFO",
    label: "허위 · 과장 정보",
    detailRequired: false,
    operatorOnly: false,
  },
  {
    code: "FRAUD_IMPERSONATION",
    label: "사기 · 사칭",
    detailRequired: false,
    operatorOnly: false,
  },
  {
    code: "ABUSE_HATE",
    label: "욕설 · 혐오 표현",
    detailRequired: false,
    operatorOnly: false,
  },
  {
    code: "SEXUAL_CONTENT",
    label: "음란물 · 성적인 내용",
    detailRequired: false,
    operatorOnly: false,
  },
  {
    code: "SPAM",
    label: "스팸 · 반복 게시",
    detailRequired: false,
    operatorOnly: false,
  },
  {
    code: "PERSONAL_INFO",
    label: "개인정보 노출",
    detailRequired: false,
    operatorOnly: true,
  },
  { code: "OTHER", label: "기타", detailRequired: true, operatorOnly: false },
];

export const MOCK_POLICY_CLAUSES: Array<PolicyClauseItem> = [
  {
    code: "ARTICLE_3_2",
    label: `${CHAPTER} 3조 2항 — 효과 · 가격 오인 표현`,
    suggestedFor: ["MISLEADING_INFO"],
  },
  {
    code: "ARTICLE_3_4",
    label: `${CHAPTER} 3조 4항 — 의약품 · 의료기기 오인 표현`,
    suggestedFor: ["MISLEADING_INFO"],
  },
  {
    code: "ARTICLE_4_1",
    label: `${CHAPTER} 4조 1항 — 욕설 · 혐오 표현`,
    suggestedFor: ["ABUSE_HATE", "SEXUAL_CONTENT"],
  },
  {
    code: "ARTICLE_4_3",
    label: `${CHAPTER} 4조 3항 — 타인 사칭`,
    suggestedFor: ["FRAUD_IMPERSONATION", "PERSONAL_INFO"],
  },
  {
    code: "ARTICLE_5",
    label: `${CHAPTER} 5조 — 광고 · 도배`,
    suggestedFor: ["SPAM"],
  },
];

function images(
  count: number,
  uploadedAt: string,
  flagged: Array<number> = []
): Array<AdminPostImage> {
  return Array.from({ length: count }, (_, index) => ({
    imageId: 9000 + index,
    sortOrder: index,
    imageUrl: null,
    originalUrl: null,
    fileName: `IMG_${3300 + index}.jpg`,
    width: 1080,
    height: 1350,
    fileSize: 812_340,
    uploadedAt,
    reportFlagged: flagged.includes(index + 1),
    reportFlaggedAt: flagged.includes(index + 1) ? at(-1, "10:40") : null,
    reportFlaggedByName: flagged.includes(index + 1) ? "김운영" : null,
  }));
}

function report(
  reportId: number,
  reasonCode: AdminPostReport["reasonCode"],
  reasonDetail: string,
  reportedAt: string,
  reporter: string,
  status: AdminPostReport["status"] = "PENDING"
): AdminPostReport {
  return {
    reportId,
    reasonCode,
    reasonLabel:
      MOCK_SUSPENSION_REASONS.find((item) => item.code === reasonCode)?.label ??
      null,
    reasonDetail,
    status,
    reportedAt,
    reporterUserId: 5500 + reportId,
    reporterMaskedName: reporter,
    handledAt: status === "PENDING" ? null : reportedAt,
    handledByName: status === "PENDING" ? null : "김운영",
  };
}

function reportsBlock(
  items: Array<AdminPostReport>
): AdminPostDetail["reports"] {
  const pending = items.filter((item) => item.status === "PENDING");
  const basis = pending.length > 0 ? pending : items;
  const counts = new Map<string, { label: string; count: number }>();
  basis.forEach((item) => {
    const prev = counts.get(String(item.reasonCode));
    counts.set(String(item.reasonCode), {
      label: item.reasonLabel ?? "",
      count: (prev?.count ?? 0) + 1,
    });
  });
  return {
    pendingCount: pending.length,
    totalCount: items.length,
    firstPendingAt: pending[0]?.reportedAt ?? null,
    countsByReason: [...counts.entries()]
      .map(([reasonCode, value]) => ({
        reasonCode,
        reasonLabel: value.label,
        count: value.count,
      }))
      .sort((a, b) => b.count - a.count),
    items,
  };
}

function tl(
  type: AdminPostTimelineItem["type"],
  time: string,
  actorType: AdminPostTimelineItem["actorType"],
  actorName: string | null,
  label: string,
  tone: string
): AdminPostTimelineItem {
  return {
    type,
    at: time,
    actorType,
    actorName,
    label,
    detail: null,
    tone,
    refId: null,
  };
}

function reportLines(
  items: Array<AdminPostReport>
): Array<AdminPostTimelineItem> {
  return items.map((item, index) =>
    tl(
      "REPORTED",
      item.reportedAt ?? "",
      "USER",
      item.reporterMaskedName,
      `신고 접수 (${index + 1}건째)`,
      "WARNING"
    )
  );
}

function sortTimeline(items: Array<AdminPostTimelineItem>) {
  return [...items].sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
}

// ------------------------------------------------------------------ 게시물 7건 (시안 C1 6행 + C10)

function buildPosts(): Array<AdminPostDetail> {
  // C2 게시중 — 신고 없음
  const p388Published = at(-1, "18:40");
  const p388: AdminPostDetail = {
    postId: 388,
    postNo: "POST-20260812-0388",
    monitoringStatus: "PUBLISHED",
    monitoringStatusLabel: "게시중",
    status: "PUBLISHED",
    content:
      "여름 데일리 메이크업 루틴 정리했어요\n\n여름에 무너지지 않는 데일리 메이크업 순서 정리했어요. 저는 지성 피부라 유분 잡는 단계를 먼저 넣습니다.\n\n1. 스킨케어 후 5분 기다리기\n2. 프라이머는 T존만\n3. 쿠션은 두 번 얇게\n4. 파우더로 마무리",
    aspectRatio: 1.5,
    aspectRatioLabel: "3:2",
    publishedAt: p388Published,
    editedAt: at(-1, "19:02"),
    deletedAt: null,
    deleteReason: null,
    purgeAt: null,
    author: {
      showroomId: 12,
      showroomName: "유하린",
      userId: 1212,
      profileImageUrl: null,
      followerCount: 24180,
      suspensionCount: 1,
      sanctionDeleteCount: 0,
    },
    images: images(4, at(-1, "18:38")),
    metrics: {
      impressions: 12060,
      likes: 1204,
      likeRate: 10.0,
      showroomVisits: 742,
      follows: 118,
      frozenAt: null,
    },
    reports: reportsBlock([]),
    suspensions: [],
    appeal: null,
    deletion: null,
    timeline: sortTimeline([
      tl(
        "PUBLISHED",
        p388Published,
        "CREATOR",
        "유하린",
        "게시물 등록",
        "INFO"
      ),
      tl(
        "EDITED",
        at(-1, "19:02"),
        "CREATOR",
        "유하린",
        "게시물 수정",
        "NEUTRAL"
      ),
    ]),
    navigation: null,
    policy: POLICY,
  };

  // C3 신고 접수 — 사진 14장 · 3번째 「신고 지목」
  const p342Reports = [
    report(
      17,
      "MISLEADING_INFO",
      "효과를 단정하고 환불을 보장하는 표현이 있습니다. 3번째 사진에 「100% 환불 보장」 문구가 있어요.",
      at(-2, "22:14"),
      "한*준"
    ),
    report(
      18,
      "MISLEADING_INFO",
      "협찬을 받았는데 아닌 것처럼 적었습니다.",
      at(-1, "07:02"),
      "오*린"
    ),
    report(
      19,
      "OTHER",
      "재고 소진을 이유로 구매를 압박합니다.",
      at(-1, "10:26"),
      "임*현"
    ),
  ];
  const p342: AdminPostDetail = {
    postId: 342,
    postNo: "POST-20260811-0342",
    monitoringStatus: "REPORTED",
    monitoringStatusLabel: "신고 접수",
    status: "PUBLISHED",
    content:
      "브랜드 협찬 없이 3개월 써본 진짜 후기\n\n브랜드 협찬 없이 제 돈으로 3개월 써본 후기입니다. 결론부터 말하면 이거 쓰고 효과 없으면 환불받으세요. 저는 두 달 만에 색소가 거의 사라졌습니다.\n\n피부과 시술보다 낫다는 얘기까지 들었어요. 재고 얼마 안 남았다고 하니 서두르시는 게 좋습니다.",
    aspectRatio: 0.8,
    aspectRatioLabel: "4:5",
    publishedAt: at(-2, "21:05"),
    editedAt: at(-2, "21:20"),
    deletedAt: null,
    deleteReason: null,
    purgeAt: null,
    author: {
      showroomId: 10,
      showroomName: "김소연",
      userId: 1203,
      profileImageUrl: null,
      followerCount: 51400,
      suspensionCount: 1,
      sanctionDeleteCount: 0,
    },
    images: images(14, at(-2, "21:03"), [3]),
    metrics: {
      impressions: 18400,
      likes: 2180,
      likeRate: 11.8,
      showroomVisits: 4902,
      follows: 386,
      frozenAt: null,
    },
    reports: reportsBlock(p342Reports),
    suspensions: [],
    appeal: null,
    deletion: null,
    timeline: sortTimeline([
      tl(
        "PUBLISHED",
        at(-2, "21:05"),
        "CREATOR",
        "김소연",
        "게시물 등록",
        "INFO"
      ),
      tl(
        "EDITED",
        at(-2, "21:20"),
        "CREATOR",
        "김소연",
        "게시물 수정",
        "NEUTRAL"
      ),
      ...reportLines(p342Reports),
    ]),
    navigation: null,
    policy: POLICY,
  };

  // C1 두 번째 신고 접수 행
  const p310Reports = [
    report(
      21,
      "MISLEADING_INFO",
      "시술 효과를 단정합니다.",
      at(-2, "08:15"),
      "정*우"
    ),
  ];
  const p310: AdminPostDetail = {
    ...p388,
    postId: 310,
    postNo: "POST-20260810-0310",
    monitoringStatus: "REPORTED",
    monitoringStatusLabel: "신고 접수",
    content:
      "각질 정리 루틴 — 병원 시술 후기 포함\n\n주 1회 각질 정리 루틴이에요. 지난달 받은 시술 후기도 같이 적었어요.",
    aspectRatio: 0.8,
    aspectRatioLabel: "4:5",
    publishedAt: at(-3, "19:12"),
    editedAt: null,
    images: images(3, at(-3, "19:10")),
    metrics: {
      impressions: 3020,
      likes: 211,
      likeRate: 7.0,
      showroomVisits: 96,
      follows: 12,
      frozenAt: null,
    },
    reports: reportsBlock(p310Reports),
    timeline: sortTimeline([
      tl(
        "PUBLISHED",
        at(-3, "19:12"),
        "CREATOR",
        "유하린",
        "게시물 등록",
        "INFO"
      ),
      ...reportLines(p310Reports),
    ]),
  };

  // C6 이의 신청 심사 중
  const p288Suspension: AdminPostSuspension = {
    suspensionId: 6,
    open: true,
    reasonCode: "MISLEADING_INFO",
    reasonLabel: "허위 · 과장 정보",
    reasonDetail:
      "“치료되는 느낌” 표현이 의약품으로 오인될 수 있어 노출을 중지합니다.",
    policyClauseCode: "ARTICLE_3_4",
    policyRef: `${CHAPTER} 3조 4항 — 의약품 · 의료기기 오인 표현`,
    suspendedAt: at(-2, "16:40"),
    suspendedBy: 3,
    suspendedByName: "김운영",
    appealDeadline: at(5, "16:40"),
    deadlinePaused: true,
    resolution: null,
    resolvedAt: null,
    resolvedByName: null,
    notifiedAt: at(-2, "16:40"),
    notificationDelivered: true,
  };
  const p288Reports = [
    report(
      11,
      "MISLEADING_INFO",
      "여드름이 치료된다고 적었습니다.",
      at(-3, "11:20"),
      "서*아",
      "ACCEPTED"
    ),
    report(
      12,
      "MISLEADING_INFO",
      "효능을 단정합니다.",
      at(-3, "13:02"),
      "문*호",
      "ACCEPTED"
    ),
  ];
  const p288: AdminPostDetail = {
    postId: 288,
    postNo: "POST-20260809-0288",
    monitoringStatus: "UNDER_REVIEW",
    monitoringStatusLabel: "이의 신청 심사 중",
    status: "UNDER_REVIEW",
    content:
      "아침 루틴에 넣은 것들\n\n요즘 아침 루틴에 넣은 것들. 세안 후 바로 이 순서로 발라요.\n\n특히 두 번째 제품이 요즘 제일 만족스러워서 자세히 찍어봤어요. 끈적임 없이 마무리되는 게 여름엔 진짜 중요하더라고요. 붉은기랑 여드름 자체가 치료되는 느낌이에요.",
    aspectRatio: 0.8,
    aspectRatioLabel: "4:5",
    publishedAt: at(-4, "08:30"),
    editedAt: at(-4, "09:04"),
    deletedAt: null,
    deleteReason: null,
    purgeAt: null,
    author: {
      showroomId: 10,
      showroomName: "김소연",
      userId: 1203,
      profileImageUrl: null,
      followerCount: 51400,
      suspensionCount: 1,
      sanctionDeleteCount: 0,
    },
    images: images(4, at(-4, "08:28")),
    metrics: {
      impressions: 2140,
      likes: 84,
      likeRate: 3.9,
      showroomVisits: 148,
      follows: 26,
      frozenAt: at(-2, "16:40"),
    },
    reports: reportsBlock(p288Reports),
    suspensions: [p288Suspension],
    appeal: {
      appealId: 2,
      status: "PENDING",
      content:
        "“치료되는 느낌”은 제 느낌을 적은 표현이고 제품이 여드름을 치료한다고 쓴 적은 없습니다. 오해의 소지가 있다면 해당 문장을 수정하겠습니다. 사진에도 효능 표현은 없습니다.",
      submittedAt: at(-1, "09:12"),
      reviewDueAt: at(2, "09:12"),
      reviewedAt: null,
      reviewedByName: null,
      reviewComment: null,
      graceUntil: null,
    },
    deletion: null,
    timeline: sortTimeline([
      tl(
        "PUBLISHED",
        at(-4, "08:30"),
        "CREATOR",
        "김소연",
        "게시물 등록",
        "INFO"
      ),
      tl(
        "EDITED",
        at(-4, "09:04"),
        "CREATOR",
        "김소연",
        "게시물 수정",
        "NEUTRAL"
      ),
      ...reportLines(p288Reports),
      tl(
        "SUSPENDED",
        at(-2, "16:40"),
        "ADMIN",
        "김운영",
        "노출 중지 · 허위 · 과장 정보",
        "DANGER"
      ),
      tl(
        "NOTIFIED",
        at(-2, "16:40"),
        "SYSTEM",
        null,
        "작성자 알림 발송",
        "INFO"
      ),
      tl(
        "APPEAL_SUBMITTED",
        at(-1, "09:12"),
        "CREATOR",
        "김소연",
        "이의 신청 접수",
        "WARNING"
      ),
    ]),
    navigation: null,
    policy: POLICY,
  };

  // C5 노출 중지 — 이의 신청 전 · 기한 D-5
  const p271Reports = [
    report(
      31,
      "MISLEADING_INFO",
      "가격이 실제와 다릅니다.",
      at(-2, "09:41"),
      "오*린",
      "ACCEPTED"
    ),
    report(
      32,
      "SPAM",
      "같은 글을 반복해서 올립니다.",
      at(-2, "10:02"),
      "한*준",
      "ACCEPTED"
    ),
    report(
      33,
      "MISLEADING_INFO",
      "정가 표기가 과장됐습니다.",
      at(-2, "10:40"),
      "강*민",
      "ACCEPTED"
    ),
    report(
      34,
      "SPAM",
      "링크 도배입니다.",
      at(-2, "11:05"),
      "윤*서",
      "ACCEPTED"
    ),
  ];
  const p271: AdminPostDetail = {
    postId: 271,
    postNo: "POST-20260809-0271",
    monitoringStatus: "SUSPENDED",
    monitoringStatusLabel: "노출 중지",
    status: "SUSPENDED",
    content:
      "가을 신상 언박싱 — 이거 하나로 톤 정리 끝\n\n가을 신상 언박싱했어요. 이거 하나로 톤 정리 끝납니다.\n\n사진에 정가랑 링크 같이 넣어 뒀어요. 재고 소진되면 이 가격에 못 삽니다.",
    aspectRatio: 1.91,
    aspectRatioLabel: "1.91:1",
    publishedAt: at(-3, "20:31"),
    editedAt: null,
    deletedAt: null,
    deleteReason: null,
    purgeAt: null,
    author: {
      showroomId: 14,
      showroomName: "박다은",
      userId: 1214,
      profileImageUrl: null,
      followerCount: 12900,
      suspensionCount: 2,
      sanctionDeleteCount: 1,
    },
    images: images(5, at(-3, "20:29")),
    metrics: {
      impressions: 8120,
      likes: 402,
      likeRate: 5.0,
      showroomVisits: 233,
      follows: 31,
      frozenAt: at(-2, "14:20"),
    },
    reports: reportsBlock(p271Reports),
    suspensions: [
      {
        suspensionId: 5,
        open: true,
        reasonCode: "MISLEADING_INFO",
        reasonLabel: "허위 · 과장 정보",
        reasonDetail:
          "사진의 정가 · 할인 표기가 실제와 달라 노출을 중지합니다.",
        policyClauseCode: "ARTICLE_3_2",
        policyRef: `${CHAPTER} 3조 2항 — 효과 · 가격 오인 표현`,
        suspendedAt: at(-2, "14:20"),
        suspendedBy: 3,
        suspendedByName: "김운영",
        appealDeadline: at(5, "14:20"),
        deadlinePaused: false,
        resolution: null,
        resolvedAt: null,
        resolvedByName: null,
        notifiedAt: at(-2, "14:20"),
        notificationDelivered: true,
      },
    ],
    appeal: null,
    deletion: null,
    timeline: sortTimeline([
      tl(
        "PUBLISHED",
        at(-3, "20:31"),
        "CREATOR",
        "박다은",
        "게시물 등록",
        "INFO"
      ),
      ...reportLines(p271Reports),
      tl(
        "SUSPENDED",
        at(-2, "14:20"),
        "ADMIN",
        "김운영",
        "노출 중지 · 허위 · 과장 정보",
        "DANGER"
      ),
      tl(
        "NOTIFIED",
        at(-2, "14:20"),
        "SYSTEM",
        null,
        "작성자 알림 발송",
        "INFO"
      ),
    ]),
    navigation: null,
    policy: POLICY,
  };

  // C8 영구 삭제 · 비공개 보관 — 이의 신청 반려
  const p198Deleted = at(-12, "11:30");
  const p198Reports = [
    report(
      41,
      "MISLEADING_INFO",
      "병원 치료를 대신할 수 있다고 합니다.",
      at(-15, "08:10"),
      "백*진",
      "ACCEPTED"
    ),
    report(
      42,
      "MISLEADING_INFO",
      "효과를 단정합니다.",
      at(-15, "09:30"),
      "조*은",
      "ACCEPTED"
    ),
  ];
  const p198Suspension: AdminPostSuspension = {
    suspensionId: 4,
    open: false,
    reasonCode: "MISLEADING_INFO",
    reasonLabel: "허위 · 과장 정보",
    reasonDetail: null,
    policyClauseCode: "ARTICLE_3_4",
    policyRef: `${CHAPTER} 3조 4항 — 의약품 · 의료기기 오인 표현`,
    suspendedAt: at(-15, "10:12"),
    suspendedBy: 3,
    suspendedByName: "김운영",
    appealDeadline: at(-8, "10:12"),
    deadlinePaused: true,
    resolution: "DELETED_BY_REJECT",
    resolvedAt: p198Deleted,
    resolvedByName: null,
    notifiedAt: at(-15, "10:12"),
    notificationDelivered: true,
  };
  const p198: AdminPostDetail = {
    postId: 198,
    postNo: "POST-20260805-0198",
    monitoringStatus: "CLOSED",
    monitoringStatusLabel: "영구 삭제",
    status: "DELETED",
    content:
      "직접 만든 홈케어 레시피 공유\n\n직접 만든 홈케어 레시피 공유합니다. 재료는 약국에서 다 구할 수 있어요.\n\n피부 타입 상관없이 누구나 효과 있고, 병원 안 가도 됩니다.",
    aspectRatio: 0.8,
    aspectRatioLabel: "4:5",
    publishedAt: at(-16, "09:55"),
    editedAt: at(-16, "10:12"),
    deletedAt: p198Deleted,
    deleteReason: "APPEAL_REJECTED",
    purgeAt: plusMonths(p198Deleted, 6),
    author: {
      showroomId: 14,
      showroomName: "박다은",
      userId: 1214,
      profileImageUrl: null,
      followerCount: 12900,
      suspensionCount: 2,
      sanctionDeleteCount: 1,
    },
    images: images(1, at(-16, "09:50")),
    metrics: {
      impressions: 5960,
      likes: 596,
      likeRate: 10.0,
      showroomVisits: 311,
      follows: 44,
      frozenAt: p198Deleted,
    },
    reports: reportsBlock(p198Reports),
    suspensions: [p198Suspension],
    appeal: {
      appealId: 1,
      status: "REJECTED",
      content: "개인 경험을 적은 것입니다.",
      submittedAt: at(-14, "14:02"),
      reviewDueAt: at(-11, "14:02"),
      reviewedAt: p198Deleted,
      reviewedByName: "김운영",
      reviewComment:
        "“누구나 효과 있고 병원 안 가도 된다”는 표현은 의료 행위 대체를 암시하므로 수정 없이 재게시할 수 없습니다.",
      graceUntil: at(-5, "11:30"),
    },
    deletion: {
      type: "APPEAL_REJECTED",
      deletedAt: p198Deleted,
      deletedByName: "김운영",
      deletedBySelf: false,
      originSuspensionId: 4,
      rejectReason:
        "“누구나 효과 있고 병원 안 가도 된다”는 표현은 의료 행위 대체를 암시하므로 수정 없이 재게시할 수 없습니다.",
      graceFrom: p198Deleted,
      graceUntil: at(-5, "11:30"),
      originalDownloads: [{ downloadedAt: at(-11, "21:14"), imageCount: 1 }],
      daysAfterSuspension: null,
      appealDeadlineAtDeletion: null,
      purgeAt: plusMonths(p198Deleted, 6),
    },
    timeline: sortTimeline([
      tl(
        "PUBLISHED",
        at(-16, "09:55"),
        "CREATOR",
        "박다은",
        "게시물 등록",
        "INFO"
      ),
      tl(
        "EDITED",
        at(-16, "10:12"),
        "CREATOR",
        "박다은",
        "게시물 수정",
        "NEUTRAL"
      ),
      ...reportLines(p198Reports),
      tl(
        "SUSPENDED",
        at(-15, "10:12"),
        "ADMIN",
        "김운영",
        "노출 중지 · 허위 · 과장 정보",
        "DANGER"
      ),
      tl(
        "APPEAL_SUBMITTED",
        at(-14, "14:02"),
        "CREATOR",
        "박다은",
        "이의 신청 접수",
        "WARNING"
      ),
      tl(
        "APPEAL_REJECTED",
        p198Deleted,
        "ADMIN",
        "김운영",
        "이의 신청 반려",
        "DANGER"
      ),
      tl(
        "DELETED",
        p198Deleted,
        "ADMIN",
        "김운영",
        "영구 삭제 · 비공개 보관 전환",
        "NEUTRAL"
      ),
      tl(
        "ORIGINAL_DOWNLOADED",
        at(-11, "21:14"),
        "CREATOR",
        "박다은",
        "원본 내려받기 (1장)",
        "NEUTRAL"
      ),
    ]),
    navigation: null,
    policy: POLICY,
  };

  // C10 작성자 삭제 — 노출 중지 중 · 이의 미신청(목록 시안 6행에는 없다 · ?mock=c10 또는 /monitoring/posts/199)
  const p199Deleted = at(-14, "09:12");
  const p199: AdminPostDetail = {
    ...p198,
    postId: 199,
    postNo: "POST-20260805-0199",
    deletedAt: p199Deleted,
    deleteReason: "SELF",
    purgeAt: plusMonths(p199Deleted, 6),
    metrics: {
      impressions: 5960,
      likes: 596,
      likeRate: 10.0,
      showroomVisits: 311,
      follows: 44,
      frozenAt: p199Deleted,
    },
    suspensions: [
      {
        ...p198Suspension,
        suspensionId: 7,
        appealDeadline: at(-8, "10:12"),
        deadlinePaused: false,
        resolution: "DELETED_BY_SELF",
        resolvedAt: p199Deleted,
      },
    ],
    appeal: null,
    deletion: {
      type: "SELF",
      deletedAt: p199Deleted,
      deletedByName: "박다은",
      deletedBySelf: true,
      originSuspensionId: 7,
      rejectReason: null,
      graceFrom: null,
      graceUntil: null,
      originalDownloads: [],
      daysAfterSuspension: 1,
      appealDeadlineAtDeletion: at(-8, "10:12"),
      purgeAt: plusMonths(p199Deleted, 6),
    },
    timeline: sortTimeline([
      tl(
        "PUBLISHED",
        at(-16, "09:55"),
        "CREATOR",
        "박다은",
        "게시물 등록",
        "INFO"
      ),
      tl(
        "SUSPENDED",
        at(-15, "10:12"),
        "ADMIN",
        "김운영",
        "노출 중지 · 허위 · 과장 정보",
        "DANGER"
      ),
      tl(
        "DELETED",
        p199Deleted,
        "CREATOR",
        "박다은",
        "작성자 삭제 · 비공개 보관 전환",
        "NEUTRAL"
      ),
    ]),
  };

  return [p288, p342, p310, p271, p388, p198, p199];
}

// ------------------------------------------------------------------ 저장소 · 시나리오

/** 상세 시나리오 — 해당 id가 저장소에 없을 때 이 게시물을 연다 */
const DETAIL_SCENARIO_POST: Record<string, number> = {
  c2: 388,
  c3: 342,
  c4: 342,
  c11: 342,
  c5: 271,
  c6: 288,
  c7: 288,
  c8: 198,
  c10: 199,
};

/** 목록 시안 C1은 6행이다 — C10(작성자 삭제)은 상세로만 연다 */
const HIDDEN_FROM_LIST = new Set([199]);

let store: Array<AdminPostDetail> | null = null;
let storeScenario: string | null = null;

function getStore(scenario: string): Array<AdminPostDetail> {
  if (store === null || storeScenario !== scenario) {
    let posts = buildPosts();
    if (scenario === "c9") {
      // C9 — 신고가 하나도 없는 날: 신고 접수 2건이 종결된 상태로 둔다
      posts = posts.map((post) =>
        post.monitoringStatus === "REPORTED"
          ? {
              ...post,
              monitoringStatus: "PUBLISHED",
              monitoringStatusLabel: "게시중",
              reports: reportsBlock(
                (post.reports?.items ?? []).map((item) => ({
                  ...item,
                  status: "DISMISSED" as const,
                }))
              ),
            }
          : post
      );
    }
    store = posts;
    storeScenario = scenario;
  }
  return store;
}

const TAB_MEMBERS: Record<
  PostMonitoringTab,
  Array<AdminPostDetail["monitoringStatus"]>
> = {
  ALL: ["PUBLISHED", "REPORTED", "SUSPENDED", "UNDER_REVIEW", "CLOSED"],
  REPORTED: ["REPORTED"],
  SUSPENDED: ["SUSPENDED"],
  UNDER_REVIEW: ["UNDER_REVIEW"],
  CLOSED: ["CLOSED"],
};

const ACTION_ORDER: Record<string, number> = {
  UNDER_REVIEW: 0,
  REPORTED: 0,
  SUSPENDED: 1,
  PUBLISHED: 2,
  CLOSED: 3,
};

function listed(scenario: string, tab: string, sort: string, keyword: string) {
  const members =
    TAB_MEMBERS[
      (tab as PostMonitoringTab) in TAB_MEMBERS
        ? (tab as PostMonitoringTab)
        : "ALL"
    ];
  const word = keyword.trim();
  const rows = getStore(scenario).filter(
    (post) =>
      !HIDDEN_FROM_LIST.has(post.postId) &&
      members.includes(post.monitoringStatus) &&
      (!word ||
        (post.author?.showroomName ?? "").includes(word) ||
        (post.content ?? "").includes(word))
  );
  if (sort === "LATEST") {
    return [...rows].sort((a, b) =>
      (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")
    );
  }
  if (sort === "MOST_REPORTED") {
    return [...rows].sort((a, b) => reportColumn(b) - reportColumn(a));
  }
  return [...rows].sort(
    (a, b) =>
      (ACTION_ORDER[a.monitoringStatus] ?? 9) -
      (ACTION_ORDER[b.monitoringStatus] ?? 9)
  );
}

/** 목록 「신고」 열 — 대기 + 조치로 이어진 신고 */
function reportColumn(post: AdminPostDetail) {
  return (post.reports?.items ?? []).filter(
    (item) => item.status !== "DISMISSED"
  ).length;
}

function toListItem(post: AdminPostDetail): AdminPostListItem {
  const open = (post.suspensions ?? []).find((item) => item.open) ?? null;
  return {
    postId: post.postId,
    postNo: post.postNo,
    monitoringStatus: post.monitoringStatus,
    monitoringStatusLabel: post.monitoringStatusLabel,
    status: post.status,
    showroomId: post.author?.showroomId ?? null,
    showroomName: post.author?.showroomName ?? null,
    thumbnailUrl: post.images?.[0]?.imageUrl ?? null,
    contentPreview:
      (post.content ?? "").replace(/\s+/g, " ").trim().slice(0, 80) || null,
    imageCount: post.images?.length ?? 0,
    publishedAt: post.publishedAt,
    editedAt: post.editedAt,
    editedAfterFirstReport: false,
    reportCount: reportColumn(post),
    pendingReportCount: post.reports?.pendingCount ?? 0,
    appealDeadline:
      post.monitoringStatus === "SUSPENDED"
        ? (open?.appealDeadline ?? null)
        : null,
    reviewDueAt:
      post.monitoringStatus === "UNDER_REVIEW"
        ? (post.appeal?.reviewDueAt ?? null)
        : null,
    deletedAt: post.deletedAt,
    deleteReason: post.deleteReason,
    purgeAt: post.purgeAt,
  };
}

export function mockList(
  scenario: string,
  params: AdminPostListParams
): Promise<PageResponse<AdminPostListItem>> {
  const rows = listed(scenario, params.tab, params.sort, params.keyword ?? "");
  const size = Number(params.size) || 20;
  const page = Number(params.page) || 1;
  const content = rows.slice((page - 1) * size, page * size).map(toListItem);
  const totalPages = Math.max(1, Math.ceil(rows.length / size));
  return mockDelay({
    content,
    pageInfo: {
      currentPage: page,
      totalPages,
      totalResults: rows.length,
      limit: size,
      hasNext: page < totalPages,
    },
  });
}

export function mockSummary(scenario: string): Promise<AdminPostSummary> {
  const posts = getStore(scenario).filter(
    (post) => !HIDDEN_FROM_LIST.has(post.postId)
  );
  const count = (status: string) =>
    posts.filter((post) => post.monitoringStatus === status).length;
  const reported = count("REPORTED");
  const underReview = count("UNDER_REVIEW");
  return mockDelay({
    all: posts.length,
    reported,
    suspended: count("SUSPENDED"),
    underReview,
    closed: count("CLOSED"),
    actionRequired: reported + underReview,
  });
}

export function mockDetail(
  scenario: string,
  postId: number,
  nav: PostDetailNavParams
): Promise<AdminPostDetail> {
  const posts = getStore(scenario);
  const targetId = posts.some((post) => post.postId === postId)
    ? postId
    : (DETAIL_SCENARIO_POST[scenario] ?? 342);
  const post = posts.find(
    (item) => item.postId === targetId
  ) as AdminPostDetail;
  const order = listed(
    scenario,
    nav.tab ?? "ALL",
    nav.sort ?? "ACTION_FIRST",
    nav.keyword ?? ""
  ).map((item) => item.postId);
  const index = order.indexOf(post.postId);
  return mockDelay({
    ...post,
    navigation:
      index < 0
        ? { previousPostId: null, nextPostId: null }
        : {
            previousPostId: order[index - 1] ?? null,
            nextPostId: order[index + 1] ?? null,
          },
  });
}

// ------------------------------------------------------------------ 쓰기 — 저장소만 바꾼다

function update(
  scenario: string,
  postId: number,
  change: (post: AdminPostDetail) => AdminPostDetail
) {
  const posts = getStore(scenario);
  const index = posts.findIndex((post) => post.postId === postId);
  if (index >= 0) {
    posts[index] = change(posts[index]);
  }
  return posts[index];
}

function response(
  post: AdminPostDetail | undefined,
  closedReportCount: number | null = null
): Promise<AdminPostActionResponse> {
  return mockDelay({
    postId: post?.postId ?? 0,
    status: post?.status ?? "PUBLISHED",
    monitoringStatus: post?.monitoringStatus ?? "PUBLISHED",
    appealDeadline:
      (post?.suspensions ?? []).find((item) => item.open)?.appealDeadline ??
      null,
    closedReportCount,
  });
}

const NOW = () => dayjs().utc().format("YYYY-MM-DDTHH:mm:ss");

export function mockSuspend(
  scenario: string,
  postId: number,
  body: SuspendPostBody
) {
  const now = NOW();
  let closed = 0;
  const post = update(scenario, postId, (prev) => {
    const items = (prev.reports?.items ?? []).map((item) => {
      if (item.status !== "PENDING") return item;
      closed += 1;
      return {
        ...item,
        status: "ACCEPTED" as const,
        handledAt: now,
        handledByName: "김운영",
      };
    });
    const reason = MOCK_SUSPENSION_REASONS.find(
      (item) => item.code === body.reasonCode
    );
    const clause = MOCK_POLICY_CLAUSES.find(
      (item) => item.code === body.policyClause
    );
    const suspension: AdminPostSuspension = {
      suspensionId: Date.now(),
      open: true,
      reasonCode: body.reasonCode,
      reasonLabel: reason?.label ?? null,
      reasonDetail: body.reasonDetail ?? null,
      policyClauseCode: body.policyClause,
      policyRef: clause?.label ?? null,
      suspendedAt: now,
      suspendedBy: 3,
      suspendedByName: "김운영",
      appealDeadline: dayjs
        .utc(now)
        .add(POLICY.appealDeadlineDays, "day")
        .format("YYYY-MM-DDTHH:mm:ss"),
      deadlinePaused: false,
      resolution: null,
      resolvedAt: null,
      resolvedByName: null,
      notifiedAt: now,
      notificationDelivered: true,
    };
    return {
      ...prev,
      status: "SUSPENDED",
      monitoringStatus: "SUSPENDED",
      monitoringStatusLabel: "노출 중지",
      reports: reportsBlock(items),
      suspensions: [suspension, ...(prev.suspensions ?? [])],
      metrics: prev.metrics ? { ...prev.metrics, frozenAt: now } : null,
      timeline: sortTimeline([
        ...(prev.timeline ?? []),
        tl(
          "SUSPENDED",
          now,
          "ADMIN",
          "김운영",
          `노출 중지 · ${reason?.label ?? ""}`,
          "DANGER"
        ),
        tl("NOTIFIED", now, "SYSTEM", null, "작성자 알림 발송", "INFO"),
      ]),
    };
  });
  return response(post, closed);
}

export function mockCloseReports(scenario: string, postId: number) {
  const now = NOW();
  let closed = 0;
  const post = update(scenario, postId, (prev) => {
    const items = (prev.reports?.items ?? []).map((item) => {
      if (item.status !== "PENDING") return item;
      closed += 1;
      return {
        ...item,
        status: "DISMISSED" as const,
        handledAt: now,
        handledByName: "김운영",
      };
    });
    return {
      ...prev,
      monitoringStatus: "PUBLISHED",
      monitoringStatusLabel: "게시중",
      reports: reportsBlock(items),
      timeline: sortTimeline([
        ...(prev.timeline ?? []),
        tl(
          "REPORTS_CLOSED",
          now,
          "ADMIN",
          "김운영",
          `신고 종결 (${closed}건)`,
          "NEUTRAL"
        ),
      ]),
    };
  });
  return response(post, closed);
}

function republish(
  prev: AdminPostDetail,
  resolution: AdminPostSuspension["resolution"],
  label: string
) {
  const now = NOW();
  return {
    ...prev,
    status: "PUBLISHED" as const,
    monitoringStatus: "PUBLISHED" as const,
    monitoringStatusLabel: "게시중",
    metrics: prev.metrics ? { ...prev.metrics, frozenAt: null } : null,
    suspensions: (prev.suspensions ?? []).map((item) =>
      item.open
        ? {
            ...item,
            open: false,
            resolution,
            resolvedAt: now,
            resolvedByName: "김운영",
          }
        : item
    ),
    timeline: sortTimeline([
      ...(prev.timeline ?? []),
      tl("SUSPENSION_CANCELED", now, "ADMIN", "김운영", label, "SUCCESS"),
    ]),
  };
}

export function mockCancelSuspension(scenario: string, postId: number) {
  const post = update(scenario, postId, (prev) =>
    republish(prev, "CANCELED_BY_ADMIN", "조치 취소 · 재게시")
  );
  return response(post);
}

function postIdOfAppeal(scenario: string, appealId: number) {
  return (
    getStore(scenario).find((post) => post.appeal?.appealId === appealId)
      ?.postId ?? 0
  );
}

export function mockApproveAppeal(
  scenario: string,
  appealId: number,
  comment?: string
) {
  const now = NOW();
  const post = update(scenario, postIdOfAppeal(scenario, appealId), (prev) => ({
    ...republish(prev, "REPUBLISHED", "이의 신청 승인 · 재게시"),
    appeal: prev.appeal
      ? {
          ...prev.appeal,
          status: "APPROVED" as const,
          reviewedAt: now,
          reviewedByName: "김운영",
          reviewComment: comment ?? null,
        }
      : null,
  }));
  return response(post);
}

export function mockRejectAppeal(
  scenario: string,
  appealId: number,
  comment: string
) {
  const now = NOW();
  const graceUntil = dayjs
    .utc(now)
    .add(POLICY.downloadGraceDays, "day")
    .format("YYYY-MM-DDTHH:mm:ss");
  const purgeAt = plusMonths(now, POLICY.retentionMonths);
  const post = update(scenario, postIdOfAppeal(scenario, appealId), (prev) => {
    const open = (prev.suspensions ?? []).find((item) => item.open);
    return {
      ...prev,
      status: "DELETED",
      monitoringStatus: "CLOSED",
      monitoringStatusLabel: "영구 삭제",
      deletedAt: now,
      deleteReason: "APPEAL_REJECTED",
      purgeAt,
      metrics: prev.metrics ? { ...prev.metrics, frozenAt: now } : null,
      suspensions: (prev.suspensions ?? []).map((item) =>
        item.open
          ? {
              ...item,
              open: false,
              resolution: "DELETED_BY_REJECT" as const,
              resolvedAt: now,
            }
          : item
      ),
      appeal: prev.appeal
        ? {
            ...prev.appeal,
            status: "REJECTED" as const,
            reviewedAt: now,
            reviewedByName: "김운영",
            reviewComment: comment,
            graceUntil,
          }
        : null,
      deletion: {
        type: "APPEAL_REJECTED",
        deletedAt: now,
        deletedByName: "김운영",
        deletedBySelf: false,
        originSuspensionId: open?.suspensionId ?? null,
        rejectReason: comment,
        graceFrom: now,
        graceUntil,
        originalDownloads: [],
        daysAfterSuspension: null,
        appealDeadlineAtDeletion: null,
        purgeAt,
      },
      timeline: sortTimeline([
        ...(prev.timeline ?? []),
        tl(
          "APPEAL_REJECTED",
          now,
          "ADMIN",
          "김운영",
          "이의 신청 반려",
          "DANGER"
        ),
        tl(
          "DELETED",
          now,
          "ADMIN",
          "김운영",
          "영구 삭제 · 비공개 보관 전환",
          "NEUTRAL"
        ),
      ]),
    };
  });
  return response(post);
}

export function mockFlagImage(
  scenario: string,
  postId: number,
  imageId: number,
  flagged: boolean
) {
  const now = NOW();
  update(scenario, postId, (prev) => ({
    ...prev,
    images: (prev.images ?? []).map((image) =>
      image.imageId === imageId
        ? {
            ...image,
            reportFlagged: flagged,
            reportFlaggedAt: flagged ? (image.reportFlaggedAt ?? now) : null,
            reportFlaggedByName: flagged
              ? (image.reportFlaggedByName ?? "김운영")
              : null,
          }
        : image
    ),
  }));
  return mockDelay(undefined, 150);
}
