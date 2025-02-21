export const useUnmount = () => {
  const destroyFns: CallableFunction[] = [];
  
  onBeforeUnmount(() => {
    destroyFns.forEach(fn => fn());
  });
  return destroyFns;
};