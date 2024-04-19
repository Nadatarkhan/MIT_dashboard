document.addEventListener('DOMContentLoaded', function() {
    // Select the container for visual 1 and get its dimensions
    const visual1Container = document.querySelector('.visual1');

    // Get the computed styles of the container to account for any padding or border
    const styles = window.getComputedStyle(visual1Container);

    // Calculate the actual available width and height by subtracting paddings and borders
    const containerWidth = visual1Container.clientWidth - (parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight));
    const containerHeight = visual1Container.clientHeight - (parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom));

    const margin = { top: 20, right: 20, bottom: 30, left: 50 },
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;

    const svg = d3.select(visual1Container)
        .append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv("data/example_data_wide.csv").then(function(data) {
        // Assuming 'Emissions', 'Innovation', 'Risk' are followed by year columns in that order
        const yearColumns = data.columns.slice(11); // Adjust the index to where year columns start for 'Emissions'
        const parseYear = d3.timeParse("%Y");
        const years = yearColumns.map(d => parseYear(d));

        // Set the domains for the x and y scales
        const x = d3.scaleTime().range([0, width]).domain(d3.extent(years));
        const y = d3.scaleLinear().range([height, 0])
            .domain([0, d3.max(data, d => d3.max(years, year => +d[year.getFullYear()]))]);

        const line = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.value));

        // Loop over the data to create separate line datasets
        data.forEach((row, index) => {
            let emissionsData = yearColumns.map(col => {
                return { date: parseYear(col), value: +row[col] };
            });

            svg.append("path")
                .data([emissionsData]) // Bind the emissions data for this row
                .attr("fill", "none")
                .attr("stroke", d3.schemeCategory10[index % 10])
                .attr("stroke-width", 1.5)
                .attr("d", line);
        });

        // Add the X Axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        // Add the Y Axis
        svg.append("g")
            .call(d3.axisLeft(y));
    }).catch(function(error) {
        console.error("Error loading or processing data:", error);
    });
});
