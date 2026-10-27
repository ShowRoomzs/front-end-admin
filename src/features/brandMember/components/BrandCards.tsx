import NotReady from "@/common/components/NotReady/NotReady";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type {
  AdminBrandConnectedCreator,
  AdminBrandDetail,
  BrandRecentInquiry,
} from "@/features/brandMember/types";
import DetailTable from "@/features/memberShared/components/DetailTable";
import {
  EmptyLine,
  ExternalAnchor,
  FieldGrid,
  Gone,
  Kpi4,
  MemberCard,
} from "@/features/memberShared/components/parts";
import {
  FLINK_CLASS,
  HMORE_CLASS,
  T_MAIN_CLASS,
  T_SUB_CLASS,
} from "@/features/memberShared/constants/styles";
import {
  eventDate,
  eventMonthDay,
  toneVariant,
  won,
} from "@/features/memberShared/utils/format";
import type { ReactNode } from "react";

/** 파기된 값은 「— 파기됨」, 원래 없는 값은 「—」 — `purged`가 둘을 가른다 */
function valueOr(value: ReactNode, purged: boolean) {
  if (value !== null && value !== undefined && value !== "") return value;
  return purged ? <Gone /> : "—";
}

/** 좌측 상단 4카드 — 기본 · 사업자 · 정산 · 배송반품(사실 조회) */
export function BrandInfoCards(props: {
  detail: AdminBrandDetail;
  onOpenChangeRequest: (requestId: number) => void;
}) {
  const { detail, onOpenChangeRequest } = props;
  const { basicInfo, businessInfo, settlementInfo, deliveryPolicy, purged } =
    detail;
  const pending = settlementInfo.pendingChangeRequests;
  const lead = deliveryPolicy?.shipLeadLastChange;

  return (
    <>
      <MemberCard
        title="기본 정보"
        note={<span className="tabular-nums">{detail.brandNo}</span>}
      >
        <FieldGrid
          items={[
            { label: "브랜드명", value: <b>{detail.brandName}</b> },
            {
              label: "담당자명",
              value: valueOr(basicInfo.managerName, purged),
            },
            {
              label: "담당자 연락처",
              value: valueOr(
                basicInfo.managerContact && (
                  <span className="tabular-nums">
                    {basicInfo.managerContact}
                  </span>
                ),
                purged
              ),
            },
            { label: "이메일", value: valueOr(basicInfo.email, purged) },
            {
              label: "사이트",
              value: valueOr(
                basicInfo.siteUrl && <ExternalAnchor url={basicInfo.siteUrl} />,
                purged
              ),
            },
            {
              label: "가입일",
              value: (
                <span className="tabular-nums">
                  {eventDate(basicInfo.joinedAt)}
                </span>
              ),
            },
            {
              label: "입점 승인일",
              value: (
                <span className="tabular-nums">
                  {eventDate(basicInfo.approvedAt)}
                </span>
              ),
            },
          ]}
        />
      </MemberCard>

      <MemberCard
        title="사업자 정보"
        note={purged ? "탈퇴로 파기됨" : undefined}
      >
        <FieldGrid
          items={[
            {
              label: "사업자 구분",
              value: valueOr(businessInfo.businessType, purged),
            },
            { label: "상호", value: valueOr(businessInfo.companyName, purged) },
            {
              label: "대표자명",
              value: valueOr(businessInfo.representativeName, purged),
            },
            {
              label: "사업자등록번호",
              value: valueOr(businessInfo.businessRegistrationNumber, purged),
            },
            {
              label: "통신판매업 신고번호",
              value: valueOr(businessInfo.mailOrderRegNumber, purged),
            },
            {
              label: "사업장 주소",
              value: valueOr(businessInfo.businessAddress, purged),
            },
          ]}
        />
      </MemberCard>

      <MemberCard
        title="정산 정보"
        badge={
          pending.length > 0 && (
            // 정산 정보 불일치 정지를 풀 근거 — 변경 요청 화면으로 간다
            <button
              type="button"
              onClick={() => onOpenChangeRequest(pending[0].requestId)}
            >
              <StatusBadge variant="warning" hideDot>
                변경 요청 대기 {pending.length}건
              </StatusBadge>
            </button>
          )
        }
        note={
          purged
            ? "탈퇴로 파기됨 · 정산 기록은 거래 관리에 보존"
            : "계좌번호는 마스킹 · 전체 값은 정산 관리에서 조회"
        }
      >
        <FieldGrid
          items={[
            { label: "은행", value: valueOr(settlementInfo.bankName, purged) },
            {
              label: "예금주",
              value: valueOr(settlementInfo.accountHolder, purged),
            },
            {
              label: "계좌번호",
              value: valueOr(
                settlementInfo.maskedAccountNumber && (
                  <span className="tabular-nums">
                    {settlementInfo.maskedAccountNumber}
                  </span>
                ),
                purged
              ),
            },
            {
              label: "세금계산서 이메일",
              value: valueOr(
                settlementInfo.taxEmail && (
                  <>
                    <span className="tabular-nums">
                      {settlementInfo.taxEmail}
                    </span>{" "}
                    <span className={T_SUB_CLASS}>· 가입 시 입력</span>
                  </>
                ),
                purged
              ),
            },
          ]}
        />
      </MemberCard>

      <MemberCard
        title="배송·반품 정책"
        note={
          purged
            ? "파기 대상 아님 · 남은 반품의 비용 기준"
            : "브랜드가 입력 · 운영자 조회 전용"
        }
      >
        {deliveryPolicy ? (
          <FieldGrid
            items={[
              {
                label: "기본 배송비",
                value: won(deliveryPolicy.defaultDeliveryFee),
              },
              {
                label: "무료배송 기준",
                value:
                  deliveryPolicy.freeShippingThreshold === null ? (
                    "—"
                  ) : (
                    <>{won(deliveryPolicy.freeShippingThreshold)} 이상</>
                  ),
              },
              {
                label: "제주 추가비",
                value: won(deliveryPolicy.jejuSurcharge),
              },
              {
                label: "도서산간 추가비",
                value: (
                  <>
                    {won(deliveryPolicy.remoteAreaSurcharge)}{" "}
                    <span className={T_SUB_CLASS}>(제주 제외)</span>
                  </>
                ),
              },
              {
                label: "발송 기한",
                value: (
                  <>
                    공구 마감 후{" "}
                    <span className="tabular-nums">
                      {deliveryPolicy.shipLeadBusinessDays}
                    </span>
                    영업일 이내
                    {lead && (
                      <span className={T_SUB_CLASS}>
                        {" "}
                        · {eventMonthDay(lead.changedAt)} {lead.previousDays}→
                        {lead.newDays} 변경
                      </span>
                    )}
                  </>
                ),
              },
              {
                label: "반품 수취 주소",
                value: deliveryPolicy.returnAddress?.address
                  ? [
                      deliveryPolicy.returnAddress.address,
                      deliveryPolicy.returnAddress.detailAddress,
                    ]
                      .filter(Boolean)
                      .join(", ")
                  : "—",
              },
            ]}
          />
        ) : (
          <EmptyLine>등록된 배송·반품 정책이 없습니다.</EmptyLine>
        )}
      </MemberCard>
    </>
  );
}

