interface MockResponse<T> {
  data: T;
}

export function createMockStore<T extends { id?: number }>(storageKey: string) {
  function getLocalData(): T[] {
    try {
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function saveLocalData(data: T[]) {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }

  function nextId(data: T[]): number {
    return data.length > 0 ? Math.max(...data.map((item) => item.id ?? 0)) + 1 : 1;
  }

  function mockResponse<U>(data: U): MockResponse<U> {
    return { data };
  }

  return { getLocalData, saveLocalData, nextId, mockResponse };
}
