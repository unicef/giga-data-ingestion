import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { api } from "@/api";

export function useTestApiRequests() {
  const [isValidJson, setIsValidJson] = useState<boolean>(false);

  const {
    mutateAsync: bearerGetRequest,
    isError: bearerGetRequestError,
    isSuccess: bearerGetRequestSuccess,
  } = useMutation({
    mutationKey: ["bearer_get_request"],
    mutationFn: api.externalRequests.bearerGetRequest,
  });

  const {
    mutateAsync: basicAuthGetRequest,
    isError: basicAuthGetRequestError,
  } = useMutation({
    mutationKey: ["basic_get_request"],
    mutationFn: api.externalRequests.basicAuthGetRequest,
  });
  const {
    mutateAsync: apiKeyAuthGetRequest,
    isError: apiKeyAuthGetRequestError,
  } = useMutation({
    mutationKey: ["api_key_get_request"],
    mutationFn: api.externalRequests.apiKeyAuthGetRequest,
  });

  const { mutateAsync: noneAuthGetRequest, isError: noneAuthGetRequestError } =
    useMutation({
      mutationKey: ["none_auth_get_request"],
      mutationFn: api.externalRequests.noneAuthGetRequest,
    });

  // TODO POST

  return {
    bearerGetRequest,
    bearerGetRequestError,
    basicAuthGetRequest,
    bearerGetRequestSuccess,
    basicAuthGetRequestError,
    apiKeyAuthGetRequest,
    apiKeyAuthGetRequestError,
    noneAuthGetRequest,
    noneAuthGetRequestError,
    isValidJson,
    setIsValidJson,
  };
}
