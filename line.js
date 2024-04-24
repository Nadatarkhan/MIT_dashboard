document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const dpi = window.devicePixelRatio;

        // Modify these values to change the overall size of the canvas and the plot
        const containerWidth = container.clientWidth - 200; // Reduced margin for a larger plot area
        const containerHeight = container.clientHeight - 200; // Reduced margin for a larger plot area

        const canvas = d3.select(container)
            .append("canvas")
            .attr("width", containerWidth * dpi)
            .attr("height", containerHeight * dpi)
            .style("width", containerWidth + "px")
            .style("height", containerHeight + "px");
        const context = canvas.node().getContext("2d");
        context.scale(dpi, dpi);

        // Adjusted margins
        const margin = { top: 40, right: 20, bottom: 40, left: 60 },
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

            setupZoom(); // Setup zoom
            setupTooltip(); // Setup tooltip

            function updatePlot(variable) {
                const filteredData = emissionsData.filter(d => gridFilter === "all" ||
                    (gridFilter === "decarbonized" ? d.grid === "decarbonization" : d.grid === "bau"));

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
                    context.lineWidth = 2; // Make lines thicker
                    context.strokeStyle = color(index);
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
                context.translate(margin.left, margin.top);
                y.ticks(10).forEach(d => {
                    context.fillText(d, -50, -y(d) + 3); // Shift label left for more space
                });
                context.fillText(variable.charAt(0).toUpperCase() + variable.slice(1), -100, -height / 2 + 20); // Y-axis label
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(0, -height);
                context.strokeStyle = 'black';
                context.stroke();
                context.restore();
            }

            function setupZoom() {
                const zoom = d3.zoom()
                    .scaleExtent([1, 10])
                    .translateExtent([[0, 0], [width, height]])
                    .on("zoom", zoomed);

                canvas.call(zoom);

                function zoomed({transform}) {
                    x.range([0, width].map(d => transform.applyX(d)));
                    y.range([height, 0].map(d => transform.applyY(d)));
                    updatePlot(selectedVariable);  // Redraw plot
                }
            }

            function setupTooltip() {
                canvas.on("mousemove", function(event) {
                    const mouse = d3.pointer(event);
                    // Calculate closest data point
                    // Display tooltip
                });
            }
        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });
    } else {
        console.error("Container not found");
    }

    // Move buttons and toggles under the plot
    const controlsContainer = document.querySelector('.controls-container');
    if (controlsContainer) {
        const graphContainer = document.querySelector('.graph-container');
        graphContainer.parentNode.insertBefore(controlsContainer, graphContainer.nextSibling);
    } else {
        console.error("Controls container not found");
    }
});
