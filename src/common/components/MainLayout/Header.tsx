import { useNavigate } from "react-router-dom";
import logo from "@/common/assets/logo.svg";
import { HEADER_HEIGHT } from "./config";

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Header(props: HeaderProps) {
  const { isSidebarOpen, onToggleSidebar } = props;
  const navigate = useNavigate();

  return (
    <header
      className="bg-white border-b border-[#e3e6f0] flex items-center px-3"
      style={{ height: `${HEADER_HEIGHT}px` }}
    >
      <button
        onClick={onToggleSidebar}
        className="mr-4 p-2 hover:bg-[#f7f8fa] rounded transition-colors cursor-pointer"
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <svg
          className="w-6 h-6 text-[#2e3547]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      <img
        src={logo}
        alt="Showroom Logo"
        className="h-4 cursor-pointer"
        onClick={() => navigate("/")}
      />
    </header>
  );
}
