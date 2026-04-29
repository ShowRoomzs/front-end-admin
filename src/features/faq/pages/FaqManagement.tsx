import FilterCard, {
  type FilterOptionGroup,
} from "@/common/components/FilterCard/FilterCard";
import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Table from "@/common/components/Table/Table";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import { useReorderList } from "@/common/hooks/useReorderList";
import { Button } from "@/components/ui/button";
import { createFaqListColumns } from "@/features/faq/constants/columns";
import { useGetFaqCategories } from "@/features/faq/hooks/useGetFaqCategories";
import { useGetFaqList } from "@/features/faq/hooks/useGetFaqList";
import { useReorderFaq } from "@/features/faq/hooks/useReorderFaq";
import type {
  Faq,
  FaqListParams,
  FaqReorderItem,
} from "@/features/faq/types/faq";
import { PlusIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const INITIAL_PARAMS: FaqListParams = {
  page: 1,
  size: 20,
  category: null,
  keyword: "",
};

export default function FaqManagement() {
  const navigate = useNavigate();
  const { params, updateLocalParam, localParams, reset, update, updateParam } =
    useParams<FaqListParams>(INITIAL_PARAMS);
  const { data: categories } = useGetFaqCategories();
  const { mutateAsync: reorderFaqs } = useReorderFaq();
  const { data: faqList, isLoading } = useGetFaqList(params);
  const {
    localItems: localFaqList,
    isReordering,
    handleDragEnd,
  } = useReorderList<Faq, FaqReorderItem>({
    items: faqList?.content,
    getId: (faq) => faq.id,
    getDisplayOrder: (faq) => faq.displayOrder,
    setDisplayOrder: (faq, displayOrder) => ({
      ...faq,
      displayOrder,
    }),
    createReorderItem: (faq) => ({
      faqId: faq.id,
      displayOrder: faq.displayOrder,
    }),
    onReorder: reorderFaqs,
    onSuccess: () => {
      toast.success("FAQ 순서가 변경되었습니다.");
    },
  });

  const pageInfo = usePaginationInfo({
    data: faqList?.pageInfo,
    onPageChange: (page) => {
      updateParam("page", page);
    },
  });

  const categoryOptions = [
    { label: "전체", value: null },
    ...(categories?.map((category) => ({
      label: category.description,
      value: category.key,
    })) ?? []),
  ];

  const filterOptions: FilterOptionGroup<FaqListParams> = {
    카테고리: [
      {
        key: "category",
        type: "select",
        options: categoryOptions,
        placeholder: "카테고리",
      },
    ],
    검색어: [
      {
        key: "keyword",
        type: "input",
        placeholder: "질문 또는 답변을 입력하세요",
      },
    ],
  };

  const handleRowClick = (record: Faq) => {
    navigate(`/support/faq/${record.id}`);
  };

  return (
    <ListViewWrapper>
      <FilterCard
        options={filterOptions}
        params={localParams}
        onChange={updateLocalParam}
        onSubmit={update}
        onReset={reset}
      />

      <Table
        columns={createFaqListColumns()}
        data={localFaqList ?? []}
        pageInfo={pageInfo}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        rowDrag={{
          enabled: !isReordering,
          droppableId: "faq-list",
          getDraggableId: (record) => record.id.toString(),
          onDragEnd: handleDragEnd,
        }}
        renderFooter={
          <Button
            onClick={() => navigate("/support/faq/register")}
            variant="default"
            className="w-fit"
          >
            FAQ 등록
            <PlusIcon className="w-fit" />
          </Button>
        }
      />
    </ListViewWrapper>
  );
}
