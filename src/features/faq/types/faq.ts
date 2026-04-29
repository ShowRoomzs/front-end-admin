import type { BaseParams, PageResponse } from "@/common/types";

export interface FaqCategory {
  key: string;
  description: string;
}

export interface Faq {
  id: number;
  category: string;
  categoryDisplayName: string;
  question: string;
  answer: string;
  createdAt: string;
  modifiedAt: string;
}

export interface FaqListParams extends BaseParams {
  category: string | null;
  keyword: string;
}

export interface FaqRequest {
  category: string;
  question: string;
  answer: string;
}

export interface FaqReorderRequest {
  faqIds: Array<number>;
}

export type FaqListResponse = PageResponse<Faq>;
