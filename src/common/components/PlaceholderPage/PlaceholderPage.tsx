interface PlaceholderPageProps {
  title: string;
}

/** 아직 구현되지 않은 메뉴의 자리 표시 화면 (페이지 h1은 셸이 렌더링한다) */
export default function PlaceholderPage(props: PlaceholderPageProps) {
  const { title } = props;

  return (
    <div className="flex flex-1 items-center justify-center rounded-[8px] border border-sz-n-200 bg-white">
      <div className="text-center">
        <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">○</div>
        <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
          {title}
        </div>
        <div className="text-[12px] text-sz-n-500">준비 중인 화면입니다.</div>
      </div>
    </div>
  );
}
