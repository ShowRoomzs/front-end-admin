import { apiInstance } from "@/common/lib/apiInstance";
import type { BaseParams, PageResponse } from "@/common/types";

export interface ProductListParams extends BaseParams {
  q: string;
}

export interface ProductPrice {
  regularPrice: number;
  discountRate: number;
  salePrice: number;
  maxBenefitPrice: number;
}

export interface ProductStatus {
  isOutOfStock: boolean;
  isOutOfStockForced: boolean;
}

export interface Product {
  id: number;
  productNumber: string;
  name: string;
  sellerProductCode: string;
  representativeImageUrl: string;
  thumbnailUrl: string;
  categoryId: number;
  categoryName: string;
  marketId: number;
  marketName: string;
  price: ProductPrice;
  discountRate: number;
  purchasePrice: number;
  gender: string;
  isDisplay: boolean;
  isRecommended: boolean;
  productNotice: string;
  description: string;
  tags: string;
  deliveryType: string;
  deliveryFee: number;
  deliveryFreeThreshold: number;
  deliveryEstimatedDays: number;
  createdAt: string;
  status: ProductStatus;
  likeCount: number;
  wishCount: number;
  reviewCount: number;
  isWished: boolean;
}

export type ProductListResponse = PageResponse<Product>;

export const productService = {
  getProductList: async (params: ProductListParams) => {
    const { data: response } = await apiInstance.get<ProductListResponse>(
      "/common/products",
      { params }
    );

    return response;
  },
};
