import {
  NOTE_CLASS,
  NOTICE_DANGER_CLASS,
  NOTICE_INFO_CLASS,
  NOTICE_WARN_CLASS,
} from "@/common/constants/dsStyle";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type NoticeTone = "info" | "warn" | "danger" | "neutral" | "consent";

/*
  세 앱 합의(11-21). 상태색은 v1.3 `.notice`, 중립은 v1.3 `.sec-note`를 따른다.
  `consent`(고지 · 확인 체크가 들어가는 자리)도 중립과 같은 모양이고, 글자만 한 단계 진하게 둔다.
*/
const TONE_CLASS: Record<NoticeTone, string> = {
  info: NOTICE_INFO_CLASS,
  warn: NOTICE_WARN_CLASS,
  danger: NOTICE_DANGER_CLASS,
  neutral: NOTE_CLASS,
  consent: `${NOTE_CLASS} text-sz-n-700`,
};

/**
 * 시안 `.notice` — 카드 안에 들어가는 안내 배너.
 *
 * 상태색 4원칙을 그대로 쓴다. 검토 중은 정보, 반려는 경고, 삭제 집행·거절은 위험,
 * 만료·취소 같은 중립 종결은 무채색이다. `consent`만 색이 아니라 **동의를 받는 자리**다.
 *
 * 원래 상품 문의 전용이었으나 계약 관리가 같은 배너를 쓰면서 공용으로 올렸다.
 */
export default function Notice(props: {
  tone: NoticeTone;
  children: ReactNode;
  className?: string;
}) {
  const { tone, children, className } = props;

  return (
    <div className={cn(TONE_CLASS[tone], className)}>
      {children}
    </div>
  );
}
