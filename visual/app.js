let recognition = null;
let isListening = false;

const conversationState = {
  step: "collecting",
  equipment: null,
  quantity: 1,
  startDate: null,
  endDate: null,
  availability: null,
  awaitingConfirmation: false,
  reservationId: null
};

const voiceStatus = document.getElementById("voiceStatus");
const startVoiceButton =
  document.getElementById("startVoiceButton");
const conversation =
  document.getElementById("conversation");

function addMessage(role, text) {
  const emptyState =
    conversation.querySelector(".empty-state");

  if (emptyState) {
    emptyState.remove();
  }

  const message = document.createElement("div");

  message.style.marginBottom = "12px";
  message.style.padding = "12px 14px";
  message.style.borderRadius = "10px";
  message.style.background =
    role === "user" ? "#e9edf5" : "#ffffff";
  message.style.border = "1px solid #e1e2e5";

  message.innerHTML = `
    <strong>
      ${role === "user" ? "You" : "Agent"}
    </strong>

    <div style="margin-top: 4px;">
      ${escapeHtml(text)}
    </div>
  `;

  conversation.appendChild(message);
  conversation.scrollTop =
    conversation.scrollHeight;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    addMessage("agent", text);
    return;
  }

  window.speechSynthesis.cancel();

  const turnEndTime = performance.now();

  const utterance =
    new SpeechSynthesisUtterance(text);

  utterance.lang = "en-US";
  utterance.rate = 1;

  utterance.onstart = () => {
    const latency = performance.now() - turnEndTime;
    console.log(`Turn-end to first-audio: ${latency.toFixed(0)} ms`);
  };

  window.speechSynthesis.speak(utterance);

  addMessage("agent", text);
}

function setupSpeechRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    voiceStatus.textContent =
      "Speech recognition is not supported in this browser.";

    startVoiceButton.disabled = true;

    return null;
  }

  const recognizer =
    new SpeechRecognition();

  recognizer.lang = "en-US";
  recognizer.interimResults = false;
  recognizer.continuous = false;
  recognizer.maxAlternatives = 1;

  recognizer.onstart = () => {
    isListening = true;

    voiceStatus.textContent =
      "Listening...";

    startVoiceButton.textContent =
      "Listening...";

    startVoiceButton.disabled = true;
  };

  recognizer.onresult = async (event) => {
    const transcript =
      event.results[0][0].transcript;

    addMessage("user", transcript);

    voiceStatus.textContent =
      "Processing...";

    await processVoiceRequest(transcript);
  };

  recognizer.onerror = (event) => {
    console.error(
      "Speech recognition error:",
      event.error
    );

    isListening = false;

    voiceStatus.textContent =
      `Voice error: ${event.error}`;

    startVoiceButton.textContent =
      "Start voice assistant";

    startVoiceButton.disabled = false;
  };

  recognizer.onend = () => {
    isListening = false;

    if (
      voiceStatus.textContent ===
      "Listening..."
    ) {
      voiceStatus.textContent =
        "Ready to start";
    }

    startVoiceButton.textContent =
      "Start voice assistant";

    startVoiceButton.disabled = false;
  };

  return recognizer;
}

function resetConversationState() {
  conversationState.step =
    "collecting";

  conversationState.equipment =
    null;

  conversationState.quantity =
    1;

  conversationState.startDate =
    null;

  conversationState.endDate =
    null;

  conversationState.availability =
    null;

  conversationState.awaitingConfirmation =
    false;
}

