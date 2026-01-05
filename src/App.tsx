import { useRoutes } from "react-router-dom";
import { authRoutes, mainRoutes } from "@/common/router";
import { useCookie } from "@/common/hooks/useCookie";
import { COOKIE_NAME } from "@/common/constants";

export default function App() {
  const [accessToken] = useCookie(COOKIE_NAME.ACCESS_TOKEN);
  const element = useRoutes(accessToken ? mainRoutes : authRoutes);
  return element;
}
