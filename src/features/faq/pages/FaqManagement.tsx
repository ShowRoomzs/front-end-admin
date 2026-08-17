import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Table from "@/common/components/Table/Table";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/common/constants";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import { useReorderList } from "@/common/hooks/useReorderList";
import FaqDeleteModal from "@/features/faq/components/FaqDeleteModal/FaqDeleteModal";
import FaqFormModal from "@/features/faq/components/FaqFormModal/FaqFormModal";
import FaqTabFilter from "@/features/faq/components/FaqTabFilter/FaqTabFilter";
import { createFaqListColumns } from "@/features/faq/constants/columns";
import {
  FAQ_INITIAL_PARAMS,
  FAQ_PAGE_SIZES,
} from "@/features/faq/constants/params";
import { useCreateFaq } from "@/features/faq/hooks/useCreateFaq";
import { useDeleteFaq } from "@/features/faq/hooks/useDeleteFaq";
import { useGetFaqCategories } from "@/features/faq/hooks/useGetFaqCategories";
import { useGetFaqList } from "@/features/faq/hooks/useGetFaqList";
import { useReorderFaq } from "@/features/faq/hooks/useReorderFaq";
import { useUpdateFaq } from "@/features/faq/hooks/useUpdateFaq";
import {
  FAQ_CATEGORY_ALL,
  type Faq,
  type FaqListParams,
  type FaqReorderItem,
  type FaqRequest,
} from "@/features/faq/types/faq";
import { PlusIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";

/**
 * C1 — FAQ 관리 목록.
 *
 * 어드민에서 **행 클릭이 상세로 가지 않는 유일한 목록**이다. FAQ는 항목당 정보가
 * 카테고리·질문·답변 셋뿐이라 상세 페이지를 만들 근거가 없고, 등록·수정·삭제가 전부
 * 모달로 끝난다. 다른 화면의 "행 클릭 → 상세" 패턴을 여기에 적용하지 말 것.
 */
export default function FaqManagement() {
  const {
    params,
    localParams,
    update,
    updateParam,
    updateParams,
    updateLocalParam,
  } = useParams<FaqListParams>(FAQ_INITIAL_PARAMS);

  const { data: categoryResponse } = useGetFaqCategories();
  const { data: faqList, isLoading } = useGetFaqList(params);

  const { mutateAsync: createFaq, isPending: isCreating } = useCreateFaq();
  const { mutateAsync: updateFaq, isPending: isUpdating } = useUpdateFaq();
  const { mutateAsync: deleteFaq, isPending: isDeleting } = useDeleteFaq();
  const { mutateAsync: reorderFaqs } = useReorderFaq();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Faq | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null);

  /*
    `/common/faqs/categories`는 필터 전용 ALL("전체")을 목록 맨 앞에 함께 내려준다.
    전체 탭은 화면이 직접 만들고 값도 null로 다루므로, API의 ALL은 걸러내야
    "전체"가 두 번 그려지지 않는다.
  */
  const categories = useMemo(
    () =>
      categoryResponse?.filter(
        (category) => category.key !== FAQ_CATEGORY_ALL
      ) ?? [],
    [categoryResponse]
  );

  const {
    localItems: localFaqList,
    isReordering,
    handleDragEnd,
  } = useReorderList<Faq, FaqReorderItem>({
    items: faqList?.content,
    getId: (faq) => faq.id,
    getDisplayOrder: (faq) => faq.displayOrder,
    setDisplayOrder: (faq, displayOrder) => ({ ...faq, displayOrder }),
    createReorderItem: (faq) => ({
      faqId: faq.id,
      displayOrder: faq.displayOrder,
    }),
    onReorder: reorderFaqs,
    onSuccess: () => {
      toast.success("FAQ 순서가 변경되었습니다.");
    },
    // 드롭 즉시 저장이라 별도 저장 버튼이 없다 — 실패를 알리지 않으면 되돌아간 걸 눈치채지 못한다
    onError: () => {
      toast.error("순서 변경에 실패했습니다. 원래 순서로 되돌렸습니다.");
    },
  });

  const pageInfo = usePaginationInfo({
    data: faqList?.pageInfo,
    onPageChange: (page) => {
      updateParam("page", page);
    },
  });

  const handleCategoryChange = useCallback(
    (category: string | null) => {
      // 탭을 바꾸면 페이지도 1로 — 3페이지에서 건수 적은 탭으로 옮기면 빈 목록이 뜬다
      updateParams({ category, page: 1 });
    },
    [updateParams]
  );

  const handleSizeChange = useCallback(
    (size: number) => {
      updateParams({ size, page: 1 });
    },
    [updateParams]
  );

  const columns = useMemo(
    () =>
      createFaqListColumns({
        onEdit: (faq) => {
          setEditTarget(faq);
          setIsFormOpen(true);
        },
        onDelete: (faq) => {
          setDeleteTarget(faq);
        },
      }),
    []
  );

  const handleOpenRegister = () => {
    setEditTarget(null);
    setIsFormOpen(true);
  };

  const handleSubmitForm = async (data: FaqRequest) => {
    try {
      if (editTarget) {
        await updateFaq({ faqId: editTarget.id, data });
        toast.success("FAQ가 수정되었습니다.");
      } else {
        await createFaq(data);
        toast.success("FAQ가 등록되었습니다.");
      }
      setIsFormOpen(false);
      setEditTarget(null);
    } catch {
      toast.error(
        editTarget ? "FAQ 수정에 실패했습니다." : "FAQ 등록에 실패했습니다."
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteFaq(deleteTarget.id);
      toast.success("FAQ가 삭제되었습니다.");
      setDeleteTarget(null);
    } catch {
      toast.error("FAQ 삭제에 실패했습니다.");
    }
  };

  // 검색이 빗나간 것과 정말 비어 있는 것은 다른 안내가 필요하다
  const emptyState = useMemo(() => {
    if (params.keyword) {
      return (
        <div className="px-6 py-[72px] text-center">
          <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">⌕</div>
          <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
            검색 결과가 없습니다
          </div>
          <div className="text-[12px] text-sz-n-500">
            다른 질문으로 검색해 보세요.
          </div>
        </div>
      );
    }

    return (
      <div className="px-6 py-[72px] text-center">
        <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">＋</div>
        <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
          등록된 FAQ가 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          자주 묻는 질문을 등록하면 소비자 앱 고객센터에 바로 노출됩니다.
        </div>
      </div>
    );
  }, [params.keyword]);

  const editInitialValue: FaqRequest | undefined = editTarget
    ? {
        category: editTarget.category,
        question: editTarget.question,
        answer: editTarget.answer,
      }
    : undefined;

  return (
    <ListViewWrapper>
      {/* 시안 페이지 헤더 우측 액션 — 셸은 pageTitle로 h1만 그리므로 버튼 줄은 화면이 만든다 */}
      <div className="mb-4 flex shrink-0 items-center justify-end">
        <button
          type="button"
          onClick={handleOpenRegister}
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-sz-accent-500 px-3.5 text-[12px] font-medium text-white hover:bg-sz-accent-600"
        >
          <PlusIcon className="size-3.5" />
          FAQ 등록
        </button>
      </div>

      <FaqTabFilter
        categories={categories}
        category={params.category}
        onCategoryChange={handleCategoryChange}
        counts={faqList?.categoryCounts}
        keyword={localParams.keyword}
        onKeywordChange={(keyword) => updateLocalParam("keyword", keyword)}
        onSearch={update}
      />

      <div className="flex flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
          <span className="text-[12px] text-sz-n-600">
            총 <b className="text-sz-n-900">{pageInfo.totalResults}</b>건
          </span>
          <select
            aria-label="표시 건수"
            value={params.size}
            onChange={(event) => handleSizeChange(Number(event.target.value))}
            style={MODAL_SELECT_CHEVRON_STYLE}
            className="h-7 appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[26px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          >
            {FAQ_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}건씩
              </option>
            ))}
          </select>
        </div>

        <Table
          columns={columns}
          data={localFaqList ?? []}
          pageInfo={pageInfo}
          isLoading={isLoading}
          emptyState={emptyState}
          fitWidth
          autoHeight
          maxRows={14}
          bodyClassName="overflow-hidden whitespace-nowrap"
          headerClassName="whitespace-nowrap"
          rowDrag={{
            enabled: !isReordering,
            droppableId: "faq-list",
            getDraggableId: (record) => record.id.toString(),
            onDragEnd: handleDragEnd,
          }}
        />
      </div>

      <FaqFormModal
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditTarget(null);
          }
        }}
        categories={categories}
        initialValue={editInitialValue}
        isSubmitting={isCreating || isUpdating}
        onSubmit={handleSubmitForm}
      />

      <FaqDeleteModal
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        question={deleteTarget?.question ?? ""}
        isSubmitting={isDeleting}
        onSubmit={handleConfirmDelete}
      />
    </ListViewWrapper>
  );
}
