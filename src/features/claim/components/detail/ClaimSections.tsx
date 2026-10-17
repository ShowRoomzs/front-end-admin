import {
  CLAIM_KIND_LABEL,
  CLAIM_PARTY_LABEL,
} from "@/features/claim/constants/params";
import type {
  ClaimDetail,
  ClaimParty,
  ClaimRejection,
} from "@/features/claim/types";
import {
  Block,
  ClaimBadge,
  Dim,
  Frow,
  Grid2,
  HistoryItem,
  ItRow,
  Num,
  RowEnd,
  Sc,
  Sub,
} from "@/features/claim/components/shared/ClaimParts";
import { md, mdHm, minusWon, won } from "@/features/claim/utils/format";
import type { ReactNode } from "react";

/*
  상세 좌측 블록 — 서버가 단계마다 내리는 블록(`ClaimDetail`의 null 아닌 필드)만 그린다.
  번호(① ②…)는 그려진 순서대로 붙는다 — 시안도 상태마다 블록 구성이 다르다.
  블록 순서: 클레임 → 항목 → 검수 반려 → 반려 보류 → 소비자 이의 → 회수 → 법정 기한 → 금액 → 환불 계산 → 정산 반영 → 이력.
*/

/** 신청자 이름을 「신청」 줄에 붙이는 단계 — 진행 중일 때만(종결·반려 보류 상세는 이력에 이름이 있다) */
const IN_MOTION_STAGES = new Set([
  "PICKUP_WAIT",
  "IN_TRANSIT",
  "INSPECT_WAIT",
  "INSPECT_OVERDUE",
  "RESHIP_WAIT",
]);

function party(value: ClaimParty): string {
  return CLAIM_PARTY_LABEL[value];
}

/** 귀책은 항목 단위다 — 일부 반려는 반려분·통과분이 갈린다 */
function rejectionFault(rejection: ClaimRejection): ReactNode {
  if (rejection.scope === "PARTIAL") {
    return (
      <>
        반려분 {party(rejection.rejectedFault)}{" "}
        {rejection.passedFault && (
          <Sub>· 통과분 {party(rejection.passedFault)}</Sub>
        )}
      </>
    );
  }
  if (rejection.faultChanged) {
    return <>{party(rejection.rejectedFault)}로 변경</>;
  }
  return (
    <>
      변경 없음 <Sub>· {party(rejection.rejectedFault)}</Sub>
    </>
  );
}

