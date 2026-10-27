import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { FIXED_FEE_HINT } from "@/features/influencerMember/constants/copy";
import type {
  AdminCreatorConnectionList,
  AdminCreatorContractPage,
  AdminCreatorOverview,
  AdminCreatorSettlementList,
} from "@/features/influencerMember/types";
import DetailTable from "@/features/memberShared/components/DetailTable";
import {
  EmptyLine,
  FieldGrid,
  Kpi4,
  MemberCard,
} from "@/features/memberShared/components/parts";
import {
  FLINK_CLASS,
  ST_HINT_CLASS,
  T_MAIN_CLASS,
  T_SUB_CLASS,
} from "@/features/memberShared/constants/styles";
import {
  count,
  eventDate,
  eventMonthDay,
  toneVariant,
  wallMonthDay,
  won,
} from "@/features/memberShared/utils/format";

/** 운영 현황 4-KPI — 경고색은 조정 협의만(지급이 멈춘 유일한 수치) */
export function InfluencerOperationsCard(props: {
  overview: AdminCreatorOverview | undefined;
}) {
  const operations = props.overview?.operations;

  return (
    <MemberCard title="운영 현황">
      <Kpi4
        items={[
          {
            label: "연결 브랜드",
            value: operations
              ? `${count(operations.connectedBrandCount)}곳`
              : "—",
          },
          {
            label: "진행중 공구",
            value: operations
              ? `${count(operations.sellingGroupBuyCount)}건`
              : "—",
          },
          {
            label: "정산 진행 중 리워드",
            value: operations ? won(operations.rewardInProgressAmount) : "—",
          },
          {
            label: "조정 협의",
            value: operations
              ? `${count(operations.openAdjustmentCount)}건`
              : "—",
            warn: !!operations && operations.openAdjustmentCount > 0,
          },
        ]}
      />
    </MemberCard>
  );
}

/** 최근 정산 — 정산 관리와 같은 단계 배지 · 조정 협의 행에 합의 기한 · 행 클릭 → 정산 상세 */
export function InfluencerSettlementsCard(props: {
  data: AdminCreatorSettlementList | undefined;
  onOpen: (settlementId: number) => void;
  onOpenList: () => void;
}) {
  const { data, onOpen, onOpenList } = props;
  const rows = data?.content ?? [];

  return (
    <MemberCard
      title="최근 정산"
      note={
        data
          ? `최근 ${rows.length}건 · 전체 ${data.total}건 · 행 클릭 → 정산 상세`
          : undefined
      }
      actions={
        <button type="button" className={FLINK_CLASS} onClick={onOpenList}>
          정산 관리에서 보기 ↗
        </button>
      }
      flush={rows.length > 0}
    >
      {rows.length === 0 ? (
        <EmptyLine>{data ? "정산 내역이 없습니다." : "불러오는 중…"}</EmptyLine>
      ) : (
        <DetailTable
          variant="compact"
          rows={rows}
          rowKey={(row) => row.settlementId}
          onRowClick={(row) => onOpen(row.settlementId)}
          columns={[
            {
              key: "settlementNumber",
              label: "정산번호",
              width: 132,
              render: (row) => (
                <span className="tabular-nums">{row.settlementNumber}</span>
              ),
            },
            {
              key: "groupBuy",
              label: "공구 · 브랜드",
              render: (row) => (
                <>
                  <span className={`${T_MAIN_CLASS} block truncate`}>
                    {row.groupBuyTitle ?? "—"}
                  </span>
                  <span className={`${T_SUB_CLASS} block`}>
                    {row.marketName ?? "—"}
                  </span>
                </>
              ),
            },
            {
              key: "status",
              label: "단계",
              width: 118,
              align: "center",
              render: (row) => (
                <>
                  <StatusBadge variant={toneVariant(row.tone)}>
                    {row.statusLabel}
                  </StatusBadge>
                  {row.adjustment?.deadlineAt && (
                    <span className={`${T_SUB_CLASS} mt-[3px] block`}>
                      기한 {wallMonthDay(row.adjustment.deadlineAt)}
                    </span>
                  )}
                </>
              ),
            },
            {
              key: "reward",
              label: "리워드(세전)",
              width: 112,
              align: "right",
              render: (row) => (
                <>
                  <span className="tabular-nums">{won(row.rewardAmount)}</span>
                  {row.adjustment && row.creatorPayoutStatusLabel && (
                    <span className={`${T_SUB_CLASS} mt-[3px] block`}>
                      {row.creatorPayoutStatusLabel}
                    </span>
                  )}
                </>
              ),
            },
            {
              key: "payout",
              label: "지급(예정)일",
              width: 120,
              align: "center",
              render: (row) => (
                <span className="text-[11px] tabular-nums text-sz-n-500">
                  {row.paidAt
                    ? eventMonthDay(row.paidAt)
                    : row.payoutDueDate
                      ? `${wallMonthDay(row.payoutDueDate)} (예정)`
                      : "—"}
                </span>
              ),
            },
          ]}
        />
      )}
    </MemberCard>
  );
}

