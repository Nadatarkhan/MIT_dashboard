document.addEventListener('DOMContentLoaded', function() {
    // Get the size of the container for the chart
    const container = document.querySelector('.visual1');
    const containerWidth = container.clientWidth; // Width of the container
    const containerHeight = container.clientHeight; // Height of the container

    // Define the margins and graph area dimensions
    const margin = { top: 20, right: 20, bottom: 70, left: 50 },
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;

    // Create the SVG element inside the container
    const svg = d3.select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse the year / time
    const parseYear = d3.timeParse("%Y");

    // Set the ranges for the scales
    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    // Define the line
    const valueline = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.emission));

    // Load and process the data
    d3.csv("data/example_data_wide.csv").then(function(data) {
        // The years are from the second row (index 1) to the row before 'Innovation'
        const yearColumns = data.columns.slice(11, 11 + (2050 - 2025 + 1)); // Adjust as necessary based on actual CSV columns

        // Prepare the data by mapping it to the correct format for the line chart
        const emissionsData = data.map(strategy => {
            return yearColumns.map(column => {
                const year = parseYear(column);
                const emission = +strategy[column];
                return { year, emission };
            });
        });

        // Find the maximum emission to set the domain for the y-axis
        const maxEmission = d3.max(emissionsData.flat(), d => d.emission);
        y.domain([0, maxEmission]);

        // Add the x-axis
        x.domain(d3.extent(yearColumns, d => parseYear(d)));
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(d3.timeYear.every(1)));

        // Add the y-axis
        svg.append("g").call(d3.axisLeft(y));

        // Draw the lines
        emissionsData.forEach((dataset, i) => {
            svg.append("path")
                .datum(dataset)
                .attr("fill", "none")
                .attr("stroke", d3.schemeCategory10[i % 10])
                .attr("stroke-width", 1.5)
                .attr("d", valueline);
        });
    }).catch(error => {
        console.error("Error loading or processing data:", error);
    });
});
