document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");

    const container = document.querySelector('.visual1');
    if (!container) {
        console.error("Container not found");
        return;
    }
    console.log("Container found");

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

    const margin = { top: 40, right: 40, bottom: 60, left: 200 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    let scenarioFilter = ''; // No scenario filter by default
    let implementationLevel = ''; // No implementation level filter by default

    // Load and process the data
    d3.csv("data/example_data.csv").then(function(data) {
        console.log("Data loaded successfully");

        // Process the data
        const processedData = data.map(d => ({
            year: new Date(d.epw_year),
            emission: +d.Emissions,
            scenario: d.Scenario,
            implementation: d.Implementation // Assuming this is how you have your implementation levels in your CSV
        }));

        // Initial plot without filters
        updatePlot(processedData);

        // Event listeners for scenario icons
        document.querySelectorAll('.icon-container').forEach(container => {
            container.addEventListener('click', function() {
                scenarioFilter = this.getAttribute('data-field');
                console.log("Icon clicked, scenario filter set to:", scenarioFilter);
                showImplementationOptions(this); // Show the implementation level buttons
            });
        });

        function showImplementationOptions(iconContainer) {
            console.log("Showing implementation options for:", iconContainer.getAttribute('data-field'));
            const container = document.createElement('div');
            container.className = 'implementation-options';
            ['baseline', 'partial', 'full'].forEach((level) => {
                const label = document.createElement('label');
                const radioButton = document.createElement('input');
                radioButton.type = 'radio';
                radioButton.name = 'implementationFilter';
                radioButton.value = level;
                radioButton.onchange = () => {
                    implementationLevel = radioButton.value;
                    console.log("Implementation level changed to:", implementationLevel);
                    updatePlot(processedData); // Update the plot when a new implementation level is selected
                };
                label.appendChild(radioButton);
                label.appendChild(document.createTextNode(level));
                container.appendChild(label);
            });
            iconContainer.appendChild(container);
        }

        function updatePlot(data) {
            console.log("Updating plot");

            // Filter the data based on the scenario and implementation level
            const filteredData = data.filter(d =>
                (!scenarioFilter || d.scenario === scenarioFilter) &&
                (!implementationLevel || d.implementation === implementationLevel)
            );

            // Define domains
            x.domain(d3.extent(filteredData, d => d.year));
            y.domain([0, d3.max(filteredData, d => d.emission)]);

            // Clear the canvas for redrawing
            context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
            context.save();
            context.translate(margin.left, margin.top);

            // Draw the line for each scenario
            const line = d3.line()
                .x(d => x(d.year))
                .y(d => y(d.emission))
                .context(context);

            context.beginPath();
            line(filteredData);
            context.lineWidth = 1.5;
            context.strokeStyle = 'steelblue';
            context.stroke();

            // Restore context and draw axis
            context.restore();
            drawAxis();
        }

        function drawAxis() {
            // Add the X Axis
            context.save();
            context.translate(margin.left, margin.top + height);
            context.beginPath();
            x.ticks().forEach(function(d) {
                context.moveTo(x(d), 0);
                context.lineTo(x(d), 6);
            });
            context.strokeStyle = "black";
            context.stroke();

            context.textAlign = "center";
            x.ticks().forEach(function(d) {
                context.fillText(d3.timeFormat("%Y")(d), x(d), 20);
            });

            // X-axis label
            context.fillText("Year", width / 2, margin.bottom / 1.5);

            context.restore();

            // Add the Y Axis
            context.save();
            context.translate(margin.left, margin.top);
            context.beginPath();
            y.ticks(10).forEach(function(d) {
                context.moveTo(0, y(d));
                context.lineTo(-6, y(d));
            });
            context.strokeStyle = "black";
            context.stroke();

            context.textAlign = "right";
            context.textBaseline = "middle";
            y.ticks(10).forEach(function(d) {
                context.fillText(d, -9, y(d));
            });

            // Y-axis label
            context.rotate(-Math.PI / 2); // Rotate context for vertical text
            context.textAlign = "center";
            context.fillText("Emissions", -height / 2, -margin.left / 1.5);

            context.restore();
        }
    }).catch(function(error) {
        console.error("Error loading or processing data:", error);
    });
});








