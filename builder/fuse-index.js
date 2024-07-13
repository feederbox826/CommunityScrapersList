const Fuse = require("fuse.js")
const fs = require("fs")

const data = require("../site/scrapers.json")
const keys = [{
    name: 'filename',
    weight: 1
}, {
    name: "name",
    weight: 20
}, {
    name: 'sites',
    weight: 2
}, {
    name: 'scrapes',
    weight: 10
}]
const fuseIndex = Fuse.createIndex(keys, data)

fs.writeFileSync("site/fuse-index.json", JSON.stringify(fuseIndex.toJSON()))