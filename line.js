document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Define the margins and dimensions for the graph
        const margin = { top: 20, right: 20, bottom: 30, left: 60 },
            width = containerWidth - margin.left - margin.right,
            height = containerHeight - margin.top - margin.bottom;

        // Append the SVG canvas to the container
        const svg = d3.select(container)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Define the scales and the line
        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        const valueline = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.emission));

        // Load and process the data
        d3.csv("data/example_data_wide.csv").then(function(data) {
            console.log("Raw data:", data); // Log raw data for debugging

            // Process the data to extract emission values for each year
            let plotData = [];
            data.forEach(function(d, i) {
                const years = Object.keys(d).slice(11); // Assuming year data starts at the 12th column
                const parseYear = d3.timeParse("%Y");
                years.forEach(function(year) {
                    if (!isNaN(d[year])) { // Check if the value is a number
                        plotData.push({
                            year: parseYear(year),
                            emission: +d[year], // Convert string to number
                            strategy: "Strategy " + (i + 1) // Assuming each line is a different strategy
                        });
                    }
                });
            });

            console.log("Formatted data:", plotData); // Log formatted data for debugging

            // Scale the range of the data
            x.domain(d3.extent(plotData, function(d) { return d.year; }));
            y.domain([0, d3.max(plotData, function(d) { return d.emission; })]);

            // Add the X Axis
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x));

            // Add the Y Axis
            svg.append("g")
                .call(d3.axisLeft(y));

            // Draw the lines
            var strategies = d3.group(plotData, d => d.strategy); // Group the data by strategy
            strategies.forEach(function(values, key) {
                svg.append("path")
                    .datum(values)
                    .attr("fill", "none")
                    .attr("stroke", d3.schemeCategory10[(key-1) % 10])
                    .attr("stroke-width", 1.5)
                    .attr("d", valueline);
                console.log(`Data for ${key}:`, values); // Log data for each strategy
            });
        }).catch(function(error) {
            console.error("Error loading or processing data:", error);
        });
    } else {
        console.error("Container not found");
    }
});
