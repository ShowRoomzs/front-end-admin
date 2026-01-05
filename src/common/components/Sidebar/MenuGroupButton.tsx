import ChevronIcon from "./ChevronIcon";

interface MenuGroupButtonProps {
  label: string;
  isActive: boolean;
  isOpen: boolean;
  hasItems: boolean;
  onClick: () => void;
}

export default function MenuGroupButton(props: MenuGroupButtonProps) {
  const { label, isActive, isOpen, hasItems, onClick } = props;

  return (
    <button
      onClick={onClick}
      className="w-full px-6 py-3 text-left text-xs font-semibold text-[#6b7299] uppercase tracking-wider hover:text-[#8b92b8] transition-colors flex items-center justify-between cursor-pointer"
    >
      <span className={isActive ? "text-[#B0B6DD]" : "text-[#6b7299]"}>
        {label}
      </span>
      {hasItems && <ChevronIcon isOpen={isOpen} />}
    </button>
  );
}
