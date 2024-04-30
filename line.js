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
                const iconContainer = document.querySelector(`.icon-container-2[data-field="${field}"]`);
                if (iconContainer) {
                    const form = document.createElement('form');
                    form.style.display = 'flex';
                    form.style.flexDirection = 'column';

                    const options = ['bau', 'cheap_ng', 'decarbonization'];
                    options.forEach(value => {
                        const checkboxContainer = document.createElement('div');
                        checkboxContainer.style.display = 'flex';
                        checkboxContainer.style.alignItems = 'center';

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
                        form.appendChild(checkboxContainer);

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

// Baseline button functionality
        const baselineButton = document.getElementById('baselineButton');
        if (baselineButton) {
            baselineButton.addEventListener('click', function() {
                // Determine whether to activate or deactivate based on the button text
                const activate = this.textContent === "Baseline";

                // Loop over all checkboxes related to the 'baseline' filter, replicating the checkbox behavior
                document.querySelectorAll('input[name$="Filter"][value="baseline"]').forEach(checkbox => {
                    checkbox.checked = activate; // Set the state based on the button
                    const field = checkbox.id.split('-')[0]; // Extract the field from ID

                    // Ensure the filters object is up-to-date
                    if (!filters[field]) {
                        filters[field] = [];
                    }

                    // Update or clear the filter based on button state
                    const baselineIndex = filters[field].indexOf('baseline');
                    if (activate && baselineIndex === -1) {
                        filters[field].push('baseline');
                    } else if (!activate && baselineIndex !== -1) {
                        filters[field].splice(baselineIndex, 1);
                    }
                });

                // Update the button text based on its current state
                this.textContent = activate ? "Remove Baseline" : "Baseline";

                updatePlot(); // Call to update the plot
            });
        }


        //Scenario 1 Function

        const scenario1Button = document.getElementById('scenario1Button');
        let scenario1Active = false;  // Track the state of Scenario 1 activation

        if (scenario1Button) {
            scenario1Button.addEventListener('click', function() {
                scenario1Active = !scenario1Active;  // Toggle the active state
                this.textContent = scenario1Active ? "Deactivate Scenario 1" : "Activate Scenario 1"; // Update button text
                updateFiltersForScenario1(scenario1Active);  // Update the filters based on new state
                updatePlot();  // Re-draw the plot with updated filters
            });
        }

        function updateFiltersForScenario1(active) {
            fields.forEach(field => {
                if (field === 'nuclear') {
                    filters[field] = active ? ['full', 'partial'] : [];  // Set or clear the nuclear filters
                }
            });
        }
        

        function updatePlot() {
            console.log("Updating plot with current filters:", filters);
            const filteredData = emissionsData.filter(d => {
                return Object.keys(filters).every(field =>
                    filters[field].length === 0 || filters[field].includes(d[field])
                );
            });

            if (filteredData.length === 0) {
                console.log("No data to display.");
                return; // Exit if no data to plot after filtering
            }

            x.domain(d3.extent(filteredData, d => d.year));
            y.domain([0, d3.max(filteredData, d => d.emission)]);

            context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
            context.save();
            context.translate(margin.left, margin.top);

            // Drawing the line chart
            context.beginPath();
            const line = d3.line()
                .x(d => x(d.year))
                .y(d => y(d.emission))
                .context(context);
            line(filteredData); // Draw the line
            context.lineWidth = 0.2;
            context.strokeStyle = scenario1Active ? '#00897b' : getColor(filteredData[0].field, filteredData[0].value);
            context.stroke(); // Apply the stroke to draw the line
            context.closePath();
            context.restore();

            drawAxis(); // Ensure axes are drawn after the line
        }

        function getColor(field, value) {
            if (scenario1Active) {
                return '#00897b'; // Teal color for Scenario 1
            }
            return '#565656'; // Default color for all other cases
        }



        function drawAxis() {
            context.save();
            context.translate(margin.left, margin.top);

            // Draw the X-axis
            context.beginPath();
            context.moveTo(0, height);
            context.lineTo(width, height);
            context.strokeStyle = 'black';
            context.stroke();

            // Draw the Y-axis
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(0, height);
            context.stroke();

            // Axis labels and ticks
            context.font = "12px Arial";
            context.textAlign = 'right';
            context.textBaseline = 'middle';
            y.ticks().forEach(d => {
                context.fillText(d, -10, y(d));
                context.beginPath();
                context.moveTo(-10, y(d));
                context.lineTo(0, y(d));
                context.stroke();
            });

            context.textAlign = 'center';
            context.textBaseline = 'top';
            x.ticks().forEach(d => {
                context.fillText(d3.timeFormat("%Y")(d), x(d), height + 5);
            });

            context.fillText("Year", width / 2, height + 20);

            context.restore();

            // Y-axis label
            context.save();
            context.translate(margin.left - 60, margin.top + height / 2);
            context.rotate(-Math.PI / 2);
            context.textAlign = "center";
            context.fillText("Emissions- MT-CO2", 0, 0);
            context.restore();
        }

    }).catch(function(error) {
        console.error("Error loading or processing data:", error);
    });
});
