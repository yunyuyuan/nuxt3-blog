let handle: number;

export const useLoading = () => {
  const loadingState = useState<number>("loading", () => 0);

  const finish = () => {
    if (handle) {
      clearInterval(handle);
    }
    loadingState.value = 0;
  };

  const start = () => {
    finish();
    handle = setInterval(() => {
      loadingState.value += 1;
      if (loadingState.value === 100) {
        clearInterval(handle);
      }
    }, 30) as unknown as number;
  };

  return {
    loadingState,
    start,
    finish
  };
};
