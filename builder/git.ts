import { simpleGit, SimpleGitOptions } from "simple-git";

const options: Partial<SimpleGitOptions> = {
  baseDir: "CommunityScrapers/scrapers",
};
export const git = simpleGit(options);
