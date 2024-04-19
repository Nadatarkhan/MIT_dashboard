document.addEventListener('DOMContentLoaded', function() {
    // Get the container for visual 1
    const container = document.querySelector('.visual1');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Define the margins and graph area dimensions
    const margin = { top: 20, right: 20, bottom: 30, left: 50 },
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;

    // Append the SVG object to the container
    const svg = d3.select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse the year / time
    const parseYear = d3.timeParse("%Y");

    // Set the ranges for the scales
    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    // Define the line
    const valueline = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.emission));

    // Load and process the data
    d3.csv("data/example_data_wide.csv").then(function(data) {
        // Convert string to number for emission values and parse the year
        data.forEach(d => {
            d.emission = +d.emission; // Convert string to number
            d.year = parseYear(d.year); // Parse the year
        });

        // Scale the range of the data
        x.domain(d3.extent(data, d => d.year));
        y.domain([0, d3.max(data, d => d.emission)]);

        // Add the valueline path for the line chart
        svg.append("path")
            .data([data])
            .attr("class", "line")
            .style("stroke", "steelblue")
            .attr("d", valueline);

        // Add the X Axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        // Add the Y Axis
        svg.append("g")
            .call(d3.axisLeft(y));
    }).catch(error => {
        console.error("Error loading or processing data:", error);
    });
});
