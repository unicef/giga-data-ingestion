import { Dispatch, SetStateAction } from "react";
import {
  UseFormGetValues,
  UseFormStateReturn,
  UseFormTrigger,
} from "react-hook-form";

import { Button } from "@carbon/react";

import { useQosStore } from "@/context/qosStore";
import { useTestApiRequests } from "@/hooks/useTestApiRequests";
import {
  AuthorizationTypeEnum, // RequestMethodEnum,
  SchoolListFormValues, // SendQueryInEnum,
} from "@/types/qos";

interface TestSchoolListApiButtonProps {
  getValues: UseFormGetValues<SchoolListFormValues>;
  trigger: UseFormTrigger<SchoolListFormValues>;
  formState: UseFormStateReturn<SchoolListFormValues>;
}

// reqs:
//validated
//

const TestSchoolListApiButton = ({
  // formState: { errors },
  getValues,
  trigger,
}: TestSchoolListApiButtonProps) => {
  const { setDetectedColumns } = useQosStore();
  const { bearerGetRequest } = useTestApiRequests();

  return (
    <>
      <Button
        size="md"
        onClick={async () => {
          //

          trigger();

          // if (Object.keys(errors).length !== 0) {
          //   console.log(errors);
          //   return;
          // }

          // if (getValues("send_query_in") !== SendQueryInEnum.NONE) {
          //   //
          // }
          // console.log("CONGRAATS");

          // if (getValues("request_method") === RequestMethodEnum.GET) {
          //   console.log("Gogetem");
          // }
          // if (getValues("request_method") === RequestMethodEnum.POST) {
          //   console.log("posterBoy");
          // }

          if (
            getValues("authorization_type") ===
            AuthorizationTypeEnum.BEARER_TOKEN
          ) {
            const queryParams = JSON.parse(getValues("query_parameters") ?? "");

            const { data: requestData } = await bearerGetRequest({
              bearerToken: getValues("bearer_auth_bearer_token") ?? "",
              queryParams: queryParams,
              url: getValues("api_endpoint"),
            });

            const dataKey = getValues("data_key");

            // TODO: make test fail if can't get source column names
            const firstElement = requestData[dataKey][0];
            const detectedColumns = Object.keys(firstElement);
            setDetectedColumns(detectedColumns);
            console.log(detectedColumns);
            console.log(dataKey);
          }
        }}
      >
        Testssss
      </Button>
    </>
  );
};

export default TestSchoolListApiButton;
