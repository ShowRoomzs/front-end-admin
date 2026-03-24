import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Section from "@/common/components/Section/Section";
import { Button } from "@/components/ui/button";
import { useGetCreatorApplicationDetail } from "@/features/creator/hooks/useGetCreatorApplicationDetail";
import { creatorService } from "@/features/creator/services/creatorService";
import { formatDate } from "@/common/utils/formatDate";
import ApprovalModal from "@/features/user/components/ApprovalModal/ApprovalModal";
import RejectionModal from "@/features/user/components/RejectionModal/RejectionModal";
import type { UpdateSellerRegistrationStatusData } from "@/features/seller/services/sellerService";
import type { UpdateCreatorApplicationStatusData } from "@/features/creator/services/creatorService";
import toast from "react-hot-toast";
import { queryClient } from "@/common/lib/queryClient";
import { CREATOR_APPLICATION_DETAIL_QUERY_KEY } from "@/features/creator/constants/queryKey";

export default function CreatorApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: detail } = useGetCreatorApplicationDetail(Number(id));
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);

  const handleCancel = () => {
    navigate(-1);
  };

  const cleanUp = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [CREATOR_APPLICATION_DETAIL_QUERY_KEY, Number(id)],
    });
  }, [id]);

  const handleReject = useCallback(
    async (data: UpdateSellerRegistrationStatusData) => {
      const body: UpdateCreatorApplicationStatusData = { status: data.status };
      await creatorService.updateCreatorApplicationStatus(Number(id), body);
      cleanUp();
      setIsRejectionModalOpen(false);
      toast.success("크리에이터 가입 신청이 반려되었습니다.");
    },
    [cleanUp, id]
  );

  const handleApproval = useCallback(
    async (data: UpdateSellerRegistrationStatusData) => {
      const body: UpdateCreatorApplicationStatusData = { status: data.status };
      await creatorService.updateCreatorApplicationStatus(Number(id), body);
      cleanUp();
      setIsApprovalModalOpen(false);
      toast.success("크리에이터 가입 신청이 승인되었습니다.");
    },
    [cleanUp, id]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">크리에이터 가입 신청 상세</h1>
      </div>

      <Section title="계정 정보">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">신청일</label>
            <p className="mt-1 text-sm">
              {formatDate(detail?.createdAt as string)}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">이메일</label>
            <p className="mt-1 text-sm">{detail?.email}</p>
          </div>
        </div>
      </Section>

      <Section title="크리에이터 정보">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">이름</label>
            <p className="mt-1 text-sm">{detail?.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              전화번호
            </label>
            <p className="mt-1 text-sm">{detail?.phoneNumber}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">활동명</label>
            <p className="mt-1 text-sm">{detail?.activityName}</p>
          </div>
        </div>
      </Section>

      <Section title="플랫폼 정보">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              플랫폼 유형
            </label>
            <p className="mt-1 text-sm">{detail?.platformType}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              플랫폼 URL
            </label>
            <p className="mt-1 text-sm">{detail?.platformUrl}</p>
          </div>
        </div>
      </Section>

      <Section title="쇼룸 정보">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">쇼룸명</label>
            <p className="mt-1 text-sm">{detail?.showroomName}</p>
          </div>
        </div>
      </Section>

      <div className="flex gap-2 justify-end w-full">
        <Button onClick={handleCancel} variant="outline">
          취소
        </Button>
        <Button
          disabled={detail?.status !== "PENDING"}
          variant="outline"
          onClick={() => setIsRejectionModalOpen(true)}
        >
          반려
        </Button>
        <Button
          disabled={detail?.status !== "PENDING"}
          onClick={() => setIsApprovalModalOpen(true)}
        >
          승인
        </Button>
      </div>

      <ApprovalModal
        open={isApprovalModalOpen}
        onOpenChange={setIsApprovalModalOpen}
        recipientEmail={detail?.email ?? ""}
        onApproval={handleApproval}
      />
      <RejectionModal
        onReject={handleReject}
        open={isRejectionModalOpen}
        onOpenChange={setIsRejectionModalOpen}
        recipientEmail={detail?.email ?? ""}
      />
    </div>
  );
}
