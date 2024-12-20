function getLocalDate() {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const date = new Date();
  const options = {
    timeZone: userTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  return new Date(date.toLocaleString("en-US", options));
}

export { getLocalDate };
