import type { CommitParams, CommitParamsAddition, CommitParamsDeletion } from "~/utils/common/types";

export const useStaging = () => {
  const inStaging = useState("in-staging", () => false);
  const stagingStore = useState<Required<CommitParams>>("staging-store", () => ({
    additions: [],
    deletions: []
  }));

  const onItemEdit = (addition: CommitParamsAddition) => {
    const additions = stagingStore.value.additions;
    const foundIndex = additions.findIndex(i => i.path === addition.path);
    if (foundIndex) {
      additions.splice(foundIndex, 1, addition);
    } else {
      additions.push(addition);
    }
  };

  const onItemsDelete = (deletions: CommitParamsDeletion[]) => {
    deletions.forEach((deletion) => {
      const deletions = stagingStore.value.deletions;
      const foundIndex = deletions.findIndex(i => i.path === deletion.path);
      if (foundIndex) {
        deletions.splice(foundIndex, 1);
      }
    });
  };

  const getResult = () => {

  };

  return {
    inStaging,
    stagingStore,
    onItemEdit,
    onItemsDelete,
    getResult
  };
};
