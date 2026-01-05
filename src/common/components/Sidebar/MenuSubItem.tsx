import { Link } from "react-router-dom";

interface MenuSubItemProps {
  id: string;
  label: string;
  path: string;
  isActive: boolean;
}

export default function MenuSubItem(props: MenuSubItemProps) {
  const { label, path, isActive } = props;

  return (
    <Link
      to={path || "#"}
      className={`block px-6 py-2 text-[#8b92b8] text-[12px] transition-colors ${
        isActive
          ? "text-white bg-[#2c315f] border-r-2 border-[#2c315f]"
          : "hover:text-white hover:bg-[#242a5a]"
      }`}
      style={{ paddingLeft: `${3 * 0.75}rem` }}
    >
      {label}
    </Link>
  );
}
