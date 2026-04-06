import FormDisplay from "@/common/components/Form/FormDisplay";
import FormItem from "@/common/components/Form/FormItem";
import type { ProductDetail } from "@/features/product/services/productService";

interface ProductNumberFormProps {
  productDetail: ProductDetail | undefined;
}

export default function ProductNumberForm(props: ProductNumberFormProps) {
  const { productDetail } = props;

  return (
    <FormItem label="상품번호">
      <FormDisplay value={productDetail?.productNumber || "-"} />
    </FormItem>
  );
}
