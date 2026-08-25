import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { listCountriesQueryOptions } from "@/api/queryOptions";

function useCountryName(iso3?: string | null) {
  const { data: countriesQuery } = useQuery({
    ...listCountriesQueryOptions,
    staleTime: 60 * 60 * 1000,
  });

  return useMemo(() => {
    if (!iso3) return "";

    const match = countriesQuery?.data?.find(country => country.ISO3 === iso3);

    return match?.name_short ?? iso3;
  }, [countriesQuery?.data, iso3]);
}

export default useCountryName;
