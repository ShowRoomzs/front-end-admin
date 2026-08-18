import DetailCard from "@/common/components/DetailCard/DetailCard";
import Editor from "@/common/components/Editor/Editor";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { formatDateTimeShort } from "@/common/utils/formatDate";
import { NOTICE_IMAGE_UPLOAD_TYPE } from "@/features/notice/constants/params";
import {
  useCreateNotice,
  useGetNoticeDetail,
  useUpdateNotice,
} from "@/features/notice/hooks/useNoticeQueries";
import type { NoticeFormRequest } from "@/features/notice/types/notice";
import { CheckIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams as useRouteParams } from "react-router-dom";

const LIST_PATH = "/support/notice";

const EMPTY_FORM: NoticeFormRequest = {
  title: "",
  content: "",
  pinned: false,
};

/** 에디터가 비어 있어도 `<p></p>`를 내려주므로 태그를 걷어내고 판정한다 */
function isContentEmpty(html: string) {
  return html.replace(/<[^>]*>/g, "").trim().length === 0;
}

/**
 * C2~C4 — 공지 등록·수정.
 *
 * **모달이 아니라 전체 페이지다** — 리치 에디터와 이미지 삽입에 폭이 필요하다(§20-4).
 * 필드가 3개뿐인 FAQ(§19, 모달)와 갈리는 지점이다.
 *
 * 등록·수정·게시 종료 상태 모두 **같은 화면**을 쓰고 우측 카드만 달라진다. 게시 종료된
 * 공지도 여기서 고칠 수 있는 건 의도된 것이다 — 내려간 문구를 미리 손봐 두고 준비되면
 * 목록에서 게시하는 운영 흐름을 지원한다.
 *
 * **저장은 상태를 건드리지 않는다**(§20-2). 이 화면에 게시/게시 종료 버튼을 두지 말 것 —
 * 저장이 곧 게시가 되면 의도치 않은 노출이 생긴다.
 */
