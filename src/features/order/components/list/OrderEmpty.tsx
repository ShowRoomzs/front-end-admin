import OrderBtn from "@/features/order/components/shared/OrderBtn";
import { ORDER_SEARCH_TYPES } from "@/features/order/constants/params";
import type { OrderListParams } from "@/features/order/types";
import type { ReactNode } from "react";

interface OrderEmptyProps {
  params: OrderListParams;
  /** 상세 조건 칩이 하나라도 걸려 있다 */
  hasChips: boolean;
  /** 조회기간이 이미 전체 기간이다 — 「전체 기간에서 다시 찾기」가 의미 없다 */
  isAllPeriod: boolean;
  onResetAll: () => void;
  onSearchAllPeriod: () => void;
}

/**
 * 시안 A4·A5 — DS §8 빈 상태 규격(아이콘 28px + `.empty-t` 13px/600 + `.empty-d`, 패딩 72px).
 * 원인이 다르면 다음 행동도 다르다: 칩이 걸렸으면 칩을 지우라고, 검색어가 있으면 조회기간을 넓히자고 한다.
 * 검색어는 지우지 않는다.
 */
export default function OrderEmpty(props: OrderEmptyProps) {
  const { params, hasChips, isAllPeriod, onResetAll, onSearchAllPeriod } =
    props;
  const keyword = params.keyword.trim();
  const searchLabel =
    ORDER_SEARCH_TYPES.find((type) => type.value === params.searchType)
      ?.label ?? "주문번호";

  let title: ReactNode = "조건에 맞는 주문이 없습니다";
  let description: ReactNode = (
    <>조회기간 · 상태 조건을 바꾸거나 조회 조건을 초기화해 보세요.</>
  );
  let actions = (
    <OrderBtn variant="secondary" onClick={onResetAll}>
      조회 조건 초기화
    </OrderBtn>
  );

  if (hasChips) {
    // A4 — 브랜드 상세에서 넘어온 조건이 상세 조건 안에 있어도 칩으로 항상 보인다
    title = "적용된 조건에 맞는 주문이 없습니다";
    description = (
      <>
        위 <b>적용됨</b> 칩을 지우면 조회 범위가 넓어집니다.
      </>
    );
  } else if (keyword) {
    // A5 — 주문번호는 맞는데 결과가 없으면 조회기간이 좁은 경우가 대부분이다
    title =
      params.searchType === "ORDER_NO" ? (
        <>
          조회기간 안에 <span className="tabular-nums">{keyword}</span> 주문이
          없습니다
        </>
      ) : (
        <>
          조회기간 안에 {searchLabel}{" "}
          <span className="tabular-nums">{keyword}</span> 검색 결과가 없습니다
        </>
      );
    description = (
      <>
        {searchLabel}는 정확한데 결과가 없으면 조회기간이 좁은 경우가
        대부분입니다.
      </>
    );
    actions = (
      <div className="flex justify-center gap-2">
        {!isAllPeriod && (
          <OrderBtn variant="primary" onClick={onSearchAllPeriod}>
            전체 기간에서 다시 찾기
          </OrderBtn>
        )}
        <OrderBtn variant="secondary" onClick={onResetAll}>
          조회 조건 초기화
        </OrderBtn>
      </div>
    );
  }

  return (
    <div className="px-6 py-[72px] text-center">
      <div
        className="mb-2.5 text-[28px] leading-[1.6] text-sz-n-300"
        aria-hidden
      >
        ◎
      </div>
      <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
        {title}
      </div>
      <div className="text-[12px] text-sz-n-500">{description}</div>
      <div className="mt-4 flex justify-center">{actions}</div>
    </div>
  );
}
