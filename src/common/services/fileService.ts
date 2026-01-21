import { apiInstance } from "@/common/lib/apiInstance";

export type FileType = "CATEGORY";
interface UploadResponse {
  imageUrl: string;
}
export const fileService = {
  upload: async (file: File, type: FileType) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiInstance.post<UploadResponse>(
      "/admin/images",
      formData,
      {
        params: { type },
      }
    );
    return data;
  },
};
