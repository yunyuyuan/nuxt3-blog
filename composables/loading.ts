let handle: number;

export const useLoadingState = () => useState<number>("loading", () => 0);

export const useLoading = () => {
  const loadingState = useLoadingState();
  const finish = (addClass = true) => {
    if (handle) {
      clearInterval(handle);
    }
    loadingState.value = 0;
    if (addClass) {
      setTimeout(() => {
        document.documentElement.classList.add("smooth-scroll");
      }, 500);
    }
  };

  const start = () => {
    document.documentElement.classList.remove("smooth-scroll");
    finish(false);
    handle = setInterval(() => {
      loadingState.value += 1;
      if (loadingState.value === 100) {
        clearInterval(handle);
      }
    }, 30) as unknown as number;
  };

  return {
    start,
    finish
  };
};
