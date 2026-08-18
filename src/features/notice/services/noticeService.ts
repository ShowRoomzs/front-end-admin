import { apiInstance } from "@/common/lib/apiInstance";
import type {
  NoticeDetail,
  NoticeFormRequest,
  NoticeListParams,
  NoticeListResponse,
  RawNoticeListResponse,
} from "@/features/notice/types/notice";

const BASE_PATH = "/admin/notices";

export const noticeService = {
  // 서버가 탭 건수를 배열로 주므로 경계에서 맵으로 바꿔 넘긴다(탭마다 find를 돌지 않도록)
  getNoticeList: async (
    params: NoticeListParams
  ): Promise<NoticeListResponse> => {
    const { data: response } = await apiInstance.get<RawNoticeListResponse>(
      BASE_PATH,
      { params }
    );
    return {
      ...response,
      statusCounts: Object.fromEntries(
        (response.statusCounts ?? []).map((item) => [item.status, item.count])
      ),
    };
  },
  getNoticeDetail: async (noticeId: number) => {
    const { data: response } = await apiInstance.get<NoticeDetail>(
      `${BASE_PATH}/${noticeId}`
    );
    return response;
  },
  createNotice: async (data: NoticeFormRequest) => {
    const response = await apiInstance.post(BASE_PATH, data);
    return response.data;
  },
  updateNotice: async (noticeId: number, data: NoticeFormRequest) => {
    const response = await apiInstance.put(`${BASE_PATH}/${noticeId}`, data);
    return response.data;
  },
  /** 게시 종료 — 삭제가 아니라 노출 중단이라 되돌릴 수 있다 */
  endNotice: async (noticeId: number) => {
    const response = await apiInstance.patch(`${BASE_PATH}/${noticeId}/end`);
    return response.data;
  },
  /** 재게시 — 등록일·수정일은 갱신되지 않는다(오래된 공지가 최상단으로 튀지 않게) */
  publishNotice: async (noticeId: number) => {
    const response = await apiInstance.patch(
      `${BASE_PATH}/${noticeId}/publish`
    );
    return response.data;
  },
};
