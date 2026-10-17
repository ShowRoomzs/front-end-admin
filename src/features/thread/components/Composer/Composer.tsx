import {
  CloseIcon,
  AttachIcon,
  SendIcon,
} from "@/features/thread/components/icons";
import {
  ALLOWED_EXTENSIONS,
  ATTACHMENT_COUNT_MAX,
  ATTACHMENT_TOTAL_SIZE_MAX,
} from "@/features/thread/constants/params";
import {
  getExtension,
  getLocalAttachmentType,
} from "@/features/thread/utils/attachment";
import { formatBytes } from "@/features/thread/utils/format";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

interface StagedFile {
  localId: string;
  file: File;
}

interface ComposerProps {
  onSend: (content: string, files: Array<File>) => void;
  /** 탈퇴 회원 채널(`writable = false`) — 입력창 · 첨부를 닫고 사유를 보인다 */
  disabledReason?: string | null;
}

/** 첨부 이미지 썸네일은 로컬 objectURL로 그린다 — 아직 서버 URL이 없다 */
function useObjectUrls(files: Array<StagedFile>) {
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const created: Record<string, string> = {};
    files.forEach(({ localId, file }) => {
      if (getLocalAttachmentType(file.name) === "IMAGE") {
        created[localId] = URL.createObjectURL(file);
      }
    });
    setUrls(created);
    return () =>
      Object.values(created).forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  return urls;
}

/**
 * 입력창(시안 `.th-input`) — 클립 · 둥근 입력 · 원형 전송.
 *
 * 개수(20개)와 합계 용량(500MB)은 서로 독립인 두 축이라 둘 다 본다. 여기 검사는 즉시 피드백용이고
 * 서버가 전송 때 다시 판정한다. Enter = 전송 · Shift+Enter = 줄바꿈(한글 조합 중 Enter는 무시).
 */
export default function Composer(props: ComposerProps) {
  const { onSend, disabledReason } = props;
  const isDisabled = Boolean(disabledReason);
  const [content, setContent] = useState("");
  const [staged, setStaged] = useState<Array<StagedFile>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useObjectUrls(staged);

  const totalSize = staged.reduce((sum, item) => sum + item.file.size, 0);
  const isOverCount = staged.length > ATTACHMENT_COUNT_MAX;
  const isOverSize = totalSize > ATTACHMENT_TOTAL_SIZE_MAX;
  const canSend =
    !isDisabled &&
    !isOverCount &&
    !isOverSize &&
    (content.trim().length > 0 || staged.length > 0);

  const handlePickFiles = (fileList: FileList | null) => {
    if (!fileList) {
      return;
    }
    const picked = Array.from(fileList);
    const rejected = picked.filter(
      (file) => !ALLOWED_EXTENSIONS.includes(getExtension(file.name))
    );
    if (rejected.length > 0) {
      toast.error(
        `첨부할 수 없는 형식입니다: ${rejected.map((file) => file.name).join(", ")}`
      );
    }
    const accepted = picked.filter((file) =>
      ALLOWED_EXTENSIONS.includes(getExtension(file.name))
    );
    setStaged((prev) => [
      ...prev,
      ...accepted.map((file) => ({ localId: crypto.randomUUID(), file })),
    ]);
  };

  const handleSend = () => {
    if (!canSend) {
      return;
    }
    onSend(
      content,
      staged.map((item) => item.file)
    );
    setContent("");
    setStaged([]);
  };

  return (
    <div className="shrink-0 border-t border-sz-n-200 bg-white px-3.5 py-[11px]">
      {disabledReason && (
        <div className="pb-2 text-[11px] text-sz-n-500">{disabledReason}</div>
      )}

      {staged.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2.5 pt-1.5">
          {staged.map(({ localId, file }) => {
            const isImage = getLocalAttachmentType(file.name) === "IMAGE";
            return (
              <div
                key={localId}
                className={cn(
                  "relative flex h-14 shrink-0 items-center rounded-[6px]",
                  isImage
                    ? "w-14 bg-sz-n-200"
                    : "gap-2 border border-sz-n-200 bg-white pl-2 pr-7"
                )}
              >
                {isImage ? (
                  <img
                    src={objectUrls[localId]}
                    alt={file.name}
                    className="size-full rounded-[6px] object-cover"
                  />
                ) : (
                  <span className="min-w-0">
                    <span className="block max-w-[120px] truncate text-[11px] font-semibold text-sz-n-900">
                      {file.name}
                    </span>
                    <span className="block text-[10px] text-sz-n-500">
                      {formatBytes(file.size)}
                    </span>
                  </span>
                )}
                <button
                  type="button"
                  aria-label="첨부 제거"
                  onClick={() =>
                    setStaged((prev) =>
                      prev.filter((item) => item.localId !== localId)
                    )
                  }
                  className={cn(
                    "absolute flex size-[18px] items-center justify-center rounded-full bg-sz-n-900 text-white",
                    isImage ? "-right-1.5 -top-1.5" : "right-1.5 top-1.5"
                  )}
                >
                  <CloseIcon />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {(isOverCount || isOverSize) && (
        <div className="pb-2 text-[11px] font-medium text-sz-danger-text">
          {isOverCount
            ? `첨부는 최대 ${ATTACHMENT_COUNT_MAX}개까지 가능합니다.`
            : "최대 500MB를 초과했습니다. 일부 파일을 제거하거나 나눠서 보내주세요."}
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            handlePickFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => fileInputRef.current?.click()}
          aria-label="파일 첨부"
          className="flex size-9 shrink-0 items-center justify-center rounded-[6px] border border-sz-n-300 text-sz-n-500 hover:bg-sz-n-100 disabled:cursor-not-allowed disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400"
        >
          <AttachIcon />
        </button>
        <textarea
          value={content}
          disabled={isDisabled}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          placeholder="메시지 입력…"
          className="h-[38px] flex-1 resize-none rounded-[19px] border border-sz-n-300 px-4 py-[8px] text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 disabled:cursor-not-allowed disabled:bg-sz-n-100"
        />
        <button
          type="button"
          disabled={!canSend}
          onClick={handleSend}
          aria-label="전송"
          className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-sz-accent-500 text-white hover:bg-sz-accent-600 disabled:cursor-not-allowed disabled:bg-sz-n-200 disabled:text-sz-n-400"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
