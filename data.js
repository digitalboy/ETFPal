// data.js
import { calculateConsecutiveDownWeeks } from "./utils.js";

function calculateConsecutiveUpMonths(nasdaqData, sp500Data) {
  if (!nasdaqData || !sp500Data) {
    return 0;
  }
  const nasdaqEntries = Object.entries(nasdaqData);
  const sp500Entries = Object.entries(sp500Data);
  if (nasdaqEntries.length < 2 || sp500Entries.length < 2) {
    return 0;
  }

  let consecutiveUpMonths = 0;
  for (let i = 0; i < nasdaqEntries.length - 1; i++) {
    const currentNasdaqPrice = parseFloat(nasdaqEntries[i][1]["4. close"]);
    const previousNasdaqPrice = parseFloat(nasdaqEntries[i + 1][1]["4. close"]);

    const currentSP500Price = parseFloat(sp500Entries[i][1]["4. close"]);
    const previousSP500Price = parseFloat(sp500Entries[i + 1][1]["4. close"]);

    if (
      currentNasdaqPrice > previousNasdaqPrice &&
      currentSP500Price > previousSP500Price
    ) {
      consecutiveUpMonths++;
    } else {
      break;
    }
  }
  return consecutiveUpMonths;
}

export { calculateConsecutiveUpMonths };
