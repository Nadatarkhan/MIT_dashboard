document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Define the margins and dimensions for the graph
        const margin = { top: 20, right: 30, bottom: 50, left: 60 },
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        // Append the SVG canvas to the container
        const svg = d3.select(container)
            .append("svg")
            .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        let selectedVariable = "emission"; // Default to 'emission'
        let gridFilter = "all"; // Default grid filter

        // Load data and then apply initial filters and draw plot
        d3.csv("data/example_data.csv").then(function(data) {
            window.emissionsData = data.map(d => ({
                year: new Date(d.epw_year),
                emission: +d.Emissions,
                cost: +d.Cost,
                scenario: d.Scenario,
                grid: d.grid,
                retrofit: d.retrofit,
                schedules: d.schedules,
                lab: d.lab,
                district: d.district,
                nuclear: d.nuclear,
                deepgeo: d.deepgeo,
                renovate: d.renovate,
                ess: d.ess,
                ccs: d.ccs
            }));

            updatePlot(selectedVariable);

            document.querySelectorAll('.button-container button').forEach(button => {
                button.addEventListener('click', function() {
                    updatePlot(this.textContent.trim().toLowerCase() === "emissions" ? "emission" : "cost");
                });
            });

            document.querySelectorAll('input[name="gridFilter"]').forEach((input) => {
                input.addEventListener('change', function() {
                    gridFilter = this.value;
                    updatePlot(selectedVariable);
                });
            });

        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });

        // Update the plot with new variable and filters
        window.updatePlot = function(variable) {
            selectedVariable = variable;

            // Apply all current filters to the data
            const filteredData = window.emissionsData.filter(d => {
                return Object.keys(window.currentFilters).every(field => {
                    const filterValue = window.currentFilters[field];
                    return filterValue === null || d[field] === filterValue;
                }) && (gridFilter === "all" ||
                    (gridFilter === "decarbonized" ? d.grid === "decarbonization" : d.grid === "no decarbonization"));
            });

            // Set the scales based on the filtered data
            x.domain(d3.extent(filteredData, d => d.year));
            y.domain([0, d3.max(filteredData, d => d[selectedVariable])]);

            // Remove the old axes
            svg.selectAll(".x-axis").remove();
            svg.selectAll(".y-axis").remove();

            // Draw the new axes
            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).tickPadding(15).tickSizeInner(-height))
                .selectAll("text")
                .style("font-size", "18px");

            svg.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(y).ticks(6).tickPadding(15).tickSizeInner(-width))
                .selectAll("text")
                .style("font-size", "18px");

            // Style for the grid lines
            svg.selectAll(".x-axis line, .y-axis line")
                .style("stroke", "#ddd");

            // Remove the old line paths
            svg.selectAll(".line").remove();

            // Draw the lines
            const color = d3.scaleOrdinal(d3.schemeCategory10);
            const line = d3.line()
                .x(d => x(d.year))
                .y(d => y(d[selectedVariable]));

            // Group the data by scenario and draw lines
            const scenarioGroups = d3.groups(filteredData, d => d.scenario);
            scenarioGroups.forEach(([key, values]) => {
                svg.append("path")
                    .datum(values)
                    .attr("class", "line")
                    .attr("fill", "none")
                    .attr("stroke", color(key))
                    .attr("stroke-width", 4)
                    .attr("d", line);
            });
        };
    } else {
        console.error("Container not found");
    }
});