// Detect the requested equipment from the user's message
function detectEquipment(text) {
  const lowerText =
    text.toLowerCase();

  if (
    lowerText.includes("camera") ||
    lowerText.includes("camera a")
  ) {
    return "Camera A";
  }

  if (
    lowerText.includes("tripod") ||
    lowerText.includes("tripod b")
  ) {
    return "Tripod B";
  }

  if (
    lowerText.includes("microphone") ||
    lowerText.includes("mic") ||
    lowerText.includes("microphone c")
  ) {
    return "Microphone C";
  }

  const twoDatesSameMonth =
    lowerText.match(
      /\b(?:from\s+)?(?:the\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(?:(?:to|through|until)\s+)?(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\b/i
    );

  if (twoDatesSameMonth) {
    const month = monthNumber(twoDatesSameMonth[1]);

    const startDate = createIsoDate(
      currentYear,
      month,
      normalizeDay(twoDatesSameMonth[2])
    );

    const endDate = createIsoDate(
      currentYear,
      month,
      normalizeDay(twoDatesSameMonth[3])
    );

    if (startDate && endDate) {
      return {
        startDate,
        endDate
      };
    }
  }

  return null;
}

// Extract the requested rental quantity from the user's message
function detectQuantity(text) {
  const lowerText =
    text.toLowerCase();

  const wordNumbers = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5
  };

  const quantityNumberMatch =
    lowerText.match(
      /\b(?:quantity|qty|amount)\s*(?:is|=|to)?\s*(\d+)\b/
    );

  if (quantityNumberMatch) {
    return Number(quantityNumberMatch[1]);
  }

  for (const [word, number] of Object.entries(
    wordNumbers
  )) {
    const quantityWordMatch =
      new RegExp(
        `\\b(?:quantity|qty|amount)\\s*(?:is|=|to)?\\s*${word}\\b`
      );

    if (quantityWordMatch.test(lowerText)) {
      return number;
    }
  }

  const numberMatch =
    lowerText.match(
      /\b(\d+)\b\s*(?:camera|cameras|tripod|tripods|microphone|microphones|mics?)/
    );

  if (numberMatch) {
    return Number(numberMatch[1]);
  }

  for (const [word, number] of Object.entries(
    wordNumbers
  )) {
    const pattern = new RegExp(
      `\\b${word}\\b\\s*(?:camera|cameras|tripod|tripods|microphone|microphones|mics?)`
    );

    if (pattern.test(lowerText)) {
      return number;
    }
  }

  return 1;
}
function monthNumber(month) {
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

  return months[month.toLowerCase()] || null;
}

function normalizeDay(dayText) {
  const cleaned =
    dayText
      .toLowerCase()
      .replace(/st|nd|rd|th/g, "");

  const number =
    Number(cleaned);

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 31
  ) {
    return null;
  }

  return number;
}

function createIsoDate(
  year,
  month,
  day
) {
  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return [
    year,
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0")
  ].join("-");
}

function detectMonthOnly(text) {
  const match =
    text
      .toLowerCase()
      .match(
        /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i
      );

  return match ? match[1] : null;
}

