import DetailCard, {
  FieldRow,
} from "@/common/components/DetailCard/DetailCard";
import RecordNav from "@/common/components/RecordNav/RecordNav";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { formatDateOnly, formatDateTimeShort } from "@/common/utils/formatDate";
import { useGetTermsVersion } from "@/features/terms/hooks/useTermsQueries";
import { TERMS_LIST_PATH } from "@/features/terms/pages/TermsManagement";
import { getTermsVersionVariant } from "@/features/terms/utils/statusBadge";
import type { ReactNode } from "react";
import { useNavigate, useParams as useRouteParams } from "react-router-dom";

/**
 * C5 — 버전 상세 (조회 전용).
 *
 * **액션이 없다** — 수정도 삭제도 불가하다. 동의 기록이 이 버전을 참조하므로 원문은
 * 영구 보관된다(§21-4). 시행중 버전도 같은 화면을 쓰고 상태 배지만 다르다.
 *
 * 이전/다음은 같은 문서의 버전 축을 오간다 — `‹ 이전`이 더 오래된 버전이다.
 */
export default function TermsVersionDetail() {
  const navigate = useNavigate();
  const { documentId: documentIdParam, versionId: versionIdParam } =
    useRouteParams<{ documentId: string; versionId: string }>();
  const documentId = Number(documentIdParam);
  const versionId = Number(versionIdParam);

  const { data: detail, isLoading } = useGetTermsVersion(documentId, versionId);

  if (isLoading || !detail) {
    return (
      <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center text-[12px] text-sz-n-500">
        {isLoading ? "불러오는 중…" : "버전을 찾을 수 없습니다."}
      </div>
    );
  }

  const versionPath = (id: number) =>
    `${TERMS_LIST_PATH}/${documentId}/versions/${id}`;

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-sz-n-900">
            {detail.documentName} {detail.version}
          </h1>
          <p className="mt-0.5 text-[12px] text-sz-n-600">
            {detail.typeName} · {detail.targetName} · {detail.statusName}
          </p>
        </div>

        <RecordNav
          // [목록]은 문서 상세로 돌아간다 — 여기까지 온 경로가 문서의 버전 이력이다
          onList={() => navigate(`${TERMS_LIST_PATH}/${documentId}`)}
          onPrev={
            detail.previousVersionId
              ? () => navigate(versionPath(detail.previousVersionId as number))
              : undefined
          }
          onNext={
            detail.nextVersionId
              ? () => navigate(versionPath(detail.nextVersionId as number))
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex flex-col gap-4">
          <DetailCard title="버전 정보">
            <FieldRow label="유형">
              {detail.typeName} · {detail.targetName}
            </FieldRow>
            <FieldRow label="버전">
              <span className="tabular-nums">{detail.version}</span>
            </FieldRow>
            <FieldRow label="시행 기간">
              {/* 종료일이 없으면 아직 교체되지 않은 버전이다(시행중·시행 예정) */}
              <span className="tabular-nums">
                {formatDateOnly(detail.effectiveStartDate)} ~{" "}
                {detail.effectiveEndDate
                  ? formatDateOnly(detail.effectiveEndDate)
                  : "현재"}
              </span>
            </FieldRow>
            <FieldRow label="등록자">
              {detail.registrantName} ·{" "}
              <span className="tabular-nums">
                {formatDateTimeShort(detail.registeredAt)}
              </span>
            </FieldRow>
          </DetailCard>

          <DetailCard
            title="약관 본문"
            note="조회 전용 · 등록된 원문은 수정할 수 없음"
          >
            <div className="pt-2">
              <div className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-[18px] py-4 text-[13px] leading-[1.9] text-sz-n-900">
                {detail.content}
              </div>
            </div>
          </DetailCard>
        </div>

        <div className="sticky top-0">
          {/* 액션 버튼 자리가 없는 카드다 — 여기에 수정·삭제를 추가하지 말 것 */}
          <DetailCard title="이 버전">
            <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3 pt-2">
              <span className="text-[12px] text-sz-n-500">상태</span>
              <StatusBadge variant={getTermsVersionVariant(detail.status)}>
                {detail.statusName}
              </StatusBadge>
            </div>

            <div className="pt-2">
              <MetaRow label="다음 버전" value={detail.nextVersion ?? "—"} />
              <MetaRow
                label="교체일"
                value={
                  detail.replacedAt ? formatDateOnly(detail.replacedAt) : "—"
                }
              />
            </div>

            <p className="mb-2 mt-4 text-[11px] leading-[1.55] text-sz-n-500">
              동의 기록이 이 버전을 참조하므로 원문은 삭제되지 않고 영구
              보관됩니다.
            </p>
          </DetailCard>
        </div>
      </div>
    </>
  );
}

interface MetaRowProps {
  label: string;
  value: ReactNode;
}

function MetaRow(props: MetaRowProps) {
  const { label, value } = props;

  return (
    <div className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0">
      <span className="text-sz-n-500">{label}</span>
      <span className="text-right font-medium tabular-nums text-sz-n-900">
        {value}
      </span>
    </div>
  );
}
