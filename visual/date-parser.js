function parseDates(text) {
  const value = text.toLowerCase();

  const numbers = value.match(/\b\d{1,2}(?:st|nd|rd|th)?\b/g);

  const month = value.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/
  );

  if (!numbers || numbers.length < 2 || !month) {
    return null;
  }

  const start = numbers[0].replace(/\D/g, "");
  const end = numbers[1].replace(/\D/g, "");

  const monthNumber = DateUtils.months[month[1]];

  const startDate = DateUtils.makeDate(
    monthNumber,
    Number(start)
  );

  const endDate = DateUtils.makeDate(
    monthNumber,
    Number(end)
  );

  if (!startDate || !endDate) {
    return null;
  }

  return {
    startDate,
    endDate
  };
}

window.parseDates = parseDates;
