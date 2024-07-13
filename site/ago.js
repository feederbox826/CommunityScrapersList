// s-ago https://github.com/sebastiansandqvist/s-ago
// LICENCE MIT by Sebastian Sandqvist

function formatDate(diff, divisor, unit, past) {
    var val = Math.round(Math.abs(diff) / divisor);
    return val <= 1 ? past : val + ' ' + unit + 's ago';
}
var units = [
    { max: 2760000, value: 60000, name: 'minute', past: 'a minute ago' },
    { max: 72000000, value: 3600000, name: 'hour', past: 'an hour ago' },
    { max: 518400000, value: 86400000, name: 'day', past: 'yesterday' },
    { max: 2419200000, value: 604800000, name: 'week', past: 'last week' },
    { max: 28512000000, value: 2592000000, name: 'month', past: 'last month' } // max: 11 months
];
function ago(date, max) {
    var diff = Date.now() - date.getTime();
    for (var i = 0; i < units.length; i++) {
        if (Math.abs(diff) < units[i].max || (max && units[i].name === max)) {
            return formatDate(diff, units[i].value, units[i].name, units[i].past);
        }
    }
    return formatDate(diff, 31536000000, 'year', 'last year');
};