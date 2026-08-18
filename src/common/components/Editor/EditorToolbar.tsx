import type { Editor } from "@tiptap/react";
import {
  Bold,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Strikethrough,
  Table as TableIcon,
  Underline,
} from "lucide-react";
import { useState, type ReactNode } from "react";

interface EditorToolbarProps {
  editor: Editor;
  onImageUpload: () => void;
  /** 이미지 상한(3장)에 도달하면 버튼을 잠근다 */
  isImageLimitReached: boolean;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}

function ToolbarButton(props: ToolbarButtonProps) {
  const {
    onClick,
    isActive = false,
    disabled = false,
    title,
    children,
  } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`inline-flex size-7 items-center justify-center rounded-[4px] text-sz-n-600 hover:bg-sz-n-200 hover:text-sz-n-900 disabled:cursor-not-allowed disabled:opacity-40 ${
        isActive ? "bg-sz-n-200 text-sz-n-900" : ""
      }`}
    >
      {children}
    </button>
  );
}

/** 시안 툴바 구분선 — 기능 묶음 사이에만 넣는다 */
function Divider() {
  return <span className="mx-0.5 h-[18px] w-px bg-sz-n-300" />;
}

const BLOCK_OPTIONS = [
  { value: "paragraph", label: "본문" },
  { value: "h1", label: "제목 1" },
  { value: "h2", label: "제목 2" },
  { value: "h3", label: "제목 3" },
];

/**
 * 공지 본문 에디터 툴바 (§20-4).
 *
 * 구성은 시안이 정한 그대로다 — 본문 스타일 · 굵게/기울임/밑줄/취소선 ·
 * 불릿·번호 목록 · 링크 · 이미지 · 표 · 구분선. 파트너센터 툴바에서 정렬·색상·HTML
 * 모드를 빼고 **표·구분선을 더했다**: 공지는 소비자 앱에 그대로 실리는 콘텐츠라
 * 운영자가 임의 색을 넣으면 앱 테마와 어긋나고, HTML 직접 편집은 앱 렌더가 깨질
 * 마크업을 통과시킨다.
 */
export default function EditorToolbar(props: EditorToolbarProps) {
  const { editor, onImageUpload, isImageLimitReached } = props;
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const currentBlock = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : "paragraph";

  const handleBlockChange = (value: string) => {
    const chain = editor.chain().focus();
    if (value === "paragraph") {
      chain.setParagraph().run();
      return;
    }
    chain.toggleHeading({ level: Number(value.slice(1)) as 1 | 2 | 3 }).run();
  };

  const applyLink = () => {
    const url = linkUrl.trim();
    // 빈 값으로 확인을 누르면 링크 해제로 해석한다(별도 해제 버튼을 두지 않는다)
    if (!url) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
    setIsLinkOpen(false);
    setLinkUrl("");
  };

  return (
    <div className="relative flex flex-wrap items-center gap-0.5 border-b border-sz-n-200 bg-sz-n-50 px-2 py-1.5">
      <select
        aria-label="본문 스타일"
        value={currentBlock}
        onChange={(event) => handleBlockChange(event.target.value)}
        className="mr-1 h-7 rounded-[4px] border border-sz-n-300 bg-white px-1.5 text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500"
      >
        {BLOCK_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="굵게"
      >
        <Bold className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="기울임"
      >
        <Italic className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="밑줄"
      >
        <Underline className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="취소선"
      >
        <Strikethrough className="size-3.5" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="불릿 목록"
      >
        <List className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="번호 목록"
      >
        <ListOrdered className="size-3.5" />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => {
          setLinkUrl(editor.getAttributes("link").href ?? "");
          setIsLinkOpen((prev) => !prev);
        }}
        isActive={editor.isActive("link")}
        title="링크"
      >
        <LinkIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={onImageUpload}
        disabled={isImageLimitReached}
        title={
          isImageLimitReached
            ? "이미지는 최대 3장까지 넣을 수 있습니다"
            : "이미지"
        }
      >
        <ImageIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
        isActive={editor.isActive("table")}
        title="표 삽입"
      >
        <TableIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="구분선"
      >
        <Minus className="size-3.5" />
      </ToolbarButton>

      {isLinkOpen && (
        <div className="absolute left-2 top-full z-50 mt-1 flex gap-1.5 rounded-[6px] border border-sz-n-200 bg-white p-2 shadow-[0_8px_24px_rgba(26,27,31,0.12)]">
          <input
            type="url"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
            }}
            placeholder="https://example.com"
            autoFocus
            className="h-7 w-[240px] rounded-[4px] border border-sz-n-300 px-2 text-[12px] outline-none focus:border-sz-accent-500"
          />
          <button
            type="button"
            onClick={applyLink}
            className="inline-flex h-7 items-center rounded-[4px] bg-sz-accent-500 px-2.5 text-[11px] font-medium text-white hover:bg-sz-accent-600"
          >
            확인
          </button>
          <button
            type="button"
            onClick={() => setIsLinkOpen(false)}
            className="inline-flex h-7 items-center rounded-[4px] border border-sz-n-300 px-2.5 text-[11px] font-medium text-sz-n-700 hover:bg-sz-n-100"
          >
            취소
          </button>
        </div>
      )}

      {/* 표 안에 커서가 있을 때만 행·열 조작을 노출한다 — 평소엔 툴바가 길어질 뿐이다 */}
      {editor.isActive("table") && (
        <div className="ml-auto flex items-center gap-1">
          <TableAction
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            행 추가
          </TableAction>
          <TableAction
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            열 추가
          </TableAction>
          <TableAction onClick={() => editor.chain().focus().deleteRow().run()}>
            행 삭제
          </TableAction>
          <TableAction
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            열 삭제
          </TableAction>
          <TableAction
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            표 삭제
          </TableAction>
        </div>
      )}
    </div>
  );
}

interface TableActionProps {
  onClick: () => void;
  children: ReactNode;
}

function TableAction(props: TableActionProps) {
  const { onClick, children } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-6 items-center rounded-[4px] border border-sz-n-300 bg-white px-1.5 text-[11px] text-sz-n-600 hover:bg-sz-n-100 hover:text-sz-n-900"
    >
      {children}
    </button>
  );
}
