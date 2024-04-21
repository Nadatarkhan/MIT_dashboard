// set the dimensions and margins of the graph
var margin = {top: 30, right: 30, bottom: 30, left: 50},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#innovation_plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Load the data
d3.csv("data/example_data.csv", function(data) {

    // X axis: scale and draw:
    var x = d3.scaleLinear()
        .domain([0, 1000])   // This is what is written on the Axis: from 0 to 1000
        .range([0, width]); // This is where the axis is placed: from 0 to the width

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Y axis: initialization
    var y = d3.scaleLinear()
        .range([height, 0]);

    // A function that builds the graph for a specific value of bin
    function update(nBin) {

        // set the parameters for the histogram
        var histogram = d3.histogram()
            .value(function(d) { return d.Innovation; })   // I need to give the vector of value
            .domain(x.domain())  // then the domain of the graphic
            .thresholds(x.ticks(nBin)); // then the numbers of bins

        // And apply this function to data to get the bins
        var bins = histogram(data);

        // Y axis: update now that we know the domain
        y.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously

        // append the bar rectangles to the svg element
        svg.selectAll("rect")
            .data(bins)
            .enter()
            .append("rect")
            .attr("x", 1)
            .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
            .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
            .attr("height", function(d) { return height - y(d.length); })
            .style("fill", "#69b3a2");

    }

    // Initialize with 20 bins
    update(20);

    // Listen to the slider?
    d3.select("#innovation_slider").on("change", function() {
        var selectedValue = this.value;
        update(selectedValue);
    });

});

