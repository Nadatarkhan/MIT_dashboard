document.addEventListener('DOMContentLoaded', function() {
    // Define the margins and dimensions for the graph
    const margin = { top: 20, right: 20, bottom: 30, left: 60 },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // Append the SVG canvas to the container
    const svg = d3.select(".visual1")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Parse the year / time
    const parseYear = d3.timeParse("%Y");

    // Set the ranges for the scales
    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    // Define the line
    const valueline = d3.line()
        .x(function(d) { return x(d.year); })
        .y(function(d) { return y(d.emission); });

    // Load and process the data
    d3.csv("data/emissions.csv").then(function(data) {
        // Convert string to number for emissions and parse years
        let parsedData = [];
        data.forEach(function(d, i) {
            let years = Object.keys(d).slice(11, 37); // From '2025' to '2050'
            years.forEach(function(year) {
                if(d[year]) { // Check if the value exists to avoid undefined entries
                    parsedData.push({
                        year: parseYear(year),
                        emission: +d[year],
                        strategy: i + 1 // Differentiate strategies by index
                    });
                }
            });
        });

        // Scale the range of the data
        x.domain(d3.extent(parsedData, function(d) { return d.year; }));
        y.domain([0, d3.max(parsedData, function(d) { return d.emission; })]);

        // Add the valueline path for each strategy
        data.forEach(function(_, i) {
            svg.append("path")
                .datum(parsedData.filter(function(d) { return d.strategy === i + 1; }))
                .attr("class", "line")
                .style("stroke", function(d) { return d3.schemeCategory10[i % 10]; })
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
});

