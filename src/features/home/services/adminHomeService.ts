import { apiInstance } from "@/common/lib/apiInstance";
import type { AdminBadges, AdminHome } from "@/features/home/types";

/*
  어드민 홈 API — 백엔드 `AdminHomeController`(origin/main · 1017 설계서 6절)와 1:1.
  두 엔드포인트 모두 개발 서버에 배포돼 있어 DEV에서도 실호출만 한다(58 반영 · DEV 목업 삭제).
*/
export const adminHomeService = {
  /** GET /v1/admin/home — 홈 한 화면(연동 · 할 일 · 오늘 일정 · 오늘 지표) */
  getHome: async () => {
    const { data } = await apiInstance.get<AdminHome>("/admin/home", {
      // 화면이 실패 상태를 직접 그린다 — 5분 폴링마다 토스트가 쌓이지 않게
      suppressErrorToast: true,
    });
    return data;
  },

  /** GET /v1/admin/badges — 사이드바 배지(홈 할 일과 같은 큐 계산) */
  getBadges: async () => {
    const { data } = await apiInstance.get<AdminBadges>("/admin/badges", {
      // 셸이 폴링하는 배경 요청이다 — 실패해도 운영자가 할 일이 없다
      suppressErrorToast: true,
    });
    return data;
  },
};
