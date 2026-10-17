import { BTN_SECONDARY_SM } from "@/features/exception/components/shared/styles";

/**
 * 관리 열의 [열기] — 이 화면의 유일한 행 버튼이다. 실행 버튼은 없다: 대행은 근거를 읽고 눌러야 해서
 * 주문 상세에서 한다. 클릭은 행 클릭으로 올라가 같은 곳(주문 · 반품·교환 화면)으로 간다.
 */
export default function OpenButton() {
  return (
    <button type="button" className={BTN_SECONDARY_SM}>
      열기
    </button>
  );
}
