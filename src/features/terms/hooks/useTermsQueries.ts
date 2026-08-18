import { queryClient } from "@/common/lib/queryClient";
import {
  TERMS_DOCUMENT_QUERY_KEY,
  TERMS_QUERY_KEY,
  TERMS_VERSION_QUERY_KEY,
} from "@/features/terms/constants/queryKey";
import { termsService } from "@/features/terms/services/termsService";
import type {
  TermsDocumentRegisterRequest,
  TermsListParams,
  TermsVersionRegisterRequest,
} from "@/features/terms/types/terms";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useGetTermsList(params: TermsListParams) {
  return useQuery({
    queryKey: [TERMS_QUERY_KEY, params],
    queryFn: () => termsService.getTermsList(params),
  });
}

export function useGetTermsDocument(documentId: number) {
  return useQuery({
    queryKey: [TERMS_DOCUMENT_QUERY_KEY, documentId],
    queryFn: () => termsService.getTermsDocument(documentId),
    enabled: Number.isFinite(documentId),
  });
}

export function useGetTermsVersion(documentId: number, versionId: number) {
  return useQuery({
    queryKey: [TERMS_VERSION_QUERY_KEY, documentId, versionId],
    queryFn: () => termsService.getTermsVersion(documentId, versionId),
    enabled: Number.isFinite(documentId) && Number.isFinite(versionId),
  });
}

export function useRegisterTermsDocument() {
  return useMutation({
    mutationFn: (data: TermsDocumentRegisterRequest) =>
      termsService.registerDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TERMS_QUERY_KEY] });
    },
  });
}

export function useRegisterTermsVersion() {
  return useMutation({
    mutationFn: ({
      documentId,
      data,
    }: {
      documentId: number;
      data: TermsVersionRegisterRequest;
    }) => termsService.registerVersion(documentId, data),
    onSuccess: (_response, { documentId }) => {
      queryClient.invalidateQueries({
        queryKey: [TERMS_DOCUMENT_QUERY_KEY, documentId],
      });
      queryClient.invalidateQueries({ queryKey: [TERMS_QUERY_KEY] });
    },
  });
}
