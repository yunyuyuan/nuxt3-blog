/**
 * 因为hydration无法正确处理`useRoute().query`的初始化，所以不能使用`computed(() => useRoute().query.xxx)`这种形式来获取动态的query值
 * @param query query名
 * @param parse parse函数
 * @returns 默认值是`parse(undefined)`
 */
export const useRouteQuery = <T = any>(query: string, parse: ((_?: string) => T) = (q) => (q as T)) => {
  const result = ref<T>(parse());
  const route = useRoute();

  onMounted(() => {
    result.value = parse(route.query[query] as string);
  });
  
  watch(() => route.query[query], (newQuery) => {
    result.value = parse(newQuery as string);
  });

  return result;
};