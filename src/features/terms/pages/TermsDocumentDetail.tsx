import DetailCard, {
  FieldRow,
} from "@/common/components/DetailCard/DetailCard";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { formatDateOnly, formatDateTimeShort } from "@/common/utils/formatDate";
import { TERMS_LIST_PATH } from "@/features/terms/pages/TermsManagement";
import { useGetTermsDocument } from "@/features/terms/hooks/useTermsQueries";
import {
  getTermsDocumentVariant,
  getTermsVersionVariant,
} from "@/features/terms/utils/statusBadge";
import type { ReactNode } from "react";
import { useNavigate, useParams as useRouteParams } from "react-router-dom";

/**
 * C2 — 문서 상세 · 버전 이력.
 *
 * 시행 원문은 **조회 전용**이다 — 수정 API가 아예 없다. 유형·대상도 문서 속성이라
 * 여기서는 값만 보여준다(§21-2 · 등록 후 고정).
 *
 * 과거 버전은 삭제하지 않는다. 동의 기록이 "동의한 버전"을 참조하므로, 지우면 과거
 * 동의가 무엇에 대한 동의였는지 확인할 수 없게 된다.
 */
export default function TermsDocumentDetail() {
  const navigate = useNavigate();
  const { documentId: documentIdParam } = useRouteParams<{
    documentId: string;
  }>();
  const documentId = Number(documentIdParam);

  const { data: detail, isLoading } = useGetTermsDocument(documentId);

  if (isLoading || !detail) {
    return (
      <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center text-[12px] text-sz-n-500">
        {isLoading ? "불러오는 중…" : "문서를 찾을 수 없습니다."}
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-sz-n-900">
            {detail.name}
          </h1>
          <p className="mt-0.5 text-[12px] text-sz-n-600">
            {detail.typeName} · {detail.targetName}
            {detail.version ? ` · 현재 ${detail.version}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(TERMS_LIST_PATH)}
          className="inline-flex h-8 items-center rounded-[6px] border border-sz-n-300 bg-white px-3 text-[12px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100 hover:text-sz-n-900"
        >
          목록
        </button>
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex flex-col gap-4">
          <DetailCard title="문서 정보">
            <FieldRow label="유형">
              {/* 유형은 상태가 아니라 문서 속성이라 점 없는 중립 배지다 */}
              <StatusBadge variant="neutral" hideDot>
                {detail.typeName}
              </StatusBadge>
            </FieldRow>
            <FieldRow label="대상">{detail.targetName}</FieldRow>
            <FieldRow label="시행 버전">
              {detail.version ? (
                <>
                  <b className="font-semibold tabular-nums">{detail.version}</b>
                  {detail.effectiveDate
                    ? ` · ${formatDateOnly(detail.effectiveDate)} 시행`
                    : ""}
                </>
              ) : (
                <span className="text-sz-n-500">—</span>
              )}
            </FieldRow>
            <FieldRow label="보관 버전">
              과거 버전 {detail.pastVersionCount}개 — 동의 기록이 참조하므로
              삭제하지 않습니다
            </FieldRow>
          </DetailCard>

          <DetailCard
            title="시행 원문"
            note={
              detail.version ? `${detail.version} · 조회 전용` : "조회 전용"
            }
          >
            <div className="pt-2">
              {detail.content ? (
                /*
                  약관 원문은 조항 단위 줄바꿈이 곧 의미 구분이라 그대로 보존한다.
                  높이를 320px로 묶고 안쪽만 스크롤시켜 우측 카드가 밀려나지 않게 한다.
                */
                <div className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-[18px] py-4 text-[13px] leading-[1.9] text-sz-n-900">
                  {detail.content}
                </div>
              ) : (
                <p className="py-3 text-[12px] text-sz-n-500">
                  아직 시행 중인 버전이 없습니다.
                </p>
              )}
            </div>
          </DetailCard>

          <DetailCard
            title="버전 이력"
            note="행 클릭 → 버전 상세 · 과거 버전은 전부 보관"
            flushBody
          >
            {/*
              공용 `Table`을 쓰지 않는다 — 페이지네이션·빈 상태·정렬이 필요 없는
              카드 내부 목록이고, 문서당 버전은 많아도 열 개 단위다.
            */}
            <table className="w-full">
              <thead>
                <tr className="border-b border-sz-n-200 bg-sz-n-100 text-[11px] font-medium text-sz-n-600">
                  <th className="px-4 py-2.5 text-left">버전</th>
                  <th className="px-4 py-2.5 text-left">시행일</th>
                  <th className="px-4 py-2.5 text-left">등록자</th>
                  <th className="px-4 py-2.5 text-left">등록일시</th>
                  <th className="px-4 py-2.5 text-center">상태</th>
                </tr>
              </thead>
              <tbody>
                {detail.versions.map((version) => (
                  <tr
                    key={version.versionId}
                    onClick={() =>
                      navigate(
                        `${TERMS_LIST_PATH}/${detail.documentId}/versions/${version.versionId}`
                      )
                    }
                    className="cursor-pointer border-t border-sz-n-100 text-[12px] hover:bg-sz-accent-50"
                  >
                    <td className="px-4 py-3 font-medium tabular-nums text-sz-n-900">
                      {version.version}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-sz-n-900">
                      {formatDateOnly(version.effectiveDate)}
                    </td>
                    <td className="px-4 py-3 text-sz-n-900">
                      {version.registrantName}
                    </td>
                    <td className="px-4 py-3 text-[11px] tabular-nums text-sz-n-500">
                      {formatDateTimeShort(version.registeredAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge
                        variant={getTermsVersionVariant(version.status)}
                      >
                        {version.statusName}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DetailCard>
        </div>

        <div className="sticky top-0 flex flex-col gap-4">
          <DetailCard title="현재 시행">
            <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3 pt-2">
              <span className="text-[12px] text-sz-n-500">상태</span>
              <StatusBadge variant={getTermsDocumentVariant(detail.status)}>
                {detail.statusName}
              </StatusBadge>
            </div>

            <div className="pt-2">
              <MetaRow label="버전" value={detail.version ?? "—"} />
              <MetaRow
                label="시행일"
                value={formatDateOnly(detail.effectiveDate)}
              />
              <MetaRow label="등록자" value={detail.registrantName ?? "—"} />
            </div>

            {/* 구버전 문서에는 버튼을 두지 않는다 — 새 버전을 붙일 대상이 아니다 */}
            {detail.canRegisterNewVersion ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `${TERMS_LIST_PATH}/${detail.documentId}/versions/register`
                    )
                  }
                  className="inline-flex h-9 w-full items-center justify-center rounded-[6px] bg-sz-accent-500 px-3.5 text-[12px] font-medium text-white hover:bg-sz-accent-600"
                >
                  새 버전 등록
                </button>
              </div>
            ) : (
              <p className="mb-2 mt-4 text-[11px] leading-[1.55] text-sz-n-500">
                후속 문서로 대체된 구버전 문서입니다. 새 버전을 붙일 수 없고
                조회만 가능합니다.
              </p>
            )}
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

/** 시안 `.mrow` — 라벨 좌 · 값 우 정렬의 메타 정보 한 줄 */
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
