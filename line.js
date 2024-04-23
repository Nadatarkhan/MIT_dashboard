document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Define the margins and dimensions for the graph
        const margin = { top: 20, right: 30, bottom: 50, left: 60 }, // Adjusted for label space
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
        let emissionsData;

        d3.csv("data/example_data.csv").then(function(data) {
            emissionsData = data.map(d => ({
                year: new Date(d.epw_year),
                emission: +d.Emissions,
                cost: +d.Cost,
                scenario: d.Scenario,
                grid: d.grid
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

        function updatePlot(variable) {
            selectedVariable = variable;

            const filteredData = emissionsData.filter(d => {
                if (gridFilter === "all") return true;
                return gridFilter === "decarbonized" ? d.grid === "decarbonization" : d.grid === "no decarbonization";
            });

            x.domain(d3.extent(filteredData, d => d.year));
            y.domain([0, d3.max(filteredData, d => d[selectedVariable])]);

            // Add X axis label
            svg.selectAll(".x-axis-label").remove(); // Remove old label if present
            svg.append("text")
                .attr("class", "x-axis-label")
                .attr("text-anchor", "end")
                .attr("x", width / 2 + 40)
                .attr("y", height + 40)
                .text("Year");

            // Add Y axis label
            svg.selectAll(".y-axis-label").remove(); // Remove old label if present
            svg.append("text")
                .attr("class", "y-axis-label")
                .attr("text-anchor", "end")
                .attr("transform", "rotate(-90)")
                .attr("y", -50)
                .attr("x", -height / 2 + 20)
                .text(selectedVariable === "emission" ? "Emission" : "Cost");

            // Update axes
            svg.selectAll(".x-axis").remove();
            svg.selectAll(".y-axis").remove();
            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).tickPadding(10).tickSizeInner(-height)); // Increased tick padding

            svg.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(y).ticks(6).tickPadding(10).tickSizeInner(-width)); // Increased tick padding

            // Clear existing lines and redraw with increased stroke width
            svg.selectAll(".line").remove();
            const color = d3.scaleOrdinal(d3.schemeCategory10);
            const line = d3.line()
                .x(d => x(d.year))
                .y(d => y(d[selectedVariable]));

            const scenarioGroups = d3.groups(filteredData, d => d.scenario);
            scenarioGroups.forEach(([key, values]) => {
                svg.append("path")
                    .datum(values)
                    .attr("class", "line")
                    .attr("fill", "none")
                    .attr("stroke", color(key))
                    .attr("stroke-width", 3) // Increased line weight
                    .attr("d", line);
            });
        }
    } else {
        console.error("Container not found");
    }
});
