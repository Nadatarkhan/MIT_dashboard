let globalEmissionsData; // Global variable to store the initial data for reuse

document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Define the margins and dimensions for the graph
        const margin = { top: 20, right: 30, bottom: 30, left: 50 },
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        // Append the SVG canvas to the container
        const svg = d3.select(container)
            .append("svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Define the scales
        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);

        // Define the axes
        const xAxis = svg.append("g")
            .attr("transform", `translate(0,${height})`);
        const yAxis = svg.append("g");

        // Load and process the data
        d3.csv("data/example_data.csv").then(function(data) {
            globalEmissionsData = data.map(d => ({
                year: d.epw_year, // Assuming the year is in a format D3 can parse
                emission: +d.Emissions,
                cost: +d.Cost,
                scenario: d.Scenario
            }));

            // Initial plot
            updatePlot("Emissions", globalEmissionsData); // Use "Emissions" as default

        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });

        function updatePlot(variable, newData) {
            // Assume emissionsData is already filtered and mapped
            let emissionsData = newData || globalEmissionsData;

            // Update the domains of the scales based on the new data
            x.domain(d3.extent(emissionsData, d => d.year));
            y.domain([0, d3.max(emissionsData, d => d[variable])]);

            // Update the axes with the new scale
            xAxis.call(d3.axisBottom(x));
            yAxis.call(d3.axisLeft(y));

            // Update the line generator
            const line = d3.line()
                .x(d => x(d.year))
                .y(d => y(d[variable]));

            // Bind the data
            const paths = svg.selectAll(".line")
                .data([emissionsData]); // Bind a new array of data

            // Enter + update
            paths.enter().append("path")
                .attr("class", "line")
                .merge(paths)
                .attr("d", line)
                .attr("fill", "none")
                .attr("stroke", "steelblue") // Change as needed
                .attr("stroke-width", 1.5);

            // Exit
            paths.exit().remove();
        }

        // Expose the updatePlot function to the global scope
        window.updatePlot = updatePlot;
    } else {
        console.error("Container not found");
    }
});
