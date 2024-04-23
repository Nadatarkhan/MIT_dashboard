document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Log to confirm dimensions read by the script
        console.log('Container dimensions:', containerWidth, 'x', containerHeight);

        // Define the margins and dimensions for the graph
        const margin = { top: 20, right: 30, bottom: 30, left: 50 },
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        // Log the calculated dimensions for the SVG content area
        console.log('SVG dimensions:', width, 'x', height);

        // Append the SVG canvas to the container, ensure the SVG has enough space
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

            svg.selectAll(".x-axis").remove();
            svg.selectAll(".y-axis").remove();
            svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
            svg.append("g").attr("class", "y-axis").call(d3.axisLeft(y));

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
                    .attr("stroke-width", 1.5)
                    .attr("d", line);
            });
        }
    } else {
        console.error("Container not found");
    }
});
