document.addEventListener('DOMContentLoaded', function() {
    // Set the dimensions of the canvas / graph
    const margin = { top: 30, right: 20, bottom: 30, left: 50 },
        width = 600 - margin.left - margin.right,
        height = 270 - margin.top - margin.bottom;

// Parse the date / time
    const parseTime = d3.timeParse("%Y");

// Set the ranges
    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

// Define the line
    const valueline = d3.line()
        .x(function(d) { return x(d.year); })
        .y(function(d) { return y(d.emission); });

// Append the SVG object to the body of the page
// Appends a 'group' element to 'svg'
// Moves the 'group' element to the top left margin
    const svg = d3.select(".visual1").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

// Get the data
    d3.csv("data/example_data_wide.csv").then(function(data) {

        console.log("Data loaded", data); // Debugging line to check data format

        // Format the data by mapping it to an array of { year, emission } objects
        let formattedData = [];
        data.forEach(function(d) {
            const strategy = d.climate + ' ' + d.grid + ' ' + d.retrofit; // Combine strategy columns into a string
            Object.keys(d).forEach(function(key) {
                if (!isNaN(key) && key.length === 4) { // Check if key is a year
                    formattedData.push({
                        strategy: strategy,
                        year: parseTime(key),
                        emission: +d[key]
                    });
                }
            });
        });

        console.log("Formatted data", formattedData); // Debugging line to check formatted data

        // Scale the range of the data
        x.domain(d3.extent(formattedData, function(d) { return d.year; }));
        y.domain([0, d3.max(formattedData, function(d) { return d.emission; })]);

        // Add the valueline path for each strategy
        let strategies = Array.from(new Set(formattedData.map(d => d.strategy))); // Unique strategies
        strategies.forEach(function(strategy) {
            let strategyData = formattedData.filter(d => d.strategy === strategy);
            svg.append("path")
                .data([strategyData])
                .attr("class", "line")
                .style("stroke", function() { return d3.schemeCategory10[strategies.indexOf(strategy) % 10]; })
                .attr("d", valueline);
        });

        // Add the X Axis
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // Add the Y Axis
        svg.append("g")
            .call(d3.axisLeft(y));

    }).catch(function(error){
        console.log("Error loading or processing data:", error);
    });
