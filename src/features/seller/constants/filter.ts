import type { FilterOptionGroup } from "@/common/components/FilterCard/FilterCard";
import type { SellerUserListParams } from "@/features/seller/services/sellerService";

// 입점 신청 목록은 FilterCard 대신 ApplicationTabFilter(탭 + 브랜드명 검색)를 쓴다.
// 기간·검색타입 필터는 API에서 제거되어 대응 상수도 함께 삭제했다.

export const SELLER_USER_FILTER_OPTIONS: FilterOptionGroup<SellerUserListParams> =
  {
    카테고리: [
      {
        key: "mainCategory",
        type: "select",
        placeholder: "대표 카테고리",
        // option은 SellerUserManagement에서 동적으로 처리
      },
    ],
    검색: [
      {
        key: "marketName",
        type: "input",
        placeholder: "마켓명을 입력해 주세요.",
      },
    ],
  };
