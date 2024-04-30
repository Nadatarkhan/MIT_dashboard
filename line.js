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

    const margin = {top: 50, right: 30, bottom: 40, left: 100},
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
                        label.style.fontSize = '10px';

                        // Change the label text based on the value
                        if (value === "bau") {
                            label.textContent = "Business as usual"; // Changed to more descriptive text
                        } else if (value === "cheap_ng") {
                            label.textContent = "Cheap Natural Gas"; // Change for "cheap_ng"
                        } else if (value === "decarbonization") {
                            label.textContent = "95% Decarbonization"; // Change for "decarbonization"
                        } else {
                            label.textContent = value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
                        }

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

// Scenario button functionality
        const scenarioButton = document.getElementById('baselineButton');
        if (scenarioButton) {
            scenarioButton.addEventListener('click', function() {
                const isActive = this.classList.contains('active');
                this.classList.toggle('active', !isActive);

                // Update the text based on the button's active state
                this.textContent = !isActive ? "Deactivate Scenario" : "Activate Scenario";

                const scenarioValue = 'baseline';  // This should be the identifier for the scenario
                const field = 'scenarioField'; // Replace 'scenarioField' with the actual field name relevant to your data
                if (!isActive) {
                    // Activating the scenario
                    if (!filters[field]) {
                        filters[field] = [];
                    }
                    if (!filters[field].includes(scenarioValue)) {
                        filters[field].push(scenarioValue);
                    }
                } else {
                    // Deactivating the scenario
                    filters[field] = filters[field].filter(v => v !== scenarioValue);
                    if (filters[field].length === 0) {
                        delete filters[field];
                    }
                }

                updatePlot();  // Call to update the plot reflecting the current filters state
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
                    // Update the filters based on whether Scenario 1 is active
                    filters[field] = active ? ['full', 'partial'] : [];

                    // Select all checkboxes related to the 'nuclear' field that match 'full' or 'partial'
                    document.querySelectorAll(`.icon-container[data-field="${field}"] input`).forEach(checkbox => {
                        if (['full', 'partial'].includes(checkbox.value)) {
                            checkbox.checked = active; // Set checkbox state based on Scenario 1 activation
                        }
                    });
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
                context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
                drawAxis(); // Draw axes even if no data
                return;
            }

            x.domain(d3.extent(filteredData, d => d.year));
            y.domain([0, d3.max(filteredData, d => d.emission)]);

            context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
            context.save();
            context.translate(margin.left, margin.top);

            filteredData.forEach((d, i) => {
                if (i > 0) {
                    context.beginPath();
                    context.moveTo(x(filteredData[i - 1].year), y(filteredData[i - 1].emission));
                    context.lineTo(x(d.year), y(d.emission));
                    context.lineWidth = 0.2;
                    context.strokeStyle = getColor(d.field, d.value);
                    context.stroke();
                    context.closePath();
                }
            });

            context.restore();
            drawAxis();
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

            context.beginPath();
            context.moveTo(0, height);
            context.lineTo(width, height);
            context.strokeStyle = 'black';
            context.stroke();

            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(0, height);
            context.stroke();

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

            // Draw red circle at 180,000 on the y-axis
            context.beginPath();
            context.arc(0, y(180000), 8, 0, 2 * Math.PI);
            context.fillStyle = 'rgba(148,54,51,0.73)';
            context.fill();

            context.textAlign = 'center';
            context.textBaseline = 'top';
            x.ticks().forEach(d => {
                context.fillText(d3.timeFormat("%Y")(d), x(d), height + 5);
            });

            context.fillText("Year", width / 2, height + 20);
            context.restore();

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
