document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    const container = document.querySelector('.visual1');
    if (container) {
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

        const margin = { top: 40, right: 40, bottom: 60, left: 200 },
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        let selectedVariable = "emission"; // Default to 'emission'
        let implementationLevel = ""; // Default implementation level
        let data; // Store loaded data

        d3.csv("data/example_data.csv").then(function(csvData) {
            console.log("Data loaded successfully");
            data = csvData.map(d => ({
                year: new Date(d.epw_year),
                emission: +d.Emissions,
                cost: +d.Cost,
                scenario: d.Scenario,
                implementation: d.Implementation // Ensure implementation level is assigned from data
            }));

            // Check implementation level assigned to each data entry
            console.log("Implementation levels assigned to data entries:", data.map(d => d.implementation));

            // Proceed with plot initialization and event listeners...
            updatePlot(selectedVariable, implementationLevel); // Initial plot update

            document.querySelectorAll('.icon-container').forEach(container => {
                container.addEventListener('click', function() {
                    implementationLevel = this.getAttribute('data-field');
                    console.log("Icon clicked, implementation level set to:", implementationLevel);
                    showImplementationOptions(this);
                    updatePlot(selectedVariable, implementationLevel);
                });
            });

        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });

        function showImplementationOptions(iconContainer) {
            console.log("Showing implementation options for:", iconContainer.getAttribute('data-field'));
            // Implement the logic to show implementation options
        }

        function updatePlot(variable, implLevel) {
            console.log("Updating plot");
            // Implement the logic to update the plot based on the selected implementation level
            const filteredData = data.filter(d => d.implementation === implLevel);

            if (filteredData.length > 0) {
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
                drawAxis(variable);
            } else {
                console.log("No data found for the selected implementation level:", implLevel);
            }
        }

        function drawAxis(variable) {
            console.log("Drawing axes for:", variable);
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
    } else {
        console.error("Container not found");
    }
});


