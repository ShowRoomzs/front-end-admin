import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Section from "@/common/components/Section/Section";
import { Button } from "@/components/ui/button";
import { useGetSellerRegistrationDetail } from "@/features/user/hooks/useGetSellerRegistrationDetail";
import { formatDate } from "@/common/utils/formatDate";
import ApprovalModal from "@/features/user/components/ApprovalModal";
import RejectionModal from "@/features/user/components/RejectionModal";
import {
  sellerService,
  type UpdateSellerRegistrationStatusData,
} from "@/features/user/services/sellerService";
import toast from "react-hot-toast";

export default function SellerRegistrationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: sellerRegistrationDetail } = useGetSellerRegistrationDetail(
    Number(id)
  );
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);

  const handleCancel = () => {
    navigate(-1);
  };

  const handleReject = useCallback(
    async (data: UpdateSellerRegistrationStatusData) => {
      await sellerService.updateSellerRegistrationStatus(Number(id), data);
      setIsRejectionModalOpen(false);
      toast.success("마켓 가입 신청이 반려되었습니다.");
    },
    [id]
  );

  const handleApproval = useCallback(
    async (data: UpdateSellerRegistrationStatusData) => {
      await sellerService.updateSellerRegistrationStatus(Number(id), data);
      setIsApprovalModalOpen(false);
      toast.success("마켓 가입 신청이 승인되었습니다.");
    },
    [id]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">마켓 가입 신청 상세</h1>
      </div>

      <Section title="계정 정보">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">신청 ID</label>
            <p className="mt-1 text-sm">{id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">신청일</label>
            <p className="mt-1 text-sm">
              {formatDate(sellerRegistrationDetail?.createdAt as string)}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">이메일</label>
            <p className="mt-1 text-sm">{sellerRegistrationDetail?.email}</p>
          </div>
        </div>
      </Section>

      <Section title="셀러 정보">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              판매 담당자 이름
            </label>
            <p className="mt-1 text-sm">{sellerRegistrationDetail?.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              판매 담당자 전화번호
            </label>
            <p className="mt-1 text-sm">
              {sellerRegistrationDetail?.phoneNumber}
            </p>
          </div>
        </div>
      </Section>
      <Section title="마켓 정보">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">마켓명</label>
            <p className="mt-1 text-sm">
              {sellerRegistrationDetail?.marketName}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              고객센터 전화번호
            </label>
            <p className="mt-1 text-sm">{/* {sellerRegistrationDetail?.} */}</p>
          </div>
        </div>
      </Section>
      <div className="flex gap-2 justify-end w-full">
        <Button onClick={handleCancel} variant="outline">
          취소
        </Button>
        <Button
          disabled={sellerRegistrationDetail?.status !== "PENDING"}
          variant="outline"
          onClick={() => setIsRejectionModalOpen(true)}
        >
          반려
        </Button>
        <Button
          disabled={sellerRegistrationDetail?.status !== "PENDING"}
          onClick={() => setIsApprovalModalOpen(true)}
        >
          승인
        </Button>
      </div>

      <ApprovalModal
        open={isApprovalModalOpen}
        onOpenChange={setIsApprovalModalOpen}
        recipientEmail={sellerRegistrationDetail?.email || ""}
        onApproval={handleApproval}
      />
      <RejectionModal
        onReject={handleReject}
        open={isRejectionModalOpen}
        onOpenChange={setIsRejectionModalOpen}
        recipientEmail={sellerRegistrationDetail?.email || ""}
      />
    </div>
  );
}
