import { ModalShell } from "@/common/components/ModalShell/ModalShell";
import Pagination from "@/common/components/Pagination/Pagination";
import type { PaginationProps } from "@/common/components/Pagination/Pagination";
import { MemberCard } from "@/features/memberShared/components/parts";
import {
  BTN_SECONDARY,
  HMORE_CLASS,
} from "@/features/memberShared/constants/styles";
import type { MemberHistoryEntry } from "@/features/memberShared/types";
import {
  eventDateTime,
  toneDotClass,
} from "@/features/memberShared/utils/format";

/** 시안 `.hitem` — 점(톤) + 처리 내용 + 「시각 · 처리자 (사유)」 */
function HistoryItems(props: { entries: Array<MemberHistoryEntry> }) {
  const { entries } = props;

  if (entries.length === 0) {
    return (
      <p className="py-2 text-[12px] text-sz-n-500">처리 이력이 없습니다.</p>
    );
  }

  return (
    <>
      {entries.map((entry) => (
        <div key={entry.key} className="flex gap-2.5 py-[9px]">
          <span
            className={`mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full ${toneDotClass(entry.tone)}`}
          />
          <div className="min-w-0">
            <div className="text-[12px] text-sz-n-900">{entry.label}</div>
            <div className="text-[11px] text-sz-n-500">
              {[eventDateTime(entry.occurredAt), entry.actorText]
                .filter(Boolean)
                .join(" · ")}
              {entry.detail && ` (${entry.detail})`}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

interface HistoryCardProps {
  /** 레일에 보이는 최신 N건(서버가 정한다 — 3건 · 탈퇴 심사 중 2건) */
  entries: Array<MemberHistoryEntry>;
  total: number;
  /** 탈퇴 회원 — 이력은 파기 대상이 아님을 머리에 적는다 */
  withdrawn: boolean;
  onShowAll: () => void;
}

/**
 * 레일 맨 아래 「처리 이력」 — 지금 내리는 조치의 근거라 정지 버튼과 같은 열에서 읽힌다.
 * 레일이 화면 밖으로 잘리지 않게 최신 몇 건만 두고 나머지는 「전체 N건 보기」로 연다.
 */
export function HistoryCard(props: HistoryCardProps) {
  const { entries, total, withdrawn, onShowAll } = props;

  return (
    <MemberCard
      title="처리 이력"
      note={
        withdrawn
          ? `최신순 · 전체 ${total}건 · 파기 대상 아님`
          : `최신순 · 전체 ${total}건 · 처리자·시각·사유`
      }
    >
      <div className="-my-2">
        <HistoryItems entries={entries} />
        {total > entries.length && (
          <button type="button" className={HMORE_CLASS} onClick={onShowAll}>
            전체 {total}건 보기
          </button>
        )}
      </div>
    </MemberCard>
  );
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: Array<MemberHistoryEntry>;
  isLoading: boolean;
  pageInfo: PaginationProps;
}

/** 「전체 N건 보기」 — 처리 이력 전부(최신순 · 페이지) */
export function HistoryModal(props: HistoryModalProps) {
  const { isOpen, onClose, entries, isLoading, pageInfo } = props;

  return (
    <ModalShell
      isOpen={isOpen}
      title="처리 이력"
      width={520}
      onClose={onClose}
      footer={
        <button type="button" className={BTN_SECONDARY} onClick={onClose}>
          닫기
        </button>
      }
    >
      {isLoading && entries.length === 0 ? (
        <p className="py-2 text-[12px] text-sz-n-500">불러오는 중…</p>
      ) : (
        <HistoryItems entries={entries} />
      )}
      {pageInfo.totalPages > 1 && (
        <div className="mt-3 flex justify-center border-t border-sz-n-100 pt-3">
          <Pagination {...pageInfo} />
        </div>
      )}
    </ModalShell>
  );
}
