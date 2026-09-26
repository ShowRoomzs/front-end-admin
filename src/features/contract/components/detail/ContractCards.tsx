import DetailCard from "@/common/components/DetailCard/DetailCard";
import { formatFileSize } from "@/common/utils/formatFileSize";
import { formatMonthDayTime } from "@/features/contract/utils/datetime";
import { formatDateOnly } from "@/common/utils/formatDate";
import Btn from "@/features/contract/components/shared/Btn";
import { TermRow, Terms } from "@/features/contract/components/shared/Terms";
import { FieldRow, FLink } from "@/features/contract/components/detail/Rows";
import type {
  AdminContractDetail,
  AdminContractDocument,
  ContractStatus,
} from "@/features/contract/types";
import {
  formatKRW,
  formatPercent,
  periodText,
} from "@/features/contract/utils/format";
import type { ReactNode } from "react";

/** 계약 조건 카드 헤더 캡션 — 상태마다 「왜 고칠 수 없는지」를 적는다(시안 B1~B6) */
function termsNote(status: ContractStatus) {
  switch (status) {
    case "REVIEW_PENDING":
      return "운영자는 조건을 고칠 수 없습니다 — 양측이 서명할 대상이 바뀌면 안 됩니다";
    case "REVIEW_REJECTED":
      return "반려로 브랜드 편집이 다시 열렸습니다 — 운영자는 이후에도 조건을 고칠 수 없습니다";
    case "SIGNING":
      return "서명이 시작돼 수정할 수 없습니다 — 서명 대상이 바뀌면 안 됩니다";
    case "CONCLUSION_PENDING":
      return "서명이 완료돼 수정할 수 없습니다";
    case "CONCLUDED":
      return "체결된 계약입니다 — 조건은 공구와 정산이 그대로 상속합니다";
    default:
      return "종결된 계약 · 읽기 전용";
  }
}

interface TermsCardProps {
  detail: AdminContractDetail;
  /** B1 — 조건 카드 맨 위의 계약서 생성본 다운로드 슬롯 */
  draftSlot?: ReactNode;
  onOpenThread?: () => void;
  onOpenBrand: () => void;
  onOpenCreator: () => void;
}

/**
 * 시안 「계약 조건」 — 파트너 B3c·B4b의 읽기 전용 카드에 **브랜드·인플루언서 2행**만 더했다
 * (파트너는 「계약 상대」 1행, 스튜디오는 「브랜드」 1행 — 운영자는 양측이 다 보여야 한다).
 * 수정 필드는 한 곳도 없다: 문제가 있으면 반려한다.
 */
export function TermsCard(props: TermsCardProps) {
  const { detail, draftSlot, onOpenThread, onOpenBrand, onOpenCreator } = props;
  const { contract, fixedFee } = detail;
  const period = periodText(contract.startAt, contract.endAt);

  return (
    <DetailCard
      title="계약 조건"
      note={
        <span className="flex items-center gap-3">
          <span>{termsNote(contract.status)}</span>
          {onOpenThread && (
            <FLink onClick={onOpenThread}>연결·소통 스레드 열기 ↗</FLink>
          )}
        </span>
      }
    >
      <div className="pt-3">
        {draftSlot}
        <FieldRow label="브랜드">
          {contract.brand.name} <FLink onClick={onOpenBrand}>브랜드 상세</FLink>
        </FieldRow>
        <FieldRow label="인플루언서">
          {contract.creator ? (
            <>
              {contract.creator.name}{" "}
              <FLink onClick={onOpenCreator}>인플루언서 상세</FLink>
            </>
          ) : (
            "—"
          )}
        </FieldRow>
        <FieldRow
          label="공구명"
          sub="내부 관리용 식별명 · 소비자 노출 제목과 별개"
        >
          {contract.title ?? "—"}
        </FieldRow>
        <FieldRow label="공구 기간">
          {period ? (
            <>
              <span className="tabular-nums">{period}</span>
              {contract.days !== null && (
                <span className="text-sz-n-500"> ({contract.days}일)</span>
              )}
            </>
          ) : (
            "—"
          )}
        </FieldRow>
        <FieldRow
          label="고정 지급비"
          sub={
            fixedFee.amount ? (
              <>
                지급 시점{" "}
                <b className="font-semibold">{fixedFee.triggerLabel ?? "—"}</b>{" "}
                · 브랜드 직접 지급 · 플랫폼 미중개
              </>
            ) : (
              "지급하지 않음"
            )
          }
        >
          <span className="tabular-nums">{formatKRW(fixedFee.amount)}</span>
        </FieldRow>
      </div>
    </DetailCard>
  );
}

