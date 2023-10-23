import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
  while (convertedToNumber >= 1000 && magnitudeIndex < magnitudes.length-1) {
    convertedToNumber /= 1000;
    magnitudeIndex++;
  }

  if (magnitudeIndex == 0) {
    return "";
  }

  return convertedToNumber.toFixed(1) + " " + magnitudes[magnitudeIndex];
}
