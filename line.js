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

    // Map the data to an array of objects for each year
    let emissionsData = data.map(d => {
        return years.map(year => {
            return {
                year: year,
                emission: +d[year.getFullYear().toString()]
            };
        });
    }).flat();

    // Scale the range of the data
    x.domain(d3.extent(years));
    y.domain([0, d3.max(emissionsData, d => d.emission)]);

    // Draw the line for each set of emissions data
    data.forEach((d, i) => {
        svg.append("path")
            .datum(emissionsData.filter(dd => dd.year.getFullYear() === years[i].getFullYear()))
            .attr("fill", "none")
            .attr("stroke", "steelblue")
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
