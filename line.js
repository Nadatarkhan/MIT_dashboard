document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.visual1');
    if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Define the margins and dimensions for the graph
        const margin = { top: 20, right: 30, bottom: 30, left: 60 },
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

            // Print out the column names for debugging
            console.log("Column names:", data.columns);

            // Identify the 'Emissions' columns based on the header names
            const emissionsHeaders = data.columns.filter(col => col.startsWith("Emissions"));
            console.log("Emissions headers:", emissionsHeaders);

            // Assume that the actual year headers follow immediately after the strategies
            const yearHeaders = data.columns.slice(data.columns.indexOf(emissionsHeaders[0]));
            console.log("Year headers:", yearHeaders);

            const parseYear = d3.timeParse("%Y");

            // Process the data to extract emission values for each year
            let emissionsData = data.map(row => {
                return yearHeaders.map(header => {
                    // We remove the 'Emissions' prefix and parse the year
                    const yearString = header.replace("Emissions", "").trim();
                    return {
                        year: parseYear(yearString),
                        emission: +row[header] // Convert string to number
                    };
                });
            }).flat();

            // Log the processed emissions data for debugging
            console.log("Emissions data:", emissionsData);

            // Set the domain for the scales
            x.domain(d3.extent(emissionsData, d => d.year));
            y.domain([0, d3.max(emissionsData, d => d.emission)]);

            // Add the X Axis
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x));

            // Add the Y Axis
            svg.append("g").call(d3.axisLeft(y));

            // Draw the line for each strategy
            data.forEach((row, index) => {
                const emissionsForStrategy = yearHeaders.map(header => {
                    const yearString = header.replace("Emissions", "").trim();
                    return {
                        year: parseYear(yearString),
                        emission: +row[header]
                    };
                });

                svg.append("path")
                    .datum(emissionsForStrategy)
                    .attr("class", "line")
                    .style("stroke", d3.schemeCategory10[index % 10])
                    .attr("d", valueline);
            });
        }).catch(error => {
            console.error("Error loading or processing data:", error);
        });
    } else {
        console.error("Container not found");
    }
});

