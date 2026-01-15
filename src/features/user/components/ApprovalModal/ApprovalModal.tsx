import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UpdateSellerRegistrationStatusData } from "@/features/seller/services/sellerService";

interface ApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientEmail: string;
  onApproval: (data: UpdateSellerRegistrationStatusData) => Promise<void>;
}

export default function ApprovalModal(props: ApprovalModalProps) {
  const { open, onOpenChange, recipientEmail, onApproval } = props;
  const handleApprove = () => {
    onApproval({
      status: "APPROVED",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            가입 신청 승인
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-center text-sm text-gray-600">
            해당 셀러에게 가입 승인 메일을 보내시겠습니까?
            <br />
            받는 이메일 {recipientEmail}로 가입 승인 사유를 안내합니다.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sender" className="text-sm font-medium">
                발신 메일 확인
              </Label>
              <Input
                id="sender"
                value="발신자 메일"
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
                value="[SHOWROOMZ] 마켓 가입이 승인되었습니다."
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-24"
          >
            취소
          </Button>
          <Button
            onClick={handleApprove}
            className="w-24 bg-emerald-500 hover:bg-emerald-600"
          >
            승인 메일 발송
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
