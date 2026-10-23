const CUTOVER_MONTH = 6;

export function getAcademicYear(dateInput) {
  const date = new Date(dateInput);

  if (isNaN(date.getTime())) {
    console.warn("getAcademicYear received an invalid date, defaulting to today:", dateInput);
    return getAcademicYear(new Date());
  }

  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return month >= CUTOVER_MONTH
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
}

export function getAcademicYearOptions(range = 5) {
  const current = getAcademicYear(new Date());
  const startYear = parseInt(current.split("-")[0], 10);
  const years = [];

  for (let i = 0; i < range; i++) {
    years.push(`${startYear - i}-${startYear - i + 1}`);
  }

  return years;
}