window.DateUtils = {
  months: {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12
  },

  clean(text) {
    return text
      .toLowerCase()
      .replace(/,/g, " ")
      .replace(/\bthe\b/g, "")
      .replace(/\bof\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  day(value) {
    const words = {
      ten: 10,
      eleven: 11,
      twelve: 12,
      thirteen: 13,
      fourteen: 14,
      fifteen: 15,
      sixteen: 16,
      seventeen: 17,
      eighteen: 18,
      nineteen: 19,
      twenty: 20,
      thirty: 30
    };

    value = value
      .replace(/st|nd|rd|th/g, "")
      .trim();

    if (/^\d+$/.test(value)) {
      const number = Number(value);
      return number >= 1 && number <= 31
        ? number
        : null;
    }

    return words[value] || null;
  },

  makeDate(month, day) {
    if (!month || !day) return null;

    const date = new Date(
      Date.UTC(2026, month - 1, day)
    );

    if (
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }

    return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
};

DateUtils.createRange = function(month, start, end) {
  const startDay = DateUtils.day(start);
  const endDay = DateUtils.day(end);
  const monthNumber = DateUtils.months[month];

  const startDate = DateUtils.makeDate(
    monthNumber,
    startDay
  );

  const endDate = DateUtils.makeDate(
    monthNumber,
    endDay
  );

  if (!startDate || !endDate || startDate > endDate) {
    return null;
  }

  return {
    startDate,
    endDate
  };
};

DateUtils.createDifferentMonthRange = function(
  startMonth,
  start,
  endMonth,
  end
) {
  const startDate = DateUtils.makeDate(
    DateUtils.months[startMonth],
    DateUtils.day(start)
  );

  const endDate = DateUtils.makeDate(
    DateUtils.months[endMonth],
    DateUtils.day(end)
  );

  if (!startDate || !endDate || startDate > endDate) {
    return null;
  }

  return {
    startDate,
    endDate
  };
};
