import { useState } from "#app";
import { GithubTokenKey } from "~/utils/constants";

export const useGithubToken = () => useState<string>(GithubTokenKey, () => "");
export const useCorrectCommitId = () => useState<boolean>("can-upload", () => false);
export const useUnsavedContent = () => useState<boolean>("unsaved-content", () => false);
