// Set the dimensions of the canvas / graph
const margin = { top: 30, right: 20, bottom: 70, left: 70 },
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
    // Extract the years from the first row (epw_year)
    const years = data.columns.slice(1).map(year => parseYear(year));

    // Scale the range of the data
    x.domain(d3.extent(years));
    y.domain([0, d3.max(data, row => d3.max(years, year => +row[year.getFullYear().toString()]))]);

    // Draw the line for each strategy
    data.forEach((row, index) => {
        const emissions = years.map(year => {
            return {
                year: year,
                emission: +row[year.getFullYear().toString()]
            };
        });

        svg.append("path")
            .datum(emissions)
            .attr("fill", "none")
            .attr("stroke", d3.schemeCategory10[index % 10]) // Use color scheme to differentiate lines
            .attr("stroke-width", 1.5)
            .attr("d", valueline);
    });

    // Add the X Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add the Y Axis
    svg.append("g")
        .call(d3.axisLeft(y));
});

/*Debug
 */
// Inside your line.js, add console logs to debug:
d3.csv("data/example_data_wide.csv").then(function(data) {
    console.log(data);  // Check what the data looks like
    const years = data.columns.slice(1).map(year => parseYear(year));
    console.log(years);  // Ensure years are parsed correctly

    // After setting domains:
    console.log(x.domain(), y.domain());  // Check the computed domains

    // Before appending paths:
    console.log(emissions);  // Check the emissions data structure
}).catch(function(error) {
    console.error("Error loading or parsing data:", error);
});

