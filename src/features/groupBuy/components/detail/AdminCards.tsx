import Btn from "@/features/contract/components/shared/Btn";
import { formatPercent } from "@/features/contract/utils/format";
import {
  B,
  FLINK,
  FRow,
  Gate,
  GbBadge,
  GbCard,
  Kpi4,
  MWarn,
  MiniBtn,
  PiX,
  ProductChip,
  ReqBox,
  SettlementMachine,
  TSub,
} from "@/features/groupBuy/components/shared/GbParts";
import {
  type AdminView,
  type Detail,
  actorText,
  d,
  daysBetween,
  daysUntilLocalDate,
  dLabel,
  dDayFromNow,
  dt,
  dutyText,
  localDate,
  md,
  mdDate,
  num,
  periodShort,
  quantityText,
  won,
} from "@/features/groupBuy/utils/view";
import { useState, type ReactNode } from "react";

/*
  시안 ui-admin-17-groupbuys 좌측 카드 — 판정 맥락(요청 원문·통지·게이트)이 맨 위에 오고
  판매 실적은 좌측 4칸 그리드, 레일은 상태와 조치만 담는다.
*/

// ── B1 오픈 승인 판정 ────────────────────────────────

export function OpenReviewCard(props: {
  detail: Detail;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { detail, onApprove, onReject } = props;
  const { readiness, openReview, permissions, brand, creator, timeline } =
    detail;
  const gates = readiness?.gates ?? [];

  return (
    <GbCard
      title="오픈 승인 판정"
      note="게이트 3개 · 셋이 모두 충족되면 시작일에 자동으로 열린다"
    >
      {gates.map((gate) => {
        const tone =
          gate.state === "DONE"
            ? "ok"
            : // 시안 「내 차례인 줄만 경고 톤」 — 반려(REJECTED)는 인플루언서 차례라 회색
              gate.state === "MY_TURN"
              ? "wait"
              : "idle";
        if (gate.key === "STOCK_CONFIRMED") {
          return (
            <Gate
              key={gate.key}
              tone={tone}
              title="최소 준비 물량 확보"
              sub={
                gate.done
                  ? `브랜드 자기 확인 · ${dt(gate.doneAt)} · ${gate.doneByName ?? brand.name}`
                  : "브랜드 자기 확인 대기"
              }
            />
          );
        }
        if (gate.key === "POST_SUBMITTED") {
          return (
            <Gate
              key={gate.key}
              tone={tone}
              title="공구 게시물 등록"
              sub={
                gate.done
                  ? `인플루언서 제출 · ${dt(gate.doneAt)} · ${gate.doneByName ?? creator.name}`
                  : gate.state === "REJECTED"
                    ? "반려 · 인플루언서 재등록 대기"
                    : "인플루언서 작성 대기"
              }
            />
          );
        }
        const myTurn = gate.state === "MY_TURN" && openReview;
        return (
          <Gate
            key={gate.key}
            tone={tone}
            title="운영자 오픈 승인"
            sub={
              myTurn && openReview ? (
                <>
                  <B className="text-sz-n-700">내 차례</B> — 접수{" "}
                  {dt(openReview.submittedAt)} · SLA 영업일{" "}
                  {openReview.slaBusinessDays}일 ·{" "}
                  <B
                    className={
                      openReview.overdue
                        ? "text-sz-warning-text"
                        : "text-sz-n-700"
                    }
                  >
                    기한 {d(openReview.dueAt)}
                  </B>
                  ({dLabel(openReview.daysLeft)}) ·{" "}
                  {timeline.startOverdue
                    ? "시작 시각이 지나 승인하면 단축된 기간으로 바로 열린다"
                    : `시작일 ${d(timeline.startAt)} 전까지 승인돼야 공구가 열린다`}
                </>
              ) : gate.state === "REJECTED" ? (
                "반려 · 인플루언서 재등록 대기"
              ) : gate.done ? (
                `승인 · ${dt(gate.doneAt)}${gate.doneByName ? ` · 운영자(${gate.doneByName})` : ""}`
              ) : (
                "게시물 등록 후 심사 · SLA 영업일 3일"
              )
            }
            actions={
              myTurn &&
              (permissions.canApproveOpen || permissions.canRejectOpen) ? (
                <>
                  {permissions.canApproveOpen && (
                    <Btn variant="primary" onClick={onApprove}>
                      오픈 승인
                    </Btn>
                  )}
                  {permissions.canRejectOpen && (
                    <Btn variant="delete" onClick={onReject}>
                      반려
                    </Btn>
                  )}
                </>
              ) : undefined
            }
          />
        );
      })}
    </GbCard>
  );
}

// ── B2c 직권 중단 사전 통지 ──────────────────────────

/** 「가이드 공유 캡처.png」 → 「가이드 공유 캡처」 */
function fileBaseName(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

function fileSizeText(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)}MB`
    : `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

/** 시안 ⑫ `.files` — 소명 첨부 목록(파일마다 누를 때 다운로드 URL 발급) */
function AppealFiles(props: {
  files: NonNullable<
    NonNullable<Detail["adminSuspension"]>["appeal"]
  >["attachments"];
  onOpen: (attachmentId: number) => void;
}) {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {props.files.map((file) => (
        <button
          key={file.attachmentId}
          type="button"
          onClick={() => props.onOpen(file.attachmentId)}
          className="flex items-center gap-2.5 rounded-[6px] border border-sz-n-200 bg-white px-3 py-[9px] text-left hover:border-sz-n-300"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-sz-accent-50 text-[9px] font-bold uppercase text-sz-accent-600">
            {file.name.match(/\.([^.]+)$/)?.[1] ?? "FILE"}
          </span>
          <span className="min-w-0 flex-1 truncate text-[12px] text-sz-n-900">
            {file.name}
          </span>
          <span className="text-[11px] tabular-nums text-sz-n-500">
            {fileSizeText(file.sizeBytes)}
          </span>
        </button>
      ))}
    </div>
  );
}

