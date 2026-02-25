import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import { Button } from "@/components/ui/button";
import CreateCouponModal from "@/features/coupon/components/CreateCouponModal";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

export default function CouponManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <ListViewWrapper>
      <div className="flex flex-row justify-end gap-2 items-center mb-4">
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="default"
          className="w-fit"
        >
          쿠폰 등록
          <PlusIcon className="w-fit" />
        </Button>
      </div>

      <div className="flex items-center justify-center h-64 border border-dashed border-gray-300 rounded-md">
        <p className="text-gray-500">리스트 API 연동 대기 중</p>
      </div>

      <CreateCouponModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </ListViewWrapper>
  );
}
