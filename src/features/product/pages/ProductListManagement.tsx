import FilterCard from "@/common/components/FilterCard/FilterCard";
import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Table from "@/common/components/Table/Table";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import { PRODUCT_LIST_COLUMNS } from "@/features/product/constants/columns";
import { PRODUCT_LIST_FILTER_OPTIONS } from "@/features/product/constants/filter";
import { useGetProductList } from "@/features/product/hooks/useGetProductList";
import type { Product, ProductListParams } from "@/features/product/services/productService";
import { useNavigate } from "react-router-dom";

const INITIAL_PARAMS: ProductListParams = {
  q: "",
  page: 1,
  size: 20,
};

export default function ProductListManagement() {
  const navigate = useNavigate();
  const { params, updateLocalParam, localParams, reset, update, updateParam } =
    useParams<ProductListParams>(INITIAL_PARAMS);
  const { data: productList, isLoading } = useGetProductList(params);
  const pageInfo = usePaginationInfo({
    data: productList?.pageInfo,
    onPageChange: (page) => {
      updateParam("page", page);
    },
  });

  const handleRowClick = (record: Product) => {
    navigate(`/product/list/${record.id}`);
  };

  return (
    <ListViewWrapper>
      <FilterCard
        options={PRODUCT_LIST_FILTER_OPTIONS}
        params={localParams}
        onChange={updateLocalParam}
        onSubmit={update}
        onReset={reset}
      />
      <Table
        columns={PRODUCT_LIST_COLUMNS}
        data={productList?.content ?? []}
        pageInfo={pageInfo}
        isLoading={isLoading}
        onRowClick={handleRowClick}
      />
    </ListViewWrapper>
  );
}
