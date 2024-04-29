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

            context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
            context.save();
            context.translate(margin.left, margin.top);

            const line = d3.line()
                .x(d => x(d.year))
                .y(d => y(d.emission))
                .context(context);

            context.beginPath();
            line(filteredData);
            context.lineWidth = 0.2;
            context.strokeStyle = filteredData.length > 0 ? getColor(filteredData[0].field, filteredData[0].value) : 'steelblue';
            context.stroke();

            context.restore();

            drawAxis();
        }

        function drawAxis() {
            context.save();
            context.translate(margin.left, margin.top + height);  // Ensure we're starting from the bottom left

            // Drawing the X-axis
            context.font = "12px Arial";
            x.ticks().forEach(d => {
                context.fillText(d3.timeFormat("%Y")(d), x(d), 20);  // X-axis tick labels
            });

            context.fillText("Year", width / 2, 35);  // X-axis title
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(width, 0);
            context.stroke();
            context.restore();

            // Drawing the Y-axis line, ticks, and labels
            context.save();
            context.translate(margin.left, margin.top);  // Start from the top left corner of the plot area
            context.font = "12px Arial";  // Font for Y-axis tick labels

            // Y-axis line
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(0, height);  // Draw line downward to match the height of the plot
            context.stroke();

            // Correct the Y-axis ticks and labels (not inverted, moved further left)
            y.ticks().forEach(d => {
                const yPosition = y(d);  // This directly uses the D3 scale to calculate the position, ensuring correct orientation.
                context.fillText(d, -50, yPosition);  // Increased offset to -50 to move labels further left
                // Draw tick marks
                context.beginPath();
                context.moveTo(-10, yPosition);  // Start of tick mark (further left)
                context.lineTo(0, yPosition);  // End of tick mark (on the axis line)
                context.stroke();
            });

            context.restore();

            // Rotate and position the Y-axis label
            context.save();
            context.font = "12px Arial";
            context.translate(margin.left, margin.top + height / 2);  // Center along the Y-axis
            context.rotate(-Math.PI / 2);  // Rotate 90 degrees to make the text vertical
            context.textAlign = "center";  // Center align text
            context.fillText("Emissions- MT-CO2", 0, -70);  // Increased the offset to -120 to move label further left
            context.restore();
        }



    }).catch(function(error) {
        console.error("Error loading or processing data:", error);
    });
});

