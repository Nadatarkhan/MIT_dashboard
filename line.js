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
                year: new Date(d.epw_year),
                emission: +d.Emissions,
                cost: +d.Cost,
                scenario: +d.Scenario
            }));

            console.log('Formatted data:', emissionsData);

            // Check if there are any invalid values in emissionsData
            const invalidValues = emissionsData.filter(d => isNaN(d[selectedVariable]));
            console.log('Invalid values:', invalidValues);

            // Set the domain for the scales
            x.domain(d3.extent(emissionsData, d => d.year));
            const maxY = d3.max(emissionsData, d => d[selectedVariable]);
            console.log('Max Y value:', maxY);
            y.domain([0, maxY]);

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

                console.log('Selected variable:', selectedVariable);

                // Update domain for y-scale
                let maxY;
                if (selectedVariable === "Emissions") {
                    maxY = d3.max(emissionsData, d => d.emission);
                } else if (selectedVariable === "Cost") {
                    maxY = d3.max(emissionsData, d => d.cost);
                } else if (selectedVariable === "Emissions-Cost") {
                    maxY = d3.max(emissionsData, d => Math.max(d.emission, d.cost));
                } else {
                    console.error("Invalid selected variable:", selectedVariable);
                    return;
                }

                console.log('Max Y value:', maxY);
                y.domain([0, maxY]);

                console.log('Y domain after update:', y.domain());

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
                        .y(d => {
                            if (selectedVariable === "Emissions") {
                                return y(d.emission);
                            } else if (selectedVariable === "Cost") {
                                return y(d.cost);
                            } else if (selectedVariable === "Emissions-Cost") {
                                return y(Math.max(d.emission, d.cost));
                            }
                        })
                    );
            }

            // Add buttons
            const buttonContainer = d3.select(container) // Append to container
                .append("div")
                .attr("class", "button-container");

            const buttonData = ["Emissions", "Cost", "Emissions-Cost"]; // Button data
            const buttons = buttonContainer.selectAll("button")
                .data(buttonData)
                .enter()
                .append("button")
                .text(d => d)
                .on("click", function() { // Removed the argument
                    updatePlot(d3.select(this).text()); // Pass the text of the button
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

