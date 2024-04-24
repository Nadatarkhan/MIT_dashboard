document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const dpi = window.devicePixelRatio;

        const containerWidth = container.clientWidth - 200;
        const containerHeight = container.clientHeight - 280;

        const canvas = d3.select(container)
            .append("canvas")
            .attr("width", containerWidth * dpi) // Multiply by dpi
            .attr("height", containerHeight * dpi) // Multiply by dpi
            .style("width", containerWidth + "px") // Set CSS width
            .style("height", containerHeight + "px"); // Set CSS height
        const context = canvas.node().getContext("2d");
        context.scale(dpi, dpi); // Scale all drawings by the DPI

        const margin = { top: 40, right: 40, bottom: 60, left: 80 },
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        let selectedVariable = "emission"; // Default to 'emission'
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

                const scenarioGroups = d3.groups(filteredData, d => d.scenario);
                scenarioGroups.forEach((group, index) => {
                    const values = group[1];
                    const maxEmission = d3.max(values, v => v[variable]);
                    const gradient = context.createLinearGradient(0, y(0), 0, y(maxEmission));
                    gradient.addColorStop(0, 'lightblue'); // Lighter color for lower values
                    gradient.addColorStop(1, 'darkblue'); // Darker color for higher values

                    const line = d3.line()
                        .x(d => x(d.year))
                        .y(d => y(d[variable]))
                        .context(context);

                    context.beginPath();
                    line(values);
                    context.lineWidth = 1.5;
                    context.strokeStyle = gradient;
                    context.stroke();
                });

                context.restore();
                drawAxis();
            }

            function drawAxis() {
                // X-axis
                context.save();
                context.translate(margin.left, height + margin.top);
                x.ticks().forEach(d => {
                    context.fillText(d3.timeFormat("%Y")(d), x(d), 10);
                });
                context.fillText("Year", width / 2, 40); // X-axis Label
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(width, 0);
                context.strokeStyle = 'black';
                context.stroke();
                context.restore();

                // Y-axis
                context.save();
                context.translate(margin.left, margin.top + height);
                y.ticks(10).forEach(d => {
                    context.fillText(d, -70, -y(d) + 3); // Shift label left for more space
                });
                context.fillText(variable.charAt(0).toUpperCase() + variable.slice(1), -100, -height / 2 + 20); // Shift Y-axis label further left
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(0, -height);
                context.strokeStyle = 'black';
                context.stroke();
                context.restore();
            }
        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });
    } else {
        console.error("Container not found");
    }
});
