import FilterCard from "@/common/components/FilterCard/FilterCard";
import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Table from "@/common/components/Table/Table";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import { CREATOR_APPLICATION_COLUMNS } from "@/features/creator/constants/columns";
import { CREATOR_APPLICATION_FILTER_OPTIONS } from "@/features/creator/constants/filter";
import { useGetCreatorApplicationList } from "@/features/creator/hooks/useGetCreatorApplicationList";

import type {
  CreatorApplicationInfo,
  CreatorApplicationParams,
} from "@/features/creator/services/creatorService";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

const INITIAL_PARAMS: CreatorApplicationParams = {
  status: null,
  startDate: "",
  endDate: "",
  page: 1,
  size: 20,
};

export default function CreatorApplicationManagement() {
  const navigate = useNavigate();
  const { params, localParams, update, updateLocalParam, reset } =
    useParams<CreatorApplicationParams>(INITIAL_PARAMS);
  const { data: creatorApplicationList, isLoading } =
    useGetCreatorApplicationList(params);
  const pageInfo = usePaginationInfo({
    data: creatorApplicationList?.pageInfo,
    onPageChange: (page) => {
      updateLocalParam("page", page);
    },
  });

  const handleRowClick = useCallback(
    (record: CreatorApplicationInfo) => {
      navigate(`/showroom/registration/${record.creatorId}`);
    },
    [navigate]
  );

  return (
    <ListViewWrapper>
      <FilterCard
        options={CREATOR_APPLICATION_FILTER_OPTIONS}
        params={localParams}
        onChange={updateLocalParam}
        onSubmit={update}
        onReset={reset}
      />
      <Table
        columns={CREATOR_APPLICATION_COLUMNS}
        data={creatorApplicationList?.content ?? []}
        pageInfo={pageInfo}
        isLoading={isLoading}
        onRowClick={handleRowClick}
      />
    </ListViewWrapper>
  );
}