export function NoticeCard(props: {
  detail: Detail;
  onOpenAttachment: (attachmentId: number) => void;
  onOpenRevisions: () => void;
}) {
  const { detail, onOpenAttachment, onOpenRevisions } = props;
  const [filesOpen, setFilesOpen] = useState(false);
  const suspension = detail.adminSuspension;
  if (!suspension) {
    return null;
  }
  const since = suspension.salesSinceNotice;
  const appeal = suspension.appeal;

  return (
    <GbCard
      title="직권 중단 사전 통지"
      note="파트너 이용약관 제17조② · 집행 3영업일 전 통지"
    >
      <ReqBox
        head={`브랜드(${detail.brand.name}) 앞 발송 · ${dt(suspension.noticedAt)} · ${actorText("ADMIN", suspension.noticedByName)}`}
        body={
          <>
            <B>중단 사유 — {suspension.clauseLabel ?? "직권 중단"}</B>
            <br />
            <span className="whitespace-pre-line">{suspension.noticeBody}</span>
          </>
        }
        meta={
          <>
            통지 경과 <B className="tabular-nums">{suspension.elapsedDays}일</B>{" "}
            · <B>통지만으로 판매가 멈추지 않는다</B>
            {detail.sales && since && (
              <>
                (현재 접수{" "}
                <span className="tabular-nums">
                  {num(detail.sales.orderCount)}건
                </span>{" "}
                · 통지 후 <B className="tabular-nums">+{num(since.orders)}건</B>
                )
              </>
            )}{" "}
            · 집행 전까지 배송·반품·소비자 응대 의무는 <B>브랜드가 계속 부담</B>
            한다(제16조②)
          </>
        }
      />
      <div className="mt-3">
        <FRow label="집행 예정 일시">
          <span className="tabular-nums">
            {dt(suspension.executeScheduledAt)}
          </span>{" "}
          <TSub>
            · 통지일 +3영업일 ·{" "}
            <B>{dDayFromNow(suspension.executeScheduledAt)}</B>
          </TSub>
        </FRow>
        <FRow label="소명 제출 기한">
          <span className="tabular-nums">
            {dt(suspension.appealDeadlineAt)}
          </span>{" "}
          <TSub>
            · 수신일 +3영업일(제17조④) ·{" "}
            <B>
              {suspension.appealDeadlinePassed
                ? "기한 경과"
                : dDayFromNow(suspension.appealDeadlineAt)}
            </B>
          </TSub>
        </FRow>
        {/* 시안 B2c · M7 — 소명은 기한과 별 줄: 미제출이면 판정 규칙을, 제출이면 원문을 읽게 한다 */}
        <FRow label="브랜드 소명">
          {appeal ? (
            <>
              <GbBadge tone="INFO" hideDot>
                제출됨
              </GbBadge>{" "}
              <TSub>
                · <span className="tabular-nums">{dt(appeal.submittedAt)}</span>{" "}
                ·{" "}
                {appeal.submittedByName
                  ? `${detail.brand.name} 담당자 ${appeal.submittedByName}`
                  : actorText("SELLER", detail.brand.name)}
              </TSub>
              <div className="mt-[7px] whitespace-pre-line rounded-[6px] bg-sz-n-50 px-3 py-2.5 text-[12px] leading-[1.75] text-sz-n-700">
                “{appeal.content}”
              </div>
              {/* 시안 「수정 전후 본문 대조 ↗」 「첨부 2건 · 가이드 공유 캡처」 — 소명 주장(문장 삭제)을 판본으로 확인한다 */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <MiniBtn onClick={onOpenRevisions}>
                  수정 전후 본문 대조 ↗
                </MiniBtn>
                {appeal.attachments.length > 0 && (
                  <MiniBtn
                    onClick={() =>
                      // 파일마다 다운로드 URL을 따로 발급한다 — 1건이면 바로 열고, 여러 건이면 목록을 편다
                      appeal.attachments.length === 1
                        ? onOpenAttachment(appeal.attachments[0].attachmentId)
                        : setFilesOpen((open) => !open)
                    }
                  >
                    첨부 {appeal.attachments.length}건 ·{" "}
                    {fileBaseName(appeal.attachments[0].name)}
                  </MiniBtn>
                )}
              </div>
              {filesOpen && appeal.attachments.length > 1 && (
                <AppealFiles
                  files={appeal.attachments}
                  onOpen={onOpenAttachment}
                />
              )}
            </>
          ) : (
            <>
              미제출{" "}
              <TSub>
                · 기한 내 미제출 시 기존 자료를 기준으로 최종 판정(제17조④)
              </TSub>
            </>
          )}
        </FRow>
      </div>
      <MWarn className="mb-0">
        이 통지는 <B>예고일 뿐 공구는 계속 팔립니다</B> — 집행 시점까지 들어온
        주문도 <B>정상 주문</B>이고 배송·환불 의무가 그대로 남습니다. 집행이
        확정되면 게시물은 즉시 노출 중지·판매 차단되고 <B>재개할 수 없습니다</B>
        (제17조⑤).
      </MWarn>
    </GbCard>
  );
}

// ── B2a 기간 연장 요청(조회 전용) ────────────────────

export function ExtensionCard(props: { detail: Detail }) {
  const { detail } = props;
  const extension = detail.extension;
  if (!extension) {
    return null;
  }
  return (
    <GbCard title="기간 연장 요청" note="당사자 합의 사안 · 운영자 승인 없음">
      <ReqBox
        neutral
        head={
          <>
            브랜드({detail.brand.name}) 발신 · {dt(extension.requestedAt)} ·{" "}
            <B>인플루언서 응답 대기</B>
          </>
        }
        body={
          <>
            <B>
              요청 — 종료일 {d(extension.beforeEndAt)} →{" "}
              {d(extension.afterEndAt)} ({extension.days}일 연장)
            </B>
            {extension.reason && (
              <>
                <br />
                {extension.reason}
              </>
            )}
          </>
        }
        meta={
          <>
            응답 기한{" "}
            <B className="tabular-nums">{dt(extension.respondDeadlineAt)}</B>
            (현재 종료 시각) · <B>무응답 = 변경 없이 종결</B> · 연장 요청은{" "}
            <B>공구당 1회</B>라 결과와 무관하게 재요청 경로가 없다
          </>
        }
      />
      <MWarn info className="mb-0">
        <B>운영자 판단이 필요 없는 요청</B>입니다 — 기간은 계약 당사자끼리
        합의한 값이고 연장 기간의 재고·배송 의무를 지는 쪽이 브랜드라, 제3자가
        판단할 근거가 없습니다. 수락되면 종료일이 <B>즉시 반영</B>되고 정산
        일정도 함께 밀립니다. <B>중단·조기 마감과 승인권자가 다릅니다</B>.
      </MWarn>
    </GbCard>
  );
}

// ── B3 · B4 중단 · 조기 마감 요청 ────────────────────

export function RequestCard(props: { detail: Detail }) {
  const { detail } = props;
  const request = detail.activeRequest;
  if (!request) {
    return null;
  }
  const isEarly = request.type === "EARLY_CLOSE";
  const basis = request.decisionBasis;

  return (
    <GbCard
      title={isEarly ? "조기 마감 요청" : "공구 중단 요청"}
      note={
        isEarly
          ? "정상 종결을 앞당기는 요청 · 중단과 다르다"
          : "결정 권한 = 운영자 단독 · 요청자에게 수락·거절 권한 없음"
      }
    >
      <ReqBox
        head={`${actorText(request.requesterType, request.requesterName)} 발신 · ${dt(request.requestedAt)} 접수`}
        body={
          <>
            <B>사유 — {request.reasonLabel ?? request.reasonCode}</B>
            {request.memo && (
              <>
                <br />
                <span className="whitespace-pre-line">{request.memo}</span>
              </>
            )}
          </>
        }
        meta={
          isEarly ? (
            <>
              검토 경과 <B>{request.elapsed}</B> · 승인하면{" "}
              <B>결과 상태는 종료</B>이며 <B>접수분은 그대로 배송·정산</B>된다 ·
              환불이 발생하지 않아 <B>위험색을 쓰지 않는다</B>
            </>
          ) : (
            <>
              검토 경과 <B>{request.elapsed}</B> · 검토 중에도{" "}
              <B>공구는 계속 팔린다</B>
              {basis?.ordersNow !== null && basis?.ordersNow !== undefined && (
                <>
                  (현재 접수 {num(basis.ordersNow)}건
                  {basis.ordersSinceRequest !== null &&
                    ` · 요청 후 +${num(basis.ordersSinceRequest)}건`}
                  )
                </>
              )}{" "}
              · 양측 모두 요청 가능하며 <B>중복 요청은 차단</B>된다
            </>
          )
        }
      />
      {isEarly ? (
        <MWarn info className="mb-0">
          <B>재고 소진은 중단이 아니라 조기 마감</B>입니다 — 판매가 잘 돼 끝나는
          정상 종결이라 중단 사유 목록에서 제외돼 있습니다. 승인하면 종료일이
          오늘로 당겨지고 게시물이 내려가며, 소비자 주문은{" "}
          <B>한 건도 취소되지 않습니다</B>.
        </MWarn>
      ) : (
        <MWarn className="mb-0">
          승인하면 <B>신규 주문만 즉시 차단</B>되고 게시물은 <B>종료</B>로
          내려갑니다. <B>접수분의 배송·환불 의무는 남고</B> 이미 지급된 고정
          지급비는 <B>플랫폼이 회수해 주지 않습니다</B> — 돈이 플랫폼을 지나가지
          않으므로 되돌릴 대상이 없습니다. 판매 리워드는 접수분 기준으로
          정산됩니다.
        </MWarn>
      )}
    </GbCard>
  );
}

// ── 판매 실적(4칸) ───────────────────────────────────

export function SalesCard(props: { detail: Detail; view: AdminView }) {
  const { detail, view } = props;
  const { sales, adminSuspension, post } = detail;
  const { total, breakdown } = quantityText(detail);

  let note: ReactNode = "판매 관리 집계 기준 · 취소·반품 반영 · 실시간";
  if (view === "notice" && adminSuspension?.salesSinceNotice) {
    note = (
      <>
        판매 관리 집계 기준 ·{" "}
        <B>
          통지 후 +{num(adminSuspension.salesSinceNotice.orders)}건 · +
          {won(adminSuspension.salesSinceNotice.amount)}
        </B>
      </>
    );
  } else if (view === "hidden" && post.hidden) {
    note =
      post.hidden.ordersSinceHidden === 0
        ? `숨김 이후 유입 없음 · ${md(post.hidden.hiddenAt)} 이후 증가 0`
        : post.hidden.ordersSinceHidden !== null
          ? `숨김 이후 +${num(post.hidden.ordersSinceHidden)}건 · ${md(post.hidden.hiddenAt)} 기준`
          : `${md(post.hidden.hiddenAt)} 숨김`;
  }

  return (
    <GbCard title="판매 실적" note={note}>
      <Kpi4
        items={[
          {
            value: sales ? num(sales.orderCount) : "—",
            label: "주문",
            sub: "누적",
          },
          {
            value: sales ? num(total) : "—",
            label: "판매 수량",
            sub: breakdown || "—",
          },
          {
            value: sales ? num(sales.amount) : "—",
            label: "판매 금액(원)",
            sub: "취소·반품 제외",
          },
          {
            value: sales ? num(sales.rewardAmount) : "—",
            label: "인플루언서 리워드(원)",
            sub: "정산 시 지급",
          },
        ]}
      />
    </GbCard>
  );
}

// ── 인플루언서 게시물 ────────────────────────────────

/** 하단 메타 — 시안 B5 「2026.08.07 종료」 · B6 「2026.07.18 중단으로 내림」 */
function closedByText(detail: Detail) {
  const date = d(detail.groupBuy.endedAt ?? detail.timeline.endAt);
  switch (detail.post.closedBy) {
    case "EARLY_CLOSED":
      return `${date} 조기 마감으로 내림`;
    case "SUSPENDED":
      return `${date} 중단으로 내림`;
    default:
      return `${date} 종료`;
  }
}

/** 게시물 하단 안내(.pv-l) — 내려간 게시물은 편집 권한 대신 보관 사실을 말한다(시안 B5 · B6) */
function postFootnote(detail: Detail): ReactNode {
  if (detail.post.status === "CLOSED") {
    if (detail.post.closedBy === "SUSPENDED") {
      return (
        <>
          <B className="text-sz-n-700">중단</B>으로 내려간 게시물이다 — 게시물
          상태는 <B className="text-sz-n-700">종료</B>(게시물 「중단」 상태는
          폐기 · 내리는 경로는 공구 종결뿐)이며 원문은 분쟁 근거로 보관된다
        </>
      );
    }
    return (
      <>
        공구가 닫혀 쇼룸에서는 내려갔지만{" "}
        <B className="text-sz-n-700">원문은 보관</B>된다 — 분쟁 시 근거가 되는
        유일한 기록이라 종결 후에도 남긴다(
        {detail.post.closedBy === "EARLY_CLOSED" ? "조기 마감" : "정상 종료"})
      </>
    );
  }
  return (
    <>
      자동 삽입 — 대가관계 표시 · 판매자 정보(소비자 앱 법정 표기) · 공구가 ·
      기간
      <br />
      편집 권한 — 승인 후에는{" "}
      <B className="text-sz-n-700">인플루언서가 재승인 없이 본문을 수정</B>
      한다(승인대기 중에는 불가) · 운영자는 본문을 고치지 않고{" "}
      <B className="text-sz-n-700">게시물 숨김</B>으로만 개입한다 ·{" "}
      <B className="text-sz-n-700">
        §14 자동 삽입 문구와 계약 확정값(상품·가격·기간)은 누구도 바꿀 수 없다
      </B>
    </>
  );
}

export function PostCard(props: {
  detail: Detail;
  view: AdminView;
  onHide: () => void;
  onUnhide: () => void;
  onOpenProduct: (productId: number) => void;
}) {
  const { detail, view, onHide, onUnhide, onOpenProduct } = props;
  const { post, items, permissions } = detail;
  const hasPost = post.status !== "NOT_WRITTEN" && post.status !== "WRITING";

  const meta: Array<ReactNode> = [];
  if (post.submittedAt) {
    meta.push(`등록 ${dt(post.submittedAt)}`);
  }
  if (post.status === "PENDING_APPROVAL") {
    meta.push("운영자 검토 중 · 심사 중에는 인플루언서도 수정할 수 없음");
  } else if (post.status === "REJECTED" && post.rejection) {
    meta.push(`반려 ${dt(post.rejection.rejectedAt)} · 인플루언서 재등록 대기`);
  } else if (post.reviewedAt) {
    meta.push(`승인 ${dt(post.reviewedAt)}`);
    if (post.editCount > 0) {
      meta.push(<B key="edit">인플루언서 수정 {post.editCount}회</B>);
      if (post.lastEditedAt) {
        meta.push(`최근 ${md(post.lastEditedAt)}`);
      }
    }
    if (post.status === "HIDDEN" && post.hidden) {
      meta.push(
        <B key="hid" className="text-sz-warning-text">
          {md(post.hidden.hiddenAt)} 숨김
        </B>
      );
    }
    if (post.status === "CLOSED") {
      meta.push(closedByText(detail));
    }
  }

  return (
    <GbCard
      title="인플루언서 게시물"
      inlineNote={`쇼룸 게시물 · 인플루언서 작성${post.postNumber ? ` · ${post.postNumber}` : ""}`}
      badge={<GbBadge tone={post.statusTone}>{post.statusLabel}</GbBadge>}
    >
      {!hasPost ? (
        <div className="py-6 text-center text-[12px] text-sz-n-500">
          아직 제출된 게시물이 없습니다 —{" "}
          {post.status === "WRITING"
            ? "인플루언서가 작성하고 있습니다."
            : "인플루언서가 작성을 시작하지 않았습니다."}
        </div>
      ) : (
        <>
          <div className="rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-4 py-3.5">
            <div className="text-[13px] font-semibold text-sz-n-900">
              {post.title ?? "(제목 없음)"}
            </div>
            {post.content && (
              <div className="mt-2 whitespace-pre-line text-[12px] leading-[1.8] text-sz-n-700">
                {post.content}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {items.map((item, index) => (
                <ProductChip
                  key={`${item.productId ?? "x"}-${index}`}
                  onClick={
                    item.productId !== null
                      ? () => onOpenProduct(item.productId!)
                      : undefined
                  }
                >
                  {item.productName} · {won(item.groupBuyPrice)}
                </ProductChip>
              ))}
            </div>
            <div className="mt-3 border-t border-sz-n-200 pt-[9px] text-[11px] leading-[1.7] text-sz-n-500">
              {postFootnote(detail)}
            </div>
          </div>

          {view === "openReview" && (
            <MWarn info className="mb-0">
              검토 기준은 <B>공구를 열지 말지</B>다 — 문구 감수가 아니다.
              표시광고법 위반(효과 단정·의료적 효능·최저가 보장), 계약과 다른
              상품·가격, 대가관계 표시 누락만 본다.{" "}
              <B>승인 후에는 인플루언서가 자유롭게 고친다</B> — 사소한 표현은
              반려하지 말고 승인한 뒤 스레드로 수정을 요청하는 편이 빠르다. 승인
              후 문제가 생기면 <B>게시물 숨김</B>으로 노출을 끊는다.
            </MWarn>
          )}
          {post.status === "REJECTED" && post.rejection && (
            <MWarn className="mb-0">
              <B>반려 사유 — {post.rejection.label ?? post.rejection.code}</B> ·{" "}
              {actorText("ADMIN", post.rejection.rejectedByName)} ·{" "}
              {dt(post.rejection.rejectedAt)}
              <br />
              {post.rejection.detail}
            </MWarn>
          )}
          {post.status === "HIDDEN" && post.hidden && (
            <MWarn className="mb-0">
              <B>숨김 사유 — {post.hidden.label ?? post.hidden.code}</B> ·{" "}
              {actorText("ADMIN", post.hidden.hiddenByName)} ·{" "}
              {dt(post.hidden.hiddenAt)}
              <br />
              {post.hidden.detail} <B>본문은 인플루언서가 고칩니다</B> —
              운영자는 고친 글을 읽고 해제합니다.
            </MWarn>
          )}

          <div className="mt-3.5 flex items-center gap-3 border-t border-sz-n-100 pt-[13px]">
            <span className="text-[11px] text-sz-n-500">
              {meta.map((part, index) => (
                <span key={index}>
                  {index > 0 && " · "}
                  {part}
                </span>
              ))}
            </span>
            {permissions.canUnhidePost ? (
              <MiniBtn className="ml-auto" onClick={onUnhide}>
                숨김 해제
              </MiniBtn>
            ) : permissions.canHidePost ? (
              <MiniBtn className="ml-auto" onClick={onHide}>
                게시물 숨김
              </MiniBtn>
            ) : (
              // 시안 B5 · B6 — 내려간 게시물은 숨김 버튼을 잠근 채 남긴다(.unmask.off)
              post.status === "CLOSED" && (
                <MiniBtn className="ml-auto" disabled>
                  게시물 숨김
                </MiniBtn>
              )
            )}
          </div>
        </>
      )}
    </GbCard>
  );
}

// ── 공구 정보 · 상품 항목 ────────────────────────────

export function InfoCard(props: {
  detail: Detail;
  view: AdminView;
  onOpenContract: () => void;
}) {
  const { detail, view, onOpenContract } = props;
  const { groupBuy, brand, creator, contract, timeline, fixedFee, extension } =
    detail;

  const periodSub = [
    `${timeline.totalDays}일`,
    view === "extension" && extension
      ? `연장 요청 시 ${extension.afterTotalDays}일`
      : null,
    groupBuy.status === "SUSPENDED" ? `${mdDate(groupBuy.endedAt)} 중단` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <GbCard title="공구 정보" note="계약에서 상속 · 어드민도 변경 불가">
      <FRow label="공구번호">
        <span className="tabular-nums">{groupBuy.groupBuyNumber}</span>
      </FRow>
      <FRow label="브랜드">{brand.name}</FRow>
      <FRow label="인플루언서">
        {creator.name}{" "}
        {creator.accountId && (
          <TSub>(쇼룸 showroomz.kr/{creator.accountId})</TSub>
        )}
      </FRow>
      <FRow label="원 계약">
        <button
          type="button"
          className={`${FLINK} tabular-nums`}
          onClick={onOpenContract}
        >
          {contract.contractNumber}
        </button>
        <button
          type="button"
          className={`${FLINK} ml-2`}
          onClick={onOpenContract}
        >
          계약서 보기 ↗
        </button>
        {contract.concludedAt && (
          <PiX>{d(contract.concludedAt)} 체결 · 계약 1건당 공구 1건</PiX>
        )}
      </FRow>
      <FRow label="공구 기간">
        <span className="tabular-nums">
          {periodShort(timeline.startAt, timeline.endAt)}
        </span>
        <PiX>{periodSub}</PiX>
      </FRow>
      <FRow label="고정 지급비">
        {fixedFee.amount === null ? (
          "없음"
        ) : (
          <>
            <span className="tabular-nums">{won(fixedFee.amount)}</span>
            <PiX>
              지급 시점{" "}
              <B className="text-sz-n-900">{fixedFee.triggerLabel ?? "—"}</B> ·{" "}
              <B className="text-sz-n-900">브랜드 직접 지급</B>
            </PiX>
          </>
        )}
      </FRow>
    </GbCard>
  );
}

export function ItemsCard(props: {
  detail: Detail;
  onOpenProduct: (productId: number) => void;
}) {
  const { detail, onOpenProduct } = props;
  return (
    <GbCard
      title="공구 상품 항목"
      note={`${detail.items.length}건 · 상품명을 누르면 상품 상세로 이동`}
    >
      {detail.items.map((item, index) => (
        <div
          key={`${item.productId ?? "x"}-${index}`}
          className="flex items-start gap-2.5 border-b border-sz-n-100 py-[11px] first:pt-0 last:border-b-0 last:pb-0"
        >
          <div className="flex-1">
            {item.productId !== null ? (
              <button
                type="button"
                onClick={() => onOpenProduct(item.productId!)}
                className="text-[12px] font-semibold text-sz-accent-600 hover:underline"
              >
                {item.productName}
                <span className="ml-[3px] text-[9px] text-sz-n-400">↗</span>
              </button>
            ) : (
              <span className="text-[12px] font-semibold text-sz-n-900">
                {item.productName}
              </span>
            )}
            <PiX>
              정가{" "}
              <span className="tabular-nums">{won(item.regularPrice)}</span> ·
              공구가{" "}
              <B className="tabular-nums text-sz-n-900">
                {won(item.groupBuyPrice)}
              </B>{" "}
              · 리워드율{" "}
              <B className="tabular-nums text-sz-n-900">
                {formatPercent(item.rewardRate)}
              </B>{" "}
              · 예상 리워드{" "}
              <span className="tabular-nums">
                {won(item.expectedUnitReward)}
              </span>{" "}
              · 최소 물량{" "}
              <span className="tabular-nums">
                {item.minQuantity === null ? "—" : `${num(item.minQuantity)}개`}
              </span>
            </PiX>
            {/* 옵션 상품 — 판매가·최소 물량이 옵션마다 다르고 서로 대체 충족되지 않는다 */}
            {(item.options ?? []).some(
              (option) => option.variantName !== null
            ) && (
              <PiX>
                옵션 —{" "}
                {item.options
                  .map(
                    (option) =>
                      `${option.variantName ?? "단품"} ${won(option.salePrice)} · 최소 ${
                        option.minQuantity === null
                          ? "—"
                          : `${num(option.minQuantity)}개`
                      }`
                  )
                  .join(" / ")}
              </PiX>
            )}
          </div>
        </div>
      ))}
      <MWarn info className="mb-0 mt-3.5">
        공구가·리워드율·최소 물량은 <B>체결된 계약의 확정값</B>이라 공구에서
        바꿀 수 없습니다 — 어드민도 예외가 아닙니다. 조건을 바꾸려면 이 공구를
        중단하고 <B>새 계약을 체결</B>해야 합니다.
      </MWarn>
    </GbCard>
  );
}

// ── B5 정산 진행 · 계약 이행 확인 ─────────────────────

/** 시안 B5 「(기한 4일 전)」 — 감시 기한까지 남은 날 */
function watchDueText(watch: { dueAt: string; reached: boolean }) {
  const left = daysUntilLocalDate(watch.dueAt);
  if (watch.reached || left < 0) {
    return "기한 경과";
  }
  return left === 0 ? "오늘 기한" : `기한 ${left}일 전`;
}

export function SettlementCard(props: { detail: Detail }) {
  const { detail } = props;
  const settlement = detail.afterEnd?.settlement;
  if (!settlement) {
    return null;
  }
  const watch = settlement.watch;
  return (
    <GbCard
      title="정산 진행"
      note="어드민 전용 · 정산대기 → 운영자 확인 → 이체완료"
    >
      <SettlementMachine stage={settlement.stage} />
      {watch && detail.groupBuy.status === "ENDED" && (
        <MWarn info={!watch.reached} className="mt-3.5">
          <B>정산 지연 감시</B> — 종료 {d(detail.groupBuy.endedAt)} 기준{" "}
          <B className="tabular-nums">{watch.elapsedDays}일차</B>이며{" "}
          <B>종료 +30일</B> 알림 기한은{" "}
          <B className="tabular-nums">{localDate(watch.dueAt)}</B>입니다(
          {watchDueText(watch)}). 강제 처리 규칙은 없으나 미종결 건이 남으면
          정산이 그만큼 늦어지므로, 기한을 넘기면 어드민 알림이 발송됩니다.
        </MWarn>
      )}
      {detail.groupBuy.status === "ENDED" && (
        <MWarn info className="mb-0 mt-3.5">
          정산 트리거는 구매확정이 아니라 <B>모든 주문 항목의 종결</B>입니다 —
          구매확정·환불·거절 확정 셋 다 종결로 셉니다.{" "}
          <B>반품·교환 거절 확정은 즉시 구매확정</B>이라 거절 보류 1건이 공구
          전체 정산을 붙잡지 않습니다. 종결 후 <B>영업일 5일 내 이체</B>.
        </MWarn>
      )}
    </GbCard>
  );
}

function CheckLine(props: {
  label: string;
  check: NonNullable<
    NonNullable<Detail["afterEnd"]>["fulfillment"]
  >["brandToCreator"];
  duty: string;
  name: string;
  extra?: ReactNode;
  agreedAt?: string | null;
}) {
  const { label, check, duty, name, extra, agreedAt } = props;
  return (
    <FRow label={label}>
      {check && check.result === "UNFULFILLED" && agreedAt ? (
        // 시안 B5a — 합의로 이행 전환된 줄은 결과(이행)를 보이고 전환 경위를 적는다
        <>
          <GbBadge hideDot tone="SUCCESS">
            이행
          </GbBadge>{" "}
          <TSub>
            미이행 제출 {d(check.checkedAt)} → <B>합의로 이행 전환</B>{" "}
            {d(agreedAt)}
          </TSub>
        </>
      ) : check ? (
        <>
          <GbBadge
            hideDot
            tone={check.result === "FULFILLED" ? "SUCCESS" : "DANGER"}
          >
            {check.result === "FULFILLED" ? "이행" : "미이행"}
          </GbBadge>{" "}
          <TSub>
            {check.result === "FULFILLED" ? "확인" : "제출"}{" "}
            {dt(check.checkedAt)} ·{" "}
            {check.auto ? (
              <B>무응답 → 자동 이행</B>
            ) : (
              (check.checkedByName ?? name)
            )}{" "}
            · {duty}
          </TSub>
        </>
      ) : (
        <>
          <GbBadge hideDot tone="NEUTRAL">
            확인 전
          </GbBadge>{" "}
          <TSub>{duty}</TSub>
        </>
      )}
      {extra}
    </FRow>
  );
}

export function FulfillmentCard(props: {
  detail: Detail;
  onOpenIssue: () => void;
  onOpenThread: (threadId: number) => void;
  onGoSettlement: () => void;
}) {
  const { detail, onOpenIssue, onOpenThread, onGoSettlement } = props;
  const fulfillment = detail.afterEnd?.fulfillment;
  if (!fulfillment) {
    return null;
  }
  const { brandToCreator, creatorToBrand, targets } = fulfillment;
  const disputed =
    brandToCreator?.result === "UNFULFILLED" ||
    creatorToBrand?.result === "UNFULFILLED";
  const agreed = disputed && fulfillment.agreedAt;
  const bothDone = !!brandToCreator && !!creatorToBrand && !disputed;
  const openIssue = detail.afterEnd?.openIssue;
  const bothResponded =
    !!brandToCreator &&
    !!creatorToBrand &&
    !brandToCreator.auto &&
    !creatorToBrand.auto;
  // 무응답 자동 이행된 쪽 — 확인 기한 줄에 그 사실을 남긴다(시안 B5b)
  const autoSides = [
    brandToCreator?.auto ? "브랜드" : null,
    creatorToBrand?.auto ? "인플루언서" : null,
  ].filter(Boolean);
  const disputedCheck =
    brandToCreator?.result === "UNFULFILLED" ? brandToCreator : creatorToBrand;
  const agreeDays = daysBetween(disputedCheck?.checkedAt, fulfillment.agreedAt);
  const daysAfterEnd = daysBetween(
    detail.groupBuy.endedAt ?? detail.timeline.endAt,
    fulfillment.dueAt
  );
  // 버튼이 하나도 없으면 줄을 두지 않는다(빈 여백 방지)
  const hasActions =
    disputed || !!openIssue?.threadId || detail.permissions.canOpenIssue;

  const reasonBox = (check: typeof brandToCreator) =>
    check?.result === "UNFULFILLED" && check.reason ? (
      <div className="mt-[7px] rounded-[6px] bg-sz-n-50 px-3 py-2.5 text-[12px] leading-[1.75] text-sz-n-700">
        {agreed ? (
          <>
            <B>제출 사유</B> — “{check.reason}”
            {fulfillment.resolutionNote && (
              <>
                <br />
                <B className="text-sz-success-text">합의 결과</B> —{" "}
                {fulfillment.resolutionNote}
              </>
            )}
          </>
        ) : (
          `“${check.reason}”`
        )}
      </div>
    ) : null;

  return (
    <GbCard
      title="계약 이행 확인"
      note={
        agreed
          ? `합의 완료 · ${d(fulfillment.agreedAt)} · 결과 표시`
          : bothDone
            ? "양측 상호 확인 · 정산 선행 조건 충족"
            : "양측 상호 확인 · 정산 선행 조건"
      }
      badge={
        agreed ? (
          <GbBadge tone="SUCCESS">합의 완료</GbBadge>
        ) : bothDone ? (
          <GbBadge tone="SUCCESS">확인 완료</GbBadge>
        ) : undefined
      }
    >
      <CheckLine
        label="브랜드 → 인플루언서"
        check={brandToCreator}
        duty={dutyText(targets.brandToCreator)}
        name={actorText("SELLER", detail.brand.name)}
        extra={reasonBox(brandToCreator)}
        agreedAt={agreed ? fulfillment.agreedAt : null}
      />
      <CheckLine
        label="인플루언서 → 브랜드"
        check={creatorToBrand}
        duty={dutyText(targets.creatorToBrand)}
        name={actorText("CREATOR", detail.creator.name)}
        extra={reasonBox(creatorToBrand)}
        agreedAt={agreed ? fulfillment.agreedAt : null}
      />
      {agreed ? (
        <>
          <FRow label="합의">
            <span className="tabular-nums">{dt(fulfillment.agreedAt)}</span>{" "}
            <TSub>
              · 3자 스레드 종결
              {agreeDays !== null && ` · 소요 ${agreeDays}일`}
            </TSub>
          </FRow>
          <FRow label="정산">
            {fulfillment.resolvedAt ? (
              <>
                <B className="text-sz-success-text">보류 해제</B>{" "}
                <TSub>
                  · {d(fulfillment.resolvedAt)} · 양측 동의로 종결 · 정산
                  관리에서 처리
                </TSub>
              </>
            ) : (
              <>
                <B className="text-sz-warning-text">보류 중</B>{" "}
                <TSub>· 정산 관리에서 해제 대기</TSub>
              </>
            )}
          </FRow>
        </>
      ) : disputed ? (
        <>
          <FRow label="확인 기한">
            <span className="tabular-nums">{dt(fulfillment.dueAt)}</span>{" "}
            <TSub>
              · {fulfillment.duePassed ? "경과" : "진행 중"}
              {bothResponded
                ? " · 무응답은 이행으로 처리되나 양측 모두 응답했다"
                : fulfillment.autoConfirmOnTimeout &&
                  " · 무응답은 이행으로 처리된다"}
            </TSub>
          </FRow>
          <FRow label="정산">
            <B className="text-sz-warning-text">보류 중</B>{" "}
            <TSub>· 합의가 끝날 때까지</TSub>
          </FRow>
        </>
      ) : (
        <>
          <FRow label="확인 기한">
            <span className="tabular-nums">{dt(fulfillment.dueAt)}</span>{" "}
            {autoSides.length > 0 ? (
              <TSub>
                {daysAfterEnd !== null && `· 종료 후 ${daysAfterEnd}일 `}·{" "}
                {autoSides.join("·")}는 기한까지 응답하지 않아{" "}
                <B>이행으로 처리</B>됐다
              </TSub>
            ) : (
              <TSub>
                · {fulfillment.duePassed ? "경과" : "진행 중"}
                {fulfillment.autoConfirmOnTimeout &&
                  " · 무응답은 이행으로 처리된다"}
              </TSub>
            )}
          </FRow>
          <FRow label="이슈 스레드">
            {openIssue ? (
              <>
                {openIssue.issueTypeLabel}{" "}
                <TSub>
                  · {dt(openIssue.openedAt)} ·{" "}
                  {actorText(openIssue.openerType, null)} 개설
                </TSub>
              </>
            ) : (
              <>
                열리지 않음 <TSub>· 미이행 제출이 없었다</TSub>
              </>
            )}
          </FRow>
        </>
      )}
      {agreed ? (
        <MWarn info className="mb-0 mt-3.5">
          합의가 끝나 <B>결과 표시로 굳었습니다</B> — 확인은 되돌릴 수 없고
          재판단 경로를 두지 않습니다. 합의 내용은 <B>정산 금액의 근거</B>라
          원문 그대로 보존되며, 이 카드에서 수정할 수 없습니다.
        </MWarn>
      ) : disputed ? (
        <MWarn info className="mb-0 mt-3.5">
          이행 확인은 <B>양측이 서로의 의무를 확인</B>하는 절차입니다 — 자기
          이행을 스스로 체크하지 않으며 <B>무응답은 이행</B>으로 처리됩니다.{" "}
          <B>이 화면에서 처리하지 않습니다</B>: 합의는 <B>3자 스레드</B>에서,
          보류 해제는 <B>정산 관리</B>에서 합니다. 공구 관리는 사유 조회와{" "}
          <B>스레드 개설</B>까지만 담당합니다.
        </MWarn>
      ) : (
        bothDone && (
          <MWarn info className="mb-0 mt-3.5">
            양측 확인이 <B>이행</B>이라 정산 선행 조건이 충족됐습니다 — 남은
            것은 <B>주문 종결</B>뿐입니다. <B>무응답은 이행으로 처리</B>됩니다:
            한쪽이 답하지 않는 것만으로 상대 정산을 무기한 멈출 수 없기
            때문이고, 그 사실을 위 기한 줄에 남깁니다.
          </MWarn>
        )
      )}
      {hasActions && (
        <div className="mt-3.5 flex gap-2">
          {(disputed || agreed) && fulfillment.threadId !== null ? (
            <Btn
              variant="secondary"
              onClick={() => onOpenThread(fulfillment.threadId!)}
            >
              {agreed ? "종결된 스레드 보기" : "이행 스레드 보기"}
            </Btn>
          ) : openIssue?.threadId ? (
            <Btn
              variant="secondary"
              onClick={() => onOpenThread(openIssue.threadId!)}
            >
              이슈 스레드 보기
            </Btn>
          ) : (
            detail.permissions.canOpenIssue && (
              <Btn variant="secondary" onClick={onOpenIssue}>
                이슈 스레드 열기
              </Btn>
            )
          )}
          {(disputed || agreed) && (
            <Btn variant="secondary" onClick={onGoSettlement}>
              정산 관리에서 보기 ↗
            </Btn>
          )}
        </div>
      )}
    </GbCard>
  );
}

// ── B6 중단 처리 내역 ────────────────────────────────

export function ClosureCard(props: { detail: Detail; onGoSales: () => void }) {
  const { detail, onGoSales } = props;
  const closure = detail.closure;
  if (!closure || detail.groupBuy.status !== "SUSPENDED") {
    return null;
  }
  const isAdmin =
    closure.source === "ADMIN_NOTICE" || closure.source === "ADMIN_EMERGENCY";
  const basis = closure.adminBasis;

  return (
    <GbCard
      title="중단 처리 내역"
      note={
        isAdmin
          ? "운영자 직권으로 확정 · 되돌릴 수 없음"
          : "운영자 승인으로 확정 · 되돌릴 수 없음"
      }
    >
      <MWarn className="mt-0">
        이 공구는 <B>중단</B>되어 신규 주문이 차단됐습니다.{" "}
        <B>
          접수분
          {closure.acceptedOrderCount !== null &&
            ` ${num(closure.acceptedOrderCount)}건`}
          의 배송·환불은 판매 관리에서 개별 처리
        </B>
        해야 합니다.
        {/* 지급비가 없으면(0원) 회수 문장 자체가 의미 없다 */}
        {detail.fixedFee.amount !== null && detail.fixedFee.amount > 0 && (
          <>
            {" "}
            이미 지급된 고정 지급비{" "}
            <B className="tabular-nums">{won(detail.fixedFee.amount)}</B>은{" "}
            <B>플랫폼이 회수해 주지 않습니다</B> — 돈이 플랫폼을 지나가지
            않으므로 되돌릴 대상이 없습니다.
          </>
        )}
      </MWarn>
      <FRow label="종결 유형">
        <GbBadge tone="DANGER">중단</GbBadge>{" "}
        {isAdmin && (
          <TSub>
            {closure.source === "ADMIN_EMERGENCY"
              ? "긴급 직권 중단(사후 통지)"
              : "직권 중단 · 사전 통지 후 집행"}
          </TSub>
        )}
      </FRow>
      <FRow label="사유">
        {isAdmin
          ? (basis?.basisLabel ?? "—")
          : [closure.reasonLabel, closure.reasonDetail]
              .filter(Boolean)
              .join(" — ") || "—"}
        {isAdmin && basis?.body && <PiX>{basis.body}</PiX>}
        {isAdmin && basis?.executionNote && (
          <PiX>집행 사유 — {basis.executionNote}</PiX>
        )}
      </FRow>
      {closure.requester ? (
        <FRow label="요청자">
          {actorText(closure.requester.type, closure.requester.name)} ·{" "}
          <span className="tabular-nums">
            {dt(closure.requester.requestedAt)}
          </span>
        </FRow>
      ) : (
        <FRow label="요청자">
          <span className="text-sz-n-400">없음 · 운영자 직권</span>
        </FRow>
      )}
      <FRow label={isAdmin ? "집행" : "승인"}>
        {actorText("ADMIN", closure.decidedByName)} ·{" "}
        <span className="tabular-nums">{dt(closure.endedAt)}</span>
        {closure.decisionReason && <PiX>{closure.decisionReason}</PiX>}
      </FRow>
      <FRow label="접수분 처리">
        회수·환불{" "}
        <B>
          {closure.acceptedOrderCount !== null
            ? `${num(closure.acceptedOrderCount)}건`
            : "—"}
        </B>{" "}
        —{" "}
        <button type="button" className={FLINK} onClick={onGoSales}>
          판매 관리에서 처리 ↗
        </button>
      </FRow>
      <FRow label="판매 리워드">
        <B>접수분 기준 그대로 정산</B>{" "}
        <TSub>
          · 중단 집행 시점 이전 결제 완료된 정상 주문 기준 ·{" "}
          <B>잔여 기간의 리워드 청구권은 소멸</B>(파트너 제16조④2)
        </TSub>
      </FRow>
    </GbCard>
  );
}
