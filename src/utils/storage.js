const STORAGE_KEY = "flash-sale-reservation";

export const saveReservation = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getReservation = () => {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  return JSON.parse(raw);
};

export const clearReservation = () => {
  localStorage.removeItem(STORAGE_KEY);
};
