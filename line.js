document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Define the margins and dimensions for the graph
        const margin = { top: 20, right: 30, bottom: 50, left: 50 }, // Adjusted left margin for y-axis label
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        // Append the SVG canvas to the container
        const svg = d3.select(container)
            .append("svg")
            .attr("class", "chart-svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        console.log('Container dimensions:', containerWidth, containerHeight);

        // Define the scales and the line
        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        const valueline = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.emission));

        // Load and process the data
        d3.csv("data/example_data.csv").then(function(data) {
            console.log('Data loaded:', data);

            // Map the data to an array of objects
            let emissionsData = data.map(d => ({
                year: new Date(d.epw_year),
                emission: +d.Emissions,
                scenario: +d.Scenario
            }));

            console.log('Formatted data:', emissionsData);

            // Set the domain for the scales
            x.domain(d3.extent(emissionsData, d => d.year));
            y.domain([0, d3.max(emissionsData, d => d.emission)]);

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
                .attr("y", -40) // Adjusted for padding
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .text("Emissions");

            // Group data by scenario
            let sumstat = d3.group(emissionsData, d => d.scenario);
            console.log('Grouped data by scenario:', sumstat);

            // color palette
            const color = d3.scaleOrdinal()
                .domain(sumstat.keys())
                .range(d3.schemeCategory10);

            // Draw the line for each scenario
            sumstat.forEach(function(value, key) {
                console.log(`Drawing line for scenario ${key}`, value);
                svg.append("path")
                    .datum(value)
                    .attr("fill", "none")
                    .attr("stroke", color(key))
                    .attr("stroke-width", 1.5)
                    .attr("d", valueline)
                    .on("mouseover", function(event, d) {
                        tooltip.style("opacity", 1);
                        const [xCoord, yCoord] = d3.pointer(event);
                        tooltip.html(`Scenario: ${key}`)
                            .style("left", (xCoord + 10) + "px")
                            .style("top", (yCoord - 20) + "px");
                    })
                    .on("mouseout", function() {
                        tooltip.style("opacity", 0);
                    });
            });

            // Tooltip
            const tooltip = d3.select(container).append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });
    } else {
        console.error("Container not found");
    }
});


