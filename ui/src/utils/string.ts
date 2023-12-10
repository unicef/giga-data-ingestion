export function formatCountries(countries: string[]) {
  if (countries.length === 1) {
    return countries[0];
  } else if (countries.length === 2) {
    return countries.join(" and ");
  } else {
    const formattedCountries =
      countries.slice(0, -1).join(", ") +
      ", and " +
      countries[countries.length - 1];
    return formattedCountries;
  }
}

const countryArray = ["CountryA", "CountryB", "CountryC", "CountryD"];

const formattedList = formatCountries(countryArray);
console.log(formattedList); // Output: CountryA, CountryB, CountryC, and CountryD

export default formatCountries;