/** 운영 현황 4-KPI — 미정산액만 0이 아니면 경고색(탈퇴 승인 · 정지 판단에서 유일하게 돈이 걸린 수치) */
export function BrandOperationsCard(props: {
  detail: AdminBrandDetail;
  onOpenContracts: () => void;
  onOpenProducts: () => void;
}) {
  const { detail, onOpenContracts, onOpenProducts } = props;
  const { operations } = detail;

  return (
    <MemberCard
      title="운영 현황"
      note={detail.purged ? "탈퇴 시점으로 동결" : undefined}
    >
      <Kpi4
        items={[
          {
            label: "연결 인플루언서",
            value: `${operations.connectedCreatorCount.toLocaleString("ko-KR")}명`,
          },
          {
            label: "진행중 공구",
            value: `${operations.activeGroupBuyCount.toLocaleString("ko-KR")}건`,
          },
          { label: "누적 정산액", value: won(operations.settledAmountTotal) },
          {
            label: "미정산액",
            value: won(operations.unsettledAmount),
            warn: operations.unsettledAmount !== 0,
            sub: operations.payoutHeld ? "지급 정지 중" : undefined,
          },
        ]}
      />
      <div className="mt-3.5 flex gap-7 border-t border-sz-n-100 pt-3 text-[12px] text-sz-n-700">
        <span>
          <span className={T_SUB_CLASS}>계약</span> 서명 진행 중{" "}
          <b className="tabular-nums">{operations.contracts.signing}</b> · 체결{" "}
          <b className="tabular-nums">{operations.contracts.concluded}</b>{" "}
          <button
            type="button"
            className={FLINK_CLASS}
            onClick={onOpenContracts}
          >
            계약 관리 ↗
          </button>
        </span>
        <span>
          <span className={T_SUB_CLASS}>상품</span> 판매중{" "}
          <b className="tabular-nums">{operations.products.selling}</b> · 품절{" "}
          <b className="tabular-nums">{operations.products.soldOut}</b>{" "}
          <button
            type="button"
            className={FLINK_CLASS}
            onClick={onOpenProducts}
          >
            상품 관리 ↗
          </button>
        </span>
      </div>
    </MemberCard>
  );
}