/** 시안 「계약 상품 항목」 — `.terms` 한 행에 정가·공구가·리워드율·예상 리워드·최소 물량 */
export function ItemsCard(props: { detail: AdminContractDetail }) {
  const { items } = props.detail;
  return (
    <DetailCard
      title="계약 상품 항목"
      note={`${items.length}건 · 정산이 이 리워드율을 사용합니다`}
    >
      <div className="pt-3">
        <Terms>
          {items.map((item) => (
            <TermRow
              key={item.contractItemId}
              label={item.productName ?? "(상품 미선택)"}
              labelWidth={176}
            >
              <span className="tabular-nums">
                정가 {formatKRW(item.regularPrice)} · 공구가{" "}
                <b className="font-semibold text-sz-n-900">
                  {formatKRW(item.groupBuyPrice)}
                </b>{" "}
                · 리워드율{" "}
                <b className="font-semibold text-sz-n-900">
                  {formatPercent(item.rewardRate)}
                </b>{" "}
                · 예상 리워드 {formatKRW(item.unitReward)} · 최소 물량{" "}
                <b className="font-semibold text-sz-n-900">
                  {item.minQuantity ?? "—"}개
                </b>
              </span>
            </TermRow>
          ))}
        </Terms>
      </div>
    </DetailCard>
  );
}

