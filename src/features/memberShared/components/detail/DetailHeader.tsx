import RecordNav from "@/common/components/RecordNav/RecordNav";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { BTN_SECONDARY } from "@/features/memberShared/constants/styles";
import { toneVariant } from "@/features/memberShared/utils/format";

interface DetailHeaderProps {
  title: string;
  /** 회원번호(BRD-1042 · INF-3018) */
  memberNo: string;
  /** 제목 옆 상태 배지 — 활성이면 없다 */
  badge?: { tone: string; text: string } | null;
  onList: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

/** 시안 `.page-h` — 제목 · 회원번호 + 「목록 · ‹ 이전 · 다음 ›」(회원번호 순 인접 회원) */
export function DetailHeader(props: DetailHeaderProps) {
  const { title, memberNo, badge, onList, onPrev, onNext } = props;

  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2.5 text-[20px] font-semibold text-sz-n-900">
          <span className="truncate">{title}</span>
          {badge && (
            <StatusBadge variant={toneVariant(badge.tone)}>
              {badge.text}
            </StatusBadge>
          )}
        </h1>
        <p className="mt-0.5 whitespace-nowrap text-[12px] tabular-nums text-sz-n-600">
          {memberNo}
        </p>
      </div>
      <RecordNav onList={onList} onPrev={onPrev} onNext={onNext} />
    </div>
  );
}

/** 상세를 불러오는 중 */
export function DetailLoading() {
  return (
    <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center text-[12px] text-sz-n-500">
      불러오는 중…
    </div>
  );
}

/** 상세를 불러오지 못함 — 없는 회원이거나 서버가 아직 이 API를 내리지 않았다 */
export function DetailError(props: { title: string; onList: () => void }) {
  const { title, onList } = props;

  return (
    <div className="flex flex-col items-center gap-3 rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center">
      <div className="text-[13px] font-semibold text-sz-n-700">{title}</div>
      <div className="text-[12px] text-sz-n-500">
        없는 회원이거나 불러오지 못했습니다.
      </div>
      <button type="button" className={BTN_SECONDARY} onClick={onList}>
        목록
      </button>
    </div>
  );
}
