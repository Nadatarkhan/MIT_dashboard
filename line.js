document.addEventListener('DOMContentLoaded', function() {
    // Get the container dimensions
    const container = document.querySelector('.visual1');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Margins and graph dimensions
    const margin = { top: 20, right: 20, bottom: 30, left: 60 },
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;

    // Append the SVG object to the container
    const svg = d3.select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse the date / year
    const parseYear = d3.timeParse("%Y");

    // Set the ranges
    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    // Define the line
    const valueline = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.emission));

    // Get the data
    d3.csv("data/example_data_wide.csv").then(function(data) {
        // Extract the years and emissions from the CSV data
        const years = data.columns.slice(11).map(col => parseYear(col));
        const emissions = data.map(d => {
            return years.map((year, i) => {
                return {
                    year: year,
                    emission: +d[data.columns[11 + i]]
                };
            });
        }).flat();

        // Scale the range of the data
        x.domain(d3.extent(years));
        y.domain([0, d3.max(emissions, d => d.emission)]);

        // Add the valueline path.
        emissions.forEach(function(emissionData, index) {
            svg.append("path")
                .data([emissionData])
                .attr("class", "line")
                .style("stroke", d3.schemeCategory10[index % 10])
                .attr("d", valueline);
        });

        // Add the X Axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        // Add the Y Axis
        svg.append("g")
            .call(d3.axisLeft(y));
    });
});