/** 연결 인플루언서 — 연결중 먼저 · 연결 종료 아래(서버 순서) · 행 클릭 → 인플루언서 상세 */
export function BrandConnectedCreatorsCard(props: {
  detail: AdminBrandDetail;
  /** 「전체 N명 보기」로 불러온 전체 — 없으면 상세의 최근 몇 명 */
  allItems: Array<AdminBrandConnectedCreator> | undefined;
  onShowAll: () => void;
  onOpenCreator: (creatorId: number) => void;
}) {
  const { detail, allItems, onShowAll, onOpenCreator } = props;
  const { total, items } = detail.connectedCreators;
  const rows = allItems ?? items;

  const note = detail.purged
    ? "탈퇴 시 전건 연결 종료"
    : total === 0
      ? "연결 없음"
      : allItems
        ? `전체 ${total}명 · 행 클릭 → 인플루언서 상세`
        : `전체 ${total}명 · 최근 연결 ${items.length}명 표시 · 행 클릭 → 인플루언서 상세`;

  return (
    <MemberCard title="연결 인플루언서" note={note} flush={rows.length > 0}>
      {rows.length === 0 ? (
        <EmptyLine>
          {detail.purged
            ? "연결된 인플루언서가 없습니다. 탈퇴 승인 시 남은 연결은 모두 종료됩니다."
            : "연결된 인플루언서가 없습니다."}
        </EmptyLine>
      ) : (
        <>
          <DetailTable
            rows={rows}
            rowKey={(row) => `${row.creatorId}-${row.connectedAt}`}
            onRowClick={(row) => onOpenCreator(row.creatorId)}
            columns={[
              {
                key: "showroomName",
                label: "쇼룸명",
                render: (row) => (
                  <span className={T_MAIN_CLASS}>
                    {row.showroomName ?? "—"}
                  </span>
                ),
              },
              {
                key: "connectedAt",
                label: "연결일",
                width: 120,
                align: "center",
                render: (row) => (
                  <span className="text-[11px] tabular-nums text-sz-n-500">
                    {eventDate(row.connectedAt)}
                  </span>
                ),
              },
              {
                key: "activeGroupBuyCount",
                label: "진행중 공구",
                width: 120,
                align: "center",
                render: (row) =>
                  row.activeGroupBuyCount > 0 ? (
                    <span className="tabular-nums">
                      {row.activeGroupBuyCount}건
                      {detail.memberStatus === "SUSPENDED" && (
                        <span className={T_SUB_CLASS}> · 판매 유지</span>
                      )}
                    </span>
                  ) : (
                    <span className="tabular-nums text-sz-n-500">0건</span>
                  ),
              },
              {
                key: "status",
                label: "연결 상태",
                width: 110,
                align: "center",
                render: (row) => (
                  <StatusBadge
                    variant={row.status === "CONNECTED" ? "success" : "neutral"}
                  >
                    {row.status === "CONNECTED" ? "연결중" : "연결 종료"}
                  </StatusBadge>
                ),
              },
            ]}
          />
          {!allItems && total > items.length && (
            <div className="px-4 pb-2">
              <button type="button" className={HMORE_CLASS} onClick={onShowAll}>
                전체 {total}명 보기
              </button>
            </div>
          )}
        </>
      )}
    </MemberCard>
  );
}

