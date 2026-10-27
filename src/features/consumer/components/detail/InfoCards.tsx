import DetailCard, {
  FieldRow,
  PurgedValue,
} from "@/common/components/DetailCard/DetailCard";
import NotReady from "@/common/components/NotReady/NotReady";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { ApiNotReadyError } from "@/common/utils/devMock";
import { formatDateOnly, formatDateTimeShort } from "@/common/utils/formatDate";
import JoinChannel from "@/features/consumer/components/JoinChannel/JoinChannel";
import { DEVICE_LABELS } from "@/features/consumer/constants/detail";
import {
  RELOCK_CLASS,
  T_SUB_CLASS,
  UNMASK_BTN_CLASS,
  UNMASK_ON_CLASS,
} from "@/features/consumer/constants/styles";
import { useConsumerTerms } from "@/features/consumer/hooks/useConsumerDetail";
import type { ConsumerDetail } from "@/features/consumer/types/consumerDetail";
import {
  formatCountdown,
  formatServerTime,
} from "@/features/consumer/utils/detailView";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, type ReactNode } from "react";

/** 시안 `.act-row` — 라벨 · 값 한 줄(콘텐츠 활동 · 약관 동의) */
function ActRow(props: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-sz-n-100 py-[9px] text-[12px] last:border-b-0">
      <span>{props.label}</span>
      {props.value}
    </div>
  );
}

const DASH = <span className="text-sz-n-500">—</span>;

// ── 계정 정보 ───────────────────────────────────────────────────

export function AccountCard(props: { detail: ConsumerDetail }) {
  const { detail } = props;
  const { notification } = detail;
  const withdrawn = detail.status === "WITHDRAWN";
  const device = detail.lastLoginDevice
    ? DEVICE_LABELS[detail.lastLoginDevice]
    : null;

  return (
    <DetailCard
      title="계정 정보"
      note={<span className="tabular-nums">{detail.memberNo}</span>}
    >
      <div className="mb-1 flex items-center gap-[14px] border-b border-sz-n-100 pb-3 pt-3">
        {detail.profileImageUrl && !withdrawn ? (
          <img
            src={detail.profileImageUrl}
            alt=""
            className="size-[52px] shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-sz-n-200 text-[11px] text-sz-n-500">
            {withdrawn ? "파기" : "프로필"}
          </span>
        )}
        <div>
          <div className="text-[16px] font-semibold text-sz-n-900">
            {detail.nickname}
          </div>
          <div className="mt-0.5 text-[11px] text-sz-n-500">
            소비자 · <span className="tabular-nums">{detail.memberNo}</span>
          </div>
        </div>
      </div>
      <FieldRow label="닉네임">{detail.nickname}</FieldRow>
      <FieldRow label="가입 수단">
        <JoinChannel provider={detail.providerType} />
      </FieldRow>
      <FieldRow label="가입일">
        <span className="tabular-nums">{formatDateOnly(detail.createdAt)}</span>
      </FieldRow>
      <FieldRow label="최근 로그인">
        {withdrawn ? (
          <PurgedValue />
        ) : detail.lastLoginAt ? (
          <span className="tabular-nums">
            {formatDateTimeShort(detail.lastLoginAt)}
            {device && <span className={T_SUB_CLASS}> · {device}</span>}
          </span>
        ) : (
          DASH
        )}
      </FieldRow>
      <FieldRow label="알림 수신">
        {notification.destroyed ? (
          <PurgedValue />
        ) : (
          <NotificationLine notification={notification} />
        )}
      </FieldRow>
    </DetailCard>
  );
}

/**
 * 알림 수신 — 「알림을 못 받았다」 문의에 답할 근거(CS 응대 보강 ③). 끔이면 경고색.
 * 「정지 · 주문 알림이 기기에 표시되지 않음」은 기기 토큰이 없을 때만 맞는 말이다 —
 * 광고성 토글만 꺼진 경우엔 주문 · 정지 알림이 그대로 간다(서버 D15).
 */
function NotificationLine(props: {
  notification: ConsumerDetail["notification"];
}) {
  const { notification } = props;
  const on = notification.appPushOn === true;
  const subs: Array<string> = [];
  if (notification.deviceRegistered === false) {
    subs.push("정지 · 주문 알림이 기기에 표시되지 않음");
  }
  if (notification.marketingAgree) {
    subs.push(
      notification.marketingAgreeChangedAt
        ? `광고성 수신 동의 ${formatDateTimeShort(notification.marketingAgreeChangedAt)}`
        : "광고성 수신 동의"
    );
  } else {
    subs.push("광고성 수신 미동의");
  }

  return (
    <>
      앱 푸시{" "}
      <b
        className={on ? "font-semibold" : "font-semibold text-sz-warning-text"}
      >
        {on ? "켬" : "끔"}
      </b>{" "}
      <span className={`${T_SUB_CLASS} tabular-nums`}>
        · {subs.join(" · ")}
      </span>
    </>
  );
}

// ── 본인확인 정보 ─────────────────────────────────────────────────

