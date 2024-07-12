import {
  ymlScraper,
  isUrlScraper,
  byUrlScraperDefn,
  anyScraper,
  isScriptScraper,
} from "./types";
import { git } from "./git";
import { lstat } from "fs/promises";

interface searchTypes {
  scene: {
    name: boolean;
    fragment: boolean;
    queryFragment: boolean;
    url: boolean;
  };
  performer: {
    name: boolean;
    fragment: boolean;
    url: boolean;
  };
  movie: {
    url: boolean;
  };
  gallery: {
    fragment: boolean;
    url: boolean;
  };
}

export interface scraperExport {
  name: string;
  sites: { name: string; url: string }[];
  searchTypes: searchTypes;
  requires: {
    cdp: boolean;
    python: boolean;
  };
  lastUpdate: Date;
}

const getSearchTypes = (scraper: ymlScraper): searchTypes => ({
  scene: {
    name: scraper.sceneByName !== undefined,
    fragment: scraper.sceneByFragment !== undefined,
    queryFragment: scraper.sceneByQueryFragment !== undefined,
    url: scraper.sceneByURL !== undefined,
  },
  performer: {
    name: scraper.performerByName !== undefined,
    fragment: scraper.performerByFragment !== undefined,
    url: scraper.performerByURL !== undefined,
  },
  movie: {
    url: scraper.movieByURL !== undefined,
  },
  gallery: {
    fragment: scraper.galleryByFragment !== undefined,
    url: scraper.galleryByURL !== undefined,
  },
});

function collectURLSites(scraper: ymlScraper): string[] {
  // collect URL sites
  const urlActions = [
    "sceneByURL",
    "performerByURL",
    "movieByURL",
    "galleryByURL",
  ];
  let urlSites: string[] = [];
  for (const action of urlActions) {
    const scrapers: byUrlScraperDefn[] = scraper[action];
    if (scrapers === undefined) continue;
    for (const scraper of scrapers) {
      if (isUrlScraper(scraper)) {
        urlSites = urlSites.concat(scraper.url);
      }
    }
  }
  // get hostname, remove duplicates
  urlSites = urlSites.map(
    (url) => new URL(url.startsWith("http") ? url : `https://${url}`).hostname,
  );
  urlSites = [...new Set(urlSites)].sort();
  return urlSites;
}

const checkScraperPython = (scraper: anyScraper): boolean =>
  isScriptScraper(scraper) &&
  scraper.script.some((script) => script.includes("python"));

function hasPython(scraper: ymlScraper): boolean {
  const actions = [
    "performerByName",
    "performerByFragment",
    "performerByURL",
    "sceneByName",
    "sceneByQueryFragment",
    "sceneByFragment",
    "sceneByURL",
    "movieByURL",
    "galleryByFragment",
    "galleryByURL",
  ];
  return actions.some((action) => {
    const scrapers = scraper[action];
    if (scrapers === undefined) return false;
    // check if is array
    return Array.isArray(scrapers)
      ? scrapers.some(checkScraperPython)
      : checkScraperPython(scrapers);
  });
}

const getRequires = (
  scraper: ymlScraper,
): { cdp: boolean; python: boolean } => ({
  cdp: scraper.driver?.useCDP ?? false,
  python: hasPython(scraper),
});

async function getLastUpdate(scraper: ymlScraper): Promise<Date | false> {
    // if script we have to take all files into account, or take the folder
    // check if scraper has a parent folder
    const filename = scraper.filename.replace(/^CommunityScrapers\\scrapers\\/, "")
    const folder = filename.split("\\").slice(0, -1).join("\\");
    const isFolder = await lstat(folder)
        .then((stat) => stat.isDirectory())
        .catch((err) => false)
    const chosenPath = isFolder ? folder : filename;
    const latestUpdate = await git.log({ file: chosenPath })
        .then(gitLog => gitLog?.latest)
    return latestUpdate ? new Date(latestUpdate.date) : false
}

// fix return type
export async function exportScraper(scraper: ymlScraper): Promise<any> {
  // collect URL sites
  const urlSites = collectURLSites(scraper);
  const searchTypes = getSearchTypes(scraper);
  const requires = getRequires(scraper);
  const lastUpdate = await getLastUpdate(scraper) ?? new Date(0)
  return {
    filename: scraper.filename,
    name: scraper.name,
    sites: urlSites,
    searchTypes: searchTypes,
    sceneUrl: requires,
    lastUpdate: lastUpdate
  };
}
