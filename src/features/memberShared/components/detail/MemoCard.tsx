import { ModalShell } from "@/common/components/ModalShell/ModalShell";
import { MemberCard } from "@/features/memberShared/components/parts";
import { MEMO_MAX_LENGTH } from "@/features/memberShared/constants/params";
import {
  BTN_CARD_HEAD,
  BTN_DANGER,
  BTN_PRIMARY,
  BTN_SECONDARY,
  HMORE_CLASS,
} from "@/features/memberShared/constants/styles";
import type { MemberMemo } from "@/features/memberShared/types";
import { eventDateTime } from "@/features/memberShared/utils/format";
import { useState } from "react";
import type { ReactNode } from "react";

const MEMO_TEXTAREA_CLASS =
  "min-h-14 w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-2 text-[12px] leading-[1.6] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** 입력칸 + 「0 / 300자」 + 버튼 줄(`.memo` · `.memo-f`) */
function MemoEditor(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  actions: ReactNode;
}) {
  const { value, onChange, placeholder, actions } = props;

  return (
    <>
      <textarea
        className={MEMO_TEXTAREA_CLASS}
        value={value}
        maxLength={MEMO_MAX_LENGTH}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] tabular-nums text-sz-n-500">
          {value.length} / {MEMO_MAX_LENGTH}자
        </span>
        <span className="flex gap-2">{actions}</span>
      </div>
    </>
  );
}

interface MemoCardProps {
  /** 「브랜드」 · 「인플루언서」 — 머리 「… 비노출」 */
  audience: string;
  /** 머리 [메모 기입] 아래 고지(`.memo-help`) */
  help: ReactNode;
  /** 지금 보이는 메모(기본은 최신 1건, 펼치면 전체) */
  items: Array<MemberMemo>;
  total: number;
  showingAll: boolean;
  onToggleAll: () => void;
  /** 탈퇴 계정 — 조회 전용 */
  readOnly: boolean;
  isSaving: boolean;
  onCreate: (content: string) => Promise<unknown>;
  onUpdate: (memoId: number, content: string) => Promise<unknown>;
  onDelete: (memoId: number) => Promise<unknown>;
}

/**
 * 관리자 메모 — 조치하지 않은 판단의 기록 · 누적 기입 · 항목당 300자 · 작성자 본인 24시간 내 수정·삭제.
 * 300자 본문을 쓰고 읽는 카드라 레일이 아니라 좌측 맨 아래에 둔다(시안 15 · 18).
 */
