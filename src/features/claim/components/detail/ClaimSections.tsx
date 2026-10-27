import { AUTO_RECEIVE_TEXT } from "@/features/claim/constants/guides";
import type {
  ClaimDetail,
  ClaimFreightRow,
  ClaimTone,
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
import {
  dDay,
  md,
  mdDate,
  mdDue,
  mdHm,
  minusWon,
  won,
} from "@/features/claim/utils/format";
import type { ReactNode } from "react";

/*
  상세 좌측 블록 — 서버가 단계마다 채워 내리는 값(null 아닌 블록)만 그린다.
  번호(① ②…)는 그려진 순서대로 붙는다 — 시안도 상태마다 블록 구성이 다르다.
  블록 순서: 클레임 → 항목 → 법정 청약철회 기한 → 검수 반려 → 반려 보류 → 소비자 이의 → 회수 → 재발송 → 금액
  → 검수 판정 · 운임 정산 → 처리 결과 → 정산 반영 → 이력.
*/

/** 이력 점 색 — 서버는 톤을 내리지 않는다. 반려·지연 계열만 경고, 종결 계열은 성공 */
function historyTone(eventType: string): ClaimTone {
  if (/REJECT|OVERDUE|EXPIRED/.test(eventType)) return "WARNING";
  if (/COMPLETED|REFUNDED|EXCHANGED|ACCEPTED/.test(eventType)) {
    return "SUCCESS";
  }
  return "INFO";
}

/** 첨부 사진 — 새 창으로 원본을 연다 */
function Photos(props: { urls: Array<string> }) {
  if (props.urls.length === 0) return <Dim>없음</Dim>;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {props.urls.map((url, index) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-sz-accent-500 hover:underline"
        >
          사진 {index + 1}
        </a>
      ))}
    </span>
  );
}

/**
 * 최초 배송비 차감 보조줄(06b rev.6 기-18) — 시안 B1 「무료배송 주문 · 소비자 귀책 · 전량 반품이라 남은 금액
 * 0원(기준 미달) · 브랜드 정산에 남음」 · B3 「브랜드 귀책 · 착불 · 차감 없음」.
 * 차감이 있으면 무료배송 · 소비자 귀책은 규칙상 확정이라 그대로 적고, 무료배송 기준 판정(가운데 마디)은
 * 서버 값(`deductionReason` — 서버 없음 · DEV 목업만)이 있을 때만 붙인다.
 */
function deductionNote(detail: ClaimDetail) {
  if (detail.feeBearer === "SELLER") {
    return "브랜드 귀책 · 착불 · 차감 없음";
  }
  const deducted = (detail.claim.refund?.requestDeduction ?? 0) > 0;
  const parts = deducted
    ? [
        "무료배송 주문",
        "소비자 귀책",
        detail.deductionReason,
        "브랜드 정산에 남음",
      ]
    : ["소비자 귀책", detail.deductionReason];
  return parts.filter(Boolean).join(" · ");
}

/** 운임 정산 방향 — 브랜드 정산 「± 운임 정산」의 부호와 같다(07b) */
function freightDirection(row: ClaimFreightRow) {
  return row.direction === "CHARGE_CONSUMER"
    ? "브랜드 → 소비자 귀책 · 소비자 부담"
    : "소비자 → 브랜드 귀책 · 소비자 환급";
}

