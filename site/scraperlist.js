const tableButtons = document.querySelectorAll("#scraper-table thead th");

const emojiBool = (value) => (value ? "✅" : "❌");
const anyTrue = (obj) => Object.values(obj).some((v) => v);
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
  scrapers.forEach((scp) => {
    const sType = scp.searchTypes;
    const row = table.insertRow();
    const scraperName = row.insertCell(0);
    scraperName.textContent = scp.name;
    // supported sites
    const scraperSites = row.insertCell(1);
    scraperSites.textContent = scp.sites.join(", \n");
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
    scraperLastUpdate.textContent = new Date(scp.lastUpdate).toDateString();
  });
};

const resetButtons = (e) => {
  [...tableButtons].forEach((th) => {
    if (th !== e.target) {
      delete th.dataset.direction;
    }
  });
};

function getScrapers() {
  fetch("scrapers.json")
    .then((response) => response.json())
    .then((data) => {
      data = data.sort((a, b) => (a.name > b.name ? 1 : -1));
      setTable(data);
      // set up listeners
      [...tableButtons].forEach((th) =>
        th.addEventListener("click", (e) => {
          resetButtons(e);
          const direction = th.dataset.direction === "asc" ? "desc" : "asc";
          sortData(data, th.id, direction);
          th.dataset.direction = direction;
        }),
      );
    });
}

const sortData = (data, param, direction = "asc") => {
  const table = document.getElementById("scraper-list");
  table.innerHTML = "";
  const sortedData =
    direction == "asc"
      ? data.sort((a, b) => (a[param] > b[param] ? 1 : -1))
      : data.sort((a, b) => (a[param] < b[param] ? 1 : -1));
  setTable(sortedData);
};

getScrapers();
