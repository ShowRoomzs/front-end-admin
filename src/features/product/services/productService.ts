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

export interface ProductDetailOptionItem {
  optionId: number;
  name: string;
  price: number;
}

export interface ProductDetailOptionGroup {
  optionGroupId: number;
  name: string;
  options: Array<ProductDetailOptionItem>;
}

export interface ProductDetailVariant {
  variantId: number;
  name: string;
  regularPrice: number;
  salePrice: number;
  stock: number;
  isRepresentative: boolean;
  isDisplay: boolean;
  optionIds: Array<number>;
}

export interface ProductDetailReview {
  reviewId: number;
  userName: string;
  rating: number;
  content: string;
  imageUrls: Array<string>;
  createdAt: string;
}

export interface ProductDetailReviewInfo {
  totalCount: number;
  averageRating: number;
  reviews: Array<ProductDetailReview>;
}

export interface ProductDetail {
  id: number;
  productNumber: string;
  marketId: number;
  marketName: string;
  categoryId: number;
  categoryName: string;
  name: string;
  sellerProductCode: string;
  representativeImageUrl: string;
  coverImageUrls: Array<string>;
  description: string;
  productNotice: Record<string, string>;
  tags: Array<string>;
  gender: string;
  isRecommended: boolean;
  regularPrice: number;
  salePrice: number;
  deliveryType: string;
  deliveryFee: number;
  deliveryFreeThreshold: number;
  deliveryEstimatedDays: number;
  isFreeDelivery: boolean;
  optionGroups: Array<ProductDetailOptionGroup>;
  variants: Array<ProductDetailVariant>;
  isWished: boolean;
  isFollowing: boolean;
  createdAt: string;
  reviewInfo: ProductDetailReviewInfo;
}

export const productService = {
  getProductList: async (params: ProductListParams) => {
    const { data: response } = await apiInstance.get<ProductListResponse>(
      "/common/products",
      { params }
    );

    return response;
  },
  getProductDetail: async (productId: number) => {
    const { data: response } = await apiInstance.get<ProductDetail>(
      `/common/products/${productId}`
    );

    return response;
  },
};
