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

// 2 csvs
    Promise.all([
        d3.csv("data/data_1.csv"),
        d3.csv("data/data_2.csv")
    ]).then(function(files) {
        // files[0] is data from data_1.csv, files[1] is from data_2.csv

        // Concatenate the data arrays from both files
        const concatenatedData = files[0].concat(files[1]);

        // Map and process the concatenated data
        const emissionsData = concatenatedData.map(d => ({
            year: new Date(d.epw_year),
            emission: +d.Emissions / 1000,
            scenario: d.Scenario,
            ...fields.reduce((acc, field) => ({...acc, [field]: d[field]}), {})
        }));
            //.sort((a, b) => a.scenario - b.scenario || a.year - b.year);
        updateTechSchematicDropdown(emissionsData); // Call initially to populate dropdown
    }).catch(error => {
        console.error("NT-Error loading or processing data:", error);


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




        // reset buttons
        function resetBaselineFilters() {
            document.querySelectorAll(`input[name$="Filter"][value="baseline"]`).forEach(checkbox => {
                checkbox.checked = false;
                const field = checkbox.id.split('-')[0];
                filters[field] = filters[field].filter(v => v !== 'baseline');
                if (filters[field].length === 0) {
                    delete filters[field];
                }
            });
        }

        function resetScenario1Filters() {
            const baselineFields = ['deepgeo', 'nuclear', 'ccs'];
            const partialFields = ['retrofit', 'schedules', 'lab', 'pv', 'district'];
            const gridFilters = ['bau', 'cheap_ng', 'decarbonization'];

            baselineFields.concat(partialFields, ['grid']).forEach(field => {
                document.querySelectorAll(`input[name="${field}Filter"]`).forEach(checkbox => {
                    checkbox.checked = false;
                    filters[field] = [];
                });
            });

            gridFilters.forEach(filter => {
                document.querySelectorAll(`input[name="gridFilter"][value="${filter}"]`).forEach(checkbox => {
                    checkbox.checked = false;
                });
            });
        }


// Scenario button functionality
        const baselineButton = document.getElementById('baselineButton');  // Example ID
        let baselineActive = false;  // Track the activation state of the baseline scenario

        if (baselineButton) {
            baselineButton.addEventListener('click', function() {
                baselineActive = !baselineActive;  // Toggle the activation state
                this.classList.toggle('active', baselineActive);
                this.textContent = baselineActive ? "Deactivate Scenario" : "Activate Scenario";

                const scenarioValue = 'baseline';  // This should be the identifier for the scenario
                // Toggle baseline filters
                document.querySelectorAll(`input[name$="Filter"][value="${scenarioValue}"]`).forEach(checkbox => {
                    checkbox.checked = baselineActive;
                    const field = checkbox.id.split('-')[0];

                    if (!filters[field]) {
                        filters[field] = [];
                    }

                    if (baselineActive && !filters[field].includes(scenarioValue)) {
                        filters[field].push(scenarioValue);
                    } else if (!baselineActive) {
                        filters[field] = filters[field].filter(v => v !== scenarioValue);
                        if (filters[field].length === 0) {
                            delete filters[field];  // Clean up if no more filters
                        }
                    }
                });

                // Additional logic to handle grid checkboxes
                const gridFilters = ['bau', 'cheap_ng', 'decarbonization'];  // Assuming these are the IDs or values for the grid checkboxes
                gridFilters.forEach(filter => {
                    document.querySelectorAll(`input[name="gridFilter"][value="${filter}"]`).forEach(checkbox => {
                        checkbox.checked = baselineActive;
                        if (!filters['grid']) {
                            filters['grid'] = [];
                        }
                        if (baselineActive && !filters['grid'].includes(filter)) {
                            filters['grid'].push(filter);
                        } else if (!baselineActive) {
                            filters['grid'] = filters['grid'].filter(f => f !== filter);
                            if (filters['grid'].length === 0) {
                                delete filters['grid'];  // Clean up if no more filters
                            }
                        }
                    });
                });

                updatePlot();  // Update the plot to reflect changes
            });
        }

//Scenario 1 Function
        const scenario1Button = document.getElementById('scenario1Button');
        let scenario1Active = false;  // Track the state of Scenario 1 activation

        if (scenario1Button) {
            scenario1Button.addEventListener('click', function() {
                scenario1Active = !scenario1Active;  // Toggle the active state
                this.classList.toggle('active', scenario1Active); // Toggle class for styling
                this.textContent = scenario1Active ? "Deactivate Scenario 1" : "Activate Scenario 1"; // Update button text

                // Clear existing filters when toggling this scenario
                Object.keys(filters).forEach(field => {
                    filters[field] = [];  // Clear all filters
                    document.querySelectorAll(`input[name="${field}Filter"]`).forEach(checkbox => checkbox.checked = false);
                });

                updateFiltersForScenario1(scenario1Active);  // Update the filters based on new state
                updatePlot();  // Re-draw the plot with updated filters
            });
        }

        function updateFiltersForScenario1(active) {
            const baselineFields = ['deepgeo', 'nuclear', 'ccs']; // Fields to set as 'baseline'
            const partialFields = ['retrofit', 'schedules', 'lab', 'pv', 'district']; // Fields to set as 'partial'
            const gridFilters = ['bau', 'cheap_ng', 'decarbonization'];  // Grid checkboxes

            baselineFields.forEach(field => {
                document.querySelectorAll(`input[name="${field}Filter"][value="baseline"]`).forEach(checkbox => {
                    checkbox.checked = active;
                    updateFilterArray(field, 'baseline', active);
                });
            });

            partialFields.forEach(field => {
                document.querySelectorAll(`input[name="${field}Filter"][value="partial"]`).forEach(checkbox => {
                    checkbox.checked = active;
                    updateFilterArray(field, 'partial', active);
                });
            });

            gridFilters.forEach(filter => {
                document.querySelectorAll(`input[name="gridFilter"][value="${filter}"]`).forEach(checkbox => {
                    checkbox.checked = active;
                    updateFilterArray('grid', filter, active);
                });
            });
        }

        function updateFilterArray(field, value, add) {
            if (!filters[field]) {
                filters[field] = [];
            }
            const index = filters[field].indexOf(value);
            if (add && index === -1) {
                filters[field].push(value);
            } else if (!add && index !== -1) {
                filters[field].splice(index, 1);
                if (filters[field].length === 0) {
                    delete filters[field];  // Clean up if no more filters
                }
            }
        }


        // Scenario 2 button functionality
        const scenario2Button = document.getElementById('scenario2Button');  // Make sure the ID matches your HTML
        let scenario2Active = false;  // Track the state of Scenario 2 activation

        if (scenario2Button) {
            scenario2Button.addEventListener('click', function() {
                scenario2Active = !scenario2Active;  // Toggle the active state
                this.classList.toggle('active', scenario2Active); // Toggle class for styling
                this.textContent = scenario2Active ? "Deactivate Scenario 2" : "Activate Scenario 2"; // Update button text
                if (scenario2Active) {
                    updateFiltersForScenario2();  // Update the filters based on current checkbox state when activated
                } else {
                    resetScenario2Filters();  // Reset filters when deactivated
                }
                updatePlot();  // Re-draw the plot with updated filters
            });
        }

        function updateFiltersForScenario2() {
            document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
                const field = checkbox.name.replace('Filter', '');
                const value = checkbox.value;
                updateFilterArray(field, value, true);
            });
        }

        function updateFiltersForScenario2(active) {
            const filtersToUpdate = {
                baseline: ['deepgeo', 'nuclear', 'ccs'],
                partial: ['retrofit', 'schedules', 'lab', 'pv', 'district'],
                grid: ['bau', 'cheap_ng', 'decarbonization']
            };

            // Set or reset filters based on the active state
            Object.entries(filtersToUpdate).forEach(([type, fields]) => {
                fields.forEach(field => {
                    document.querySelectorAll(`input[name="${field}Filter"][value="${type}"]`).forEach(checkbox => {
                        checkbox.checked = active; // Set checked state based on the scenario button state
                        updateFilterArray(field, type, active);
                    });
                });
            });

            // Additionally reset all checkboxes if the scenario is being deactivated
            if (!active) {
                resetAllCheckboxes();
            }
        }

