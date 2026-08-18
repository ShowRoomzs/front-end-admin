import EditorToolbar from "@/common/components/Editor/EditorToolbar";
import { fileService, type FileType } from "@/common/services/fileService";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import "@/common/components/Editor/editor.css";

/** 이미지 상한 (§20-4) — **서버가 다시 검증한다.** 여기 값은 편의를 위한 사전 차단이다 */
export const EDITOR_IMAGE_MAX_COUNT = 3;
export const EDITOR_IMAGE_MAX_TOTAL_BYTES = 10 * 1024 * 1024;

interface EditorProps {
  value: string;
  onChange: (html: string) => void;
  imageUploadType: FileType;
  placeholder?: string;
}

/** 본문에 들어간 `<img>` 개수 — 상한 판정과 카운터에 쓴다 */
function countImages(html: string) {
  return (html.match(/<img\b/gi) ?? []).length;
}

/**
 * 공지·약관 본문 리치 에디터. 파트너센터 `Editor`를 옮겨와 어드민 요건에 맞춘 것이다.
 *
 * 파트너센터판과 갈리는 지점:
 * - **표·구분선을 더했다** — 점검 일정·요금 안내처럼 값이 여러 축으로 갈리는 공지에 필요하다.
 * - **정렬·글자색·HTML 직접 편집을 뺐다** — 본문이 소비자 앱에 그대로 실리므로 운영자가
 *   임의 색을 넣으면 앱 테마와 어긋나고, HTML 모드는 앱 렌더가 깨질 마크업을 통과시킨다.
 * - **이미지 3장·합계 10MB 상한**을 건다. 다만 이건 클라이언트 편의일 뿐이고
 *   **서버가 다시 검증해야 한다**(§20-4) — 클라이언트 제한은 우회 가능하다.
 */
export default function Editor(props: EditorProps) {
  const { value, onChange, imageUploadType, placeholder } = props;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // 공지 본문에 코드 블록을 쓸 일이 없고, 앱 렌더 대상 태그만 남긴다
        codeBlock: false,
      }),
      Underline,
      // 정렬 버튼은 툴바에서 뺐지만, 붙여넣기로 들어온 정렬 속성을 보존하려면 확장은 필요하다
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-sz-accent-500 underline" },
      }),
      Image.configure({
        HTMLAttributes: { class: "max-w-full h-auto" },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "min-h-[320px] focus:outline-none",
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
    },
  });

  /*
    바깥 값이 갈아치워졌을 때만 본문을 다시 심는다. 조건 없이 setContent를 부르면
    타이핑마다 커서가 문서 끝으로 튀어 한글 조합이 끊긴다.
  */
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  const handleImageUpload = useCallback(() => {
    if (!editor) {
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        return;
      }

      if (countImages(editor.getHTML()) >= EDITOR_IMAGE_MAX_COUNT) {
        toast.error(
          `이미지는 최대 ${EDITOR_IMAGE_MAX_COUNT}장까지 넣을 수 있습니다.`
        );
        return;
      }

      /*
        합계 10MB 제한은 "이번에 올리는 파일 하나"로만 검사한다. 이미 삽입된 이미지는
        URL만 남아 원본 용량을 알 수 없어 프론트에서 합계를 정확히 셀 수 없다 —
        그래서 서버 검증이 필수다(§20-6 #2).
      */
      if (file.size > EDITOR_IMAGE_MAX_TOTAL_BYTES) {
        toast.error("이미지 용량은 합계 10MB를 넘을 수 없습니다.");
        return;
      }

      try {
        const { imageUrl } = await fileService.upload(file, imageUploadType);
        editor.chain().focus().setImage({ src: imageUrl }).run();
      } catch {
        toast.error("이미지 업로드에 실패했습니다.");
      }
    };
    input.click();
  }, [editor, imageUploadType]);

  if (!editor) {
    return null;
  }

  const html = editor.getHTML();
  // 글자수는 공백 포함이다(§20-4) — 마크업을 뺀 순수 텍스트 길이를 센다
  const textLength = editor.getText().length;
  const imageCount = countImages(html);

  return (
    <div className="overflow-hidden rounded-[6px] border border-sz-n-300 bg-white">
      <EditorToolbar
        editor={editor}
        onImageUpload={handleImageUpload}
        isImageLimitReached={imageCount >= EDITOR_IMAGE_MAX_COUNT}
      />

      <EditorContent editor={editor} />

      <div className="flex items-center justify-between border-t border-sz-n-200 bg-sz-n-50 px-3 py-1.5 text-[11px] text-sz-n-500">
        <span>
          이미지 {imageCount}/{EDITOR_IMAGE_MAX_COUNT}장 · 합계 10MB 이내
        </span>
        <span className="tabular-nums">{textLength.toLocaleString()}자</span>
      </div>
    </div>
  );
}
