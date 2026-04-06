import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NoticeManagement() {
  const navigate = useNavigate();

  return (
    <ListViewWrapper>
      <div className="flex flex-row items-center justify-end gap-2 mb-4">
        <Button
          onClick={() => navigate("/support/notice/register")}
          variant="default"
          className="w-fit"
        >
          공지사항 등록
          <PlusIcon className="w-fit" />
        </Button>
      </div>

      <div className="flex items-center justify-center h-64 border border-dashed border-gray-300 rounded-md">
        <p className="text-gray-500">리스트 API 연동 대기 중</p>
      </div>
    </ListViewWrapper>
  );
}