/** 시안 「콘텐츠 의무」 */
export function ContentCard(props: { detail: AdminContractDetail }) {
  const { content } = props.detail;
  const formats = [
    content.feedCount ? `피드 ${content.feedCount}` : null,
    content.reelsCount ? `릴스 ${content.reelsCount}` : null,
    content.storyCount ? `스토리 ${content.storyCount}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <DetailCard title="콘텐츠 의무">
      <div className="pt-3">
        <FieldRow label="게시 포맷·수량">{formats || "—"}</FieldRow>
        <FieldRow
          label="게시 완료 기한"
          sub={formats ? `${formats} 전부를 이 날짜까지 게시` : undefined}
        >
          <span className="tabular-nums">
            {content.dueDate ? formatDateOnly(content.dueDate) : "—"}
          </span>
        </FieldRow>
        <FieldRow
          label="2차 활용권"
          sub={
            content.secondaryUseAllowed ? "허용 범위는 비고 참조" : undefined
          }
        >
          {content.secondaryUseAllowed ? "허용" : "불허"}
        </FieldRow>
        {content.secondaryUseAllowed && (
          <FieldRow label="2차 활용 기간">
            {content.secondaryUsePeriodType === "UNLIMITED"
              ? "무기한"
              : `기간 지정 · ${content.secondaryUseMonths ?? "—"}개월`}
          </FieldRow>
        )}
        <FieldRow
          label="브랜드 사전 검수"
          sub={
            content.brandPreReview ? "게시 전 초안을 스레드로 확인" : undefined
          }
        >
          {content.brandPreReview ? "있음" : "없음"}
        </FieldRow>
        {content.note && <FieldRow label="비고">{content.note}</FieldRow>}
      </div>
    </DetailCard>
  );
}

/** 시안 `.upl` — 파일 슬롯 한 줄 */
export function FileSlot(props: {
  name: ReactNode;
  meta?: ReactNode;
  done: boolean;
  action?: ReactNode;
}) {
  const { name, meta, done, action } = props;
  return (
    <div
      className={
        done
          ? "flex items-center gap-2.5 rounded-[6px] border border-sz-n-200 bg-white px-[13px] py-[11px] text-[12px] text-sz-n-900"
          : "flex items-center gap-2.5 rounded-[6px] border border-dashed border-sz-n-300 bg-sz-n-50 px-[13px] py-[11px] text-[12px] text-sz-n-600"
      }
    >
      <span className="min-w-0 flex-1 truncate">
        {name}
        {meta && <span className="text-[11px] text-sz-n-500"> · {meta}</span>}
      </span>
      {action}
    </div>
  );
}

interface DocumentsCardProps {
  documents: Array<AdminContractDocument>;
  /** 문서별 용량(바이트) — 받기 전이면 비어 있다 */
  sizes?: Partial<Record<AdminContractDocument["type"], number | null>>;
  /** B4 업로드 모드 · B5 내려받기 모드 */
  mode: "upload" | "download";
  uploadingType: "SIGNED_PDF" | "AUDIT_TRAIL" | null;
  onPick: (type: "SIGNED_PDF" | "AUDIT_TRAIL") => void;
  onDownload: (type: "SIGNED_PDF" | "AUDIT_TRAIL") => void;
}

const DOC_SLOTS: Array<{
  type: "SIGNED_PDF" | "AUDIT_TRAIL";
  label: string;
}> = [
  { type: "SIGNED_PDF", label: "서명 PDF" },
  { type: "AUDIT_TRAIL", label: "감사추적인증서" },
];

/**
 * 시안 「체결 문서」 — API를 쓰지 않아 PDF·감사추적인증서가 자동 수신되지 않으므로
 * 운영자가 모두싸인에서 내려받아 올린다(B4). 체결 후(B5)에는 교체·삭제 불가인 **단일 원본**이다.
 */
export function DocumentsCard(props: DocumentsCardProps) {
  const { documents, sizes, mode, uploadingType, onPick, onDownload } = props;
  const find = (type: string) =>
    documents.find((document) => document.type === type && document.exists);

  return (
    <DetailCard
      title="체결 문서"
      note={
        mode === "upload" ? (
          "모두싸인에서 내려받아 업로드 — 자동 수신되지 않습니다"
        ) : (
          <>
            체결 시 업로드된 원본 — 교체·삭제 불가 ·{" "}
            <b className="font-semibold">
              브랜드·인플루언서도 각자 화면에서 내려받습니다
            </b>
          </>
        )
      }
    >
      <div className="flex flex-col gap-2 pt-3">
        {DOC_SLOTS.map((slot) => {
          const document = find(slot.type);
          if (document) {
            return (
              <FileSlot
                key={slot.type}
                done
                name={document.fileName ?? slot.label}
                meta={
                  // 시안: 「1.2MB · 08.14 12:02 업로드」(체결 후엔 「업로드」 없이 시각만)
                  [
                    sizes?.[slot.type] != null
                      ? formatFileSize(sizes[slot.type] as number)
                      : null,
                    document.uploadedAt
                      ? `${formatMonthDayTime(document.uploadedAt)}${mode === "upload" ? " 업로드" : ""}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || undefined
                }
                action={
                  mode === "upload" ? (
                    <Btn
                      variant="secondary"
                      isLoading={uploadingType === slot.type}
                      onClick={() => onPick(slot.type)}
                    >
                      교체
                    </Btn>
                  ) : (
                    <Btn
                      variant="secondary"
                      onClick={() => onDownload(slot.type)}
                    >
                      내려받기
                    </Btn>
                  )
                }
              />
            );
          }
          return (
            <FileSlot
              key={slot.type}
              done={false}
              name={`${slot.label} — 아직 올리지 않았습니다`}
              action={
                mode === "upload" ? (
                  <Btn
                    variant="secondary"
                    isLoading={uploadingType === slot.type}
                    onClick={() => onPick(slot.type)}
                  >
                    파일 선택
                  </Btn>
                ) : undefined
              }
            />
          );
        })}
        {mode === "upload" && (
          <p className="mt-0.5 text-[11px] leading-[1.55] text-sz-n-500">
            두 파일이 <b className="font-semibold">모두 올라와야</b> 체결 완료를
            누를 수 있습니다. PDF만 올릴 수 있습니다.
          </p>
        )}
      </div>
    </DetailCard>
  );
}
