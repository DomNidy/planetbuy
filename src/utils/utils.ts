import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { planetImagePropertiesSchema } from "./schemas";
import { PlanetTemperatureRange, PlanetTerrain } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Function that will format a number to have commas in it
 *
 * Example: `15923` -> `15,923`
 * @param {any} num:number|string
 * @returns {any}
 */
export function formatNumberToStringWithCommas(num: number | string): string {
  // Convert input to a string in case it's a number
  const inputString = typeof num === "number" ? num.toString() : num;
  let formattedString = "";

  const decimalIndex = inputString.indexOf(".");
  const integerPart =
    decimalIndex >= 0 ? inputString.slice(0, decimalIndex) : inputString;
  const decimalPart = decimalIndex >= 0 ? inputString.slice(decimalIndex) : "";

  for (let i = 0; i < integerPart.length; i++) {
    const char = integerPart[i];
    formattedString += char;

    // Place comma every 3 characters from the right, except for the last character
    if ((integerPart.length - i - 1) % 3 === 0 && i < integerPart.length - 1) {
      formattedString += ",";
    }
  }

  return formattedString + decimalPart;
}

/**
 * Given a string with numbers in it, example: "300,454", converts the string to a number: 300454
 *
 * Will remove all commas in the string
 *
 * @param {any} stringWithNumbers:string
 * @returns {any}
 */
export function formatStringToNumber(stringWithNumbers: string): number {
  const formattedString: string = stringWithNumbers.replaceAll(",", "");
  const convertedString = Number(formattedString);

  if (Number.isNaN(convertedString)) {
    throw new Error("Invalid string input");
  }

  return Number(formattedString);
}

/**
 * Utility function that converts large numbers into more readable strings
 *
 * Ex: 40050000 -> `40.1 million`
 * @param {any} num:number
 * @returns {any}
 */
export function formatLargeNumberToString(num: number) {
  // Convert input to num
  let convertedToNumber = Number(num);

  if (isNaN(convertedToNumber) || typeof convertedToNumber != "number") {
    return "";
  }

  const magnitudes = [
    "",
    "thousand",
    "million",
    "billion",
    "trillion",
    "quadrillion",
    "quintillion",
    "sextillion",
    "septillion",
    "octillion",
    "nonillion",
    "decillion",
    "undecillion",
    "duodecillion",
    "tredecillion",
    "quattuordecillion",
    "quindecillion",
    "sexdecillion",
    "septendecillion",
    "octodecillion",
    "novemdecillion",
    "vigintillion",
    "centillion",
  ];

  let magnitudeIndex = 0;
  while (convertedToNumber >= 1000 && magnitudeIndex < magnitudes.length - 1) {
    convertedToNumber /= 1000;
    magnitudeIndex++;
  }

  if (magnitudeIndex == 0) {
    return "";
  }

  return convertedToNumber.toFixed(1) + " " + magnitudes[magnitudeIndex];
}

export function generateRandomNumberWithStdDev(
  mean: number,
  stdDeviation: number,
): number {
  // Generate two random numbers between 0 and 1 and apply the Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();

  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  // Scale and shift random number to match mean and std dev
  const randomValue = mean + stdDeviation * z0;

  return Math.abs(randomValue);
}

/**
 * Function which returns true when the user is scrolled
 * near the bottom of the page. (Specified by the threshold prope)
 * @param {number} threshold When the user is scrolled closer than this distance (in pixels) from the bottom of the page, returns true
 * @returns {any}
 */
export function isScrolledToBottom(threshold: number): boolean {
  const scrollPos = window.scrollY;
  const totalHeight =
    document.documentElement.scrollHeight - window.innerHeight;

  // Check if the scroll position is near the bottom
  if (scrollPos >= totalHeight - threshold) {
    return true;
  } else {
    return false;
  }
}

export function generateRandomPlanetName(): string {
  const vowels = "aeiou";
  const consonants = "bcdfghjklmnpqrstvwxyz";
  const nameLength = Math.max(Math.floor(Math.random() * 6) + 2, 4);
  let planetName = "";

  for (let i = 0; i < nameLength; i++) {
    if (i % 2 === 0) {
      // If even position, add a consonant
      const randomConsonant =
        consonants[Math.floor(Math.random() * consonants.length)];
      planetName += randomConsonant;
    } else {
      // If odd position, add a vowel
      const randomVowel = vowels[Math.floor(Math.random() * vowels.length)];
      planetName += randomVowel;
    }
  }

  // Random additional words that we may append to the planet name to make things more interesting
  const flavorWords = [
    "Scar",
    "Land",
    "Hallow",
    "Revere",
    "Quaint",
    "Mire",
    "Grasp",
    "Bane",
    "Planet",
    "Hold",
  ];

  // Add a random flavor word to planet name
  if (Math.random() * 100 > 96) {
    planetName +=
      " " + flavorWords[Math.round(Math.random() * flavorWords.length) - 1];
  }

  // Capitalize the first character
  planetName = planetName.charAt(0).toUpperCase() + planetName.slice(1);

  // Add prefixes, suffixes, or combine words for added interest
  if (Math.random() * 100 > 96) {
    const prefixes = ["Nova", "Terra", "Cyber", "Aqua", "Exo"];
    const suffixes = ["Prime", "Secunda", "Ultima", "Omega", "Nebula"];
    const compoundWords = ["Star", "Cosmo", "Galax", "Orbit", "Astro"];

    const randomOption = Math.floor(Math.random() * 3);
    if (randomOption === 0) {
      planetName = prefixes[Math.floor(Math.random() * prefixes.length)] + " " + planetName;
    } else if (randomOption === 1) {
      planetName = planetName + " " + suffixes[Math.floor(Math.random() * suffixes.length)];
    } else {
      planetName = compoundWords[Math.floor(Math.random() * compoundWords.length)] + " " + planetName;
    }
  }

  return planetName;
}

export function parsePlanetImagePropertiesFromFilename(
  filename: string,
): Zod.infer<typeof planetImagePropertiesSchema> | undefined {
  // Parse planet image properties from filename
  const parsedImagePropertiesFromFileName: string[] = filename
    .replace(".jpg", "")
    .split(" ");

  // Declare variables which will corespond to the image properties once we finish parsing them from the file name
  let planetTemperature: PlanetTemperatureRange | undefined;
  let planetTerrain: PlanetTerrain | undefined;

  // Parse the temperature property string from image props
  for (const prop of parsedImagePropertiesFromFileName) {
    // Check if the current string matches a member of the PlanetTemperatureRange enum
    if (
      Object.values(PlanetTemperatureRange).includes(
        prop as PlanetTemperatureRange,
      )
    ) {
      // If we find a string that matches a temperature property, assign the variable and break
      planetTemperature = prop as PlanetTemperatureRange;
      break;
    }
  }

  // Parse the terrain property string from image props
  for (const prop of parsedImagePropertiesFromFileName) {
    // Check if the current string matches a member of the PlanetTerrain enum
    if (Object.values(PlanetTerrain).includes(prop as PlanetTerrain)) {
      // If we find a string that matches a temperature property, assign the variable and break
      planetTerrain = prop as PlanetTerrain;
      break;
    }
  }

  if (planetTemperature && planetTerrain) {
    return {
      planetTemperature: planetTemperature,
      planetTerrain: planetTerrain,
    };
  }

  return undefined;
}
