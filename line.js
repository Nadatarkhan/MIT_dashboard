document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Define the margins and dimensions for the graph
    const margin = { top: 20, right: 30, bottom: 30, left: 60 },
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;

    // Append the SVG canvas to the container
    const svg = d3.select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define the scales and the line
    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);
    const valueline = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.emission));

    // Load and process the data
    d3.csv("data/example_data_wide.csv").then(function(data) {
        // Assuming the 'Emissions' columns are named with just the year (e.g., "2025", "2026", ...)
        const yearColumns = data.columns.slice(11).filter(col => col.includes("Emissions")); // Adjust if the indices are different
        const parseYear = d3.timeParse("%Y");

        // Process the data to extract emission values for each year
        let emissionsData = data.map(row => {
            return yearColumns.map(column => {
                const year = column.split("Emissions")[1].trim(); // Split the header to get the year part
                return {
                    year: parseYear(year),
                    emission: +row[column] // Convert string to number
                };
            });
        }).flat(); // Flatten the array of arrays into a single array

        // Set the domain for the scales
        x.domain(d3.extent(emissionsData, d => d.year));
        y.domain([0, d3.max(emissionsData, d => d.emission)]);

        // Add the X Axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        // Add the Y Axis
        svg.append("g").call(d3.axisLeft(y));

        // Draw the line for each strategy
        data.forEach((row, index) => {
            const strategyEmissions = yearColumns.map(column => {
                const year = column.split("Emissions")[1].trim(); // Split the header to get the year part
                return {
                    year: parseYear(year),
                    emission: +row[column]
                };
            });

            svg.append("path")
                .data([strategyEmissions])
                .attr("class", "line")
                .style("stroke", d3.schemeCategory10[index % 10]) // Use color scheme to differentiate lines
                .attr("d", valueline);
        });
    }).catch(error => {
        console.error("Error loading or processing data:", error);
    });
});