interface IdentityCardProps {
  detail: ConsumerDetail;
  /** 자동 잠금까지 남은 초(화면 카운트다운) */
  remainingSeconds: number;
  /** 10분 만료로 방금 다시 잠겼다(A3) — 해제 칩 자리에 알린다 */
  autoRelocked: boolean;
  onUnmask: () => void;
  onLock: () => void;
  isLocking: boolean;
}

/**
 * 본인확인 정보 — 이름 · 생년월일 · 휴대폰은 마스킹이 기본이고 해제는 이 카드 머리 버튼으로만 한다.
 * 해제 칩 · 카운트다운 · 자동 잠김 · 지금 잠금이 **모두 같은 자리**를 쓴다(권한 상태가 한 곳에서만 바뀐다).
 * 값은 서버가 마스킹을 끝내서 내린다 — 여기서 가리거나 풀지 않는다.
 */
export function IdentityCard(props: IdentityCardProps) {
  const {
    detail,
    remainingSeconds,
    autoRelocked,
    onUnmask,
    onLock,
    isLocking,
  } = props;
  const { identity, unmask } = detail;
  const destroyed = identity.destroyed;
  const unmasked = identity.unmasked && unmask.unmasked;

  let controls: ReactNode;
  if (destroyed) {
    controls = (
      <button type="button" className={UNMASK_BTN_CLASS} disabled>
        마스킹 해제
      </button>
    );
  } else if (unmasked) {
    controls = (
      <span className="flex items-center gap-2">
        <span className={UNMASK_ON_CLASS}>
          해제됨 · {unmask.operatorName ?? "—"} ·{" "}
          {formatServerTime(unmask.unmaskedAt)}{" "}
          <span className="tabular-nums opacity-75">
            · {formatCountdown(remainingSeconds)} 후 잠금
          </span>
        </span>
        <button
          type="button"
          className={UNMASK_BTN_CLASS}
          onClick={onLock}
          disabled={isLocking}
        >
          지금 잠금
        </button>
      </span>
    );
  } else {
    controls = (
      <span className="flex items-center gap-2">
        {autoRelocked && (
          <span className={RELOCK_CLASS}>무조작 10분 · 자동 잠김</span>
        )}
        <button
          type="button"
          className={UNMASK_BTN_CLASS}
          onClick={onUnmask}
          disabled={!unmask.allowed}
          title={
            unmask.allowed
              ? undefined
              : "최고관리자만 마스킹을 해제할 수 있습니다."
          }
        >
          마스킹 해제
        </button>
      </span>
    );
  }

  /*
    파기됨은 「값이 있었다가 지워졌다」는 뜻이다 — 애초에 수집하지 않는 항목(내외국인 · 통신사 ·
    재인증 시각)에는 쓰지 않는다(시안 C1 · 서버 Identity 설명).
  */
  const purged = (value: ReactNode) => (destroyed ? <PurgedValue /> : value);

  return (
    <DetailCard title="본인확인 정보" note={controls}>
      <FieldRow label="이름">{purged(identity.name ?? DASH)}</FieldRow>
      <FieldRow label="생년월일">
        {purged(
          identity.birthday ? (
            <span className="tabular-nums">
              {identity.birthday}
              {unmasked && identity.age !== null && (
                <span className={T_SUB_CLASS}> ({identity.age}세)</span>
              )}
            </span>
          ) : (
            DASH
          )
        )}
      </FieldRow>
      <FieldRow label="성별">{purged(identity.genderLabel ?? DASH)}</FieldRow>
      <FieldRow label="내외국인">{identity.nationality ?? DASH}</FieldRow>
      <FieldRow label="휴대폰">
        {purged(
          identity.phone ? (
            <span className="tabular-nums">{identity.phone}</span>
          ) : (
            DASH
          )
        )}
      </FieldRow>
      <FieldRow label="통신사">{identity.carrier ?? DASH}</FieldRow>
      <FieldRow label="최초 인증">
        {purged(
          <span className="tabular-nums">
            {formatDateTimeShort(identity.firstVerifiedAt)}
          </span>
        )}
      </FieldRow>
      <FieldRow label="최근 갱신">
        <span className="tabular-nums">
          {formatDateTimeShort(identity.renewedAt)}
        </span>
      </FieldRow>
    </DetailCard>
  );
}

// ── 콘텐츠 활동 ─────────────────────────────────────────────────

/**
 * 콘텐츠 활동 — 활동만 담는다(거래 지표는 레일 판단 메타). 「제출 신고(기각 N)」 행은
 * 게시물 신고 기능이 [자문대기-법률]이라 그리지 않는다(시안 조건부 미표시).
 */
export function ActivityCard(props: { detail: ConsumerDetail }) {
  const { detail } = props;
  const withdrawn = detail.status === "WITHDRAWN";
  const value = (count: number | null) => (
    <span className="font-semibold tabular-nums">
      {withdrawn || count === null ? "—" : count.toLocaleString()}
    </span>
  );

  return (
    <DetailCard title="콘텐츠 활동">
      <div className="pt-3">
        <ActRow label="좋아요" value={value(detail.productWishlistCount)} />
        <ActRow
          label="팔로우 쇼룸"
          value={value(detail.followedShowroomCount)}
        />
      </div>
    </DetailCard>
  );
}

