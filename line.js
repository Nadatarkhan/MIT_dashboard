document.addEventListener('DOMContentLoaded', function() {
    // Parse the year / time
    const parseYear = d3.timeParse("%Y");

    // Set the dimensions of the canvas / graph
    const margin = { top: 30, right: 20, bottom: 30, left: 50 },
        width = 600 - margin.left - margin.right, // Adjust the width if needed
        height = 270 - margin.top - margin.bottom; // Adjust the height if needed

    // Set the ranges
    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    // Define the line
    const valueline = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.emission));

    // Adds the SVG canvas
    const svg = d3.select("#lineChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Get the data
    d3.csv("data/example_data_wide.csv").then(function(data) {
        // Extract the year columns from the data header
        const yearColumns = data.columns.slice(11); // Assuming emission years start at the 12th column
        const years = yearColumns.map(col => parseYear(col)); // Parse each year string into a Date object

        // Map the data to create a data structure suitable for plotting
        let plotData = data.map(strategy => {
            return yearColumns.map(column => ({
                year: parseYear(column),
                emission: +strategy[column] // Convert emission values to numbers
            }));
        });

        // Flatten the array of arrays into a single array for plotting
        plotData = plotData.flat();

        // Scale the range of the data
        x.domain(d3.extent(years));
        y.domain([0, d3.max(plotData, d => d.emission)]);

        // Add the X Axis
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // Add the Y Axis
        svg.append("g")
            .call(d3.axisLeft(y));

        // Loop through each strategy to plot
        data.forEach((strategy, index) => {
            svg.append("path")
                .datum(plotData.filter(d => +strategy['2025'] === d.emission))
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 2)
                .attr("d", valueline);
        });
    }).catch(error => {
        console.error("Error processing CSV data: ", error);
    });
});
