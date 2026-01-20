import FilterCard from "@/common/components/FilterCard/FilterCard";
import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Table from "@/common/components/Table/Table";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import { LOGIN_HISTORY_COLUMNS } from "@/features/user/constants/columns";
import { LOGIN_HISTORY_FILTER_OPTIONS } from "@/features/user/constants/filter";
import { useGetLoginHistory } from "@/features/user/hooks/useGetLoginHistory";
import type { LoginHistoryParams } from "@/features/user/services/commonUserService";

const INITIAL_PARAMS: LoginHistoryParams = {
  page: 1,
  size: 20,
  startDate: "",
  endDate: "",
  deviceType: null,
  country: "",
  city: "",
  status: null,
};
export default function LoginHistoryManagement() {
  const { params, localParams, updateLocalParam, reset, update } =
    useParams<LoginHistoryParams>(INITIAL_PARAMS);
  const { data: loginHistoryList, isLoading } = useGetLoginHistory(params);
  const pageInfo = usePaginationInfo({
    data: loginHistoryList?.pageInfo,
    onPageChange: (page) => {
      updateLocalParam("page", page);
    },
  });

  return (
    <ListViewWrapper>
      <FilterCard
        options={LOGIN_HISTORY_FILTER_OPTIONS}
        params={localParams}
        onChange={updateLocalParam}
        onReset={reset}
        onSubmit={update}
      />
      <Table
        columns={LOGIN_HISTORY_COLUMNS}
        data={loginHistoryList?.content ?? []}
        isLoading={isLoading}
        pageInfo={pageInfo}
      />
    </ListViewWrapper>
  );
}
