import { parse } from "yaml";
import { readFileSync, writeFileSync } from "fs";
import { ymlScraper } from "./types";
import { glob } from "glob";
import { z } from "zod";
import { scraperSchema } from "./zodType";
import { exportScraper, scraperExport } from "./scraper";

function parseFile(file: string): ymlScraper {
  const fileData = readFileSync(file, "utf8");
  // extract scrapes: comment
  let scrapes = fileData.match(/^# scrapes: (.*)/gm)?.[0];
  let scrapeList: string[] = [];
  if (scrapes) {
    scrapeList = scrapes
      .replace("# scrapes:", "")
      .split(",")
      .map((scrape) => scrape.trim())
  }
  const parsed: ymlScraper = parse(fileData) as unknown as ymlScraper;
  return {
    ...parsed,
    filename: file,
    scrapes: scrapeList,
  };
}
async function parseRepository(
  pathName: string = "CommunityScrapers/scrapers",
): Promise<ymlScraper[]> {
  const ymlFolderFiles = await glob(`${pathName}/**/*.yml`);
  const ymlFiles = await glob(`${pathName}/*.yml`);
  const allYmlFiles = [...new Set([...ymlFolderFiles, ...ymlFiles])]
  const scrapers: ymlScraper[] = [];
  allYmlFiles.forEach((file: string) => {
    const scraper = parseFile(file);
    scrapers.push(scraper);
  });
  return scrapers;
}
function validate(scraper: ymlScraper) {
  scraperSchema.parse(scraper);
  type validated = z.infer<typeof scraperSchema>;
  return scraper as validated;
}

// get all scrapers
const mdScrapers: scraperExport[] = [];
parseRepository()
  .then(async (scrapers) => {
    for (const scraper of scrapers) {
      validate(scraper);
      const parsed: scraperExport = await exportScraper(scraper);
      mdScrapers.push(parsed);
    }
  })
  .catch((err) => console.error(err))
  .then(() => {
    writeFileSync("site/scrapers.json", JSON.stringify(mdScrapers, null, 2));
    console.log("VALIDATED");
  });
