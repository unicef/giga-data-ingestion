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

export const getUniqueDatasetsNew = (
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

export function parseDqResultFilename(str: string): {
  uid: string;
  warnings: number;
  errors: number;
  extension: string;
} {
  const parts = str.split("_");
  const [uid, warningsStr, errorsStrWithJson] = parts;

  const [errorsStr, extension] = errorsStrWithJson.split(".");

  const warnings = parseInt(warningsStr, 10);
  const errors = parseInt(errorsStr, 10);

  return { uid, warnings, errors, extension };
}

export function validateDatetimeFormat(str: string): boolean {
  // %Y %m %d %H %M %S %z
  const validFormatSpecifiers = `(%Y|%m|%d|%H|%M|%S|%z)`;

  // "/"" "-"" "_" "." ":" and " "(space)
  const validSeparators = `[\\/\\-_.+: ]?`;

  const fullPattern = `^${validFormatSpecifiers}(${validSeparators}${validFormatSpecifiers})*$`;

  const matchesFullPattern = new RegExp(fullPattern).test(str);

  return matchesFullPattern || str === "timestamp" || str === "ISO8601";
}