// Parse rental start and end dates from natural-language input
function extractDates(text) {

  const lowerText =
    text
      .toLowerCase()
      .replace(/,/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const currentYear = 2026;

  const twoDatesSameMonthPattern =
    /\b(?:from\s+)?(?:the\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(?:(?:to\s+)?(?:the\s+)?(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+)?(\d{1,2})(?:st|nd|rd|th)?\b/i;

  const twoDatesSameMonthMatch =
    lowerText.match(twoDatesSameMonthPattern);

  if (twoDatesSameMonthMatch) {
    const month =
      monthNumber(twoDatesSameMonthMatch[1]);

    const startDate =
      createIsoDate(
        currentYear,
        month,
        normalizeDay(twoDatesSameMonthMatch[2])
      );

    const endDate =
      createIsoDate(
        currentYear,
        month,
        normalizeDay(twoDatesSameMonthMatch[3])
      );

    if (startDate && endDate) {
      return {
        startDate,
        endDate
      };
    }
  }


  /*
   * Reject ambiguous date constructions.
   *
   * Example:
   * "from 2 to 29 and 9 of October"
   *
   * This contains an extra date after an already defined range,
   * so we must not silently interpret it as October 2 to October 29.
   */

  const ambiguousDatePattern =
    /\\b(?:from\\s+)?(?:the\\s+)?\\d{1,2}(?:st|nd|rd|th)?\\s+(?:to|through|until)\\s+(?:the\\s+)?\\d{1,2}(?:st|nd|rd|th)?\\s+(?:and|or)\\s+(?:the\\s+)?\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?(?:january|february|march|april|may|june|july|august|september|october|november|december)\\b/i;

  if (ambiguousDatePattern.test(lowerText)) {
    return null;
  }

  /*
   * 29th of October to the 30th of October
   * 29 of October until 30 of October
   * 10th of October and 12th of October
   */

  const dayFirstPattern =
    /\b(?:from\s+)?(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+(?:to|through|until|and|-)\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?(?:\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december))?/i;

  const dayFirstMatches =
    [...lowerText.matchAll(
      new RegExp(dayFirstPattern.source, "gi")
    )];

  const dayFirstMatch =
    dayFirstMatches.length
      ? dayFirstMatches[dayFirstMatches.length - 1]
      : null;

  if (dayFirstMatch) {
    const startMonth =
      monthNumber(dayFirstMatch[2]);

    const endMonth =
      monthNumber(
        dayFirstMatch[4] ||
        dayFirstMatch[2]
      );

    const startDay =
      normalizeDay(dayFirstMatch[1]);

    const endDay =
      normalizeDay(dayFirstMatch[3]);

    const startDate =
      createIsoDate(
        currentYear,
        startMonth,
        startDay
      );

    const endDate =
      createIsoDate(
        currentYear,
        endMonth,
        endDay
      );

    if (startDate && endDate) {
      return {
        startDate,
        endDate
      };
    }
  }

  /*
   * October 29 to October 30
   * from October 29 through October 30
   */

  const monthFirstPattern =
    /\b(?:from\s+)?(?:the\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?\s*(?:to|through|until|and|-)\s*(?:(?:the\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+)?(\d{1,2})(?:st|nd|rd|th)?/i;

  const monthFirstMatches =
    [...lowerText.matchAll(
      new RegExp(monthFirstPattern.source, "gi")
    )];

  const monthFirstMatch =
    monthFirstMatches.length
      ? monthFirstMatches[monthFirstMatches.length - 1]
      : null;

  if (monthFirstMatch) {
    const startMonth =
      monthNumber(monthFirstMatch[1]);

    const endMonth =
      monthNumber(
        monthFirstMatch[3] ||
        monthFirstMatch[1]
      );

    const startDay =
      normalizeDay(monthFirstMatch[2]);

    const endDay =
      normalizeDay(monthFirstMatch[4]);

    const startDate =
      createIsoDate(
        currentYear,
        startMonth,
        startDay
      );

    const endDate =
      createIsoDate(
        currentYear,
        endMonth,
        endDay
      );

    if (startDate && endDate) {
      return {
        startDate,
        endDate
      };
    }
  }

  /*
   * October 10 October 12
   * from October 10 October 12
   * Also supports ordinal suffixes.
   */

  /*
   * from October 30
   * on October 30
   * for October 30
   */

  const singleDatePattern =
    /\b(?:from|on|for)\s+(?:the\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?/i;

  const singleMatch =
    lowerText.match(singleDatePattern);

  if (singleMatch) {
    const month =
      monthNumber(singleMatch[1]);

    const day =
      normalizeDay(singleMatch[2]);

    const date =
      createIsoDate(
        currentYear,
        month,
        day
      );

    if (date) {
      return {
        startDate: date,
        endDate: null
      };
    }
  }

  return null;
}

function formatDate(isoDate) {
  if (!isoDate) {
    return "";
  }

  const [
    year,
    month,
    day
  ] = isoDate.split("-");

  const date =
    new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day)
      )
    );

  return date.toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC"
    }
  );
}

function isValidDateRange(
  startDate,
  endDate
) {
  if (!startDate || !endDate) {
    return false;
  }

  return startDate <= endDate;
}

async function checkPeriodAvailability() {
  if (
    !conversationState.equipment ||
    !conversationState.startDate ||
    !conversationState.endDate
  ) {
    return null;
  }

  const params =
    new URLSearchParams({
      equipment:
        conversationState.equipment,

      quantity:
        String(
          conversationState.quantity
        ),

      startDate:
        conversationState.startDate,

      endDate:
        conversationState.endDate
    });

  const response =
    await fetch(
      `/api/availability?${params.toString()}`
    );

  if (!response.ok) {
    throw new Error(
      "Failed to check availability"
    );
  }

  return response.json();
}

async function handleEquipment(text) {
  const equipment =
    detectEquipment(text);

  if (equipment) {
    conversationState.equipment =
      equipment;

    conversationState.quantity =
      detectQuantity(text);
  }

  return equipment;
}

async function processVoiceRequest(text) {
  try {
    /*
     * Handle unclear replies after an unavailable result.
     * Do not repeat the stale availability message.
     */

    if (
      conversationState.step === "unavailable"
    ) {
      const newEquipment =
        detectEquipment(text);

      let newDates =
        extractDates(text);

      if (!newDates) {
        const singleDateMatch =
          text.match(
            /\\b(january|february|march|april|may|june|july|august|september|october|november|december)\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b/i
          );

        if (singleDateMatch) {
          const month =
            monthNumber(singleDateMatch[1]);

          const date =
            createIsoDate(
              2026,
              month,
              normalizeDay(singleDateMatch[2])
            );

          if (date) {
            newDates = {
              startDate: date,
              endDate: null
            };
          }
        }
      }

      if (!newEquipment && !newDates) {
        speak(
          "I didn't understand the change. Please tell me the equipment or new dates you would like."
        );

        voiceStatus.textContent =
          "Waiting for clarification.";

        return;
      }

      conversationState.step =
        "collecting";

      if (newEquipment) {
        conversationState.equipment =
          newEquipment;

        conversationState.quantity =
          detectQuantity(text);
      }

      if (newDates) {
        conversationState.startDate =
          newDates.startDate;

        conversationState.endDate =
          newDates.endDate;
      }

      await continueBookingFlow();

      return;
    }
    const lowerText =
      text.toLowerCase();

    /*
     * Ignore repeated confirmation after booking.
     */

    if (
      conversationState.step === "confirmed" &&
      conversationState.reservationId &&
      (
        lowerText.includes("yes") ||
        lowerText.includes("confirm") ||
        lowerText.includes("confirmed")
      )
    ) {
      speak(
        `This booking is already confirmed. Your reservation number is ${conversationState.reservationId}.`
      );

      voiceStatus.textContent =
        "Booking already confirmed.";

      return;
    }

    /*
     * Detect rental dates.
     */

    const parsedDates = extractDates(text);

    if (
      parsedDates &&
      conversationState.equipment
    ) {
      conversationState.startDate =
        parsedDates.startDate;

      conversationState.endDate =
        parsedDates.endDate;
    }

    /*
     * Global cancellation.
     */

    if (
      lowerText.includes("cancel") ||
      lowerText.includes("start over") ||
      lowerText.includes("reset")
    ) {
      resetConversationState();

      speak(
        "Okay. I cancelled the current request. What equipment would you like to rent?"
      );

      voiceStatus.textContent =
        "Waiting for a new request.";

      return;
    }

    /*
     * Confirmation handling.
     */

    if (
      conversationState.awaitingConfirmation
    ) {
      const newEquipment =
        detectEquipment(text);

      const newDates =
        extractDates(text);

      /*
       * Corrections have priority over "no".
       * Example:
       * "No, I want October 10 to October 12."
       */

      const mentionsDate =
        /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(
          text
        );

      if (
        mentionsDate &&
        !newDates
      ) {
        conversationState.awaitingConfirmation =
          false;

        conversationState.startDate =
          null;

        conversationState.endDate =
          null;

        conversationState.step =
          "collecting_dates";

        speak(
          "I couldn't understand those dates. Please say them again, for example October 25 to October 27."
        );

        voiceStatus.textContent =
          "Waiting for valid rental dates.";

        return;
      }

      const quantityCorrection =
        /\b(?:quantity|qty|amount)\s*(?:is|=|to)?\s*(\d+|one|two|three|four|five)\b/i.test(
          text
        );

      if (quantityCorrection) {
        conversationState.quantity =
          detectQuantity(text);

        conversationState.awaitingConfirmation =
          false;

        await continueBookingFlow();

        return;
      }

      if (
        newEquipment ||
        newDates
      ) {
        conversationState.awaitingConfirmation =
          false;

        if (newEquipment) {
          conversationState.equipment =
            newEquipment;

          conversationState.quantity =
            detectQuantity(text);
        }

        if (newDates) {
          conversationState.startDate =
            newDates.startDate;

          conversationState.endDate =
            newDates.endDate;
        }

        await continueBookingFlow();

        return;
      }

      if (
        /\b(yes|yeah|yep|confirm|confirmed|do it|book it|go ahead)\b/i.test(
          text
        )
      ) {
        await confirmReservation();
        return;
      }

      if (
        /\b(no|nope|cancel)\b/i.test(text) ||
        /\b(don't|do not)\s+(want|book|confirm|need)\b/i.test(text)
      ) {
        resetConversationState();

        speak(
          "Okay, I will not create the booking. What would you like to rent?"
        );

        voiceStatus.textContent =
          "Waiting for a new request.";

        return;
      }

      speak(
        "Please say yes to confirm, no to cancel, or tell me the correction you would like to make."
      );

      voiceStatus.textContent =
        "Waiting for confirmation.";

      return;
    }

    /*
     * Collect the start day after the user gave only a month.
     */

    if (
      conversationState.step ===
      "collecting_start_date"
    ) {
      let dates =
        extractDates(text);

      /*
       * In this state the month is already known,
       * so accept a simple date such as "October 25".
       */

      if (!dates) {
        const lowerText =
          text.toLowerCase();

        const simpleDateMatch =
          lowerText.match(
            /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
          );

        const dayFirstMatch =
          lowerText.match(
            /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\b/i
          );

        const dayOnlyMatch =
          lowerText.match(
            /^\s*(\d{1,2})(?:st|nd|rd|th)?\s*$/i
          );

        if (simpleDateMatch) {
          const month =
            monthNumber(simpleDateMatch[1]);

          const day =
            normalizeDay(simpleDateMatch[2]);

          const date =
            createIsoDate(
              2026,
              month,
              day
            );

          if (date) {
            dates = {
              startDate: date,
              endDate: null
            };
          }
        } else if (dayFirstMatch) {
          const month =
            monthNumber(dayFirstMatch[2]);

          const day =
            normalizeDay(dayFirstMatch[1]);

          const date =
            createIsoDate(
              2026,
              month,
              day
            );

          if (date) {
            dates = {
              startDate: date,
              endDate: null
            };
          }
        } else if (
          dayOnlyMatch &&
          conversationState.month
        ) {
          const month =
            monthNumber(
              conversationState.month
            );

          const day =
            normalizeDay(dayOnlyMatch[1]);

          const date =
            createIsoDate(
              2026,
              month,
              day
            );

          if (date) {
            dates = {
              startDate: date,
              endDate: null
            };
          }
        }
      }

      if (
        dates &&
        dates.startDate &&
        dates.endDate
      ) {
        conversationState.startDate =
          dates.startDate;

        conversationState.endDate =
          dates.endDate;

        conversationState.step =
          "collecting";

        await continueBookingFlow();

        return;
      }

      if (
        dates &&
        dates.startDate &&
        !dates.endDate
      ) {
        conversationState.startDate =
          dates.startDate;

        conversationState.endDate =
          null;

        conversationState.step =
          "collecting_end_date";

        speak(
          `I have ${formatDate(
            dates.startDate
          )} as the start date. What is the end date?`
        );

        voiceStatus.textContent =
          "Waiting for end date.";

        return;
      }

      /*
       * If the user only says something unclear,
       * keep asking specifically for the day.
       */

      const dayMatch =
        text.match(
          /\b(\d{1,2})(?:st|nd|rd|th)?\b/i
        );

      if (!dayMatch) {
        const month =
          conversationState.month ||
          "that month";

        speak(
          `I didn't catch the day. What day in ${month} would you like to start?`
        );

        voiceStatus.textContent =
          "Waiting for start date.";

        return;
      }
    }

    /*
     * Collect the end date after the start date is known.
     */

    if (
      conversationState.step ===
      "collecting_end_date"
    ) {
      let endDate = null;

      const lowerText =
        text.toLowerCase();

      const monthFirstMatch =
        lowerText.match(
          /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
        );

      const dayFirstMatch =
        lowerText.match(
          /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\b/i
        );

      const dayOnlyMatch =
        lowerText.match(
          /^\s*(\d{1,2})(?:st|nd|rd|th)?\s*$/i
        );

      if (monthFirstMatch) {
        const month =
          monthNumber(monthFirstMatch[1]);

        const day =
          normalizeDay(monthFirstMatch[2]);

        endDate =
          createIsoDate(
            2026,
            month,
            day
          );
      } else if (dayFirstMatch) {
        const month =
          monthNumber(dayFirstMatch[2]);

        const day =
          normalizeDay(dayFirstMatch[1]);

        endDate =
          createIsoDate(
            2026,
            month,
            day
          );
      } else if (
        dayOnlyMatch &&
        conversationState.month
      ) {
        const month =
          monthNumber(
            conversationState.month
          );

        const day =
          normalizeDay(dayOnlyMatch[1]);

        endDate =
          createIsoDate(
            2026,
            month,
            day
          );
      }

      if (endDate) {
        if (
          endDate <
          conversationState.startDate
        ) {
          speak(
            "The end date cannot be before the start date. Please give me the end date again."
          );

          voiceStatus.textContent =
            "Waiting for valid end date.";

          return;
        }

        conversationState.endDate =
          endDate;

        conversationState.step =
          "collecting";

        await continueBookingFlow();

        return;
      }

      speak(
        `I didn't catch the end date. Please say it again, for example October 27.`
      );

      voiceStatus.textContent =
        "Waiting for end date.";

      return;
    }

    /*
     * Collect equipment.
     */

    const detectedEquipment =
      await handleEquipment(text);

    /*
     * If the user has just provided equipment
     * and no dates, ask for dates immediately.
     */

    if (
      detectedEquipment &&
      !extractDates(text) &&
      !conversationState.startDate &&
      !conversationState.endDate
    ) {
      speak(
        `What dates would you like to rent ${conversationState.equipment}? Please say the start and end date.`
      );

      conversationState.step =
        "collecting_dates";

      voiceStatus.textContent =
        "Waiting for rental dates.";

      return;
    }

    /*
     * Collect dates.
     */

    const dates =
      extractDates(text);

    if (dates) {
      conversationState.startDate =
        dates.startDate;

      if (dates.endDate) {
        conversationState.endDate =
          dates.endDate;
      }
    }

    /*
     * If the user gave only one date,
     * ask for the end date instead of guessing.
     */

    if (
      conversationState.startDate &&
      !conversationState.endDate
    ) {
      speak(
        `I have ${formatDate(
          conversationState.startDate
        )} as the start date. What is the end date?`
      );

      conversationState.step =
        "collecting_end_date";

      voiceStatus.textContent =
        "Waiting for end date.";

      return;
    }

    /*
     * If we have no equipment at all.
     */

    if (
      !conversationState.equipment
    ) {
      speak(
        "Which equipment would you like to rent: Camera A, Tripod B, or Microphone C?"
      );

      conversationState.step =
        "collecting_equipment";

      voiceStatus.textContent =
        "Waiting for equipment.";

      return;
    }

    /*
     * If the user gave only a month,
     * keep the month context and ask for the day.
     */

    if (
      !conversationState.startDate &&
      !conversationState.endDate
    ) {
      const monthOnly =
        detectMonthOnly(text);

      if (monthOnly) {
        conversationState.month =
          monthOnly;

        speak(
          `What day in ${monthOnly} would you like to start?`
        );

        conversationState.step =
          "collecting_start_date";

        voiceStatus.textContent =
          "Waiting for start date.";

        return;
      }
    }

    /*
     * If we have no dates.
     */

    if (
      !conversationState.startDate ||
      !conversationState.endDate
    ) {
      const mentionsDate =
        /\b(january|february|march|april|may|june|july|august|september|october|november|december|from|until|through|to|on|for)\b/i.test(
          text
        );

      if (!mentionsDate) {
        speak(
          `What dates would you like to rent ${conversationState.equipment}? Please say the start and end date.`
        );

        conversationState.step =
          "collecting_dates";

        voiceStatus.textContent =
          "Waiting for rental dates.";

        return;
      }

      speak(
        `I couldn't understand those dates. Please say them again, for example October 25 to October 27.`
      );

      conversationState.step =
        "collecting_dates";

      voiceStatus.textContent =
        "Waiting for valid rental dates.";

      return;
    }

    /*
     * Validate the date range.
     */

    if (
      !isValidDateRange(
        conversationState.startDate,
        conversationState.endDate
      )
    ) {
      conversationState.endDate =
        null;

      speak(
        "The end date cannot be before the start date. Please give me the rental dates again."
      );

      conversationState.step =
        "collecting_dates";

      voiceStatus.textContent =
        "Waiting for valid dates.";

      return;
    }

    await continueBookingFlow();

  } catch (error) {
    console.error(error);

    speak(
      "I could not complete that step because of a system error. Please try the request again."
    );

    voiceStatus.textContent =
      "System error. Ready to try again.";
  }
}

// Continue the booking flow: validate dates, check availability, and request confirmation
async function continueBookingFlow() {
  if (
    !conversationState.equipment
  ) {
    speak(
      "Which equipment would you like to rent: Camera A, Tripod B, or Microphone C?"
    );

    return;
  }

  if (
    !conversationState.startDate ||
    !conversationState.endDate
  ) {
    speak(
      `What dates would you like to rent ${conversationState.equipment}?`
    );

    return;
  }

  if (
    !isValidDateRange(
      conversationState.startDate,
      conversationState.endDate
    )
  ) {
    conversationState.endDate =
      null;

    speak(
      "The end date cannot be before the start date. Please give me the rental dates again."
    );

    return;
  }

  voiceStatus.textContent =
    "Checking inventory...";

  const availability =
    await checkPeriodAvailability();

  conversationState.availability =
    availability;

  if (
    !availability ||
    availability.available === false
  ) {
    conversationState.awaitingConfirmation =
      false;

    const availableQuantity =
      availability &&
      typeof availability.availableQuantity ===
        "number"
        ? availability.availableQuantity
        : 0;

    speak(
      `${conversationState.equipment} is not available for ${formatDate(
        conversationState.startDate
      )} to ${formatDate(
        conversationState.endDate
      )}. There ${
        availableQuantity === 1
          ? "is 1"
          : `are ${availableQuantity}`
      } available for that period. Would you like to choose different dates?`
    );

    conversationState.step =
      "unavailable";

    voiceStatus.textContent =
      "Waiting for different dates.";

    return;
  }

  conversationState.awaitingConfirmation =
    true;

  conversationState.step =
    "awaiting_confirmation";

  updateBookingSummary("Waiting for confirmation");

  speak(
    `${conversationState.equipment}, quantity ${conversationState.quantity}, is available from ${formatDate(
      conversationState.startDate
    )} to ${formatDate(
      conversationState.endDate
    )}. Would you like me to confirm the booking?`
  );

  voiceStatus.textContent =
    "Waiting for confirmation.";
}

// Create the reservation only after the user explicitly confirms the booking
async function confirmReservation() {
  if (
    !conversationState.awaitingConfirmation
  ) {
    return;
  }

  /*
   * Lock the state immediately.
   *
   * This prevents two rapid "yes" events
   * from creating two reservations.
   */

  conversationState.awaitingConfirmation =
    false;

  conversationState.step =
    "creating";

  voiceStatus.textContent =
    "Creating booking...";

  try {
    const response =
      await fetch(
        "/api/reservations",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            equipment:
              conversationState.equipment,

            quantity:
              conversationState.quantity,

            startDate:
              conversationState.startDate,

            endDate:
              conversationState.endDate
          })
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      /*
       * The inventory could have changed
       * between the availability check and
       * confirmation.
       */

      if (
        response.status === 409
      ) {
        conversationState.step =
          "unavailable";

        speak(
          `Sorry, ${conversationState.equipment} is no longer available for those dates. The inventory changed before I could confirm the booking. Would you like to choose different dates?`
        );

        voiceStatus.textContent =
          "Booking unavailable.";

        return;
      }

      throw new Error(
        result.reason ||
        "Failed to create reservation"
      );
    }

    conversationState.step =
      "confirmed";

    conversationState.reservationId =
      result.reservationId;

    updateBookingSummary("Confirmed");

    speak(
      `Confirmed. Your reservation number is ${result.reservationId}. ${result.equipment}, quantity ${result.quantity}, from ${formatDate(
        result.startDate
      )} to ${formatDate(
        result.endDate
      )}.`
    );

    voiceStatus.textContent =
      "Booking confirmed.";

    await loadData();

    /*
     * Keep the confirmed booking visible,
     * but clear the pending confirmation state.
     */

    conversationState.awaitingConfirmation =
      false;

  } catch (error) {
    console.error(error);

    conversationState.step =
      "error";

    speak(
      "I could not create the booking because of a system error. No booking was confirmed."
    );

    voiceStatus.textContent =
      "Booking failed.";
  }
}

