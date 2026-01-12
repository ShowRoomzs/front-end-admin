import dayjs from "dayjs";

export function formatDate(date: string): string {
  return dayjs(date).format("YYYY.MM.DD HH:mm:ss");
}
