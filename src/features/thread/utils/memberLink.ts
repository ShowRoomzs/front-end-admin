import {
  BRAND_MEMBER_DETAIL_PATH,
  INFLUENCER_MEMBER_DETAIL_PATH,
} from "@/features/thread/constants/params";
import type { ChannelInfo } from "@/features/thread/types";

/** 운영팀 채널의 회원 상세 경로 — 이슈 · 쌍 스레드이거나 회원 id가 없으면 null */
export function memberDetailPath(info: ChannelInfo): string | null {
  if (info.memberId === null) {
    return null;
  }
  if (info.tab === "BRAND") {
    return `${BRAND_MEMBER_DETAIL_PATH}/${info.memberId}`;
  }
  if (info.tab === "INFLUENCER") {
    return `${INFLUENCER_MEMBER_DETAIL_PATH}/${info.memberId}`;
  }
  return null;
}
