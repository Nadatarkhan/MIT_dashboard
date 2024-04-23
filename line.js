document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Define the margins and dimensions for the graph
        const margin = { top: 20, right: 30, bottom: 50, left: 60 },
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        // Append the SVG canvas to the container, setting a viewBox for responsive scaling
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

            // Clear any previous axes
            svg.selectAll(".x-axis").remove();
            svg.selectAll(".y-axis").remove();

            // X-axis with label
            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).tickPadding(10))
                .append("text")
                .attr("class", "axis-label")
                .attr("x", width / 2)
                .attr("y", 40) // Positioning the label below the x-axis
                .style("text-anchor", "middle")
                .style("font-size", "16px")
                .text("Year");

            // Y-axis with label
            svg.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(y).ticks(6).tickPadding(10))
                .append("text")
                .attr("class", "axis-label")
                .attr("transform", "rotate(-90)") // Rotating text for vertical axis
                .attr("x", -height / 2)
                .attr("y", -50) // Positioning left of the y-axis
                .style("text-anchor", "middle")
                .style("font-size", "16px")
                .text("Value");

            // Draw grid lines with very light grey
            svg.selectAll(".x-axis line, .y-axis line")
                .style("stroke", "#ddd");

            // Clear existing lines and redraw
            svg.selectAll(".line").remove();
            const color = d3.scaleOrdinal(d3.schemeCategory10);
            const line = d3.line()
                .x(d => x(d.year))
                .y(d => y(d[selectedVariable]))
                .curve(d3.curveMonotoneX); // Smooths the line

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
