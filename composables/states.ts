import { useState } from "#app";
import { GithubTokenKey } from "~/utils/constants";

export const useGithubToken = () => useState<string>(GithubTokenKey, () => "");
export const useCorrectSha = () => useState<string>("correct-sha", () => "");
export const useUnsavedContent = () => useState<boolean>("unsaved-content", () => false);
