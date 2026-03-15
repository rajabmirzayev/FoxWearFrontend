const storage = {
  setItem: (key: string, value: string, remember: boolean = false) => {
    if (remember) {
      localStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
    }
  },
  getItem: (key: string) => {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
  clear: () => {
    localStorage.clear();
    sessionStorage.clear();
  }
};

export default storage;