// ── 배송지 ──────────────────────────────────────────────────────

/**
 * 배송지 — 기본 접힘(A1) · 펼침(A4). 마스킹 중에는 시 · 군 · 구까지만 오고 상세주소 · 수령인 ·
 * 연락처는 「해제 후 조회」다(본인확인 정보와 같은 열람 통제). 운영자는 수정 · 삭제하지 않는다.
 */
export function AddressCard(props: { detail: ConsumerDetail }) {
  const { addresses } = props.detail;
  const unmasked = props.detail.identity.unmasked;
  const [open, setOpen] = useState(false);
  const first = addresses.content[0];
  const expandable = !addresses.destroyed && addresses.content.length > 0;

  const maskedHint = (
    <span className={`${T_SUB_CLASS} font-normal`}>
      (상세주소는 해제 후 조회)
    </span>
  );

  return (
    <DetailCard
      title="배송지"
      note={addresses.destroyed ? "파기됨" : `등록 ${addresses.total}건`}
    >
      <div
        className={`flex items-center justify-between pt-3 text-[12px] ${expandable ? "cursor-pointer" : ""}`}
        onClick={expandable ? () => setOpen((value) => !value) : undefined}
      >
        <div className="min-w-0">
          {addresses.destroyed ? (
            <PurgedValue />
          ) : first ? (
            <>
              <b className="font-semibold">
                {first.defaultAddress ? "기본 배송지" : "배송지"}
              </b>{" "}
              · {first.address}{" "}
              {unmasked
                ? first.detailAddress && <span>{first.detailAddress}</span>
                : maskedHint}
            </>
          ) : (
            <span className="text-sz-n-500">등록된 배송지가 없습니다.</span>
          )}
        </div>
        {expandable && (
          <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-sz-n-500">
            {open ? "접기" : "펼치기"}
            {open ? (
              <ChevronUp className="size-3" aria-hidden />
            ) : (
              <ChevronDown className="size-3" aria-hidden />
            )}
          </span>
        )}
      </div>

      {open && expandable && (
        <div className="mt-3 border-t border-sz-n-100 pt-1">
          {addresses.content.map((address) => (
            <div
              key={address.addressId}
              className="flex items-start gap-3 border-b border-sz-n-100 py-[11px] last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold text-sz-n-900">
                  {address.address}
                  {unmasked ? (
                    <>
                      {address.detailAddress && (
                        <span>{address.detailAddress}</span>
                      )}
                      {address.zipCode && (
                        <span className={`${T_SUB_CLASS} font-normal`}>
                          ({address.zipCode})
                        </span>
                      )}
                    </>
                  ) : (
                    maskedHint
                  )}
                  {address.defaultAddress && (
                    <StatusBadge variant="info" hideDot>
                      기본
                    </StatusBadge>
                  )}
                </div>
                <div className="mt-[3px] text-[11px] text-sz-n-500">
                  수령인{" "}
                  <b className="font-semibold">{address.recipientName}</b> ·
                  연락처{" "}
                  <span className="tabular-nums">{address.phoneNumber}</span>
                  {/* 최근 사용 주문일 — 주문에 배송지 id가 없어 서버가 아직 못 낸다(보류 · 항상 null) */}
                  {address.lastUsedOrderAt && (
                    <>
                      {" "}
                      · 최근 사용{" "}
                      <span className="tabular-nums">
                        {formatDateOnly(address.lastUsedOrderAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DetailCard>
  );
}

// ── 약관 동의 내역 ───────────────────────────────────────────────

/**
 * 약관 동의 내역 — **서버에 없다**(약관 버전 테이블 보류 · 55 계획서 4-3-4 D16).
 * DEV는 목업, 배포본은 「준비 중」. 동의 기록은 탈퇴해도 파기 대상이 아니다.
 */
export function TermsCard(props: { userId: number }) {
  const { data, isLoading, error } = useConsumerTerms(props.userId);

  let body: ReactNode;
  if (error instanceof ApiNotReadyError) {
    body = <NotReady title="약관 동의 내역은 준비 중입니다." />;
  } else if (isLoading || !data) {
    body = (
      <p className="py-2 text-[12px] text-sz-n-500">
        {isLoading ? "불러오는 중…" : "약관 동의 내역을 불러오지 못했습니다."}
      </p>
    );
  } else {
    body = (
      <div className="pt-3">
        {data.map((term) => (
          <ActRow
            key={term.title}
            label={
              <>
                {term.title}{" "}
                <span className={`${T_SUB_CLASS} tabular-nums`}>
                  {term.version}
                </span>
              </>
            }
            value={
              <span className={`${T_SUB_CLASS} tabular-nums`}>
                {formatDateTimeShort(term.agreedAt)}
              </span>
            }
          />
        ))}
      </div>
    );
  }

  return (
    <DetailCard title="약관 동의 내역" note="동의 기록은 파기 대상이 아님">
      {body}
    </DetailCard>
  );
}