async function loadStock() {
  const startDate = conversationState.startDate;
  const endDate = conversationState.endDate;

  let url = "/api/stock";

  const hasDates = startDate && endDate;

  if (hasDates) {
    url +=
      `?startDate=${encodeURIComponent(startDate)}` +
      `&endDate=${encodeURIComponent(endDate)}`;

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    const format = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric"
    });

    document.getElementById("inventoryTitle").textContent =
      "Availability";

    document.getElementById("inventorySubtitle").textContent =
      `${format.format(start)}–${format.format(end)}, ${end.getFullYear()}`;
  } else {
    document.getElementById("inventoryTitle").textContent =
      "Equipment";

    document.getElementById("inventorySubtitle").textContent =
      "Select rental dates to see availability";
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to load stock");
  }

  const stock = await response.json();

  const container =
    document.getElementById("equipmentList");

  container.innerHTML = stock
    .map(
      (item) => `
        <button
          type="button"
          class="equipment-card"
          onclick="openVisualBooking('${escapeHtml(item.name)}')"
        >
          <h3>${escapeHtml(item.name)}</h3>

          <div class="stock-row">
            <span>${hasDates ? "Available" : "Quantity"}</span>

            <span class="stock-number">
              ${hasDates ? item.availableQuantity : item.totalQuantity}
            </span>
          </div>

          <div class="stock-row">
            <span>Total</span>

            <span>
              ${item.totalQuantity}
            </span>
          </div>
        </button>
      `
    )
    .join("");
}
async function loadReservations() {
  const response =
    await fetch(
      "/api/reservations"
    );

  if (!response.ok) {
    throw new Error(
      "Failed to load reservations"
    );
  }

  const reservations =
    await response.json();

  const container =
    document.getElementById(
      "reservationList"
    );

  if (reservations.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No reservations</p>

        <span>
          There are no confirmed bookings yet.
        </span>
      </div>
    `;

    return;
  }

  container.innerHTML =
    reservations
      .map(
        (reservation) => `
          <div class="reservation-card">

            <div class="reservation-id">
              #${reservation.id}
            </div>

            <div class="reservation-equipment">
              <strong>
                ${escapeHtml(
                  reservation.equipment
                )}
                × ${reservation.quantity}
              </strong>

              <span>
                ${reservation.startDate}
                →
                ${reservation.endDate}
              </span>
            </div>

            <div class="reservation-status">
              ${escapeHtml(
                reservation.status
              )}
            </div>

          </div>
        `
      )
      .join("");
}

async function loadData() {
  try {
    await Promise.all([
      loadStock(),
      loadReservations()
    ]);
  } catch (error) {
    console.error(error);

    document.getElementById(
      "equipmentList"
    ).textContent =
      "Failed to load inventory.";

    document.getElementById(
      "reservationList"
    ).textContent =
      "Failed to load reservations.";
  }
}

startVoiceButton.addEventListener(
  "click",
  () => {
    if (!recognition) {
      recognition =
        setupSpeechRecognition();
    }

    if (
      !recognition ||
      isListening
    ) {
      return;
    }

    try {
      recognition.start();
    } catch (error) {
      console.error(error);
    }
  }
);

document
  .getElementById("refreshButton")
  .addEventListener(
    "click",
    loadData
  );

loadData();

/* Space = skip current agent speech */
document.addEventListener("keydown", (event) => {
  if (event.code !== "Space") return;

  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;

  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
});

let visualSelectedEquipment = null;

function updateBookingSummary(status = null) {
  const summary = document.getElementById("bookingSummary");
  const summaryStatus = document.getElementById("summaryStatus");

  if (!summary || !summaryStatus) return;

  const {
    equipment,
    quantity,
    startDate,
    endDate,
    availability,
    step,
    reservationId
  } = conversationState;

  if (!equipment) {
    summaryStatus.textContent = "No booking selected";
    summary.innerHTML =
      "Select equipment or start the voice assistant.";
    return;
  }

  const availableText =
    availability &&
    typeof availability.availableQuantity === "number"
      ? `${availability.availableQuantity} available`
      : "Availability not checked";

  let currentStatus =
    status ||
    (step === "confirmed"
      ? "Confirmed"
      : conversationState.awaitingConfirmation
        ? "Waiting for confirmation"
        : "In progress");

  summaryStatus.textContent = currentStatus;

  summary.innerHTML = `
    <div class="summary-row">
      <span>Equipment</span>
      <strong>${escapeHtml(equipment)}</strong>
    </div>

    <div class="summary-row">
      <span>Quantity</span>
      <strong>${quantity}</strong>
    </div>

    <div class="summary-row">
      <span>Dates</span>
      <strong>
        ${
          startDate && endDate
            ? `${formatDate(startDate)} → ${formatDate(endDate)}`
            : "Not selected"
        }
      </strong>
    </div>

    <div class="summary-row">
      <span>Stock</span>
      <strong>${escapeHtml(availableText)}</strong>
    </div>

    ${
      reservationId
        ? `
          <div class="summary-row">
            <span>Reservation</span>
            <strong>#${reservationId}</strong>
          </div>
        `
        : ""
    }
  `;
}

function openVisualBooking(equipment) {
  visualSelectedEquipment = equipment;

  conversationState.equipment = equipment;
  conversationState.quantity = 1;
  conversationState.startDate = null;
  conversationState.endDate = null;
  conversationState.availability = null;
  conversationState.awaitingConfirmation = false;
  conversationState.step = "visual_collecting";

  document.getElementById("visualBookingForm").hidden = false;
  document.getElementById("confirmVisualBooking").hidden = true;

  document.getElementById("visualQuantity").value = 1;
  document.getElementById("visualStartDate").value = "";
  document.getElementById("visualEndDate").value = "";

  updateBookingSummary("Select dates and check availability");
}

async function checkVisualAvailability() {
  const quantity =
    Number(document.getElementById("visualQuantity").value);

  const startDate =
    document.getElementById("visualStartDate").value;

  const endDate =
    document.getElementById("visualEndDate").value;

  if (
    !visualSelectedEquipment ||
    !quantity ||
    quantity < 1 ||
    !startDate ||
    !endDate
  ) {
    updateBookingSummary("Complete all booking fields");
    return;
  }

  if (endDate < startDate) {
    updateBookingSummary("End date cannot be before start date");
    return;
  }

  try {
    const params = new URLSearchParams({
      equipment: visualSelectedEquipment,
      quantity: String(quantity),
      startDate,
      endDate
    });

    const response =
      await fetch(`/api/availability?${params}`);

    const result = await response.json();

    conversationState.quantity = quantity;
    conversationState.startDate = startDate;
    conversationState.endDate = endDate;
    conversationState.availability = result;

    if (!response.ok || result.available === false) {
      document.getElementById("confirmVisualBooking").hidden = true;
      updateBookingSummary(
        `Not available — ${result.availableQuantity || 0} available`
      );
      await loadStock();
      return;
    }

    conversationState.awaitingConfirmation = true;
    conversationState.step = "awaiting_confirmation";

    document.getElementById("confirmVisualBooking").hidden = false;

    updateBookingSummary("Available — waiting for confirmation");
    await loadStock();
  } catch (error) {
    console.error(error);
    updateBookingSummary("Availability check failed");
  }
}

async function confirmVisualBooking() {
  if (!conversationState.awaitingConfirmation) {
    return;
  }

  await confirmReservation();

  document.getElementById("confirmVisualBooking").hidden = true;
  updateBookingSummary(
    conversationState.step === "confirmed"
      ? "Confirmed"
      : "Booking failed"
  );
}

async function resetDemo() {
  try {
    const response =
      await fetch("/api/reset-demo", {
        method: "POST"
      });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.reason || "Reset failed");
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    resetConversationState();

    conversationState.reservationId = null;
    conversationState.month = null;

    visualSelectedEquipment = null;

    document.getElementById("visualBookingForm").hidden = true;
    document.getElementById("confirmVisualBooking").hidden = true;

    updateBookingSummary("Demo reset");

    const conversation =
      document.getElementById("conversation");

    conversation.innerHTML = `
      <div class="empty-state">
        <p>Your conversation will appear here.</p>
        <span>Press the button to start.</span>
      </div>
    `;

    voiceStatus.textContent = "Ready to start";

    await loadData();
  } catch (error) {
    console.error(error);
    alert("Failed to reset demo.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const resetButton =
    document.getElementById("resetDemoButton");

  const checkButton =
    document.getElementById("checkVisualAvailability");

  const confirmButton =
    document.getElementById("confirmVisualBooking");

  if (resetButton) {
    resetButton.addEventListener("click", resetDemo);
  }

  if (checkButton) {
    checkButton.addEventListener(
      "click",
      checkVisualAvailability
    );
  }

  if (confirmButton) {
    confirmButton.addEventListener(
      "click",
      confirmVisualBooking
    );
  }

  updateBookingSummary();
});
