document.addEventListener('DOMContentLoaded', function() {
    // Select the container and get its dimensions
    const container = document.querySelector('.visual1');
    const width = container.clientWidth;  // Use the width of the container
    const height = container.clientHeight;  // Use the height of the container

    const margin = { top: 20, right: 20, bottom: 30, left: 40 },
        svgWidth = width - margin.left - margin.right,
        svgHeight = height - margin.top - margin.bottom;

    const x = d3.scaleTime().range([0, svgWidth]);
    const y = d3.scaleLinear().range([svgHeight, 0]);

    const valueline = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.emission));

    const svg = d3.select("#lineChart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    d3.csv("data/example_data_wide.csv").then(function(data) {
        const parseYear = d3.timeParse("%Y");
        const years = data.columns.slice(1).map(col => parseYear(col.replace('Emissions ', '')));

        x.domain(d3.extent(years));
        y.domain([0, d3.max(data, row => d3.max(years, year => +row[year.getFullYear().toString()]))]);

        data.forEach((row, index) => {
            const emissions = years.map(year => {
                return {
                    year: year,
                    emission: +row[year.getFullYear().toString()]
                };
            });

            svg.append("path")
                .datum(emissions)
                .attr("fill", "none")
                .attr("stroke", d3.schemeCategory10[index % 10])
                .attr("stroke-width", 1.5)
                .attr("d", valueline);
        });

        // Add the X Axis
        svg.append("g")
            .attr("transform", `translate(0,${svgHeight})`)
            .call(d3.axisBottom(x));

        // Add the Y Axis
        svg.append("g")
            .call(d3.axisLeft(y));
    }).catch(function(error) {
        console.error("Error loading or processing data:", error);
    });
});
