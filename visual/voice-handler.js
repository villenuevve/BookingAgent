window.handleBookingVoice = function(text) {
  const value = text.toLowerCase();

  let equipment = null;

  if (value.includes("camera")) {
    equipment = "Camera A";
  } else if (value.includes("tripod")) {
    equipment = "Tripod B";
  } else if (
    value.includes("microphone") ||
    value.includes("mic")
  ) {
    equipment = "Microphone C";
  }

  const dates = window.parseDates(text);

  return {
    equipment,
    dates
  };
};
