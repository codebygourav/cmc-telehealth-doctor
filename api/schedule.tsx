import api from "@/lib/axios";
import { ScheduleResponse } from "@/types/schedule";


export interface FetchScheduleParams {
    month?: number;
    year?: number;
    date?: string;
    filter?: string;
}

export const fetchSchedule = async (params?: FetchScheduleParams): Promise<ScheduleResponse> => {
    const queryParams: Record<string, any> = {
        filter: params?.filter || 'month',
    };

    if (params?.month && params?.year) {
        const mStr = String(params.month).padStart(2, '0');
        const year = params.year;
        const lastDay = new Date(year, params.month, 0).getDate();
        const startDate = `${year}-${mStr}-01`;
        const endDate = `${year}-${mStr}-${String(lastDay).padStart(2, '0')}`;

        queryParams.month = params.month;
        queryParams.month_num = mStr;
        queryParams.year = year;
        queryParams.month_year = `${year}-${mStr}`;
        queryParams.start_date = startDate;
        queryParams.end_date = endDate;
        queryParams.from = startDate;
        queryParams.to = endDate;
    } else if (params?.month) {
        queryParams.month = params.month;
    }

    if (params?.date) queryParams.date = params.date;

    const { data } = await api.get('doctor/schedule', { params: queryParams });
    return data;
};