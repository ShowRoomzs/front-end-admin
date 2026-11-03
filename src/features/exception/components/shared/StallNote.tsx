import { STALL_CHOICE_NOTE } from "@/features/exception/constants/labels";
import type { ExceptionStallChoice } from "@/features/exception/types";

/** 시안 `.t-note` — 경과 열 아래 보조 줄 */
const NOTE = "mt-[3px] block text-[11px] font-medium";

/** 추적 정지 보조줄 — 「선택 개방까지 N일」(시안 A2). N은 서버 `stallChoice.daysUntilOpen` */
export default function StallNote(props: { choice: ExceptionStallChoice }) {
  const { choice } = props;
  if (choice.state === "CHOSEN") {
    return (
      <span className={NOTE}>
        {STALL_CHOICE_NOTE.chosen(choice.choiceLabel)}
      </span>
    );
  }
  if (choice.state === "OPEN") {
    return <span className={NOTE}>{STALL_CHOICE_NOTE.open}</span>;
  }
  return (
    <span className={NOTE}>
      {STALL_CHOICE_NOTE.waiting(choice.daysUntilOpen)}
    </span>
  );
}