export default function NoticeFormPage() {
  const navigate = useNavigate();
  const { noticeId: noticeIdParam } = useRouteParams<{ noticeId: string }>();
  const noticeId = Number(noticeIdParam);
  const isEdit = Number.isFinite(noticeId);

  const { data: detail, isLoading } = useGetNoticeDetail(noticeId);
  const { mutateAsync: createNotice, isPending: isCreating } =
    useCreateNotice();
  const { mutateAsync: updateNotice, isPending: isUpdating } =
    useUpdateNotice();

  const [form, setForm] = useState<NoticeFormRequest>(EMPTY_FORM);

  // 수정 진입 시 서버 값을 폼에 심는다. 등록 화면은 빈 폼으로 남는다
  useEffect(() => {
    if (detail) {
      setForm({
        title: detail.title,
        content: detail.content,
        pinned: detail.pinned,
      });
    }
  }, [detail]);

  const isSubmitting = isCreating || isUpdating;
  const canSubmit =
    form.title.trim().length > 0 && !isContentEmpty(form.content);

  const goToList = () => navigate(LIST_PATH);

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) {
      return;
    }

    const payload: NoticeFormRequest = {
      title: form.title.trim(),
      content: form.content,
      pinned: form.pinned,
    };

    try {
      if (isEdit) {
        await updateNotice({ noticeId, data: payload });
        toast.success("공지를 저장했습니다.");
      } else {
        await createNotice(payload);
        toast.success("공지를 게시했습니다. 소비자 앱에 즉시 노출됩니다.");
      }
      goToList();
    } catch {
      toast.error(isEdit ? "저장에 실패했습니다." : "게시에 실패했습니다.");
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center text-[12px] text-sz-n-500">
        불러오는 중…
      </div>
    );
  }

  if (isEdit && !detail) {
    return (
      <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center text-[12px] text-sz-n-500">
        공지를 찾을 수 없습니다.
      </div>
    );
  }

  const isEnded = detail?.status === "ENDED";

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h1 className="text-[20px] font-semibold text-sz-n-900">
          {isEdit ? "공지 수정" : "공지 등록"}
        </h1>
        {/* 헤더는 `목록` 버튼만이다 — 공지는 순차 검토 대상이 아니라 이전/다음을 두지 않는다 */}
        <button
          type="button"
          onClick={goToList}
          className="inline-flex h-8 items-center rounded-[6px] border border-sz-n-300 bg-white px-3 text-[12px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100 hover:text-sz-n-900"
        >
          목록
        </button>
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <DetailCard title="공지 작성">
          <div className="pt-2">
            <label
              htmlFor="notice-title"
              className="mb-1 block text-[12px] font-medium text-sz-n-600"
            >
              제목<span className="ml-0.5 text-sz-danger-text">*</span>
            </label>
            <input
              id="notice-title"
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="소비자 앱 공지사항 목록에 그대로 노출됩니다"
              className="h-8 w-full rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
            />

            <label className="mb-1 mt-4 block text-[12px] font-medium text-sz-n-600">
              본문<span className="ml-0.5 text-sz-danger-text">*</span>
            </label>
            <Editor
              value={form.content}
              onChange={(content) => setForm((prev) => ({ ...prev, content }))}
              imageUploadType={NOTICE_IMAGE_UPLOAD_TYPE}
              placeholder="소비자 앱 공지사항에 그대로 실립니다."
            />
          </div>
        </DetailCard>

        <div className="flex flex-col gap-4">
          <DetailCard title="게시 설정">
            <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3 pt-2">
              <span className="text-[12px] text-sz-n-500">
                {isEdit ? "현재 상태" : "등록 후 상태"}
              </span>
              {isEdit ? (
                <StatusBadge variant={isEnded ? "neutral" : "success"}>
                  {detail?.statusName}
                </StatusBadge>
              ) : (
                // 등록은 곧 게시다 — 임시저장 상태를 두지 않는다(§20-1)
                <StatusBadge variant="success">게시</StatusBadge>
              )}
            </div>

            {isEdit && detail && (
              <div className="pt-2">
                <MetaRow
                  label="등록일시"
                  value={formatDateTimeShort(detail.createdAt)}
                />
                <MetaRow
                  label="최종 수정"
                  value={formatDateTimeShort(detail.modifiedAt)}
                />
                {detail.endedAt && (
                  <MetaRow
                    label="게시 종료"
                    value={formatDateTimeShort(detail.endedAt)}
                  />
                )}
                <MetaRow label="작성자" value={detail.authorName} />
              </div>
            )}

            {/*
              중요는 상태가 아니라 분류라 여기(게시 설정)에 체크박스로 둔다.
              수정 시 해제도 가능하다 — 지난 공지를 상단에서 내리는 유일한 방법이다.
            */}
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, pinned: !prev.pinned }))
              }
              className="mt-3 flex w-full items-start gap-2.5 text-left"
            >
              <span
                className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] ${
                  form.pinned
                    ? "border-sz-accent-500 bg-sz-accent-500 text-white"
                    : "border-sz-n-300 bg-white"
                }`}
              >
                {form.pinned && (
                  <CheckIcon className="size-3" strokeWidth={3} />
                )}
              </span>
              <span className="text-[12px] text-sz-n-700">
                <b className="font-semibold text-sz-n-900">중요</b>로 표시
                <span className="mt-0.5 block text-[11px] text-sz-n-500">
                  목록 상단에 고정 노출됩니다.
                </span>
              </span>
            </button>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={goToList}
                className="inline-flex h-9 flex-1 items-center justify-center rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[12px] font-medium text-sz-n-900 hover:bg-sz-n-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                // 필수 미입력은 에러 문구 없이 버튼 비활성만으로 표현한다
                disabled={!canSubmit || isSubmitting}
                className="inline-flex h-9 flex-1 items-center justify-center rounded-[6px] bg-sz-accent-500 px-3.5 text-[12px] font-medium text-white hover:bg-sz-accent-600 disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-400"
              >
                {isEdit ? "저장" : "게시"}
              </button>
            </div>

            <p className="mb-2 mt-2.5 text-[11px] leading-[1.55] text-sz-n-500">
              {isEnded ? (
                <>
                  이 공지는 현재{" "}
                  <b className="font-semibold text-sz-n-900">게시 종료</b>{" "}
                  상태입니다 — 저장해도 소비자 앱에 다시 노출되지 않습니다.
                  노출하려면 목록에서{" "}
                  <b className="font-semibold text-sz-n-900">게시</b>를
                  실행하세요.
                </>
              ) : isEdit ? (
                <>
                  저장하면 수정 내용이 소비자 앱에 즉시 반영됩니다. 상태는
                  그대로 유지되며, 내릴 때는 목록에서{" "}
                  <b className="font-semibold text-sz-n-900">게시 종료</b>를
                  실행하세요.
                </>
              ) : (
                <>
                  게시하면 소비자 앱 공지사항에 즉시 노출됩니다. 내릴 때는
                  삭제가 아니라{" "}
                  <b className="font-semibold text-sz-n-900">게시 종료</b>로
                  처리합니다.
                </>
              )}
            </p>
          </DetailCard>
        </div>
      </div>
    </>
  );
}

interface MetaRowProps {
  label: string;
  value: ReactNode;
}

/** 시안 `.mrow` — 라벨 좌 · 값 우 정렬의 메타 정보 한 줄 */
function MetaRow(props: MetaRowProps) {
  const { label, value } = props;

  return (
    <div className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0">
      <span className="text-sz-n-500">{label}</span>
      <span className="text-right font-medium tabular-nums text-sz-n-900">
        {value}
      </span>
    </div>
  );
}
