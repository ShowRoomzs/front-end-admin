interface HeaderProps {
  /** 상위 메뉴명 (예: 입점 관리) */
  title?: string;
  /** 하위 경로 (예: 브랜드) */
  subtitle?: string;
  operatorName?: string;
}

/**
 * 어드민 탑바 — 사이드바 우측에만 걸친다(높이 56px).
 * 좌측 브레드크럼 · 우측 운영자 정보.
 */
export default function Header(props: HeaderProps) {
  const { title, subtitle, operatorName } = props;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-sz-n-200 bg-white px-6">
      <div className="text-[16px] font-semibold text-sz-n-900">
        {title}
        {subtitle && (
          <span className="ml-1.5 text-[12px] font-normal text-sz-n-500">
            / {subtitle}
          </span>
        )}
      </div>

      {operatorName && (
        <div className="flex items-center gap-2 text-[12px] text-sz-n-600">
          <span>
            {operatorName} <b className="font-semibold">운영자</b>
          </span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sz-n-200 text-[11px] font-semibold text-sz-n-600">
            {operatorName.charAt(0)}
          </span>
        </div>
      )}
    </header>
  );
}