export function MemoCard(props: MemoCardProps) {
  const {
    audience,
    help,
    items,
    total,
    showingAll,
    onToggleAll,
    readOnly,
    isSaving,
    onCreate,
    onUpdate,
    onDelete,
  } = props;
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<{ memoId: number; text: string }>();
  const [deleting, setDeleting] = useState<MemberMemo>();

  const note = readOnly
    ? `최신 ${items.length}건 · 전체 ${total}건 · 조회 전용`
    : showingAll
      ? `전체 ${total}건 · ${audience} 비노출`
      : `최신 ${items.length}건 · 전체 ${total}건 · ${audience} 비노출`;

  /*
    실패하면 입력을 그대로 둔다(24시간 경과 · 작성자 아님 등 서버 문구는 공용 토스트가 띄운다) —
    다시 시도하거나 내용을 옮겨 적을 수 있게.
  */
  const submitDraft = async () => {
    try {
      await onCreate(draft.trim());
      setDraft("");
      setComposing(false);
    } catch {
      // 입력 유지
    }
  };

  const submitEdit = async () => {
    if (!editing) return;
    try {
      await onUpdate(editing.memoId, editing.text.trim());
      setEditing(undefined);
    } catch {
      // 입력 유지
    }
  };

  const submitDelete = async () => {
    if (!deleting) return;
    try {
      await onDelete(deleting.memoId);
    } catch {
      // 공용 토스트가 이유를 띄운다
    }
    setDeleting(undefined);
  };

  return (
    <MemberCard
      title="관리자 메모"
      note={note}
      actions={
        !readOnly && (
          <button
            type="button"
            className={BTN_CARD_HEAD}
            onClick={() => setComposing((value) => !value)}
          >
            메모 기입
          </button>
        )
      }
    >
      {composing && (
        <div className="mb-3">
          <div className="mb-2 rounded-[6px] bg-sz-n-50 px-[9px] py-[7px] text-[11px] leading-[1.6] text-sz-n-600">
            {help}
          </div>
          <MemoEditor
            value={draft}
            onChange={setDraft}
            placeholder="조치까지 가지 않았지만 남겨 둘 판단을 적습니다."
            actions={
              <button
                type="button"
                className={BTN_SECONDARY}
                disabled={draft.trim().length === 0 || isSaving}
                onClick={submitDraft}
              >
                기입
              </button>
            }
          />
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-[12px] text-sz-n-500">기록된 메모가 없습니다.</p>
      ) : (
        // 시안 `.memo-l` — 기입 칸과 목록을 선으로 가른다(조회 전용이면 선 없이)
        <div className={readOnly ? "" : "border-t border-sz-n-200 pt-3"}>
          {items.map((memo) => (
            <div
              key={memo.memoId}
              className="border-b border-sz-n-100 py-2.5 first:pt-0 last:border-b-0 last:pb-0"
            >
              <div className="flex items-baseline gap-1.5 text-[11px] text-sz-n-500">
                <span className="font-semibold text-sz-n-700">
                  {memo.authorName}
                </span>
                <span className="tabular-nums">
                  {eventDateTime(memo.createdAt)}
                </span>
                {memo.modifiedAt && <span>수정됨</span>}
              </div>
              {editing?.memoId === memo.memoId ? (
                <div className="mt-1.5">
                  <MemoEditor
                    value={editing.text}
                    onChange={(text) =>
                      setEditing({ memoId: memo.memoId, text })
                    }
                    actions={
                      <>
                        <button
                          type="button"
                          className={BTN_SECONDARY}
                          onClick={() => setEditing(undefined)}
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          className={BTN_PRIMARY}
                          disabled={
                            editing.text.trim().length === 0 || isSaving
                          }
                          onClick={submitEdit}
                        >
                          저장
                        </button>
                      </>
                    }
                  />
                </div>
              ) : (
                <div className="mt-[3px] whitespace-pre-wrap text-[12px] leading-[1.7] text-sz-n-900">
                  {memo.content}
                </div>
              )}
              {readOnly ? (
                <div className="mt-[5px] text-[11px] text-sz-n-400">
                  탈퇴 계정 · 조회 전용
                </div>
              ) : memo.editable ? (
                editing?.memoId !== memo.memoId && (
                  <div className="mt-[5px] flex gap-2">
                    <button
                      type="button"
                      className="text-[11px] text-sz-n-600 hover:text-sz-n-900 hover:underline"
                      onClick={() =>
                        setEditing({ memoId: memo.memoId, text: memo.content })
                      }
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className="text-[11px] text-sz-n-600 hover:text-sz-n-900 hover:underline"
                      onClick={() => setDeleting(memo)}
                    >
                      삭제
                    </button>
                  </div>
                )
              ) : (
                <div className="mt-[5px] text-[11px] text-sz-n-400">
                  작성자 본인만 24시간 내 수정·삭제
                </div>
              )}
            </div>
          ))}
          {total > 1 && (
            <button type="button" className={HMORE_CLASS} onClick={onToggleAll}>
              {showingAll ? "최신 1건만 보기" : `전체 ${total}건 보기`}
            </button>
          )}
        </div>
      )}

      <ModalShell
        isOpen={!!deleting}
        title="메모 삭제"
        width={400}
        onClose={() => setDeleting(undefined)}
        footer={
          <>
            <button
              type="button"
              className={BTN_SECONDARY}
              onClick={() => setDeleting(undefined)}
            >
              취소
            </button>
            <button
              type="button"
              className={BTN_DANGER}
              disabled={isSaving}
              onClick={submitDelete}
            >
              삭제
            </button>
          </>
        }
      >
        <p className="text-[12px] leading-[1.7] text-sz-n-700">
          이 메모를 삭제합니다. 처리 이력에는 「관리자 메모 삭제」가 남습니다.
        </p>
      </ModalShell>
    </MemberCard>
  );
}
