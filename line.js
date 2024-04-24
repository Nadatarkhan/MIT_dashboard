document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const dpi = window.devicePixelRatio;
        const containerWidth = container.clientWidth - 100;
        const containerHeight = container.clientHeight - 230;
        const canvas = d3.select(container)
            .append("canvas")
            .attr("width", containerWidth * dpi)
            .attr("height", containerHeight * dpi)
            .style("width", containerWidth + "px")
            .style("height", containerHeight + "px");
        const context = canvas.node().getContext("2d");
        context.scale(dpi, dpi);

        const margin = { top: 40, right: 40, bottom: 60, left: 200 },
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        let selectedVariable = "emission"; // Default to 'emission'
        let gridFilter = "all";
        let scenarioFilter = ""; // No scenario filter by default
        let implementationLevel = "baseline"; // Default implementation level

        d3.csv("data/example_data.csv").then(function(data) {
            const emissionsData = data.map(d => ({
                year: new Date(d.epw_year),
                emission: +d.Emissions,
                cost: +d.Cost,
                scenario: d.Scenario,
                grid: d.grid,
                implementation: d.Implementation // Assuming there is a field for implementation level
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

            // Setting up scenario filters
            document.querySelectorAll('.icon-container').forEach(container => {
                container.addEventListener('click', function() {
                    scenarioFilter = this.getAttribute('data-field');
                    showImplementationOptions(this);
                });
            });

            function showImplementationOptions(iconContainer) {
                const container = document.createElement('div');
                container.className = 'implementation-options';
                ['baseline', 'partial', 'full'].forEach((level, index) => {
                    const label = document.createElement('label');
                    const radioButton = document.createElement('input');
                    radioButton.type = 'radio';
                    radioButton.name = 'implementationFilter';
                    radioButton.value = level;
                    if (index === 0) radioButton.checked = true;
                    radioButton.onchange = () => {
                        implementationLevel = radioButton.value;
                        updatePlot(selectedVariable);
                    };
                    label.appendChild(radioButton);
                    label.appendChild(document.createTextNode(["Business as usual", "Partial implementation", "Full implementation"][index]));
                    container.appendChild(label);
                });
                const currentOptions = iconContainer.parentNode.querySelector('.implementation-options');
                if (currentOptions) iconContainer.parentNode.removeChild(currentOptions);
                iconContainer.appendChild(container);
            }

            function updatePlot(variable) {
                const filteredData = emissionsData.filter(d => (gridFilter === "all" || (gridFilter === "decarbonized" ? d.grid === "decarbonization" : d.grid === "bau")) && (!scenarioFilter || (d.scenario === scenarioFilter && d.implementation === implementationLevel)));

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
                    context.lineWidth = 0.1;
                    context.strokeStyle = color(index);
                    context.stroke();
                });

                context.restore();
                drawAxis();
            }

            function drawAxis() {
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
                    context.fillText(d, -70, -y(d) + 3); // Shift label left for more space
                });
                context.fillText(variable.charAt(0).toUpperCase() + variable.slice(1), -120, -height / 2 + 20); // Shift Y-axis label further left
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

    // Move buttons and toggles under the plot
    const controlsContainer = document.querySelector('.controls-container');
    if (controlsContainer) {
        const graphContainer = document.querySelector('.graph-container');
        graphContainer.parentNode.insertBefore(controlsContainer, graphContainer.nextSibling);
    } else {
        console.error("Controls container not found");
    }
});


