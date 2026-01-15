import FilterCard, {
  type FilterOption,
} from "@/common/components/FilterCard/FilterCard";
import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Table from "@/common/components/Table/Table";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import { useGetCategory } from "@/features/category/hooks/useGetCategory";
import { SELLER_USER_COLUMNS } from "@/features/seller/constants/columns";
import { SELLER_USER_FILTER_OPTIONS } from "@/features/seller/constants/filter";
import { useGetSellerUserList } from "@/features/seller/hooks/useGetSellerUserList";
import type { SellerUserListParams } from "@/features/seller/services/sellerService";
import { produce } from "immer";
import { useMemo } from "react";

const INITIAL_PARAMS: SellerUserListParams = {
  mainCategory: "",
  marketName: "",
  page: 1,
  size: 20,
};
export default function SellerUserManagement() {
  const { params, updateLocalParam, localParams, reset, update, updateParam } =
    useParams<SellerUserListParams>(INITIAL_PARAMS);
  const { data: sellerUserList, isLoading } = useGetSellerUserList(params);
  const { categoryMap } = useGetCategory();
  const pageInfo = usePaginationInfo({
    data: sellerUserList?.pageInfo,
    onPageChange: (page) => {
      updateParam("page", page);
    },
  });

  const options = useMemo(() => {
    return produce(SELLER_USER_FILTER_OPTIONS, (draft) => {
      const categoryOption = draft["카테고리"].find(
        (option) => option.key === "mainCategory"
      );
      const newCategoryOption = {
        ...categoryOption,
        options: categoryMap?.mainCategories.map((category) => ({
          value: category.categoryId.toString(),
          label: category.name,
        })),
      };
      draft["카테고리"] = [
        newCategoryOption as FilterOption<SellerUserListParams>,
      ];
    });
  }, [categoryMap?.mainCategories]);

  const columns = useMemo(() => {
    return produce(SELLER_USER_COLUMNS, (draft) => {
      const mainCategoryColumn = draft.find((c) => c.key === "mainCategory");
      if (!mainCategoryColumn) {
        return;
      }
      mainCategoryColumn.render = (value) =>
        categoryMap?.byId.get(Number(value))?.name || "-";
    });
  }, [categoryMap?.byId]);

  return (
    <ListViewWrapper>
      <FilterCard
        options={options}
        params={localParams}
        onChange={updateLocalParam}
        onSubmit={update}
        onReset={reset}
      />
      <Table
        columns={columns}
        data={sellerUserList?.content ?? []}
        pageInfo={pageInfo}
        isLoading={isLoading}
      />
    </ListViewWrapper>
  );
}
