import FilterCard from "@/common/components/FilterCard/FilterCard";
import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Table from "@/common/components/Table/Table";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import { SELLER_REGISTRATION_COLUMNS } from "@/features/user/constants/columns";
import { SELLER_REGISTRATION_FILTER_OPTIONS } from "@/features/user/constants/filter";
import { useGetSellerRegistrationList } from "@/features/user/hooks/useGetSellerRegistrationList";
import type { SellerRegistrationParams } from "@/features/user/services/sellerService";

const INITIAL_PARAMS: SellerRegistrationParams = {
  status: null,
  startDate: "",
  endDate: "",
  page: 1,
  size: 10,
  keyword: "",
  keywordType: "SELLER_ID",
};

export default function SellerRegistrationManagement() {
  const { params, localParams, update, updateLocalParam, reset } =
    useParams<SellerRegistrationParams>(INITIAL_PARAMS);
  const { data: sellerRegistrationList, isLoading } =
    useGetSellerRegistrationList(params);
  const pageInfo = usePaginationInfo({
    data: sellerRegistrationList?.pageInfo,
    onPageChange: (page) => {
      updateLocalParam("page", page);
    },
  });

  return (
    <ListViewWrapper>
      <FilterCard
        options={SELLER_REGISTRATION_FILTER_OPTIONS}
        params={localParams}
        onChange={updateLocalParam}
        onSubmit={update}
        onReset={reset}
      />
      <Table
        columns={SELLER_REGISTRATION_COLUMNS}
        data={sellerRegistrationList?.content ?? []}
        pageInfo={pageInfo}
        isLoading={isLoading}
      />
    </ListViewWrapper>
  );
}
