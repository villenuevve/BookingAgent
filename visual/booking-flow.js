let bookingState = {
  equipment: null,
  quantity: 1,
  startDate: null,
  endDate: null
};

function detectEquipment(text) {
  const value = text.toLowerCase();

  if (value.includes("camera")) return "Camera A";
  if (value.includes("tripod")) return "Tripod B";
  if (
    value.includes("microphone") ||
    value.includes("mic")
  ) {
    return "Microphone C";
  }

  return null;
}

function parseVoiceDates(text) {
  const value = text
    .toLowerCase()
    .replace(/,/g, " ")
    .replace(/\bthe\b/g, "")
    .replace(/\bof\b/g, " ");

  const months = {
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
  };

  const numbers = {
    "ten": 10,
    "eleven": 11,
    "twelve": 12,
    "thirteen": 13,
    "fourteen": 14,
    "fifteen": 15,
    "sixteen": 16,
    "seventeen": 17,
    "eighteen": 18,
    "nineteen": 19,
    "twenty": 20,
    "twenty one": 21,
    "twenty-two": 22,
    "twenty two": 22,
    "twenty-three": 23,
    "twenty three": 23,
    "twenty-four": 24,
    "twenty four": 24,
    "twenty-five": 25,
    "twenty five": 25,
    "twenty-six": 26,
    "twenty six": 26,
    "twenty-seven": 27,
    "twenty seven": 27,
    "twenty-eight": 28,
    "twenty eight": 28,
    "twenty-nine": 29,
    "twenty nine": 29,
    "thirty": 30,
    "thirty-one": 31,
    "thirty one": 31
  };

  function dayNumber(value) {
    value = value.trim();

    value = value.replace(
      /(st|nd|rd|th)$/i,
      ""
    );

    if (/^\d+$/.test(value)) {
      const number = Number(value);
      return number >= 1 && number <= 31
        ? number
        : null;
    }

    return numbers[value] || null;
  }

  const monthNames = Object.keys(months);

  let found = [];

  for (const monthName of monthNames) {
    const pattern = new RegExp(
      `(\\d{1,2}(?:st|nd|rd|th)?|[a-z -]+)\\s+${monthName}`,
      "i"
    );

    const match = value.match(pattern);

    if (match) {
      const day = dayNumber(match[1]);

      if (day) {
        found.push({
          month: months[monthName],
          day
        });
      }
    }
  }

  for (const monthName of monthNames) {
    const pattern = new RegExp(
      `${monthName}\\s+(\\d{1,2}(?:st|nd|rd|th)?)`,
      "i"
    );

    const match = value.match(pattern);

    if (match) {
      const day = dayNumber(match[1]);

      if (day) {
        found.push({
          month: months[monthName],
          day
        });
      }
    }
  }

  const unique = [];

  for (const item of found) {
    const key = `${item.month}-${item.day}`;

    if (!unique.some(x => x.key === key)) {
      unique.push({
        key,
        ...item
      });
    }
  }

  if (unique.length >= 2) {
    const start = unique[0];
    const end = unique[1];

    return {
      startDate: `2026-${String(start.month).padStart(2, "0")}-${String(start.day).padStart(2, "0")}`,
      endDate: `2026-${String(end.month).padStart(2, "0")}-${String(end.day).padStart(2, "0")}`
    };
  }

  return null;
}

function processBookingVoice(text) {
  const equipment = detectEquipment(text);

  if (equipment) {
    bookingState.equipment = equipment;
  }

  const dates = parseVoiceDates(text);

  if (dates) {
    bookingState.startDate = dates.startDate;
    bookingState.endDate = dates.endDate;
  }

  return {
    equipment: bookingState.equipment,
    startDate: bookingState.startDate,
    endDate: bookingState.endDate
  };
}

window.bookingState = bookingState;
window.processBookingVoice = processBookingVoice;