/** 운임 정산 금액 마디 — 착불 운임 · 선불 운임 환급 · 최초 배송비 환원(표시용) */
function freightParts(row: ClaimFreightRow) {
  return [
    row.collectFreight > 0 && `착불 운임 ${won(row.collectFreight)}`,
    row.prepaidFreight > 0 &&
      `선불 운임 환급 ${won(row.prepaidFreight)}(기본 배송비 편도 정액)`,
    row.initialFeeRestored > 0 &&
      `최초 배송비 환원 ${won(row.initialFeeRestored)}`,
    row.settledVia === "BANK_TRANSFER" &&
      "원래 결제액 초과분 · 운영자 계좌 송금",
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function ClaimSections(props: { detail: ClaimDetail }) {
  const { detail } = props;
  const { claim } = detail;
  const row = claim.summary;
  const isHold = row.stage === "REJECT_HOLD";

  const blocks: Array<{
    key: string;
    title: ReactNode;
    aside?: ReactNode;
    body: ReactNode;
  }> = [];

  // 클레임 — 4칸. 운영자 개설은 「개설 · 증빙」이 더해진다
  blocks.push({
    key: "claim",
    title: "클레임",
    body: (
      <Grid2>
        <Frow label="유형">
          {row.typeLabel} · {row.reasonLabel}{" "}
          <Sub>· {detail.feeBearerLabel}</Sub>
        </Frow>
        <Frow label="주문">
          <Num>{claim.orderNumber}</Num> <Sub>· {detail.brandName}</Sub>
        </Frow>
        <Frow label="신청">
          <Num>{mdHm(row.requestedAt)}</Num>{" "}
          <Sub>
            · 소비자 {row.consumerName}
            {claim.consumerPhone && ` · ${claim.consumerPhone}`}
          </Sub>
        </Frow>
        <Frow label="상세 내용">
          {claim.reasonDetail ? (
            `“${claim.reasonDetail}”`
          ) : (
            <Dim>선택 입력 없음</Dim>
          )}
        </Frow>
        {row.openedByOperator && (
          <Frow label="개설">
            <b>운영자 개설</b>
            {row.openReason && <Sub> · {row.openReason}</Sub>}
          </Frow>
        )}
        {(row.openedByOperator || claim.consumerAttachments.length > 0) && (
          <Frow label="소비자 증빙">
            <Photos urls={claim.consumerAttachments} />
          </Frow>
        )}
      </Grid2>
    ),
  });

  // 항목 — 그 하위주문의 항목 전체. 신청하지 않은 항목은 흐리게
  if (row.orderItems.length > 0) {
    blocks.push({
      key: "items",
      title: "항목",
      aside: <span>{row.orderSummary}</span>,
      body: (
        <Sc>
          {row.orderItems.map((item, index) => {
            const claimed = item.claimedQuantity > 0;
            return (
              <ItRow key={`${item.productName}-${item.optionName}-${index}`}>
                <span className={claimed ? undefined : "text-sz-n-400"}>
                  {item.productName}
                </span>
                {item.optionName && <Dim>{item.optionName}</Dim>}
                <span className="text-sz-n-500">
                  ×{claimed ? item.claimedQuantity : item.orderedQuantity}
                  {claimed && item.orderedQuantity !== item.claimedQuantity && (
                    <> / 주문 {item.orderedQuantity}</>
                  )}
                </span>
                <ClaimBadge tone={claimed ? "INFO" : "NEUTRAL"} hideDot>
                  {item.itemStatusLabel}
                </ClaimBadge>
                <RowEnd className={claimed ? undefined : "text-sz-n-400"}>
                  {won(
                    item.price *
                      (claimed ? item.claimedQuantity : item.orderedQuantity)
                  )}
                </RowEnd>
              </ItRow>
            );
          })}
          {row.exchangeOptionName && (
            <ItRow>
              <Sub>교환 옵션</Sub>
              <span>
                {row.optionName ?? "—"} → <b>{row.exchangeOptionName}</b>
              </span>
              {/* 기-18 — 「교환비」 명칭 폐기 · 재발송 배송비. main은 `reshipFeeCharged`로 개명(옛 이름 병행) */}
              {(claim.reshipFeeCharged ?? claim.exchangeFeeCharged) !==
                null && (
                <RowEnd className="text-[11px] text-sz-n-500">
                  {(claim.reshipFeeCharged ?? claim.exchangeFeeCharged)
                    ? "재발송 배송비 결제됨"
                    : "재발송 배송비 없음"}
                </RowEnd>
              )}
            </ItRow>
          )}
        </Sc>
      ),
    });
  }

  // 법정 청약철회 기한(B4) — 운영자가 대신 연 클레임만 서버가 채운다. 공급 + 3개월 · 하자 인지 + 30일 중 이른 날
  const hasPickup = Boolean(row.collection || row.receivedAt);
  if (detail.legalDeadline) {
    const legal = detail.legalDeadline;
    blocks.push({
      key: "legal",
      title: "법정 청약철회 기한",
      body: (
        <Grid2>
          <Frow label="공급일">
            <Num>{mdDate(legal.suppliedOn)}</Num>{" "}
            <Sub>→ 3개월 {mdDate(legal.supplyDeadline)}</Sub>
          </Frow>
          <Frow label="하자 인지">
            {legal.noticedOn ? (
              <>
                <Num>{mdDate(legal.noticedOn)}</Num>{" "}
                <Sub>→ 30일 {mdDate(legal.noticeDeadline)}</Sub>
              </>
            ) : (
              <Dim>입력 없음</Dim>
            )}
          </Frow>
          <Frow label="적용 기한">
            <b className="tabular-nums">{mdDate(legal.appliedDeadline)}</b>{" "}
            <Sub>· {legal.noticeDeadline ? "이른 날" : "공급 기준"}</Sub>
          </Frow>
          {/* 회수 블록이 아직 없을 때(송장 입력 전) 시안처럼 이 자리에 회수 송장을 적는다 */}
          {!hasPickup && row.stage === "COLLECT_WAIT" && (
            <Frow label="회수 송장">
              <Dim>소비자 입력 대기</Dim> <Sub>· 7일 미입력 시 자동 취소</Sub>
            </Frow>
          )}
        </Grid2>
      ),
    });
  }

  // 검수 반려 6항목 — 사유 · 법적 근거 · 범위 · 귀책 · 증빙 · 메시지(파트너 검수 반려·소비자 C10-5와 같은 값)
  if (claim.rejection) {
    const rejection = claim.rejection;
    const partial = rejection.splitFromClaimNumber !== null;
    blocks.push({
      key: "rejection",
      title: (
        <>
          검수 반려{" "}
          <Sub className="font-normal">· 브랜드 제출 = 소비자 C10-5</Sub>
        </>
      ),
      body: (
        <>
          <Grid2>
            <Frow label="반려 사유">{row.rejectReasonLabel ?? "—"}</Frow>
            <Frow label="법적 근거">{rejection.legalBasisLabel ?? "—"}</Frow>
            <Frow label="범위">
              <b>{partial ? "일부 반려" : "전체 반려"}</b>{" "}
              <Sub>
                · {row.quantity}개
                {partial && ` · ${rejection.splitFromClaimNumber}에서 분할`}
              </Sub>
            </Frow>
            <Frow label="귀책">
              {rejection.faultChangedToSeller ? (
                <b>브랜드 귀책으로 인정</b>
              ) : (
                <>
                  변경 없음 <Sub>· {detail.feeBearerLabel}</Sub>
                </>
              )}
            </Frow>
          </Grid2>
          <Frow label="증빙">
            <Photos urls={claim.sellerEvidences} />
            {claim.rejectDetail && <Sub> · {claim.rejectDetail}</Sub>}
          </Frow>
          {rejection.consumerMessage && (
            <Frow label="소비자 메시지">“{rejection.consumerMessage}”</Frow>
          )}
        </>
      ),
    });
  }

  // 반려 보류 — 재발송비 결제를 기다리는 상태. 폐기 표기·폐기 액션은 없다(약관 반영 전, 결정 12)
  if (isHold) {
    const fee = row.reshipFee;
    const storage = row.storage;
    blocks.push({
      key: "hold",
      title: "반려 보류",
      body: (
        <Grid2>
          <Frow label="재발송비">
            {fee ? (
              <>
                <Num>{won(fee.amount)}</Num> · {fee.statusLabel}
                {fee.status === "PENDING" && fee.dueAt && (
                  <Sub> · {dDay(fee.dueAt)}</Sub>
                )}
              </>
            ) : (
              <Dim>청구 없음</Dim>
            )}
          </Frow>
          <Frow label="고지">
            {storage ? `${storage.noticeCount}회` : "—"}
            {storage?.lastNoticeAt && <Sub> · {md(storage.lastNoticeAt)}</Sub>}
            {claim.notices.length > 0 && (
              <Sub>
                {" "}
                (
                {claim.notices
                  .map(
                    (notice) =>
                      `${notice.seq}회 ${md(notice.notifiedAt)}${
                        notice.channel ? ` ${notice.channel}` : ""
                      }`
                  )
                  .join(" · ")}
                )
              </Sub>
            )}
          </Frow>
          <Frow label="보관 기한">
            {storage?.storageDueAt ? (
              <>
                <Num>{mdDue(storage.storageDueAt)}</Num>{" "}
                <Sub>
                  ·{" "}
                  {storage.phase === "EXPIRED"
                    ? "기한 경과 · 약관 반영 후 처리"
                    : "이후 처리는 약관 반영 후"}
                </Sub>
              </>
            ) : (
              <Dim>고지 2회 후 확정</Dim>
            )}
          </Frow>
          <Frow label="반려일시">
            <Num>{mdHm(row.rejectedAt)}</Num>
          </Frow>
        </Grid2>
      ),
    });
  }

  if (detail.dispute) {
    const dispute = detail.dispute;
    blocks.push({
      key: "dispute",
      title: "소비자 이의",
      aside: dispute.answered ? (
        <ClaimBadge tone="NEUTRAL" hideDot>
          답변 완료 {md(dispute.answeredAt)}
        </ClaimBadge>
      ) : (
        <ClaimBadge tone="WARNING" hideDot>
          답변 전
        </ClaimBadge>
      ),
      body: (
        <p className="m-0 text-[12px] leading-[1.7]">
          “{dispute.content}”{" "}
          <Sub>
            · 1:1 문의 #{dispute.inquiryId} · 사진 {dispute.imageUrls.length}장
            · {mdHm(dispute.createdAt)}
          </Sub>
          {dispute.imageUrls.length > 0 && (
            <span className="mt-1 block text-[11px]">
              <Photos urls={dispute.imageUrls} />
            </span>
          )}
        </p>
      ),
    });
  }

  // 회수 — 송장 → 도착 → 입고 확인(검수 기한 = 입고 + 2영업일)
  if (hasPickup) {
    const collection = row.collection;
    blocks.push({
      key: "pickup",
      title: "회수",
      aside:
        collection && collection.size > 1 ? (
          <span>
            {collection.leadClaimNumber} 외 {collection.size - 1}건 한 박스
          </span>
        ) : undefined,
      body: (
        <Sc>
          <ItRow>
            <Sub>회수 송장</Sub>
            {collection?.trackingNumber ? (
              <span>
                {collection.carrierLabel} <Num>{collection.trackingNumber}</Num>{" "}
                <Dim>· 소비자 입력</Dim>
              </span>
            ) : (
              <span>
                <Dim>소비자 입력 대기</Dim> <Sub>· 7일 미입력 시 자동 취소</Sub>
              </span>
            )}
            {collection?.lastTrackingLabel && (
              <RowEnd className="text-[11px] text-sz-n-500">
                {collection.lastTrackingLabel}{" "}
                <Num>{md(collection.lastTrackingAt)}</Num>
              </RowEnd>
            )}
          </ItRow>
          {row.receivedAt && (
            <ItRow>
              <Sub>입고 확인</Sub>
              <span>
                브랜드 {detail.brandName} · <Num>{mdHm(row.receivedAt)}</Num>
              </span>
              {row.inspectDueAt && (
                <RowEnd className="text-[11px] text-sz-n-500">
                  검수 기한{" "}
                  <b
                    className={
                      detail.inspectOverdueBusinessDays !== null
                        ? "tabular-nums text-sz-warning-text"
                        : "tabular-nums"
                    }
                  >
                    {mdDue(row.inspectDueAt)}
                  </b>
                  {detail.inspectOverdueBusinessDays !== null &&
                    ` · ${detail.inspectOverdueBusinessDays}영업일 초과`}
                </RowEnd>
              )}
            </ItRow>
          )}
        </Sc>
      ),
    });
  }

  // 재발송 — 교환 재발송 · 반려 반송
  if (row.reshipReason && !isHold) {
    blocks.push({
      key: "reship",
      title: "재발송",
      body: (
        <Sc>
          <ItRow>
            <Sub>{row.reshipReasonLabel}</Sub>
            <span>{row.shipLabel ?? row.productLabel}</span>
            <RowEnd className="text-[11px] text-sz-n-500">
              {row.reshipTrackingNumber ? (
                <>
                  {row.reshipCarrierLabel} <Num>{row.reshipTrackingNumber}</Num>
                </>
              ) : (
                <Dim>송장 등록 전</Dim>
              )}
            </RowEnd>
          </ItRow>
          {row.reshipFee && (
            <ItRow>
              <Sub>재발송비</Sub>
              <span>
                <Num>{won(row.reshipFee.amount)}</Num> ·{" "}
                {row.reshipFee.statusLabel}
              </span>
            </ItRow>
          )}
        </Sc>
      ),
    });
  }

  // 금액 — 반품만. 판정 전은 예정, 판정이 끝났으면 확정액(서버 `refund`가 같은 식으로 내린다)
  if (claim.refund) {
    const refund = claim.refund;
    const settled = row.outcome !== null;
    blocks.push({
      key: "amount",
      title: settled ? "환불 계산" : "금액 (예정)",
      body: (
        <Sc>
          <ItRow>
            <Sub>상품 금액</Sub>
            <Num>{won(refund.itemAmount)}</Num>
            <RowEnd className="text-[11px] text-sz-n-500">
              단가 × 신청 수량
            </RowEnd>
          </ItRow>
          <ItRow>
            <Sub>최초 배송비 차감</Sub>
            <Num>
              {refund.requestDeduction > 0
                ? minusWon(refund.requestDeduction)
                : "없음"}
            </Num>
            <RowEnd className="text-[11px] text-sz-n-500">
              {deductionNote(detail)}
            </RowEnd>
          </ItRow>
          <ItRow>
            <Sub>
              <b className="text-sz-n-900">
                {settled ? "환불액" : "통과 시 환불"}
              </b>
            </Sub>
            <b className="tabular-nums">{won(refund.requestExpectedAmount)}</b>
            <RowEnd className="text-[11px] text-sz-n-500">
              {refund.basisLabel}
            </RowEnd>
          </ItRow>
        </Sc>
      ),
    });
  }

  // 검수 판정 · 운임 정산(06b rev.5 기-17 · rev.7 기-93) — main 서버가 판정 · 운임 행 · 자동 입고가 있을 때만
  // `claim.inspection`을 내린다(개발 서버 미배포 — 그 전에는 블록이 없다)
  const inspection = claim.inspection;
  if (inspection) {
    blocks.push({
      key: "inspection",
      title: "검수 판정 · 운임 정산",
      body: (
        <Sc>
          {inspection.result && (
            <ItRow>
              <Sub>판정</Sub>
              <b>{inspection.resultLabel}</b>
              {inspection.result === "REASON_OVERTURNED" && (
                <RowEnd className="text-[11px] text-sz-n-500">
                  귀책 브랜드 → 소비자
                </RowEnd>
              )}
            </ItRow>
          )}
          {inspection.explanation && (
            <ItRow>
              <Sub>번복 설명</Sub>
              <span>“{inspection.explanation}”</span>
            </ItRow>
          )}
          {inspection.autoReceived && (
            <ItRow>
              <Sub>입고</Sub>
              <span>{AUTO_RECEIVE_TEXT.done}</span>
            </ItRow>
          )}
          {inspection.overturnFee !== null && (
            <ItRow>
              <Sub>번복 결제</Sub>
              <Num>{won(inspection.overturnFee)}</Num>
              <RowEnd className="text-[11px] text-sz-n-500">
                재발송 배송비 + 착불 운임 · 소비자 결제
              </RowEnd>
            </ItRow>
          )}
          {inspection.freight.map((row, index) => (
            <ItRow key={`${row.trigger}-${index}`}>
              <Sub>운임 정산</Sub>
              <span>
                {row.triggerLabel} <Sub>· {freightDirection(row)}</Sub>
                <span className="block text-[11px] text-sz-n-500">
                  {freightParts(row)}
                </span>
              </span>
              <RowEnd className="text-[11px] text-sz-n-500">
                브랜드 정산{" "}
                <b className="tabular-nums text-sz-n-900">
                  {row.signedAmount >= 0 ? "+ " : "− "}
                  {won(Math.abs(row.signedAmount))}
                </b>
              </RowEnd>
            </ItRow>
          ))}
        </Sc>
      ),
    });
  }

  // 처리 결과 — 완료 탭 단계만
  if (claim.result || row.outcome?.finalized) {
    const result = claim.result;
    blocks.push({
      key: "result",
      title: "처리 결과",
      body: (
        <Grid2>
          <Frow label="결과">
            <b>{row.outcome?.label ?? "—"}</b>
            {row.completedAt && <Sub> · {mdHm(row.completedAt)}</Sub>}
          </Frow>
          {row.amount !== null && (
            <Frow label="금액">
              <Num>{won(row.amount)}</Num>
            </Frow>
          )}
          {result?.reshipDeliveredAt && (
            <Frow label="재발송 도착">
              <Num>{mdHm(result.reshipDeliveredAt)}</Num>
            </Frow>
          )}
          {result?.confirmDueAt && (
            <Frow label="구매확정 예정">
              <Num>{md(result.confirmDueAt)}</Num> <Sub>· 7일 새로 시작</Sub>
            </Frow>
          )}
          {result?.rejectionEnd && (
            <Frow label="반려 종결">
              {result.rejectionEnd === "RETURNED" ? "반송 완료" : "폐기"}
              {result.disposedAt && <Sub> · {md(result.disposedAt)}</Sub>}
            </Frow>
          )}
        </Grid2>
      ),
    });
  }

  // 정산 반영(B4) — 그 하위주문이 이미 정산에 들어갔으면 통과 시 다음 정산에서 차감된다.
  // 소비자가 연 클레임은 구매확정 전이라 대개 정산 전이다 — 정산이 있을 때만 그리고, 운영자 개설(구매확정 후 하자)은 정산 전이어도 그린다
  if (detail.settlement || row.openedByOperator) {
    const settlement = detail.settlement;
    blocks.push({
      key: "settlement",
      title: "정산 반영",
      body: (
        <Grid2>
          <Frow label="정산">
            {settlement ? (
              <>
                <Num>{settlement.settlementNumber}</Num> ·{" "}
                {settlement.statusLabel}
                {settlement.confirmedAt && (
                  <Sub> · {md(settlement.confirmedAt)} 확정</Sub>
                )}
              </>
            ) : (
              <>
                <Dim>정산 전</Dim> <Sub>· 생성 시 반영</Sub>
              </>
            )}
          </Frow>
          {settlement?.deductOnPass && (
            <Frow label="통과 시">
              <b>다음 정산에서 차감</b> <Sub>· 브랜드 수취액 · 리워드</Sub>
            </Frow>
          )}
        </Grid2>
      ),
    });
  }

  blocks.push({
    key: "history",
    title: "이력",
    body:
      claim.history.length > 0 ? (
        <div className="pt-0.5">
          {claim.history.map((item, index) => (
            <HistoryItem
              key={`${item.eventType}-${item.occurredAt}-${index}`}
              tone={historyTone(item.eventType)}
              label={item.eventLabel}
              meta={[item.actorLabel, item.detail, mdHm(item.occurredAt)]
                .filter(Boolean)
                .join(" · ")}
            />
          ))}
        </div>
      ) : (
        <Dim>이력이 없습니다</Dim>
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
