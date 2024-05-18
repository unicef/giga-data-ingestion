export const pluralizeDatasets = (uniqueDatasets: number) =>
  `${uniqueDatasets} ${uniqueDatasets === 1 ? "dataset" : "datasets"}`;

export const pluralizeCountries = (countries: string[]) => {
  return (
    countries.slice(0, -1).join(", ") +
    (countries.length > 1 ? ", and " : "") +
    countries.slice(-1)
  );
};

export const getUniqueDatasets = (
  email: string,
  addedDatasets: Array<{ name: string; id?: string }>,
) => {
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

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
