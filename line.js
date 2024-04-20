document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Define the margins and dimensions for the graph
        const margin = { top: 20, right: 30, bottom: 30, left: 50 },
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        // Append the SVG canvas to the container
        const svg = d3.select(container)
            .append("svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        console.log('Container dimensions:', containerWidth, containerHeight);

        // Define the scales and the line
        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        let selectedVariable = "Emissions";

        // Load and process the data
        d3.csv("data/example_data.csv").then(function(data) {
            console.log('Data loaded:', data);

            // Map the data to an array of objects
            let emissionsData = data.map(d => ({
                year: d3.timeParse("%Y")(d.epw_year), // Parse date format
                emission: parseFloat(d.Emissions), // Convert to numeric type
                cost: parseFloat(d.Cost), // Convert to numeric type
                scenario: +d.Scenario // Convert to numeric type
            }));

            console.log('Formatted data:', emissionsData); // Log data structure

            // Set the domain for the scales
            x.domain(d3.extent(emissionsData, d => d.year));
            y.domain([0, d3.max(emissionsData, d => d[selectedVariable])]);

            console.log('X domain:', x.domain());
            console.log('Y domain:', y.domain());

            // Add the X Axis
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x))
                .append("text") // X-axis label
                .attr("class", "x-axis-label")
                .attr("x", width / 2)
                .attr("y", 40) // Adjusted for padding
                .style("text-anchor", "middle")
                .text("Years");

            // Add the Y Axis
            svg.append("g")
                .call(d3.axisLeft(y))
                .append("text") // Y-axis label
                .attr("class", "y-axis-label")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2) // Adjusted for padding
                .attr("y", -60) // Adjusted for padding
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text(selectedVariable);

            // Function to update plot based on selected variable
            function updatePlot(variable) {
                selectedVariable = variable;

                // Update domain for y-scale
                y.domain([0, d3.max(emissionsData, d => d[selectedVariable])]);

                // Update Y axis label
                svg.selectAll(".y-axis-label")
                    .text(selectedVariable);

                // Redraw the line
                svg.selectAll(".line").remove();
                svg.append("path")
                    .datum(emissionsData)
                    .attr("class", "line")
                    .attr("fill", "none")
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                        .x(d => x(d.year))
                        .y(d => y(d[selectedVariable]))
                    );
            }

            // Add buttons
            const buttonContainer = d3.select(container) // Append to container
                .append("div")
                .attr("class", "button-container");

            const buttons = buttonContainer.selectAll("button")
                .data(["Emissions", "Cost", "CO2/$"])
                .enter()
                .append("button")
                .text(d => d)
                .on("click", function(d) {
                    updatePlot(d);
                });

            // Initial plot
            updatePlot(selectedVariable);

        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });
    } else {
        console.error("Container not found");
    }
});


