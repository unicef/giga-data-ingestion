import { AxiosInstance, AxiosResponse } from "axios";

export default function routers(axi: AxiosInstance) {
  return {
    isValidDateTimeFormatCodeRequest: ({
      datetime_str,
      format_code,
    }: {
      datetime_str: string;
      format_code: string;
    }): Promise<AxiosResponse<boolean>> => {
      return axi.post("/utils/is_valid_datetime_format_code", {
        datetime_str: datetime_str,
        format_code: format_code,
      });
    },
  };
}
