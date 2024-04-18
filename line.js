

// Set the dimensions of the canvas / graph
const margin = { top: 30, right: 20, bottom: 70, left: 50 },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// Parse the year / time
const parseYear = d3.timeParse("%Y");

// Set the ranges
const x = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

// Define the line
const valueline = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.emission));

// Adds the svg canvas
const svg = d3.select("#lineChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Get the data
d3.csv("data/example_data_wide.csv").then(function(data) {
    // Convert years from columns to an array of data
    let dataset = [];
    data.forEach(function(d, i) {
        Object.keys(d).forEach(function(key) {
            if (key.includes("Emissions")) {
                let year = parseYear(key.split("Emissions ")[1]);
                dataset.push({
                    year: year,
                    emission: +d[key],
                    strategy: "Strategy " + (i + 1) // Assuming each line is a different strategy
                });
            }
        });
    });

    // Scale the range of the data
    x.domain(d3.extent(dataset, d => d.year));
    y.domain([0, d3.max(dataset, d => d.emission)]);

    // Group the data: I assume each group represents a strategy
    const sumstat = d3.group(dataset, d => d.strategy);

    // Color palette: one color for each group
    const res = sumstat.keys(); // list of group names
    const color = d3.scaleOrdinal()
        .domain(res)
        .range(d3.schemeCategory10);

    // Draw the line for each strategy
    sumstat.forEach(function(value, key) {
        svg.append("path")
            .datum(value)
            .attr("fill", "none")
            .attr("stroke", color(key))
            .attr("stroke-width", 1.5)
            .attr("d", valueline);
    });

    // Add the X Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(d3.timeYear.every(1)));

    // Add the Y Axis
    svg.append("g")
        .call(d3.axisLeft(y));
});
