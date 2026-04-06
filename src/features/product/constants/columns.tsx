import Image from "@/common/components/Image/Image";
import type { Columns } from "@/common/components/Table/types";
import { formatDate } from "@/common/utils/formatDate";
import type { Product } from "@/features/product/services/productService";

export const PRODUCT_LIST_COLUMNS: Columns<Product> = [
  {
    key: "productNumber",
    label: "상품번호",
    width: 180,
  },
  {
    key: "thumbnailUrl",
    label: "대표이미지",
    width: 100,
    render: (value) => (
      <Image
        showPreview
        src={value as string}
        alt="대표이미지"
        className="w-6 h-6"
      />
    ),
  },
  {
    key: "name",
    label: "상품명",
    width: 240,
  },
  {
    key: "categoryName",
    label: "카테고리",
    align: "center",
    width: 140,
  },
  {
    key: "marketName",
    label: "마켓명",
    width: 180,
  },
  {
    key: "price",
    label: "판매가",
    align: "right",
    width: 120,
    render: (value) => {
      const price = value as Product["price"];
      return `${price.salePrice.toLocaleString()}원`;
    },
  },
  {
    key: "isDisplay",
    label: "노출 여부",
    align: "center",
    width: 100,
    render: (value) => (value ? "노출" : "미노출"),
  },
  {
    key: "createdAt",
    label: "등록일",
    align: "center",
    width: 160,
    render: (value) => formatDate(value as string),
  },
];
