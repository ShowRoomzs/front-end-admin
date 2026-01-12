import { useParams } from "react-router-dom";
import Section from "@/common/components/Section/Section";
import { Button } from "@/components/ui/button";

export default function SellerRegistrationDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">마켓 가입 신청 상세</h1>
        <div className="flex gap-2">
          <Button variant="outline">반려</Button>
          <Button>승인</Button>
        </div>
      </div>

      <Section title="신청자 정보">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">신청 ID</label>
            <p className="mt-1 text-sm">{id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">신청일</label>
            <p className="mt-1 text-sm">2024.01.01</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">이메일</label>
            <p className="mt-1 text-sm">seller@example.com</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">연락처</label>
            <p className="mt-1 text-sm">010-1234-5678</p>
          </div>
        </div>
      </Section>

      <Section title="사업자 정보">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              사업자명
            </label>
            <p className="mt-1 text-sm">주식회사 예시</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              사업자등록번호
            </label>
            <p className="mt-1 text-sm">123-45-67890</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">대표자명</label>
            <p className="mt-1 text-sm">홍길동</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">업종</label>
            <p className="mt-1 text-sm">소매업</p>
          </div>
        </div>
      </Section>

      <Section title="첨부서류">
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="text-sm">사업자등록증.pdf</span>
            <Button variant="outline" size="sm">
              다운로드
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span className="text-sm">통장사본.pdf</span>
            <Button variant="outline" size="sm">
              다운로드
            </Button>
          </div>
        </div>
      </Section>

      <Section title="처리 이력">
        <div className="space-y-3">
          <div className="flex gap-3 text-sm">
            <span className="text-gray-500">2024.01.01 10:00</span>
            <span>신청 접수</span>
          </div>
          <div className="flex gap-3 text-sm">
            <span className="text-gray-500">2024.01.02 14:30</span>
            <span>검토 중</span>
          </div>
        </div>
      </Section>
    </div>
  );
}

