export const fetchByApi = async (url: string) => {
  // fetch api url
  const res = await fetch(url);
  return res.json();
};
