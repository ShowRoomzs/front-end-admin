import FilterCard from "@/common/components/FilterCard/FilterCard";
import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Table from "@/common/components/Table/Table";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import { Button } from "@/components/ui/button";
import { COUPON_LIST_COLUMNS } from "@/features/coupon/constants/columns";
import { COUPON_LIST_FILTER_OPTIONS } from "@/features/coupon/constants/filter";
import CreateCouponModal from "@/features/coupon/components/CreateCouponModal";
import { useGetCouponList } from "@/features/coupon/hooks/useGetCouponList";
import type { CouponListParams } from "@/features/coupon/types/coupon";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

const INITIAL_PARAMS: CouponListParams = {
  page: 0,
  size: 20,
  status: null,
};

export default function CouponManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { params, updateLocalParam, localParams, reset, update, updateParam } =
    useParams<CouponListParams>(INITIAL_PARAMS);
  const { data: couponList, isLoading } = useGetCouponList(params);
  const pageInfo = usePaginationInfo({
    data: couponList?.pageInfo,
    onPageChange: (page) => {
      updateParam("page", page);
    },
  });

  return (
    <ListViewWrapper>
      <FilterCard
        options={COUPON_LIST_FILTER_OPTIONS}
        params={localParams}
        onChange={updateLocalParam}
        onSubmit={update}
        onReset={reset}
      />

      <Table
        columns={COUPON_LIST_COLUMNS}
        data={couponList?.content ?? []}
        pageInfo={pageInfo}
        isLoading={isLoading}
        renderFooter={
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="default"
            className="w-fit"
          >
            쿠폰 등록
            <PlusIcon className="w-fit" />
          </Button>
        }
      />

      <CreateCouponModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </ListViewWrapper>
  );
}
