import Fuse from "https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.basic.min.mjs";
import ago from "./ago.js";
// constant elements
const searchInput = document.querySelector("#search");

// helper functions
const emojiBool = (value) => (value ? "✅" : "❌");
const anyTrue = (obj) => Object.values(obj).some((v) => v);
// https://stackoverflow.com/a/54265129
function debounce(f, interval) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    return new Promise((resolve) => {
      timer = setTimeout(() => resolve(f(...args)), interval);
    });
  };
}
// tooltip helper
const createToolTip = (target, stypeObj) => {
  // check if any of the values are true
  const typeTrue = anyTrue(stypeObj);
  // if false, don't add tooltip
  if (!typeTrue) return (target.textContent = emojiBool(false));
  // generate tooltip text dynamically
  let tooltipArray = [];
  // add all applicable tooltips
  const hasName = stypeObj.name;
  if (hasName !== undefined) tooltipArray.push(`Name: ${emojiBool(hasName)}`);
  const hasURL = stypeObj.url;
  if (hasURL !== undefined) tooltipArray.push(`URL: ${emojiBool(hasURL)}`);
  const hasFragment = stypeObj.fragment;
  if (hasFragment !== undefined)
    tooltipArray.push(`Fragment: ${emojiBool(hasFragment)}`);
  const hasQueryFragment = stypeObj.queryFragment;
  if (hasQueryFragment !== undefined)
    tooltipArray.push(`QueryFragment: ${emojiBool(hasQueryFragment)}`);
  // create tooltip text
  const tooltipElement = document.createElement("span");
  tooltipElement.textContent = tooltipArray.join(" | ");
  target.textContent = emojiBool(typeTrue);
  target.classList.add("tooltip");
  target.appendChild(tooltipElement);
};

const siteDetails = (sites, expand = false) => {
  const preContainer = document.createElement("pre");
  if (sites.length == 1) preContainer.textContent = sites[0];
  else {
    const summary = document.createElement("summary");
    summary.textContent = sites[0];
    const p = document.createElement("p");
    p.textContent = sites.slice(1).join("\n");
    const detailsBox = document.createElement("details");
    detailsBox.appendChild(p);
    detailsBox.appendChild(summary);
    preContainer.appendChild(detailsBox);
    if (expand) detailsBox.open = true;
  }
  return preContainer;
};

const setTable = (scrapers, search = false) => {
  const table = document.getElementById("scraper-list");
  if (table.rows.length) table.innerHTML = "";
  scrapers.forEach((scp, idx) => {
    const sType = scp.searchTypes;
    const row = table.insertRow();
    // name
    row.insertCell(0).textContent = scp.name;
    // supported sites
    row.insertCell(1).appendChild(siteDetails(scp.sites, search && idx <= 5));
    // scene scraping
    createToolTip(row.insertCell(2), sType.scene);
    // gallery scraping
    createToolTip(row.insertCell(3), sType.gallery);
    // movie scraping
    row.insertCell(4).textContent = emojiBool(sType.movie.url);
    // performer scraping
    createToolTip(row.insertCell(5), sType.performer);
    // requires
    row.insertCell(6).textContent = emojiBool(scp.requires.python);
    row.insertCell(7).textContent = emojiBool(scp.requires.cdp);
    row.insertCell(8).textContent = ago(new Date(scp.lastUpdate));
  });
};

const keys = [
  {
    name: "filename",
    weight: 2,
  },
  {
    name: "name",
    weight: 20,
  },
  {
    name: "sites",
    weight: 2,
  },
  {
    name: "scrapes",
    weight: 10,
  },
  {
    name: "hosts",
    weight: 10,
  },
];

// fuse config
const fuseConfig = {
  keys,
  threshold: 0.4,
  shouldSort: true,
  includeScore: true, // debugging
  minMatchCharLength: 3,
};

// init fuse
let fuse;

// fuse search
async function search(event) {
  const searchValue = event.target.value;
  if (searchValue.length < 3) return;
  const results = fuse.search(searchValue, {
    limit: 20,
  });
  console.debug(searchValue, results);
  const filterTable = results.map((result) => result.item);
  setTable(filterTable, true);
}

// parse scrapers.json
const rawScraperList = await fetch("scrapers.json").then((response) =>
  response.json(),
);
setTable(rawScraperList);
const fuseIndex = await fetch("fuse-index.json")
  .then((response) => response.json())
  .then((data) => Fuse.parseIndex(data));
fuse = new Fuse(rawScraperList, fuseConfig, fuseIndex);
searchInput.addEventListener("input", debounce(search, 300));
