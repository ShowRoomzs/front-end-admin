import DetailCard from "@/common/components/DetailCard/DetailCard";
import { formatDateTimeShort } from "@/common/utils/formatDate";
import { MEMO_MAX_LENGTH } from "@/features/consumer/constants/detail";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  MEMO_TEXTAREA_CLASS,
} from "@/features/consumer/constants/styles";
import type { ConsumerMemo } from "@/features/consumer/types/consumerDetail";
import { memoLockText } from "@/features/consumer/utils/detailView";
import { useState } from "react";

interface MemoCardProps {
  memos: Array<ConsumerMemo>;
  total: number;
  withdrawn: boolean;
  isSaving: boolean;
  onCreate: (content: string) => Promise<unknown>;
  onUpdate: (memoId: number, content: string) => Promise<unknown>;
  onRequestDelete: (memo: ConsumerMemo) => void;
}

const MEMO_B =
  "cursor-pointer text-[11px] text-sz-n-600 hover:text-sz-n-900 hover:underline";

/**
 * 관리자 메모(A1 · A5 · A6 · C1) — **조치하지 않은 판단의 기록**이다. 덮어쓰기가 아니라 누적 기입이고
 * 항목마다 작성자 · 일시가 붙는다(최신순). 항목당 300자, 수정 · 삭제는 작성자 본인 · 24시간 내(서버 `editable`).
 * 열람청구 고지는 입력란 위에 상시 둔다. 탈퇴 계정은 조회 전용(입력란 없음).
 */
export default function MemoCard(props: MemoCardProps) {
  const {
    memos,
    total,
    withdrawn,
    isSaving,
    onCreate,
    onUpdate,
    onRequestDelete,
  } = props;
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  // 24시간 경과 문구를 고르는 기준 시각 — 렌더 중에 시계를 읽지 않으려고 처음 그릴 때 한 번 잡는다
  const [now] = useState(() => Date.now());
  // editable은 작성자 본인일 때만 참 — 그 작성자를 「나」로 본다(memoLockText 설명)
  const myName = memos.find((memo) => memo.editable)?.authorName ?? null;

  const editing = editingId !== null;
  const trimmed = draft.trim();

  const handleCreate = async () => {
    if (!trimmed || isSaving) return;
    try {
      await onCreate(trimmed);
      setDraft("");
    } catch {
      // 실패 사유는 인터셉터 토스트 — 입력은 그대로 둔다
    }
  };

  const handleSave = async () => {
    const content = editDraft.trim();
    if (editingId === null || !content || isSaving) return;
    try {
      await onUpdate(editingId, content);
      setEditingId(null);
    } catch {
      // 실패해도 편집 상태를 유지한다
    }
  };

  const note = `${total.toLocaleString()}건 · ${editing ? "수정 중" : "조치하지 않은 판단의 기록"}`;

  return (
    <DetailCard title="관리자 메모" note={note}>
      <div className="pt-3">
        {/* 새 입력란은 수정 중에 감춘다 — 기입과 수정을 동시에 하지 않게(A6) */}
        {!withdrawn && !editing && (
          <>
            <div className="mb-2 rounded-[6px] bg-sz-n-50 px-[9px] py-[7px] text-[11px] leading-[1.6] text-sz-n-600">
              이 메모는{" "}
              <b className="font-semibold">소비자에게 노출되지 않지만</b>,
              개인정보 <b className="font-semibold">열람청구 시 제공 대상</b>이
              될 수 있습니다. 조치 판단의 근거만 사실 위주로 적어 주세요.
            </div>
            <textarea
              aria-label="관리자 메모"
              className={MEMO_TEXTAREA_CLASS}
              placeholder="조치까지 가지 않았지만 남겨 둘 판단을 적습니다."
              maxLength={MEMO_MAX_LENGTH}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] tabular-nums text-sz-n-500">
                {draft.length} / {MEMO_MAX_LENGTH}자
              </span>
              <button
                type="button"
                className={BTN_SECONDARY}
                disabled={!trimmed || isSaving}
                onClick={handleCreate}
              >
                기입
              </button>
            </div>
          </>
        )}

        <div
          className={
            !withdrawn && !editing
              ? "mt-3 border-t border-sz-n-200 pt-1"
              : undefined
          }
        >
          {memos.length === 0 ? (
            <div className="pb-1.5 pt-4 text-center text-[12px] leading-[1.7] text-sz-n-500">
              기입된 메모가 없습니다.
              <br />
              조치까지 가지 않은 판단을 남기면 다음 담당자가 같은 검토를
              반복하지 않습니다.
            </div>
          ) : (
            memos.map((memo) => (
              <div
                key={memo.memoId}
                className="border-b border-sz-n-100 py-2.5 last:border-b-0 last:pb-0"
              >
                <div className="flex items-baseline gap-1.5 text-[11px] text-sz-n-500">
                  <span className="font-semibold text-sz-n-700">
                    {memo.authorName}
                  </span>
                  <span className="tabular-nums">
                    {formatDateTimeShort(memo.createdAt)}
                  </span>
                  {memo.modifiedAt && <span>· 수정됨</span>}
                </div>

                {editingId === memo.memoId ? (
                  <div className="my-1 rounded-[6px] border border-sz-accent-500 bg-sz-accent-50 p-[9px]">
                    <textarea
                      aria-label="메모 수정"
                      className={`${MEMO_TEXTAREA_CLASS} min-h-[70px]`}
                      maxLength={MEMO_MAX_LENGTH}
                      value={editDraft}
                      onChange={(event) => setEditDraft(event.target.value)}
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] tabular-nums text-sz-n-500">
                        {editDraft.length} / {MEMO_MAX_LENGTH}자
                      </span>
                      <span className="flex gap-2">
                        <button
                          type="button"
                          className={BTN_SECONDARY}
                          onClick={() => setEditingId(null)}
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          className={BTN_PRIMARY}
                          disabled={!editDraft.trim() || isSaving}
                          onClick={handleSave}
                        >
                          저장
                        </button>
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-[3px] whitespace-pre-wrap break-keep text-[12px] leading-[1.7] text-sz-n-900">
                      {memo.content}
                    </div>
                    {memo.editable && !withdrawn ? (
                      !editing && (
                        <div className="mt-[5px] flex gap-2">
                          <button
                            type="button"
                            className={MEMO_B}
                            onClick={() => {
                              setEditingId(memo.memoId);
                              setEditDraft(memo.content);
                            }}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className={MEMO_B}
                            onClick={() => onRequestDelete(memo)}
                          >
                            삭제
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="mt-[5px] text-[11px] text-sz-n-400">
                        {memoLockText(memo, withdrawn, myName, now)}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </DetailCard>
  );
}
