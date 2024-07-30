export function filterCountries(groups: string[]): string[] {
  return groups.filter(group => group.split("-School").length > 1);
}

export function filterCountryDatasetFromGroup(
  groups: string[],
  dataset: string,
): string[] {
  const countryGroups = groups.filter(group => group.split("-School").length > 1);

  const countryDatasets = countryGroups.filter(group => {
    return group.endsWith(`${dataset}`);
  });

  return countryDatasets;
}

export function filterRoles(groups: string[]): string[] {
  return groups.filter(group => group.split("-").length < 2);
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
