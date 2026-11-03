/*
  DEV 전용 목업 — 브랜드 상세(15) 「최근 문의」(파트너센터 1:1 문의) 한 가지만 남았다.

  서버에 아직 정말 없다: 브랜드 상세 응답에 최근 문의가 없고, 1:1 문의 목록(`GET /v1/admin/inquiries`)도
  브랜드(마켓)로 거르는 파라미터가 없다(`userId`뿐 · 55 A-5 · 58 계획에도 없음). 그래서 DEV에서만 시안 값을 보이고
  배포본은 「준비 중」이다. 나머지 `/v1/admin/brands/**`는 개발 서버에 배포돼 목업을 지웠다(58 반영).
  시각은 서버처럼 UTC 순간(`…Z`)으로 둔다.
*/
import type { BrandRecentInquiry } from "@/features/brandMember/types";
import dayjs from "dayjs";

/** 시안의 KST 시각 → 서버 형식(UTC 순간 `…Z`) */
function at(kst: string): string {
  return dayjs(kst).subtract(9, "hour").format("YYYY-MM-DDTHH:mm:ss[Z]");
}

export function mockBrandRecentInquiries(): {
  items: Array<BrandRecentInquiry>;
  total: number;
} {
  return {
    total: 3,
    items: [
      {
        inquiryNumber: "PIQ-20260812-014",
        typeLabel: "정산",
        title: "8월 정산 지급일이 언제인가요?",
        statusLabel: "답변 완료",
        tone: "SUCCESS",
        createdAt: at("2026-08-12 10:00"),
      },
      {
        inquiryNumber: "PIQ-20260805-007",
        typeLabel: "상품",
        title: "상품 대표 이미지 교체 방법",
        statusLabel: "답변 완료",
        tone: "SUCCESS",
        createdAt: at("2026-08-05 15:30"),
      },
    ],
  };
}
