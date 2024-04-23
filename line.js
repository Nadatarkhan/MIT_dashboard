document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const svg = d3.select(container)
            .append("svg")
            .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
            .append("g")
            .attr("transform", `translate(${60},${20})`);

        const x = d3.scaleTime().range([0, containerWidth - 90]);
        const y = d3.scaleLinear().range([containerHeight - 70, 0]);

        let selectedVariable = "emission";
        let gridFilter = "all";
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
            svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${containerHeight - 70})`).call(d3.axisBottom(x));
            svg.append("g").attr("class", "y-axis").call(d3.axisLeft(y));

            const color = d3.scaleOrdinal(d3.schemeCategory10);
            const line = d3.line()
                .x(d => x(d.year))
                .y(d => y(d[selectedVariable]));

            const tooltip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

            const scenarioGroups = d3.groups(filteredData, d => d.scenario);
            scenarioGroups.forEach(([key, values]) => {
                const path = svg.append("path")
                    .datum(values)
                    .attr("class", "line")
                    .attr("fill", "none")
                    .attr("stroke", color(key))
                    .attr("stroke-width", 4)
                    .attr("d", line);

                path.on("mouseover", function(event, d) {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(`Scenario: ${d.scenario}<br>${selectedVariable.charAt(0).toUpperCase() + selectedVariable.slice(1)}: ${d[selectedVariable]}`)
                        .style("left", (event.pageX) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                    .on("mouseout", function(d) {
                        tooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                    });
            });
        }
    } else {
        console.error("Container not found");
    }
});
