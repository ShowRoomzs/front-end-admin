import FilterCard from "@/common/components/FilterCard/FilterCard";
import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Table from "@/common/components/Table/Table";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import { COMMON_USER_COLUMNS } from "@/features/user/constants/columns";
import { COMMON_USER_FILTER_OPTIONS } from "@/features/user/constants/filter";
import { useGetCommonUserList } from "@/features/user/hooks/useGetCommonUserList";
import type { CommonUserListParams } from "@/features/user/services/commonUserService";

const INITIAL_PARAMS: CommonUserListParams = {
  page: 1,
  size: 10,
  providerType: null,
  status: null,
  startDate: "",
  endDate: "",
};
export default function CommonUserManagement() {
  const { params, update, localParams, updateLocalParam, reset } =
    useParams<CommonUserListParams>(INITIAL_PARAMS);
  const { data: commonUserList, isLoading } = useGetCommonUserList(params);
  const pageInfo = usePaginationInfo({
    data: commonUserList?.pageInfo,
    onPageChange: (page) => {
      updateLocalParam("page", page);
    },
  });
  return (
    <ListViewWrapper>
      <FilterCard
        options={COMMON_USER_FILTER_OPTIONS}
        params={localParams}
        onChange={updateLocalParam}
        onReset={reset}
        onSubmit={update}
      />
      <Table
        columns={COMMON_USER_COLUMNS}
        data={commonUserList?.content ?? []}
        pageInfo={pageInfo}
        isLoading={isLoading}
      />
    </ListViewWrapper>
  );
}