export default function ClaimSections(props: { detail: ClaimDetail }) {
  const { detail } = props;
  const kindLabel = CLAIM_KIND_LABEL[detail.kind];
  const claimedQty = detail.items.reduce((sum, row) => sum + row.quantity, 0);
  const firstItem = detail.items[0];

  const blocks: Array<{
    key: string;
    title: ReactNode;
    aside?: ReactNode;
    body: ReactNode;
  }> = [];

  // 클레임 — 4칸. 운영자 개설은 신청 대신 「개설 · 근거」가 들어간다
  blocks.push({
    key: "claim",
    title: "클레임",
    body: (
      <Grid2>
        <Frow label="유형">
          {kindLabel} · {detail.reason} <Sub>· {party(detail.fault)} 귀책</Sub>
        </Frow>
        <Frow label="주문">
          <Num>{detail.orderNo}</Num>{" "}
          <Sub>
            · {detail.brandName}
            {detail.confirmedAt && ` · 구매확정 ${md(detail.confirmedAt)}`}
          </Sub>
        </Frow>
        {detail.opened ? (
          <>
            <Frow label="개설">
              <b>운영자 {detail.opened.operatorName}</b>{" "}
              <Sub>· {mdHm(detail.opened.openedAt)}</Sub>
            </Frow>
            <Frow label="근거">
              1:1 문의 {detail.opened.basis.inquiryNo} ·{" "}
              {detail.opened.basis.summary} · 사진{" "}
              {detail.opened.basis.photoCount}장
            </Frow>
          </>
        ) : (
          <>
            <Frow label="신청">
              <Num>{mdHm(detail.appliedAt)}</Num>
              {IN_MOTION_STAGES.has(detail.stage) && (
                <>
                  {" "}
                  <Sub>· 소비자 {detail.consumerName}</Sub>
                </>
              )}
            </Frow>
            {detail.hold ? (
              // 반려 보류는 항목 블록이 없다 — 반려한 상품을 클레임 줄에서 보인다
              <Frow label="항목">
                {firstItem.name} {firstItem.option} ×{firstItem.quantity} ·{" "}
                <Num>{won(firstItem.price)}</Num>
              </Frow>
            ) : (
              <Frow label="상세 내용">
                {detail.detailText ? (
                  `“${detail.detailText}”`
                ) : (
                  <Dim>선택 입력 없음</Dim>
                )}
              </Frow>
            )}
          </>
        )}
      </Grid2>
    ),
  });

  // 항목 — 반려 보류는 위 클레임 줄로 갈음한다
  if (!detail.hold) {
    const hasResult = detail.rejection?.scope === "PARTIAL";
    let note: string | null = null;
    if (hasResult && detail.rejection) {
      note = `신청 ${detail.rejection.claimedQty} · 통과 ${
        detail.rejection.claimedQty - detail.rejection.rejectedQty
      } · 반려 ${detail.rejection.rejectedQty}`;
    } else if (detail.orderedQty !== null) {
      note = `주문 수량 ${detail.orderedQty} · ${kindLabel} 신청 ${claimedQty}`;
    }
    blocks.push({
      key: "items",
      title: hasResult ? "항목 · 검수 결과" : "항목",
      aside: note ? <span>{note}</span> : undefined,
      body: (
        <Sc>
          {detail.items.map((row, index) => (
            <ItRow key={`${row.name}-${index}`}>
              <span>{row.name}</span>
              <Dim>{row.option}</Dim>
              <span className="text-sz-n-500">×{row.quantity}</span>
              {row.status && (
                <ClaimBadge tone={row.status.tone} hideDot>
                  {row.status.label}
                </ClaimBadge>
              )}
              <RowEnd className={row.dimmed ? "text-sz-n-400" : undefined}>
                {won(row.price)}
              </RowEnd>
            </ItRow>
          ))}
        </Sc>
      ),
    });
  }

  // 검수 반려 6항목 — 사유 · 법적 근거 · 범위 · 귀책 · 증빙 · 메시지(파트너 검수 반려·소비자 C10-5와 1:1)
  if (detail.rejection) {
    const rejection = detail.rejection;
    blocks.push({
      key: "rejection",
      title:
        rejection.scope === "PARTIAL" ? (
          "반려분 (6항목)"
        ) : (
          <>
            검수 반려{" "}
            <Sub className="font-normal">· 브랜드 제출 = 소비자 C10-5</Sub>
          </>
        ),
      body: (
        <>
          <Grid2>
            <Frow label="반려 사유">{rejection.reason}</Frow>
            <Frow label="법적 근거">{rejection.legalBasis}</Frow>
            <Frow label="범위">
              <b>{rejection.scope === "ALL" ? "전체 반려" : "일부 반려"}</b>{" "}
              <Sub>
                · {rejection.rejectedQty} / {rejection.claimedQty}개
              </Sub>
            </Frow>
            <Frow label="귀책">{rejectionFault(rejection)}</Frow>
          </Grid2>
          <Frow label="증빙">
            <Sub>{rejection.evidence}</Sub>
          </Frow>
          {rejection.consumerMessage && (
            <Frow label="소비자 메시지">“{rejection.consumerMessage}”</Frow>
          )}
        </>
      ),
    });
  }

  // 반려 보류 — 재발송비 결제를 기다리는 상태. 폐기 표기·폐기 액션은 없다(약관 반영 전, 결정 12)
  if (detail.hold) {
    const hold = detail.hold;
    blocks.push({
      key: "hold",
      title: "반려 보류",
      body: (
        <Grid2>
          <Frow label="재발송비">
            <Num>{won(hold.reshipFee)}</Num> · 결제 대기{" "}
            <Sub>· D-{hold.payDueDays}</Sub>
          </Frow>
          <Frow label="고지">
            {hold.noticeCount}회 <Sub>· {md(hold.lastNoticeAt)}</Sub>
          </Frow>
          <Frow label="보관 기한">
            <Num>{md(hold.retainUntil)}</Num>{" "}
            <Sub>· 이후 처리는 약관 반영 후</Sub>
          </Frow>
          <Frow label="구매확정">
            <b>타이머 정지</b>
          </Frow>
        </Grid2>
      ),
    });
  }

  if (detail.objection) {
    const objection = detail.objection;
    blocks.push({
      key: "objection",
      title: "소비자 이의",
      body: (
        <p className="m-0 text-[12px] leading-[1.7]">
          “{objection.text}”{" "}
          <Sub>
            · 1:1 문의 {objection.inquiryNo} · 사진 {objection.photoCount}장 ·{" "}
            {mdHm(objection.receivedAt)}
          </Sub>
        </p>
      ),
    });
  }

  // 회수 — 송장 → 입고 확인(검수 기한은 입고 + 2영업일)
  if (detail.pickup) {
    const pickup = detail.pickup;
    blocks.push({
      key: "pickup",
      title: "회수",
      body: (
        <Sc>
          <ItRow>
            <Sub>회수 송장</Sub>
            {pickup.trackingNo ? (
              <span>
                {pickup.carrier} <Num>{pickup.trackingNo}</Num>{" "}
                <Dim>· 소비자 입력</Dim>
              </span>
            ) : (
              <span>
                <Dim>소비자 입력 대기</Dim> <Sub>· 7일 미입력 시 자동 취소</Sub>
              </span>
            )}
            {pickup.pickedUpAt && (
              <RowEnd className="text-[11px] text-sz-n-500">
                집화 <Num>{md(pickup.pickedUpAt)}</Num>
              </RowEnd>
            )}
          </ItRow>
          {pickup.receivedAt && (
            <ItRow>
              <Sub>입고 확인</Sub>
              <span>
                {pickup.receivedBy} · <Num>{mdHm(pickup.receivedAt)}</Num>
              </span>
              <RowEnd className="text-[11px] text-sz-n-500">
                검수 기한{" "}
                <b
                  className={
                    pickup.overdue
                      ? "tabular-nums text-sz-warning-text"
                      : "tabular-nums"
                  }
                >
                  {md(pickup.inspectionDueDate)}
                </b>
                {pickup.overdue && " · 2영업일 초과"}
              </RowEnd>
            </ItRow>
          )}
        </Sc>
      ),
    });
  }

  // 구매확정 후 하자 — 법정 청약철회 기한: 공급일 + 3개월 / 하자 인지 + 30일 중 이른 날
  if (detail.legalDeadline) {
    const legal = detail.legalDeadline;
    blocks.push({
      key: "legal",
      title: "법정 청약철회 기한",
      body: (
        <Grid2>
          <Frow label="공급일">
            <Num>{md(legal.suppliedAt)}</Num>{" "}
            <Sub>→ 3개월 {md(legal.suppliedLimit)}</Sub>
          </Frow>
          <Frow label="하자 인지">
            <Num>{md(legal.defectKnownAt)}</Num>{" "}
            <Sub>→ 30일 {md(legal.defectLimit)}</Sub>
          </Frow>
          <Frow label="적용 기한">
            <b className={"tabular-nums"}>{md(legal.appliedDeadline)}</b>{" "}
            <Sub>· 이른 날</Sub>
          </Frow>
          <Frow label="회수 송장">
            {legal.trackingEntered ? (
              "입력 완료"
            ) : (
              <>
                <Dim>소비자 입력 대기</Dim> <Sub>· 7일 미입력 시 자동 취소</Sub>
              </>
            )}
          </Frow>
        </Grid2>
      ),
    });
  }

  // 금액(예정) — 검수 통과 즉시 PG 자동 환불이라 운영자 집행 단계가 없다. 그래서 「예정」이다
  if (detail.amount) {
    const amount = detail.amount;
    const confirm = detail.purchaseConfirm;
    blocks.push({
      key: "amount",
      title: "금액 (예정)",
      body: (
        <Grid2>
          <Frow label="상품 금액">
            <Num>{won(amount.productAmount)}</Num>
          </Frow>
          <Frow label="최초 배송비 차감">
            {amount.firstShippingDeduction > 0 ? (
              <>
                <Num>{minusWon(amount.firstShippingDeduction)}</Num>{" "}
                <Sub>
                  · {amount.freeShipping && "무료배송 · "}
                  {party(detail.fault)} 귀책
                </Sub>
              </>
            ) : (
              <>
                <Num>없음</Num> <Sub>· {party(detail.fault)} 귀책</Sub>
              </>
            )}
          </Frow>
          <Frow label="통과 시 환불">
            <b className={"tabular-nums"}>{won(amount.refundOnPass)}</b>{" "}
            <Sub>· PG 자동</Sub>
          </Frow>
          {confirm && (
            <Frow label="구매확정">
              <b>타이머 정지</b>
              {confirm.remainingDays !== null && (
                <>
                  {" "}
                  <Sub>· 남은 {confirm.remainingDays}일</Sub>
                </>
              )}
            </Frow>
          )}
        </Grid2>
      ),
    });
  } else if (detail.purchaseConfirm && !detail.hold) {
    // 교환은 금액이 오가지 않는다 — 구매확정 타이머만 남는다
    const confirm = detail.purchaseConfirm;
    blocks.push({
      key: "confirm",
      title: "구매확정",
      body: (
        <Frow label="구매확정">
          {confirm.timer === "RESTARTED" ? (
            <b>{confirm.remainingDays}일 새로 시작</b>
          ) : (
            <>
              <b>타이머 정지</b>
              {confirm.remainingDays !== null && (
                <>
                  {" "}
                  <Sub>· 남은 {confirm.remainingDays}일</Sub>
                </>
              )}
            </>
          )}
        </Frow>
      ),
    });
  }

  // 환불 계산식 — 상품 금액 − 최초 배송비 − 재발송비(일부 반려). 소비자가 「왜 이 금액만」 물을 때의 근거다
  if (detail.refundCalc) {
    const calc = detail.refundCalc;
    blocks.push({
      key: "calc",
      title: calc.title,
      body: (
        <Sc>
          {calc.lines.map((line) => (
            <ItRow key={line.label}>
              <Sub>
                {line.kind === "TOTAL" ? (
                  <b className={"text-sz-n-900"}>{line.label}</b>
                ) : (
                  line.label
                )}
              </Sub>
              <span>
                {line.kind === "TOTAL" ? (
                  <b className={"tabular-nums"}>{won(line.amount)}</b>
                ) : (
                  <Num>
                    {line.kind === "MINUS"
                      ? minusWon(line.amount)
                      : won(line.amount)}
                  </Num>
                )}
              </span>
              <RowEnd className="text-[11px] text-sz-n-500">{line.note}</RowEnd>
            </ItRow>
          ))}
        </Sc>
      ),
    });
  }

  // 정산 반영 — 이미 확정된 회차면 통과 시 다음 정산에서 차감
  if (detail.settlement) {
    const settlement = detail.settlement;
    blocks.push({
      key: "settlement",
      title: "정산 반영",
      body: (
        <Grid2>
          <Frow label="정산">
            <Num>{md(settlement.confirmedRound)}</Num> 회차 확정
          </Frow>
          <Frow label="통과 시">
            <b>다음 정산에서 차감</b>{" "}
            <Sub>· {settlement.deductTargets.join(" · ")}</Sub>
          </Frow>
        </Grid2>
      ),
    });
  }

  blocks.push({
    key: "history",
    title: "이력",
    body: (
      <div className="pt-0.5">
        {detail.history.map((row, index) => (
          <HistoryItem
            key={`${row.label}-${index}`}
            tone={row.tone}
            label={row.label}
            meta={[row.actor, row.extra, mdHm(row.at)]
              .filter(Boolean)
              .join(" · ")}
          />
        ))}
      </div>
    ),
  });

  return (
    <>
      {blocks.map((block, index) => (
        <Block
          key={block.key}
          index={index}
          title={block.title}
          aside={block.aside}
        >
          {block.body}
        </Block>
      ))}
    </>
  );
}
