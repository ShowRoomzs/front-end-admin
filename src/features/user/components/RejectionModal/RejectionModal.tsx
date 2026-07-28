import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type {
  RejectionReason,
  UpdateSellerRegistrationStatusData,
} from "@/features/seller/services/sellerService";

interface RejectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientEmail: string;
  onReject: (data: UpdateSellerRegistrationStatusData) => Promise<void>;
}

// 백엔드 RejectionReasonType enum과 일치하는 값만 사용한다.
// (브랜드 입점 심사 전용 모달은 features/seller/components 쪽으로 분리됨)
const REJECTION_REASONS: Array<{ value: RejectionReason; label: string }> = [
  { value: "BUSINESS_REG_NUMBER_MISMATCH", label: "사업자등록번호 불일치" },
  { value: "MAIL_ORDER_REPORT_INCOMPLETE", label: "통신판매업 신고 미완료" },
  { value: "INSUFFICIENT_DOCUMENTS", label: "첨부 서류 부실·누락" },
  { value: "OTHER", label: "기타" },
];

export default function RejectionModal(props: RejectionModalProps) {
  const { open, onOpenChange, recipientEmail, onReject } = props;
  const [selectedReason, setSelectedReason] = useState<RejectionReason>(
    "BUSINESS_REG_NUMBER_MISMATCH"
  );
  const [otherReason, setOtherReason] = useState("");

  const handleReject = async () => {
    onReject({
      rejectionReasonType: selectedReason,
      rejectionReasonDetail:
        selectedReason === "OTHER" ? otherReason : undefined,
      status: "REJECTED",
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // 모달이 닫힐 때 상태 초기화
      setSelectedReason("BUSINESS_REG_NUMBER_MISMATCH");
      setOtherReason("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            가입 신청 반려
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-center text-sm text-gray-600">
            해당 셀러에게 가입 반려 메일을 보내시겠습니까?
            <br />
            받는 이메일 {recipientEmail}로 가입 반려 사유를 안내합니다.
          </p>

          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-red-600">
                반려 사유 선택
              </Label>
              <RadioGroup
                value={selectedReason}
                onValueChange={(value) =>
                  setSelectedReason(value as RejectionReason)
                }
                className="space-y-3"
              >
                {REJECTION_REASONS.map((reason) => (
                  <div
                    key={reason.value}
                    className="flex items-center gap-3 h-[20px]"
                  >
                    <RadioGroupItem value={reason.value} id={reason.value} />
                    <Label
                      htmlFor={reason.value}
                      className="cursor-pointer text-sm font-normal items"
                    >
                      {reason.label}
                    </Label>
                    {reason.value === "OTHER" && selectedReason === "OTHER" && (
                      <Input
                        placeholder="사유를 입력해 주세요."
                        value={otherReason}
                        onChange={(e) => setOtherReason(e.target.value)}
                        className="flex-1 min-w-[385px]"
                      />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender" className="text-sm font-medium">
                발신
              </Label>
              <Input
                id="sender"
                value={"발신자 이메일"}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-sm font-medium">
                수신자
              </Label>
              <Input
                id="recipient"
                value={recipientEmail}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium">
                제목
              </Label>
              <Input
                id="subject"
                value="[SHOWROOMZ] 마켓 가입이 반려되었습니다."
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="w-24"
          >
            취소
          </Button>
          <Button
            onClick={handleReject}
            className="w-24 bg-red-500 hover:bg-red-600"
          >
            반려 메일 발송
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