/**
 * 계약 — 고정 지급비 · 지급 시점 · 브랜드 지급 기록(자기 신고). 기록이 없고 시점이 지난 행만 경고색 글자로 세우되
 * 배지 · 조치 버튼은 두지 않는다(플랫폼은 보증하지 않는다).
 */
export function InfluencerContractsCard(props: {
  data: AdminCreatorContractPage | undefined;
  onOpen: (contractId: number) => void;
}) {
  const { data, onOpen } = props;
  const rows = data?.content ?? [];

  return (
    <MemberCard
      title="계약"
      note={
        data
          ? `전체 ${data.pageInfo.totalResults}건 · 행 클릭 → 계약 상세 · 고정 지급비는 브랜드 직접 지급`
          : undefined
      }
      flush={rows.length > 0}
    >
      {rows.length === 0 ? (
        <EmptyLine>{data ? "계약 내역이 없습니다." : "불러오는 중…"}</EmptyLine>
      ) : (
        <>
          <DetailTable
            variant="compact"
            rows={rows}
            rowKey={(row) => row.contractId}
            onRowClick={(row) => onOpen(row.contractId)}
            columns={[
              {
                key: "contractNumber",
                label: "계약번호",
                width: 144,
                render: (row) => (
                  <span className="tabular-nums">{row.contractNumber}</span>
                ),
              },
              {
                key: "brand",
                label: "브랜드 · 공구",
                render: (row) => (
                  <>
                    <span className={`${T_MAIN_CLASS} block truncate`}>
                      {row.marketName ?? "—"}
                    </span>
                    <span className={`${T_SUB_CLASS} block truncate`}>
                      {row.title ?? "—"}
                    </span>
                  </>
                ),
              },
              {
                key: "status",
                label: "상태",
                width: 96,
                align: "center",
                render: (row) => (
                  <StatusBadge variant={toneVariant(row.tone)}>
                    {row.statusLabel}
                  </StatusBadge>
                ),
              },
              {
                key: "fixedFee",
                label: "고정 지급비",
                width: 104,
                align: "right",
                render: (row) =>
                  row.fixedFeeAmount === null ? (
                    <span className={T_SUB_CLASS}>없음</span>
                  ) : (
                    <span className="tabular-nums">
                      {won(row.fixedFeeAmount)}
                    </span>
                  ),
              },
              {
                key: "trigger",
                label: "지급 시점",
                width: 108,
                align: "center",
                render: (row) => (
                  <span className={T_SUB_CLASS}>
                    {row.fixedFeeTriggerLabel ?? "—"}
                  </span>
                ),
              },
              {
                key: "paid",
                label: "브랜드 지급 기록",
                width: 150,
                render: (row) =>
                  row.fixedFeePaidAt ? (
                    <>
                      지급 완료 기록{" "}
                      <span className={`${T_SUB_CLASS} tabular-nums`}>
                        {eventMonthDay(row.fixedFeePaidAt)}
                      </span>
                    </>
                  ) : row.fixedFeeAmount !== null &&
                    row.fixedFeeTriggerReachedAt ? (
                    <>
                      <span className="text-sz-warning-text">기록 없음</span>{" "}
                      <span className={T_SUB_CLASS}>
                        · 시점 경과 (
                        {eventMonthDay(row.fixedFeeTriggerReachedAt)})
                      </span>
                    </>
                  ) : (
                    <span className={T_SUB_CLASS}>—</span>
                  ),
              },
            ]}
          />
          <div className="px-4 pb-4 pt-2.5">
            <p className={`${ST_HINT_CLASS} !mt-0`}>{FIXED_FEE_HINT}</p>
          </div>
        </>
      )}
    </MemberCard>
  );
}

