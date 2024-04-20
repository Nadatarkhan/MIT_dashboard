document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Define the margins and dimensions for the graph
        const margin = {top: 20, right: 30, bottom: 30, left: 60},
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
            // Debugging: log raw data
            console.log("Raw data:", data);

            // Remove the non-year columns from the data array
            const yearColumns = data.columns.slice(12); // Assuming year columns start at index 12
            console.log("Year columns:", yearColumns);

            // Process the data to extract emission values for each year
            let emissionsData = [];
            data.forEach(function(d) {
                yearColumns.forEach(function(year) {
                    emissionsData.push({
                        year: d3.timeParse("%Y")(year),
                        emission: +d[year]
                    });
                });
            });

            // Debugging: log processed emissions data
            console.log("Emissions data:", emissionsData);

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
            data.forEach((d, i) => {
                svg.append("path")
                    .datum(emissionsData.filter(e => e.scenario === `Scenario ${i+1}`))
                    .attr("fill", "none")
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", 1.5)
                    .attr("d", valueline);
            });

        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });
    } else {
        console.error("Container not found");
    }
});

