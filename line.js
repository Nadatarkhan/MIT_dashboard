document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const dpi = window.devicePixelRatio;

        const containerWidth = container.clientWidth - 200;
        const containerHeight = container.clientHeight - 280;

        const canvas = d3.select(container)
            .append("canvas")
            .attr("width", containerWidth * dpi)
            .attr("height", containerHeight * dpi)
            .style("width", containerWidth + "px")
            .style("height", containerHeight + "px");
        const context = canvas.node().getContext("2d");
        context.scale(dpi, dpi);

        const margin = { top: 40, right: 40, bottom: 60, left: 80 },
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        let selectedVariable = "emission";
        let gridFilter = "all";

        d3.csv("data/example_data.csv").then(function(data) {
            const emissionsData = data.map(d => ({
                year: new Date(d.epw_year),
                emission: +d.Emissions,
                cost: +d.Cost,
                scenario: d.Scenario,
                grid: d.grid
            }));

            updatePlot(selectedVariable);

            document.querySelectorAll('.button-container button').forEach(button => {
                button.addEventListener('click', function() {
                    selectedVariable = this.textContent.trim().toLowerCase() === "emissions" ? "emission" : "cost";
                    updatePlot(selectedVariable);
                });
            });

            document.querySelectorAll('input[name="gridFilter"]').forEach(input => {
                input.addEventListener('change', function() {
                    gridFilter = this.value;
                    updatePlot(selectedVariable);
                });
            });

            function updatePlot(variable) {
                const filteredData = emissionsData.filter(d => gridFilter === "all" ||
                    (gridFilter === "decarbonized" ? d.grid === "decarbonization" : d.grid === "no decarbonization"));

                x.domain(d3.extent(filteredData, d => d.year));
                y.domain([0, d3.max(filteredData, d => d[variable])]);

                context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
                context.save();
                context.translate(margin.left, margin.top);

                const color = d3.scaleOrdinal(d3.schemeCategory10);
                const line = d3.line()
                    .x(d => x(d.year))
                    .y(d => y(d[variable]))
                    .context(context);

                const scenarioGroups = d3.groups(filteredData, d => d.scenario);
                scenarioGroups.forEach((group, index) => {
                    context.beginPath();
                    line(group[1]);
                    context.lineWidth = 0.5;
                    context.strokeStyle = color(index);
                    context.stroke();
                });

                context.restore();
                drawAxis();
            }

            function drawAxis() {
                context.save();
                context.translate(margin.left, margin.top);

                // Draw X-axis
                context.translate(0, height);
                context.scale(1, -1);
                x.ticks().forEach(d => {
                    context.fillText(d3.timeFormat("%Y")(d), x(d), -10);
                });

                // Draw Y-axis
                context.scale(1, -1);
                y.ticks(10).forEach(d => {
                    context.fillText(d, -50, -y(d) + 5);
                });

                context.restore();
            }
        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });
    } else {
        console.error("Container not found");
    }
});