/** 연결 브랜드 — 연결중 먼저 · 연결 종료 아래 · 행 클릭 → 브랜드 상세 */
export function InfluencerConnectionsCard(props: {
  data: AdminCreatorConnectionList | undefined;
  onOpenBrand: (marketId: number) => void;
}) {
  const { data, onOpenBrand } = props;
  const rows = data?.content ?? [];
  const allEnded =
    rows.length > 0 && rows.every((row) => row.status !== "CONNECTED");

  return (
    <MemberCard
      title="연결 브랜드"
      note={
        data
          ? allEnded
            ? `전체 ${data.total}곳 · 모두 연결 종료`
            : `전체 ${data.total}곳 · 행 클릭 → 브랜드 상세`
          : undefined
      }
      flush={rows.length > 0}
    >
      {rows.length === 0 ? (
        <EmptyLine>
          {data ? "연결된 브랜드가 없습니다." : "불러오는 중…"}
        </EmptyLine>
      ) : (
        <DetailTable
          rows={rows}
          rowKey={(row) => row.connectionId}
          onRowClick={(row) => onOpenBrand(row.marketId)}
          columns={[
            {
              key: "marketName",
              label: "브랜드명",
              render: (row) => (
                <span className={T_MAIN_CLASS}>{row.marketName ?? "—"}</span>
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
              key: "selling",
              label: "진행중 공구",
              width: 120,
              align: "center",
              render: (row) => (
                <span
                  className={
                    row.sellingGroupBuyCount > 0
                      ? "tabular-nums"
                      : "tabular-nums text-sz-n-500"
                  }
                >
                  {row.sellingGroupBuyCount}건
                </span>
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
      )}
    </MemberCard>
  );
}

/**
 * 쇼룸 활동 — 앱 내 기록만(외부 채널 수치 아님). 게시물 검토는 반려 · 노출 중지 횟수를 사실 기록으로만 둔다(기-08 「노출 중지」).
 */
export function InfluencerActivityCard(props: {
  overview: AdminCreatorOverview | undefined;
  onOpenPostHistory: () => void;
}) {
  const { overview, onOpenPostHistory } = props;
  const activity = overview?.activity;

  return (
    <MemberCard title="쇼룸 활동" note="앱 내 기록 · 외부 채널 수치가 아님">
      {!activity ? (
        <EmptyLine>불러오는 중…</EmptyLine>
      ) : (
        <FieldGrid
          items={[
            {
              label: "공구 게시물",
              value: (
                <>
                  <span className="tabular-nums">
                    {count(activity.groupBuyPostCount)}건
                  </span>{" "}
                  <span className={T_SUB_CLASS}>
                    · 게시물·소통 모니터링에서 열람
                  </span>
                </>
              ),
            },
            {
              label: "게시물 검토",
              value: (
                <>
                  반려{" "}
                  <b className="tabular-nums">
                    {count(activity.reviewRejectCount)}회
                  </b>{" "}
                  · 노출 중지{" "}
                  <b className="tabular-nums">
                    {count(activity.hiddenCount)}회
                  </b>{" "}
                  <button
                    type="button"
                    className={FLINK_CLASS}
                    onClick={onOpenPostHistory}
                  >
                    이력 보기 ↗
                  </button>
                </>
              ),
            },
            {
              label: "일반 게시물",
              value: (
                <span className="tabular-nums">
                  {count(activity.generalPostCount)}건
                </span>
              ),
            },
            {
              label: "쇼룸 팔로워",
              value: (
                <span className="tabular-nums">
                  {count(activity.followerCount)}명
                </span>
              ),
            },
            {
              label: "소통 스레드",
              value: (
                <>
                  {count(activity.threadCount)}건{" "}
                  <span className={T_SUB_CLASS}>
                    · 진행 {count(activity.openThreadCount)}건
                  </span>
                </>
              ),
            },
          ]}
        />
      )}
    </MemberCard>
  );
}
