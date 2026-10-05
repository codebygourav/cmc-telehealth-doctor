import axiosInstance from "@/lib/axios";
import type { GetMedicinesResponse } from "@/types/medicines";

export interface GetMedicinesParams {
    page?: number;
    per_page?: number;
    search?: string;
    include_doctor_added?: boolean;
    /** Search / sort by trade name or generic name (default: both). */
    by?: "trade" | "generic";
    /** How many results per page (the server caps it at 100). */
    limit?: number;
    category_id?: string;
}

export const getMedicines = async ({
    page = 1,
    per_page = 5,
    search = "",
    include_doctor_added = false,
    by,
    limit,
    category_id,
}: GetMedicinesParams = {}): Promise<GetMedicinesResponse> => {
    const response = await axiosInstance.get<GetMedicinesResponse>("/medicines", {
        params: {
            page,
            per_page,
            ...(search ? { search } : {}),
            ...(include_doctor_added ? { include_doctor_added: true } : {}),
            ...(by ? { by } : {}),
            ...(limit ? { limit } : {}),
            ...(category_id ? { category_id } : {}),
        },
    });

    return response.data;
};

// Categories the doctor can prescribe from (category filter in the medicine search).
export const getMedicineCategories = async (): Promise<{ id: string; name: string; medicines: number }[]> => {
    const response = await axiosInstance.get("/doctor/medicine-categories");
    return response.data?.data ?? [];
};

// Formulary picker (Add medicine): paged A-Z, ?by=trade|generic, ?category_id, meta.has_more.
export const getFormularyMedicines = async (params: {
    search?: string;
    by?: "trade" | "generic";
    category_id?: string;
    page?: number;
    limit?: number;
}): Promise<{ data: any[]; meta?: { page: number; per_page: number; total: number; has_more: boolean } }> => {
    const response = await axiosInstance.get("/doctor/medicines", {
        params: {
            ...(params.search ? { search: params.search } : {}),
            ...(params.by ? { by: params.by } : {}),
            ...(params.category_id ? { category_id: params.category_id } : {}),
            page: params.page ?? 1,
            limit: params.limit ?? 30,
        },
    });
    return response.data;
};
