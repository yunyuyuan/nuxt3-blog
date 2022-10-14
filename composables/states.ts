import { useState } from "#app";
import { GithubTokenKey } from "~/utils/constants";

export const useFirstLoad = () => useState("first-loaded", () => true);
export const useGithubToken = () => useState(GithubTokenKey, () => "");
export const useCorrectSha = () => useState("correct-sha", () => "");
export const useUnsavedContent = () => useState("unsaved-content", () => false);
