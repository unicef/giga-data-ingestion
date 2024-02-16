import countries from "@/constants/countries";

export function filterCountries(groups: string[]): string[] {
  return groups.filter(group => {
    return countries.some(country =>
      group.split("-")[0].startsWith(country.name),
    );
  });
}

export function filterCountryDatasetFromGroup(
  groups: string[],
  dataset: string,
): string[] {
  const countryGroups = groups.filter(group => {
    return countries.some(country => {
      return group.split("-")[0].trim() === country.name;
    });
  });

  const countryDatasets = countryGroups.filter(group => {
    return group.endsWith(`${dataset}`);
  });

  return countryDatasets;
}

export function filterRoles(groups: string[]): string[] {
  return groups.filter(group => {
    return !countries.some(country =>
      group.split("-")[0].startsWith(country.name),
    );
  });
}

export const matchNamesWithIds = (
  names: string[],
  data: { id: string; name: string }[],
): { name: string; id: string | undefined }[] => {
  return names.map(name => {
    const matchingData = data.find(d => d.name === name);
    return { name, id: matchingData?.id };
  });
};
