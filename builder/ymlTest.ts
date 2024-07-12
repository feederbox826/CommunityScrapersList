import { parse } from "yaml";
import { readFileSync } from "fs";
import { ymlScraper } from "./types";
import { glob } from "glob";
import { z } from "zod";
import { scraperSchema } from "./zodType";
import { exportScraper } from "./scraper";

function parseFile(file: string): ymlScraper {
  const fileData = readFileSync(file, "utf8");
  const parsed: ymlScraper = parse(fileData) as unknown as ymlScraper;
  return {
    ...parsed,
    filename: file
  }
}
async function parseRepository(
  pathName: string = "CommunityScrapers/scrapers",
): Promise<ymlScraper[]> {
  const ymlFolderFiles = await glob(`${pathName}/**/*.yml`);
  const ymlFiles = await glob(`${pathName}/*.yml`);
  const allYmlFiles = ymlFolderFiles.concat(ymlFiles);
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
parseRepository()
  .then(async (scrapers) => {
    for (const scraper of scrapers) {
      //console.log(scraper.name);
      validate(scraper);
      // check that debug is not enabled
      const parsed = await exportScraper(scraper);
      console.log(parsed);
    }
  })
  .catch((err) => console.error(err))
  .then(() => console.log("VALIDATED"));
