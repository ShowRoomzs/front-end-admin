import HistoryList from "@/common/components/HistoryList/HistoryList";
import Btn from "@/features/contract/components/shared/Btn";
import { formatPercent } from "@/features/contract/utils/format";
import {
  B,
  GbBadge,
  GbCard,
  RailKpi,
} from "@/features/groupBuy/components/shared/GbParts";
import {
  type AdminView,
  type Detail,
  actorText,
  d,
  dDayFromNow,
  dLabel,
  dt,
  md,
  mdDate,
  num,
  toHistoryItems,
  won,
} from "@/features/groupBuy/utils/view";
import type { ReactNode } from "react";

export interface AdminRailActions {
  onApproveOpen: () => void;
  onRejectOpen: () => void;
  onNotice: () => void;
  onEmergency: () => void;
  onUnhide: () => void;
  onExecute: () => void;
  onWithdraw: () => void;
  onApproveRequest: () => void;
  onRejectRequest: () => void;
  onConfirmSettlement: () => void;
}

function MRow(props: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0">
      <span className="text-sz-n-500">{props.label}</span>
      <span className="text-right font-medium text-sz-n-900">
        {props.value}
      </span>
    </div>
  );
}

function Hint(props: { children: ReactNode }) {
  return (
    <p className="mt-2.5 text-[11px] leading-[1.55] text-sz-n-500">
      {props.children}
    </p>
  );
}

/**
 * 우측 레일 「현재 상태」 — 공구 배지 · 메타 · 판정 버튼 · 힌트.
 * 버튼은 서버 permissions로만 노출하고, 소명 기한 전 [중단 집행]처럼 잠긴 버튼은
 * 에러 문구 없이 비활성으로만 둔다(시안 규칙).
 */
