// constant elements
const tableButtons = document.querySelectorAll("#scraper-table thead th");
const searchInput = document.querySelector('#search');

// helper functions
const emojiBool = (value) => (value ? "✅" : "❌");
const anyTrue = (obj) => Object.values(obj).some((v) => v);
// https://stackoverflow.com/a/54265129
function debounce(f, interval) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    return new Promise((resolve) => {
      timer = setTimeout(
        () => resolve(f(...args)),
        interval,
      );
    });
  };
}
// tooltip helper
const createToolTip = (target, stypeObj) => {
  const typeTrue = anyTrue(stypeObj);
  // if false, don't add tooltip
  if (!typeTrue) return (target.textContent = emojiBool(false));
  // generate tooltip text dynamically
  let tooltipArray = [];
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
  const tooltip = tooltipArray.join(" | ");
  const tooltipElement = document.createElement("span");
  target.textContent = emojiBool(typeTrue);
  tooltipElement.textContent = tooltip;
  target.classList.add("tooltip");
  target.appendChild(tooltipElement);
};

const setTable = (scrapers) => {
  const table = document.getElementById("scraper-list");
  if (table.rows.length) table.innerHTML = "";
  let isSearch = table.rows.length <= 20
  scrapers.forEach((scp, idx) => {
    const sType = scp.searchTypes;
    const row = table.insertRow();
    const scraperName = row.insertCell(0);
    scraperName.textContent = scp.name;
    // supported sites
    const scraperSites = row.insertCell(1);
    const preContainer = document.createElement("pre");
    if (scp.sites.length == 1) preContainer.textContent = scp.sites[0];
    else {
      const detailsBox = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = scp.sites[0];
      detailsBox.appendChild(summary);
      const p = document.createElement("p");
      p.textContent = scp.sites.slice(1).join("\n");
      detailsBox.appendChild(p);
      preContainer.appendChild(detailsBox);
      // auto-open details of first 5 search results
      if (isSearch && idx <=5) detailsBox.open = true;
    }
    scraperSites.appendChild(preContainer);
    // scene scraping
    const scraperScene = row.insertCell(2);
    createToolTip(scraperScene, sType.scene);
    // gallery scraping
    const scraperGallery = row.insertCell(3);
    createToolTip(scraperGallery, sType.gallery);
    // movie scraping
    const scraperMovie = row.insertCell(4);
    scraperMovie.textContent = emojiBool(sType.movie.url);
    // performer scraping
    const scraperPerformer = row.insertCell(5);
    createToolTip(scraperPerformer, sType.performer);
    // requires
    const scraperPython = row.insertCell(6);
    scraperPython.textContent = emojiBool(scp.requires.python);
    const scraperCDP = row.insertCell(7);
    scraperCDP.textContent = emojiBool(scp.requires.cdp);
    // last update
    const scraperLastUpdate = row.insertCell(8);
    scraperLastUpdate.textContent = ago(new Date(scp.lastUpdate));
  });
};

// fuse config
const fuseConfig = {
  keys: [{
    name: 'filename',
    weight: 2
  }, {
    name: "name",
    weight: 20
  }, {
    name: 'sites',
    weight: 2
  }, {
    name: 'scrapes',
    weight: 10
  }],
  threshold: 0.4,
  includeScore: true, // debugging
  minMatchCharLength: 3
};

// parse scrapers.json
// init fuse
let fuse;
let rawScraperList = [];

async function getScrapers() {
  const rawScraperList = await fetch("scrapers.json")
    .then((response) => response.json())
  setTable(rawScraperList)
  const fuseIndex = await fetch("fuse-index.json")
    .then((response) => response.json())
    .then((data) => Fuse.parseIndex(data));
  fuse = new Fuse(rawScraperList, fuseConfig, fuseIndex);
  searchInput.addEventListener('input', debounce(search, 300));
}

getScrapers();

async function search(event) {
  const searchValue = event.target.value;
  if (searchValue.length < 3) return;
  const results = fuse.search(searchValue, {
    limit: 20
  });
  console.debug(results)
  const filterTable = results.map(result => result.item)
  setTable(filterTable)
}
