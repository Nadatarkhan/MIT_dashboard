document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    const container = document.querySelector('.icon-and-graph');

    if (!container) {
        console.error("Container not found");
        return;
    }
    console.log("Container found");

    const dpi = window.devicePixelRatio;
    const containerWidth = container.clientWidth - 50;
    const containerHeight = container.clientHeight - 170;
    const canvas = d3.select(container)
        .append("canvas")
        .attr("width", containerWidth * dpi)
        .attr("height", containerHeight * dpi)
        .style("width", containerWidth + "px")
        .style("height", containerHeight + "px");
    const context = canvas.node().getContext("2d");
    context.scale(dpi, dpi);

    const margin = {top: 30, right: 30, bottom: 40, left: 100},
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    let filters = {}; // Object to hold the active filters for each technology

    const fields = ['retrofit', 'schedules', 'lab', 'district', 'nuclear', 'deepgeo', 'ccs', 'pv', 'grid'];

    d3.csv("data/example_data.csv").then(function(data) {
        console.log("Data loaded successfully");
        const emissionsData = data.map(d => ({
            year: new Date(d.epw_year),
            emission: +d.Emissions / 1000,
            ...fields.reduce((acc, field) => ({...acc, [field]: d[field]}), {}) // assuming each field exists in CSV
        }));

        fields.forEach(field => {
            if (field === 'grid') {
                // Special handling for the 'grid' field in the left pane using icon-container-2
                const iconContainer = document.querySelector(`.icon-container-2[data-field="${field}"]`);
                if (iconContainer) {
                    const form = document.createElement('form');
                    form.style.display = 'flex'; // Flex container to hold the checkboxes
                    form.style.flexDirection = 'column'; // Align checkboxes vertically

                    const options = ['bau', 'cheap_ng', 'decarbonization'];
                    options.forEach(value => {
                        const checkboxContainer = document.createElement('div');
                        checkboxContainer.style.display = 'flex';
                        checkboxContainer.style.alignItems = 'center'; // Align checkbox and label

                        const input = document.createElement('input');
                        input.type = 'checkbox';
                        input.id = `${field}-${value}`;
                        input.name = `${field}Filter`;
                        input.value = value;
                        input.style.transform = 'scale(0.75)';
                        input.style.marginRight = '5px';

                        const label = document.createElement('label');
                        label.htmlFor = `${field}-${value}`;
                        label.textContent = value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
                        label.style.fontSize = '12px';

                        checkboxContainer.appendChild(input);
                        checkboxContainer.appendChild(label);
                        form.appendChild(checkboxContainer); // Append each pair to the form

                        input.addEventListener('change', function() {
                            if (!filters[field]) filters[field] = [];
                            const filterIndex = filters[field].indexOf(value);
                            if (this.checked && filterIndex === -1) {
                                filters[field].push(value);
                            } else if (!this.checked && filterIndex !== -1) {
                                filters[field].splice(filterIndex, 1);
                            }
                            updatePlot();
                        });
                    });
                    iconContainer.appendChild(form);
                }
            } else {
                // Handle other fields using regular 'icon-container'
                const iconContainer = document.querySelector(`.icon-container[data-field="${field}"]`);
                if (iconContainer) {
                    const form = document.createElement('form');
                    let options = ['baseline', 'partial', 'full'];
                    options.forEach(value => {
                        const input = document.createElement('input');
                        input.type = 'checkbox';
                        input.id = `${field}-${value}`;
                        input.name = `${field}Filter`;
                        input.value = value;
                        input.style.transform = 'scale(0.75)';
                        input.style.marginRight = '5px';

                        const label = document.createElement('label');
                        label.htmlFor = `${field}-${value}`;
                        label.textContent = value.charAt(0).toUpperCase() + value.slice(1);
                        label.style.fontSize = '12px';

                        form.appendChild(input);
                        form.appendChild(label);
                        form.appendChild(document.createElement('br'));

                        input.addEventListener('change', function() {
                            if (!filters[field]) filters[field] = [];
                            const filterIndex = filters[field].indexOf(value);
                            if (this.checked && filterIndex === -1) {
                                filters[field].push(value);
                            } else if (!this.checked && filterIndex !== -1) {
                                filters[field].splice(filterIndex, 1);
                            }
                            updatePlot();
                        });
                    });
                    iconContainer.appendChild(form);
                }
            }
        });

        // Baseline checkbox logic
        const baselineCheckbox = document.getElementById('select-all-baseline');
        if (baselineCheckbox) {
            baselineCheckbox.addEventListener('change', function() {
                document.querySelectorAll('input[name$="Filter"][value="baseline"]').forEach(checkbox => {
                    checkbox.checked = this.checked; // Set all baseline checkboxes to match the main baseline checkbox state
                    const field = checkbox.id.split('-')[0]; // Assuming your ID is structured as field-value

                    // Update the filters object
                    if (!filters[field]) {
                        filters[field] = [];
                    }

                    const baselineIndex = filters[field].indexOf('baseline');
                    if (this.checked && baselineIndex === -1) {
                        filters[field].push('baseline'); // Add 'baseline' if it's checked and not already in the filter
                    } else if (!this.checked && baselineIndex !== -1) {
                        filters[field].splice(baselineIndex, 1); // Remove 'baseline' if it's unchecked
                    }
                });

                updatePlot(); // Update the plot after changing the filters
            });
        }


        function getColor(field, value) {
            if (field === 'district' && ['baseline', 'partial', 'full'].includes(value)) return 'purple';
            if (field === 'nuclear' && ['baseline', 'full'].includes(value)) return 'red';
            if (field === 'deepgeo' && ['baseline', 'partial', 'full'].includes(value)) return 'green';
            return 'steelblue';
        }

        function updatePlot() {
            console.log("Updating plot with current filters:", filters);
            const filteredData = emissionsData.filter(d => {
                return Object.keys(filters).every(field =>
                    filters[field].length === 0 || filters[field].includes(d[field])
                );
            });

            x.domain(d3.extent(filteredData, d => d.year));
            y.domain([0, d3.max(filteredData, d => d.emission)]);

            // Clear the entire canvas and reset transformations
            context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
            context.save();
            context.translate(margin.left, margin.top);

            // Start a new path for the line to ensure it does not connect back to the starting point
            context.beginPath();

            // Define the line generator
            const lineGenerator = d3.line()
                .x(d => x(d.year))
                .y(d => y(d.emission))
                .curve(d3.curveLinear) // This ensures that the line is drawn with a linear path without any unintended curves
                .context(context);

            lineGenerator(filteredData); // Draw the line with the filtered data

            context.lineWidth = 0.2;
            context.strokeStyle = filteredData.length > 0 ? getColor(filteredData[0].field, filteredData[0].value) : 'steelblue';
            context.stroke(); // Apply the stroke to draw the line

            context.restore();

            drawAxis(); // Redraw the axes after the line
        }


        function drawAxis() {
            context.save();
            context.translate(margin.left, margin.top); // Adjust the context to the plot area for the axes

            // Drawing the X-axis at the bottom of the plot
            context.beginPath(); // Start a new path for the X-axis
            context.moveTo(0, height); // Start from the left bottom corner of the plot
            context.lineTo(width, height); // Draw line to the right bottom corner
            context.strokeStyle = 'black'; // Set color for the axis
            context.stroke(); // Apply the drawing stroke

            // Adding X-axis labels
            context.font = "12px Arial";
            context.textAlign = 'center';
            context.textBaseline = 'top';
            x.ticks().forEach(d => {
                context.fillText(d3.timeFormat("%Y")(d), x(d), height + 5);
            });

            // Add X-axis title
            context.fillText("Year", width / 2, height + 20); // Positioning the axis title a bit lower than the tick labels

            // Drawing the Y-axis on the left side of the plot
            context.beginPath(); // Start a new path for the Y-axis
            context.moveTo(0, 0); // Start from the top left corner of the plot
            context.lineTo(0, height); // Draw line to the bottom left corner
            context.stroke(); // Apply the stroke

            // Adding Y-axis labels
            context.textAlign = 'right';
            context.textBaseline = 'middle';
            y.ticks(10).forEach(d => {
                context.fillText(d, -10, y(d)); // Position the labels to the left of the axis
            });

            // Draw tick marks for the Y-axis
            y.ticks(10).forEach(d => {
                context.beginPath(); // Start a new path for each tick mark to ensure they are not connected
                context.moveTo(-10, y(d)); // Start from a bit left of the axis
                context.lineTo(0, y(d)); // Draw to the axis line
                context.stroke(); // Apply the stroke
            });

            context.restore();

            // Rotate and position the Y-axis label
            context.save();
            context.translate(margin.left - 60, margin.top + height / 2); // Move context to the center of the y-axis
            context.rotate(-Math.PI / 2); // Rotate context to make the text vertical
            context.font = "12px Arial";
            context.textAlign = "center";
            context.fillText("Emissions- MT-CO2", 0, 0); // Center the text at the rotated origin
            context.restore();
        }
        

    }).catch(function(error) {
        console.error("Error loading or processing data:", error);
    });
});