export function CurrentStateCard(props: {
  detail: Detail;
  view: AdminView;
  actions: AdminRailActions;
}) {
  const { detail, view, actions } = props;
  const {
    groupBuy,
    timeline,
    post,
    permissions,
    openReview,
    extension,
    adminSuspension,
    activeRequest,
    afterEnd,
    closure,
  } = detail;

  const rows: Array<{ label: string; value: ReactNode }> = [];
  let buttons: ReactNode = null;
  let extraButton: ReactNode = null;
  let hint: ReactNode = null;

  const progress = {
    label: "진행",
    value: `${timeline.elapsedDays}일차 / ${timeline.totalDays}일`,
  };
  const endRow = { label: "종료 예정", value: dt(timeline.endAt) };
  const extensionRow = {
    label: "연장 요청",
    value:
      extension?.status === "PENDING"
        ? "응답 대기 · 브랜드 발신"
        : extension?.status === "ACCEPTED"
          ? `수락 · ${extension.days}일`
          : extension?.status === "REJECTED"
            ? "거절"
            : extension?.status === "EXPIRED"
              ? "만료 · 변경 없음"
              : "없음",
  };

  const suspendButtons =
    permissions.canNoticeSuspension || permissions.canEmergencySuspend ? (
      <>
        {permissions.canNoticeSuspension && (
          <Btn
            variant="delete"
            className="w-full flex-1"
            onClick={actions.onNotice}
          >
            직권 중단 사전통지
          </Btn>
        )}
        {permissions.canEmergencySuspend && (
          <Btn
            variant="delete"
            className="w-full flex-1"
            onClick={actions.onEmergency}
          >
            긴급 중단
          </Btn>
        )}
      </>
    ) : null;

  switch (view) {
    case "openReview":
    case "preparing": {
      rows.push({ label: "게시물", value: post.statusLabel });
      if (openReview) {
        rows.push({
          label: "승인 기한",
          value: `${d(openReview.dueAt)} · ${dLabel(openReview.daysLeft)}`,
        });
      }
      rows.push({ label: "시작일", value: d(timeline.startAt) });
      if (view === "openReview") {
        buttons = (
          <>
            {permissions.canApproveOpen && (
              <Btn
                variant="primary"
                className="w-full flex-1"
                onClick={actions.onApproveOpen}
              >
                오픈 승인
              </Btn>
            )}
            {permissions.canRejectOpen && (
              <Btn
                variant="delete"
                className="w-full flex-1"
                onClick={actions.onRejectOpen}
              >
                반려
              </Btn>
            )}
          </>
        );
        hint = (
          <Hint>
            오픈 승인의 결과는 <B>공구가 열리는 것</B> 하나입니다 — 시작일{" "}
            <B className="tabular-nums">{d(timeline.startAt)}</B>에 게시물이
            노출되고 판매가 시작됩니다.{" "}
            <B>고정 지급비는 브랜드가 인플루언서에게 직접 지급</B>하므로
            승인·반려와 무관합니다.
            {timeline.startOverdue && (
              <>
                {" "}
                <B className="text-sz-warning-text">
                  시작 시각이 지났습니다 — 승인하면 단축된 기간으로 바로
                  열립니다.
                </B>
              </>
            )}
          </Hint>
        );
      } else if (groupBuy.status === "READY") {
        hint = (
          <Hint>
            게이트 3개가 모두 충족돼 시작일{" "}
            <B className="tabular-nums">{d(timeline.startAt)}</B>에{" "}
            <B>자동으로 열립니다</B>. 시작 전 중단 요청이 들어오면 이 화면에서
            판정합니다.
          </Hint>
        );
      } else {
        hint = (
          <Hint>
            브랜드의 <B>물량 확보 확인</B>과 인플루언서의 <B>게시물 등록</B>이
            끝나야 오픈 승인 심사가 시작됩니다. 준비 단계에서는 운영자가 할
            조치가 없습니다.
          </Hint>
        );
      }
      break;
    }
    case "selling":
    case "extension": {
      rows.push(progress, endRow, extensionRow);
      if (view === "extension" && extension) {
        rows.push({
          label: "응답 기한",
          value: dt(extension.respondDeadlineAt),
        });
      }
      buttons = suspendButtons;
      hint =
        view === "extension" ? (
          <Hint>
            연장에는 <B>수락·거절 버튼이 없습니다</B> — 응답 권한은
            인플루언서에게 있고 결과만 이력으로 돌아옵니다. 응답 기한을 넘기면{" "}
            <B>변경 없이 원래 종료일에 닫힙니다</B>.
          </Hint>
        ) : (
          <Hint>
            <B>직권 중단은 사전 통지가 원칙</B>입니다(제17조②) — 집행{" "}
            <B>3영업일 전</B>까지 사유·집행 일시·소명 기한을 브랜드에 통지하고,
            통지 기간에도 <B>공구는 계속 팔립니다</B>. <B>긴급 중단</B>은 소비자
            위해·행정명령·피해 급증에만 쓰는 예외로 즉시 집행 후 사후
            통지합니다(제17조③).
          </Hint>
        );
      break;
    }
    case "hidden": {
      rows.push(progress, endRow, {
        label: "게시물",
        value: <GbBadge tone={post.statusTone}>{post.statusLabel}</GbBadge>,
      });
      if (post.hidden) {
        rows.push({ label: "숨김 경과", value: `${post.hidden.hiddenDays}일` });
      }
      buttons = (
        <>
          {permissions.canUnhidePost && (
            <Btn
              variant="primary"
              className="w-full flex-1"
              onClick={actions.onUnhide}
            >
              숨김 해제
            </Btn>
          )}
          {permissions.canNoticeSuspension && (
            <Btn
              variant="delete"
              className="w-full flex-1"
              onClick={actions.onNotice}
            >
              직권 중단 사전통지
            </Btn>
          )}
        </>
      );
      hint = (
        <Hint>
          <B>숨김 해제</B>는 인플루언서가 본문을 고친 뒤 운영자가 확인하고
          누릅니다 — 자동 복귀가 아닙니다. 숨김 상태에서는{" "}
          <B>새 소비자가 이 공구를 볼 경로가 없어</B> 판매가 사실상 멈추므로
          오래 두지 마세요. 고쳐지지 않으면 <B>직권 중단</B>으로 넘어갑니다.
        </Hint>
      );
      break;
    }
    case "notice": {
      rows.push(progress);
      if (adminSuspension) {
        rows.push(
          { label: "사전 통지", value: `${d(adminSuspension.noticedAt)} 발송` },
          { label: "집행 예정", value: dt(adminSuspension.executeScheduledAt) },
          {
            label: "소명",
            value: adminSuspension.appeal ? (
              <>
                <GbBadge tone="INFO" hideDot>
                  제출됨
                </GbBadge>{" "}
                <span className="text-[11px] font-normal tabular-nums text-sz-n-500">
                  {mdDate(adminSuspension.appeal.submittedAt)}
                </span>
              </>
            ) : (
              <span className="text-sz-n-400">
                {adminSuspension.appealDeadlinePassed
                  ? "미제출 · 기한 경과"
                  : `대기 · ${dDayFromNow(adminSuspension.appealDeadlineAt)}`}
              </span>
            ),
          }
        );
      }
      rows.push(endRow, extensionRow);
      buttons = (
        <>
          <Btn
            variant="delete"
            className="w-full flex-1"
            disabled={!permissions.canExecuteSuspension}
            onClick={actions.onExecute}
          >
            중단 집행
          </Btn>
          {permissions.canWithdrawSuspension && (
            <Btn
              variant="secondary"
              className="w-full flex-1"
              onClick={actions.onWithdraw}
            >
              직권 중단 철회
            </Btn>
          )}
        </>
      );
      if (permissions.canEmergencySuspend) {
        extraButton = (
          <Btn
            variant="delete"
            className="mt-2 w-full"
            onClick={actions.onEmergency}
          >
            긴급 중단
          </Btn>
        );
      }
      hint = permissions.canExecuteSuspension ? (
        <Hint>
          소명 기한이 지나 <B>집행이 열렸습니다</B>. 소명이 타당하면 <B>철회</B>
          하고, 그대로면 <B>집행</B>합니다 — 어느 쪽이든{" "}
          <B>사유가 브랜드에 전달</B>됩니다.
        </Hint>
      ) : (
        <Hint>
          <B>중단 집행</B>은 소명 제출 기한(
          <B className="tabular-nums">
            {md(adminSuspension?.appealDeadlineAt)}
          </B>
          )이 지나야 열립니다 — 기한 내 소명이 없으면 기존 자료로 최종
          판정합니다(제17조④). 소명이 타당하면 <B>철회</B>할 수 있고, 철회하면
          공구는 <B>원래 일정대로</B> 계속 진행됩니다.
        </Hint>
      );
      break;
    }
    case "request": {
      if (activeRequest) {
        const isEarly = activeRequest.type === "EARLY_CLOSE";
        rows.push(
          {
            label: "요청 상태",
            value: `검토 중 · ${activeRequest.elapsed} 경과`,
          },
          {
            label: "요청자",
            value: actorText(
              activeRequest.requesterType,
              activeRequest.requesterName
            ),
          },
          {
            label: "사유",
            value: activeRequest.reasonLabel ?? activeRequest.reasonCode,
          }
        );
        if (isEarly) {
          rows.push(
            {
              label: "원 종료일",
              value: dt(
                activeRequest.decisionBasis?.originalEndAt ?? timeline.endAt
              ),
            },
            {
              label: "승인 시 종료",
              value: activeRequest.decisionBasis?.endsImmediatelyIfApproved
                ? "승인 즉시"
                : "—",
            }
          );
        } else {
          rows.push({
            label: "공구 상태",
            value: `${groupBuy.statusLabel} — 요청은 상태를 바꾸지 않는다`,
          });
        }
        buttons = (
          <>
            {permissions.canApproveRequest && (
              <Btn
                variant={isEarly ? "primary" : "delete"}
                className="w-full flex-1"
                onClick={actions.onApproveRequest}
              >
                {isEarly ? "조기 마감 승인" : "중단 승인"}
              </Btn>
            )}
            {permissions.canRejectRequest && (
              <Btn
                variant="secondary"
                className="w-full flex-1"
                onClick={actions.onRejectRequest}
              >
                요청 반려
              </Btn>
            )}
          </>
        );
        hint = isEarly ? (
          <Hint>
            조기 마감은 파괴적 종결이 아니라 <B>정상 절차</B>라 승인 버튼이 주
            액션 색입니다. 위험색은 <B>중단</B>에만 씁니다.
          </Hint>
        ) : (
          <Hint>
            <B>연장과 승인권자가 다릅니다</B> — 연장은 당사자 합의(브랜드 요청 →
            인플루언서 수락)로 끝나지만, 중단은 <B>소비자 주문을 끊는 일</B>이라
            운영자가 단독으로 결정합니다.
          </Hint>
        );
      }
      break;
    }
    case "ended": {
      const settlement = afterEnd?.settlement;
      const orderClosure = afterEnd?.orderClosure;
      const blockers = settlement?.blockers ?? [];
      const fulfillment = afterEnd?.fulfillment;
      rows.push({
        label: "종료",
        value: dt(groupBuy.endedAt ?? timeline.endAt),
      });
      if (groupBuy.status === "SETTLED") {
        rows.push({ label: "정산 완료", value: dt(groupBuy.settledAt) });
      } else {
        if (settlement?.watch) {
          rows.push({
            label: "종결 경과",
            value: `${settlement.watch.elapsedDays}일`,
          });
        }
        rows.push({
          label: "미종결",
          value: orderClosure ? `${num(orderClosure.unclosedCount)}건` : "—",
        });
        rows.push({
          label: "정산",
          value: blockers.includes("FULFILLMENT_DISPUTE") ? (
            <span className="text-sz-warning-text">보류 · 이행 미합의</span>
          ) : fulfillment?.resolvedAt ? (
            "대기 · 보류 해제됨"
          ) : blockers.includes("FULFILLMENT_PENDING") ? (
            "대기 · 이행 확인 전"
          ) : (
            "대기 · 이행 확인 완료"
          ),
        });
        buttons = (
          <Btn
            variant="primary"
            className="w-full flex-1"
            disabled={!permissions.canConfirmSettlement}
            onClick={actions.onConfirmSettlement}
          >
            정산 확인
          </Btn>
        );
        const reasons: Array<ReactNode> = [];
        if (blockers.includes("UNCLOSED_ORDERS")) {
          reasons.push(
            <>
              <B>
                미종결 {orderClosure ? num(orderClosure.unclosedCount) : ""}건
              </B>
              (주문 처리는 판매 관리 소관)
            </>
          );
        }
        if (blockers.includes("FULFILLMENT_DISPUTE")) {
          reasons.push(
            <>
              <B>이행 미합의</B>(3자 스레드 진행 중 · 정산 보류)
            </>
          );
        }
        if (blockers.includes("FULFILLMENT_PENDING")) {
          reasons.push(
            <>
              <B>이행 확인 대기</B>(양측 확인 전)
            </>
          );
        }
        if (blockers.includes("CLOSURE_UNKNOWN")) {
          reasons.push(
            <>
              <B>주문 종결 집계 불가</B>(판매 모듈 연동 전)
            </>
          );
        }
        hint = (
          <Hint>
            {reasons.length > 0 ? (
              <>
                정산이 멈춘 사유가 <B>{reasons.length}개</B>입니다 —{" "}
                {reasons.map((reason, index) => (
                  <span key={index}>
                    {index > 0 && " "}
                    {["①", "②", "③", "④"][index]} {reason}
                  </span>
                ))}
                . 모두 풀려야 확인이 열립니다.
              </>
            ) : (
              <>정산 선행 조건이 모두 충족됐습니다.</>
            )}{" "}
            <B>정산 단계는 어드민에만 보입니다</B>(양측 화면에는 “받았는지
            아직인지”만 노출).
          </Hint>
        );
      }
      break;
    }
    case "suspended": {
      rows.push(
        { label: "중단", value: dt(groupBuy.endedAt) },
        { label: "처리자", value: actorText("ADMIN", closure?.decidedByName) },
        {
          label: "요청자",
          value: closure?.requester
            ? actorText(closure.requester.type, closure.requester.name)
            : "없음 · 직권",
        },
        {
          label: "사유",
          value: closure?.adminBasis?.basisLabel ?? closure?.reasonLabel ?? "—",
        },
        {
          label: "접수분",
          value:
            closure?.acceptedOrderCount !== null &&
            closure?.acceptedOrderCount !== undefined
              ? `${num(closure.acceptedOrderCount)}건 · 회수·환불 진행`
              : "—",
        }
      );
      hint = (
        <Hint>
          중단은 <B>종료·정산완료와 같은 색으로 묶지 않습니다</B> — 기간을 채운
          정상 완주가 아니라 판매 도중 강제로 끊긴 비정상 종결이고, 소비자
          환불과 배송 의무가 뒤따릅니다. 계약의 「취소·만료」(중립)와도 층이
          다릅니다.
        </Hint>
      );
      break;
    }
    default:
      break;
  }

  return (
    <GbCard title="현재 상태">
      <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3">
        <span className="shrink-0 text-[12px] text-sz-n-500">공구</span>
        <GbBadge tone={groupBuy.statusTone}>{groupBuy.statusLabel}</GbBadge>
      </div>
      <div className="pt-2">
        {rows.map((row) => (
          <MRow key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
      {buttons && <div className="mt-4 flex gap-2">{buttons}</div>}
      {extraButton}
      {hint}
    </GbCard>
  );
}

/** B3 · B4 판단 근거 — 요청 시점 대비. 승인 버튼 바로 아래에서 견준다 */
export function DecisionBasisCard(props: { detail: Detail }) {
  const request = props.detail.activeRequest;
  const basis = request?.decisionBasis;
  if (!request || !basis) {
    return null;
  }
  const isEarly = request.type === "EARLY_CLOSE";
  return (
    <GbCard title="판단 근거" note="요청 시점 대비">
      {isEarly ? (
        <>
          <RailKpi
            label="판매 수량 / 준비 물량"
            value={`${num(basis.quantityNow)} / ${num(basis.preparedQuantity)}`}
            sub={
              basis.sellThroughRate !== null
                ? `${basis.sellThroughRate}% 소진`
                : undefined
            }
          />
          <RailKpi label="주문" value={num(basis.ordersNow)} sub="누적" />
          <RailKpi
            label="판매 금액(원)"
            value={num(basis.amountNow)}
            sub="취소·반품 제외"
          />
          <RailKpi
            label="품절 문의"
            value={num(basis.soldOutInquiriesSinceRequest)}
            sub="요청 후 접수"
          />
        </>
      ) : (
        <>
          <RailKpi
            label="주문"
            value={num(basis.ordersNow)}
            sub={
              basis.ordersSinceRequest !== null
                ? `요청 후 +${num(basis.ordersSinceRequest)}`
                : undefined
            }
          />
          <RailKpi
            label="판매 수량"
            value={num(basis.quantityNow)}
            sub="회수 대상"
          />
          <RailKpi
            label="판매 금액(원)"
            value={num(basis.amountNow)}
            sub="접수분 합계"
          />
          <RailKpi
            label="CS 문의"
            value={num(basis.inquiries?.total)}
            sub={
              basis.inquiries?.defectRelated !== null &&
              basis.inquiries?.defectRelated !== undefined
                ? `하자 관련 ${num(basis.inquiries.defectRelated)}건`
                : undefined
            }
          />
        </>
      )}
    </GbCard>
  );
}

/** B5 주문 종결 현황 — 정산 트리거(경로별 내역은 판매 관리 소관) */
export function OrderClosureCard(props: { detail: Detail }) {
  const closure = props.detail.afterEnd?.orderClosure;
  if (!closure) {
    return null;
  }
  return (
    <GbCard title="주문 종결 현황" note="정산 트리거">
      <RailKpi label="전체 주문" value={`${num(closure.totalCount)}건`} />
      <RailKpi
        label="종결"
        value={`${num(closure.closedCount)}건`}
        // 시안 B5 「구매확정 271 · 환불 19 · 거절 확정 4」 — 거절 확정은 서버가 구매확정에 합쳐 내린다
        sub={
          closure.purchaseConfirmedCount != null &&
          closure.refundedCount != null
            ? `구매확정 ${num(closure.purchaseConfirmedCount)} · 환불 ${num(closure.refundedCount)}`
            : undefined
        }
      />
      <RailKpi
        label="미종결"
        value={`${num(closure.unclosedCount)}건`}
        sub={
          closure.unclosed.length > 0
            ? closure.unclosed
                .map((stage) => `${stage.label} ${stage.count}`)
                .join(" · ")
            : undefined
        }
      />
      <RailKpi label="정산 예정" value="미종결 0건 도달 후 영업일 5일 내" />
      <p className="mt-3 text-[11px] leading-[1.55] text-sz-n-500">
        정산 트리거는 구매확정이 아니라 <B>모든 주문 항목의 종결</B>입니다 —
        구매확정·환불·거절 확정 셋 다 종결로 셉니다.{" "}
        <B>반품·교환 거절 확정은 즉시 구매확정</B>이라 거절 보류 1건이 공구 전체
        정산을 붙잡지 않습니다.
      </p>
    </GbCard>
  );
}

/** B5 정산 예정 금액 — 미종결 결론에 따라 변동하므로 리워드는 확정 대기로 둔다 */
export function SettlementPreviewCard(props: { detail: Detail }) {
  const settlement = props.detail.afterEnd?.settlement;
  if (!settlement) {
    return null;
  }
  const { preview } = settlement;
  const rates = preview.rewardRates
    .map((rate) => formatPercent(rate))
    .join(" · ");
  return (
    <GbCard title="정산 예정 금액" note="미종결 결론에 따라 변동">
      <RailKpi
        label="확정 판매액"
        value={
          preview.provisionalSalesAmount !== null
            ? `잠정 ${won(preview.provisionalSalesAmount)}`
            : "—"
        }
      />
      <RailKpi
        label="인플루언서 리워드"
        value={
          preview.rewardAmount !== null
            ? won(preview.rewardAmount)
            : "확정 대기"
        }
        sub={rates || undefined}
      />
    </GbCard>
  );
}

export function AdminHistoryCard(props: { detail: Detail }) {
  return (
    <GbCard title="처리 이력" note="최신순" flush>
      <HistoryList items={toHistoryItems(props.detail.history)} />
    </GbCard>
  );
}
