import ChevronIcon from "./ChevronIcon";

interface MenuItemButtonProps {
  label: string;
  isOpen: boolean;
  onClick: () => void;
}

export default function MenuItemButton(props: MenuItemButtonProps) {
  const { label, isOpen, onClick } = props;

  return (
    <button
      onClick={onClick}
      className="w-full px-6 py-2.5 text-left text-[#8b92b8] text-[12px] hover:text-white hover:bg-[#242a5a] transition-colors flex items-center justify-between cursor-pointer"
      style={{ paddingLeft: 1 }}
    >
      <span>{label}</span>
      <ChevronIcon isOpen={isOpen} />
    </button>
  );
}