// Helper function to reset all checkboxes
        function resetAllCheckboxes() {
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            // Optionally reset the filters object entirely if needed
            filters = {}; // This line can be adjusted based on how your filter logic is implemented
        }

        /*Drop down function */

        function updateTechSchematicDropdown(data) {
            const dropdown = document.getElementById('techSchematicDropdown');
            if (!dropdown) {
                console.error("Dropdown element not found");
                return; // Ensure the dropdown is present
            }

            // Gather active filters
            const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
                if (value.length > 0) acc[key] = value;
                return acc;
            }, {});

            console.log("Active Filters: ", activeFilters);

            // Filter data based on active filters, considering each part of tech_schematic
            const filteredData = data.filter(item =>
                Object.keys(activeFilters).every(field =>
                    activeFilters[field].some(val => item.tech_schematic.includes(val))
                )
            );

            // Extract unique schematics considering they could be combinations
            const techSchematics = new Set(filteredData.map(item => item.tech_schematic).filter(Boolean));
            console.log("Filtered tech_schematics: ", techSchematics);

            dropdown.innerHTML = ''; // Clear current options
            techSchematics.forEach(schematic => {
                const option = document.createElement('option');
                option.value = schematic;
                option.textContent = schematic;
                dropdown.appendChild(option);
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
                drawAxis();
                return;
            }

            x.domain(d3.extent(filteredData, d => d.year));
            y.domain([0, d3.max(filteredData, d => d.emission)]);

            context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
            context.save();
            context.translate(margin.left, margin.top);

            let lastScenario = null; // Variable to track the last scenario processed
            filteredData.forEach((d, i) => {
                if (i > 0 && d.scenario === filteredData[i - 1].scenario) {
                    context.beginPath(); // Start a new path for each line segment
                    context.moveTo(x(filteredData[i - 1].year), y(filteredData[i - 1].emission));
                    context.lineTo(x(d.year), y(d.emission));

                    // Check if the current scenario is considered active
                    const isActive = filters[d.scenario] && filters[d.scenario].includes('active');

                    // Determine the color and thickness of the line based on the active filters
                    const { color, lineWidth } = getColor(d.scenario, isActive);
                    context.strokeStyle = color;
                    context.lineWidth = lineWidth;
                    context.stroke(); // Execute the drawing
                }
                lastScenario = d.scenario; // Update the last scenario
            });

            context.restore();
            drawAxis();
        }

        function getColor(scenario, isActive) {
            if (isActive) {
                context.lineWidth = 0.5; // Make lines thicker when filter is active
                switch(scenario) {
                    case 'baseline':
                        return '#b937b8'; // Purple for Baseline
                    case 'scenario1':
                        return '#00897b'; // Teal for Scenario 1
                    case 'scenario2':
                        return '#b64f1d'; // Orange for Scenario 2
                    default:
                        return '#6e6e6e'; // Default color if scenario is not matched
                }
            } else {
                context.lineWidth = 0.5; // Standard line thickness
                return 'rgba(108,108,108,0.8)'; // Default semi-transparent grey
            }
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
            context.arc(0, y(180000), 3, 0, 2 * Math.PI);
            context.fillStyle = 'rgba(12,12,12,0.73)';
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
