import { countries } from "@/constants/countries";

export function filterCountries(groups: string[]): string[] {
  return groups.filter(group => {
    return countries.some(country =>
      group.split("-")[0].startsWith(country.name),
    );
  });
}

export function filterRoles(groups: string[]): string[] {
  return groups.filter(country => {
    return !countries.some(g => g.name === country);
  });
}
