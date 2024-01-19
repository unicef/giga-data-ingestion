import { NamePath } from "antd/es/form/interface";
import { StoreValue } from "antd/es/form/interface";

import { Dataset } from "@/types/group";

export const pluralizeDatasets = (uniqueDatasets: number) =>
  `access to Giga data for ${uniqueDatasets} ${
    uniqueDatasets === 1 ? "dataset" : "datasets"
  }`;

export const pluralizeCountries = (countries: string[]) => {
  const countriesText =
    countries.slice(0, -1).join(", ") +
    (countries.length > 1 ? ", and " : "") +
    countries.slice(-1);
  return countriesText;
};

export const getUniqueDatasets = (
  getFieldValue: (field: NamePath) => StoreValue,
) => {
  const email = getFieldValue("email") || "";
  const addedDatasets: Dataset[] = getFieldValue("addedDatasets") || [];

  const uniqueCountries = new Set<string>();
  const datasetTypes = new Set();

  addedDatasets.forEach(item => {
    const country = item.name.split("-")[0];
    uniqueCountries.add(country);

    if (item.name.includes("School Geolocation")) {
      datasetTypes.add("School Geolocation");
    }
    if (item.name.includes("School Coverage")) {
      datasetTypes.add("School Coverage");
    }
    if (item.name.includes("School QoS")) {
      datasetTypes.add("School QoS");
    }
  });

  const result: {
    countries: string[];
    email: string;
    uniqueDatasets: number;
  } = {
    countries: Array.from(uniqueCountries),
    email: email,
    uniqueDatasets: datasetTypes.size,
  };

  return result;
};
