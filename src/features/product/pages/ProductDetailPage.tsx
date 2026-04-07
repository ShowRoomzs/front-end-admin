import { useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import Section from "@/common/components/Section/Section";
import { Button } from "@/components/ui/button";
import type { OptionItem } from "@/common/components/Form/FormOptionTable";
import type { OptionCombination } from "@/common/components/Form/FormOptionCombinationTable";
import { useGetProductDetail } from "@/features/product/hooks/useGetProductDetail";
import IsDisplayForm from "@/features/product/components/IsDisplayForm/IsDisplayForm";
import IsOutOfStockForm from "@/features/product/components/IsOutOfStockForm/IsOutOfStockForm";
import CategoryForm from "@/features/product/components/CategoryForm/CategoryForm";
import ProductNameForm from "@/features/product/components/ProductNameForm/ProductNameForm";
import ProductNumberForm from "@/features/product/components/ProductNumberForm/ProductNumberForm";
import SellerProductCodeForm from "@/features/product/components/SellerProductCodeForm/SellerProductCodeForm";
import RegularPriceForm from "@/features/product/components/RegularPriceForm/RegularPriceForm";
import IsDiscountForm from "@/features/product/components/IsDiscountForm/IsDiscountForm";
import DiscountRateForm from "@/features/product/components/DiscountRateForm/DiscountRateForm";
import DiscountPriceForm from "@/features/product/components/DiscountPriceForm/DiscountPriceForm";
import OptionGroupsForm from "@/features/product/components/OptionGroupsForm/OptionGroupsForm";
import OptionCombinationsForm from "@/features/product/components/OptionCombinationsForm/OptionCombinationsForm";
import TitleImageForm from "@/features/product/components/TitleImageForm/TitleImageForm";
import CoverImagesForm from "@/features/product/components/CoverImagesForm/CoverImagesForm";
import ProductNoticeForm from "@/features/product/components/ProductNoticeForm/ProductNoticeForm";
import DescriptionForm from "@/features/product/components/DescriptionForm/DescriptionForm";

export interface ProductDetailFormData {
  isDisplay: boolean;
  isOutOfStockForced: boolean;
  categoryName: string;
  productName: string;
  sellerProductCode: string;
  isDiscount: boolean;
  regularPrice: number;
  discountRate: number;
  optionGroups: Array<{
    id: string | number;
    name: string;
    items: Array<OptionItem>;
  }>;
  optionCombinations: Array<OptionCombination>;
  titleImage: string;
  coverImages: Array<string>;
  description: string;
  productNotice: Record<string, string>;
}

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const { data: productDetail } = useGetProductDetail(Number(productId));

  const { control, reset } = useForm<ProductDetailFormData>({
    defaultValues: {
      isDisplay: false,
      isOutOfStockForced: false,
      categoryName: "",
      productName: "",
      sellerProductCode: "",
      isDiscount: false,
      regularPrice: 0,
      discountRate: 0,
      optionGroups: [],
      optionCombinations: [],
      titleImage: "",
      coverImages: [],
      description: "",
      productNotice: {
        origin: "",
        material: "",
        color: "",
        size: "",
        manufacturer: "",
        washingMethod: "",
        manufactureDate: "",
        asInfo: "",
        qualityAssurance: "",
      },
    },
  });

  const initializeForm = useCallback(() => {
    if (!productDetail) return;

    const discountRate = productDetail.regularPrice - productDetail.salePrice;

    const optionGroups = productDetail.optionGroups.map((group) => ({
      id: group.optionGroupId,
      name: group.name,
      items: group.options.map((option) => ({
        id: option.optionId,
        name: option.name,
        price: option.price,
      })),
    }));

    const optionCombinations = productDetail.variants.map((variant) => ({
      id: variant.variantId.toString(),
      combination: variant.name.split("/").map((v) => v.trim()),
      price: variant.salePrice.toString(),
      stock: variant.stock.toString(),
      isDisplayed: variant.isDisplay,
      isRepresentative: variant.isRepresentative,
    }));

    reset({
      isDisplay: false,
      isOutOfStockForced: false,
      categoryName: productDetail.categoryName,
      productName: productDetail.name,
      sellerProductCode: productDetail.sellerProductCode,
      regularPrice: productDetail.regularPrice,
      discountRate: discountRate,
      isDiscount: discountRate > 0,
      optionGroups,
      optionCombinations,
      titleImage: productDetail.representativeImageUrl,
      coverImages: productDetail.coverImageUrls,
      description: productDetail.description,
      productNotice: {
        origin: productDetail.productNotice?.origin ?? "",
        material: productDetail.productNotice?.material ?? "",
        color: productDetail.productNotice?.color ?? "",
        size: productDetail.productNotice?.size ?? "",
        manufacturer: productDetail.productNotice?.manufacturer ?? "",
        washingMethod: productDetail.productNotice?.washingMethod ?? "",
        manufactureDate: productDetail.productNotice?.manufactureDate ?? "",
        asInfo: productDetail.productNotice?.asInfo ?? "",
        qualityAssurance: productDetail.productNotice?.qualityAssurance ?? "",
      },
    });
  }, [productDetail, reset]);

  useEffect(() => {
    initializeForm();
  }, [initializeForm]);

  return (
    <div className="flex flex-col">
      <Section title="표시 여부">
        <IsDisplayForm control={control} />
        <IsOutOfStockForm control={control} />
      </Section>

      <Section title="카테고리(한 개만 지정 가능)">
        <CategoryForm control={control} />
      </Section>

      <Section title="기본 정보">
        <ProductNameForm control={control} />
        <ProductNumberForm productDetail={productDetail} />
        <SellerProductCodeForm control={control} />
      </Section>

      <Section title="가격 설정">
        <RegularPriceForm control={control} />
        <IsDiscountForm control={control} />
        <DiscountRateForm control={control} />
        <DiscountPriceForm control={control} />
      </Section>

      <Section required title="옵션 설정">
        <OptionGroupsForm control={control} />
      </Section>

      <Section required title="옵션 조합">
        <OptionCombinationsForm control={control} />
      </Section>

      <Section title="상품 이미지">
        <TitleImageForm control={control} />
        <CoverImagesForm control={control} />
      </Section>

      <Section title="에디터">
        <DescriptionForm control={control} />
      </Section>

      <Section title="상품정보고시">
        <ProductNoticeForm control={control} />
      </Section>

      <div className="flex gap-3 justify-end mt-6">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          이전
        </Button>
        <Button type="button" variant="destructive">
          삭제 처리
        </Button>
      </div>
    </div>
  );
}