/**
 * 최근 문의 — 파트너센터 1:1 문의가 서버에 없어(§55 A-5) DEV만 목업으로 채우고 배포본은 「준비 중」.
 * 머리의 「운영자 채널 열기 ↗」는 서버가 대신 내리는 운영팀 소통 스레드로 간다.
 */
export function BrandRecentInquiryCard(props: {
  data: { items: Array<BrandRecentInquiry>; total: number } | undefined;
  isError: boolean;
  withdrawn: boolean;
  onOpenThread?: () => void;
  onOpenInquiries: () => void;
}) {
  const { data, isError, withdrawn, onOpenThread, onOpenInquiries } = props;

  const note = withdrawn
    ? "탈퇴 후에도 문의 기록은 보존"
    : data
      ? data.total > data.items.length
        ? `최근 ${data.items.length}건 · 전체 ${data.total}건`
        : `최근 ${data.items.length}건`
      : undefined;

  return (
    <MemberCard
      title="최근 문의"
      note={note}
      flush={!!data && data.items.length > 0}
      actions={
        <>
          {onOpenThread && (
            <button
              type="button"
              className={FLINK_CLASS}
              onClick={onOpenThread}
            >
              운영자 채널 열기 ↗
            </button>
          )}
          <button
            type="button"
            className={FLINK_CLASS}
            onClick={onOpenInquiries}
          >
            1:1 문의 전체 ↗
          </button>
        </>
      }
    >
      {isError ? (
        <NotReady title="준비 중">
          브랜드 1:1 문의 연동을 준비하고 있습니다.
        </NotReady>
      ) : !data ? (
        <EmptyLine>불러오는 중…</EmptyLine>
      ) : data.items.length === 0 ? (
        <EmptyLine>최근 문의가 없습니다.</EmptyLine>
      ) : (
        <DetailTable
          rows={data.items}
          rowKey={(row) => row.inquiryNumber}
          columns={[
            {
              key: "inquiryNumber",
              label: "문의번호",
              width: 150,
              render: (row) => (
                <span className="tabular-nums">{row.inquiryNumber}</span>
              ),
            },
            {
              key: "title",
              label: "유형 · 제목",
              render: (row) => (
                <span className="block truncate">
                  <span className={T_SUB_CLASS}>{row.typeLabel} · </span>
                  {row.title}
                </span>
              ),
            },
            {
              key: "status",
              label: "상태",
              width: 96,
              render: (row) => (
                <StatusBadge variant={toneVariant(row.tone)} hideDot>
                  {row.statusLabel}
                </StatusBadge>
              ),
            },
            {
              key: "createdAt",
              label: "접수일",
              width: 100,
              render: (row) => (
                <span className="text-[11px] tabular-nums text-sz-n-500">
                  {eventDate(row.createdAt)}
                </span>
              ),
            },
          ]}
        />
      )}
    </MemberCard>
  );
}
