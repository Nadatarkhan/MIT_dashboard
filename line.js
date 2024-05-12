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


    // Declare temporaryStorage here
    let temporaryStorage = [];

    const margin = {top: 30, right: 60, bottom: 30, left: 100},
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    let filters = {}; // Object to hold the active filters for each technology

// Define the resetAllCheckboxes function
    function resetAllCheckboxes() {
        // Reset all checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        // Reset the scenario toggles specifically if they exist
        const baselineToggle = document.getElementById('baselineToggle');
        const bestToggle = document.getElementById('best');
        if (baselineToggle) baselineToggle.checked = false;
        if (bestToggle) bestToggle.checked = false;

        // Reset the filter settings
        filters = {}; // Assuming filters are directly related to checkbox state, reset them as well

        // Reset toggle states
        toggleBaselineActive = false;
        toggleBestActive = false;

        // Update the plot to reflect the reset state
        updatePlot();
    }

// Example of how to use this function with a button
    const resetButton = document.getElementById('resetCheckboxesButton');
    resetButton.addEventListener('click', function() {
        resetAllCheckboxes();
    });



    function showInitialMessage() {
        let opacity = 0;  // Start with an opacity of 0
        let yOffset = -100;  // Start closer to the center
        const maxOpacity = 1;  // Target opacity
        const incrementOpacity = 0.05;  // Increment the opacity by this amount each frame
        const incrementYOffset = 5;  // Move the text down by 5 pixels each frame

        const maxWidth = Math.max(300, containerWidth - 100);  // Ensure a minimum maxWidth for very small screens
        const lineHeight = 20;  // Line height for wrapping text

        context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
        context.font = "12px Arial";  // Adjust font size dynamically if needed
        context.fillStyle = "#666";
        context.textAlign = "center";
        context.textBaseline = "middle";

        const text = "To explore the data, select one of the preset scenarios from the left pane or build your own! Select at least one option from each category to display the plot.";

        function fadeIn() {
            if (opacity < maxOpacity || yOffset < containerHeight / 2) {
                opacity += incrementOpacity;
                yOffset += incrementYOffset;
                context.save();
                context.globalAlpha = opacity;
                context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
                const yPos = Math.max(containerHeight / 2, yOffset + margin.top);
                wrapText(context, text, containerWidth / 2, yPos, maxWidth, lineHeight);
                context.restore();
                requestAnimationFrame(fadeIn);
            }
        }
        fadeIn();
    }


// Function to handle text wrapping
    function wrapText(context, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                context.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        context.fillText(line, x, y);
    }



    showInitialMessage();  // Display initial message when the page loads

    const fields = ['retrofit', 'schedules', 'lab', 'district', 'nuclear', 'deepgeo', 'ccs', 'pv', 'grid'];

// 2 csvs
    Promise.all([
        d3.csv("data/data_1.csv"),
        d3.csv("data/data_2.csv")
    ]).then(function(files) {

        // Concatenate the data arrays from both files
        const concatenatedData = files[0].concat(files[1]);

        // Map and process the concatenated data
        let cumulativeEmissions = {};

// Process data to extract emissions details and calculate cumulative emissions
        const emissionsData = concatenatedData.map(d => {
            const emission = +d.Emissions / 1000; // Convert and normalize emission data
            const scenario = d.Scenario;

            // Initialize scenario entry in cumulativeEmissions if not already present
            if (!cumulativeEmissions[scenario]) {
                cumulativeEmissions[scenario] = { totalEmissions: 0 };
            }

            // Accumulate emissions for each scenario
            cumulativeEmissions[scenario].totalEmissions += emission;

            // Return structured data for further processing or visualization
            return {
                year: new Date(d.epw_year),
                emission,
                scenario,
                tech_schematic: d.tech_schematic,
                ...fields.reduce((acc, field) => ({...acc, [field]: d[field]}), {})
            };
        });

// Initialize filters with the cumulative emissions data
        initFilters(cumulativeEmissions);

        //.sort((a, b) => a.scenario - b.scenario || a.year - b.year);

        window.tryUpdateDropdown = function() {
            const dropdown = document.getElementById('techSchematicDropdown');
            const techImage = document.getElementById('techImage');

            if (!dropdown || !techImage) {
                console.error('Dropdown or image element not found');
                return;
            }

            // Collect all currently active filters
            const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
                if (value.length > 0) acc[key] = value;
                return acc;
            }, {});

            console.log("Filtered active filters", activeFilters);

            // Filter emissionsData based on active filters
            const filteredData = emissionsData.filter(item =>
                Object.keys(activeFilters).every(field => activeFilters[field].includes(item[field]))
            );

            console.log("Filtered data:", filteredData);

            // Extract unique tech_schematic values from the filtered data
            const techSchematics = Array.from(new Set(filteredData.map(item => item.tech_schematic)));

            // Clear the dropdown and populate with indexes
            dropdown.innerHTML = '';
            techSchematics.forEach((schematic, index) => {
                const option = document.createElement('option');
                option.value = schematic; // You could use index + 1 if you want to start numbering from 1
                option.textContent = index + 1; // Display just the index as the dropdown text
                dropdown.appendChild(option);
            });

            // Update the image upon selecting a schematic
            dropdown.addEventListener('change', function() {
                const selectedSchematic = dropdown.value;
                techImage.src = `images/${selectedSchematic}.png`;
                techImage.alt = selectedSchematic;
            });
        };


        /*function modifyLabelName(field, value) {
            const replacements = {
                'schedules': {'baseline': 'As is', 'partial': 'Partial', 'full': 'Full'},
                'retrofit': {'baseline': 'As is', 'partial': 'Partial', 'full': 'Full'},
                'district': {'baseline': 'Steam/chilled water loops', 'partial': 'Hot/chilled water loops', 'full': 'Ambient loop'},
                'deepgeo': {'baseline': 'None', 'partial': '2km boreholes', 'full': '20km boreholes'},
                'nuclear': {'baseline': 'None', 'partial': '10MWe reactors', 'full': '25Mwe reactors'},
                'ccs': {'baseline': 'None', 'partial': 'Post-combustion', 'full': 'Direct air'}
            };

            // Check for a replacement in the predefined dictionary; otherwise, format the value normally
            return replacements[field] && replacements[field][value] ? replacements[field][value] :
                value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
        }*/

        fields.forEach(field => {
            const iconContainer = document.querySelector(`.icon-container${field === 'grid' ? '-2' : ''}[data-field="${field}"]`);
            if (iconContainer) {
                const form = document.createElement('form');
                form.style.display = 'flex';
                form.style.flexDirection = 'column';

                const options = field === 'grid' ? ['static','bau', 'cheap_ng', 'decarbonization'] : ['baseline', 'partial', 'full'];
                const checkboxes = []; // Array to store references to all checkboxes within this field

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
                    checkboxes.push(input); // Store reference to checkbox

                    const label = document.createElement('label');
                    label.htmlFor = `${field}-${value}`;
                    label.textContent = value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
                    label.style.fontSize = '12px';

                    // Set descriptive text for grid values
                    if (field === 'grid') {
                        if (value === "bau") {
                            label.textContent = "Business as usual";
                        } else if (value === "cheap_ng") {
                            label.textContent = "Cheap Natural Gas";
                        } else if (value === "decarbonization") {
                            label.textContent = "95% Decarbonization";
                        } else if (value === "static") {
                            label.textContent = "static";
                        }
                    }

                    checkboxContainer.appendChild(input);
                    checkboxContainer.appendChild(label);
                    form.appendChild(checkboxContainer);

                    input.addEventListener('change', function() {
                        if (!filters[field]) filters[field] = [];
                        const isChecked = this.checked;
                        const value = this.value;

                        // Prevent unchecking if it's the last checked checkbox in this group
                        if (!isChecked && filters[field].length <= 1) {
                            this.checked = true; // Revert unchecking action
                            return; // Stop further execution
                        }

                        // Update filters based on checkbox state
                        if (isChecked && !filters[field].includes(value)) {
                            filters[field].push(value);
                        } else if (!isChecked) {
                            const index = filters[field].indexOf(value);
                            if (index !== -1) {
                                filters[field].splice(index, 1);
                            }
                        }

                        // Update the plot if all technologies have at least one checkbox checked
                        if (fields.every(f => filters[f] && filters[f].length > 0)) {
                            updatePlot();
                        } else {
                            // Optionally clear the plot if not all conditions are met
                            context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
                        }
                    });
                });
                iconContainer.appendChild(form);

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
            const gridFilters = ['static','bau', 'cheap_ng', 'decarbonization'];

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
        const baselineButton = document.getElementById('baselineButton');
        let baselineActive = false;  // Track the activation state of the baseline scenario
        let baselineScenarios = new Set();  // To track which scenarios are affected by the baseline button

        if (baselineButton) {
            baselineButton.addEventListener('click', function() {
                baselineActive = !baselineActive;
                this.classList.toggle('active', baselineActive);
                this.textContent = baselineActive ? "Business as Usual" : "Business as Usual";

                document.querySelectorAll(`input[name$="Filter"][value="baseline"]`).forEach(checkbox => {
                    checkbox.checked = baselineActive;
                    const field = checkbox.getAttribute('name').replace('Filter', '');
                    if (!filters[field]) {
                        filters[field] = [];
                    }
                    if (baselineActive) {
                        if (!filters[field].includes('baseline')) {
                            filters[field].push('baseline');
                        }
                    } else {
                        filters[field] = filters[field].filter(v => v !== 'baseline');
                        if (filters[field].length === 0) {
                            delete filters[field];
                        }
                    }
                });

                // Ensure all relevant scenario identifiers are correctly captured or removed
                const allScenarios = emissionsData.map(d => d.scenario);
                if (baselineActive) {
                    allScenarios.forEach(scenario => baselineScenarios.add(scenario));
                } else {
                    baselineScenarios.clear();
                }

                console.log("Current baselineScenarios:", Array.from(baselineScenarios));
                console.log("Filters after update:", filters);

                // Sync the state of grid-related checkboxes with the baseline button
                const gridFilters = ['static','bau', 'cheap_ng', 'decarbonization'];  // Grid scenario identifiers
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

                updatePlot();  // Redraw the plot with the new settings
            });
        }






//Scenario 1 Function
        const scenario1Button = document.getElementById('scenario1Button');
        let scenario1Active = false;  // Track the activation state of Scenario 1

        if (scenario1Button) {
            scenario1Button.addEventListener('click', function() {
                scenario1Active = !scenario1Active;  // Toggle the activation state
                this.classList.toggle('active', scenario1Active);
                this.textContent = scenario1Active ? "Best Practice" : "Best Practice";

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
            const gridFilters = ['static','bau', 'cheap_ng', 'decarbonization'];  // Grid checkboxes

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


// Scenario 2
        const scenario2Button = document.getElementById('scenario2Button');
        let isRecording = false;
        let recordedLines = []; // Ensure this is defined here if not already globally defined

        scenario2Button.addEventListener('click', function() {
            isRecording = !isRecording;
            this.textContent = isRecording ? "Stop Recording" : "Scenario 2";
            this.classList.toggle('active', isRecording);
            const toggle = document.getElementById('scenario2Toggle');

            if (toggle.checked !== isRecording) {
                toggle.click();
            }

            if (isRecording) {
                resetAllCheckboxes();
                recordedLines = [];
            } else {
                drawRecordedLines(recordedLines);
                updatePlot();  // Optionally redraw the entire plot to re-align everything
            }
        });


        // Toggle visibility event listener and function
        let lightBulbOn = false; // Track the state of the lightbulb toggle
        const lightBulbToggle = document.getElementById('scenario2Toggle');
        lightBulbToggle.addEventListener('change', function() {
            if (this.checked) {
                if (!fields.every(field => filters[field] && filters[field].length > 0)) {
                    // If no filters are active and no plot is currently shown, clear and prepare to draw just the axes and lines
                    context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
                    drawAxis();  // Draw axes first
                }
                drawRecordedLines(recordedLines); // Then draw the recorded lines over the axes
            } else {
                context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
                updatePlot(); // Redraw the plot without the recorded lines
            }
        });



        function drawRecordedLines(lines) {
            context.save();  // Save the current state of the context
            context.translate(margin.left, margin.top);  // Ensure this translation matches exactly as in the main plot drawing

            lines.forEach(line => {
                context.beginPath();
                context.moveTo(x(line.start.year), y(line.start.emission));
                context.lineTo(x(line.end.year), y(line.end.emission));
                context.strokeStyle = line.color;
                context.lineWidth = line.lineWidth;
                context.stroke();
            });

            context.restore();  // Restore the context to the saved state, undoing the translation
        }



// Helper function to reset all checkboxes
        function resetAllCheckboxes() {
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            // Optionally reset the filters object entirely if needed
            filters = {}; // This line can be adjusted based on how your filter logic is implemented
        }


////Filter Code for Emissions slider//
        function initFilters(cumulativeEmissionsData) {
            const container = document.getElementById('innovation_plot');
            if (!container) {
                console.error("Container for innovation plot not found");
                return;
            }

            const margin = { top: 10, right: 50, bottom: 30, left: 50 },
                width = container.clientWidth - margin.left - margin.right,
                height = 80 - margin.top - margin.bottom;

            // Load the data
            d3.csv("data/example_data.csv").then(function(data) {
                const metrics = ['Emissions', 'Innovation', 'Cost', 'Risk'];

                metrics.forEach((metric, index) => {
                    let metricData;
                    if (metric === 'Emissions') {
                        // Use cumulative emissions data for the 'Emissions' histogram
                        metricData = Object.values(cumulativeEmissionsData).map(item => item.totalEmissions);
                    } else {
                        // Continue using data from example_data.csv for other metrics
                        metricData = data.map(d => parseFloat(d[metric]));
                    }

                    // Create a new container for each metric
                    const metricContainer = container.appendChild(document.createElement('div'));
                    metricContainer.classList.add('metric-container');
                    metricContainer.style.marginBottom = '20px';

                    // Append SVG canvas to the container
                    const svg = d3.select(metricContainer)
                        .append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                        .append("g")
                        .attr("transform", `translate(${margin.left},${margin.top})`);

                    // Set up the x and y scales
                    const x = d3.scaleLinear()
                        .domain(d3.extent(metricData))
                        .range([0, width]);
                    const y = d3.scaleLinear()
                        .range([height, 0])
                        .domain([0, d3.max(metricData, d => d) * 0.1]);  // Adjusting to show up to 10% of the highest value

                    // Create histogram bins
                    const histogram = d3.histogram()
                        .value(d => d)
                        .domain(x.domain())
                        .thresholds(x.ticks(40));
                    const bins = histogram(metricData);

                    // Compute y scale domain based on the maximum bin count
                    y.domain([0, d3.max(bins, d => d.length)]);

                    // Append bars for histogram
                    svg.selectAll("rect")
                        .data(bins)
                        .enter().append("rect")
                        .attr("x", 1)
                        .attr("transform", d => `translate(${x(d.x0)},${y(d.length)})`)
                        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
                        .attr("height", d => height - y(d.length))
                        .style("fill", "#424242");

                    // Add the axes
                    svg.append("g")
                        .attr("transform", `translate(0,${height})`)
                        .call(d3.axisBottom(x));
                    svg.append("g")
                        .call(d3.axisLeft(y).tickFormat(""));

                    // Append slider only for 'Emissions' to directly affect the line plot
                    if (metric === 'Emissions') {
                        const slider = d3.sliderHorizontal()
                            .min(d3.min(metricData))
                            .max(d3.max(metricData))
                            .width(width)
                            .default([d3.min(metricData), d3.max(metricData)])
                            .fill('#6b6b6b')
                            .on('onchange', val => {
                                console.log("Slider values changed to:", val);  // Check what values are received
                                updateLinePlotVisibility(val, cumulativeEmissionsData);
                            });

                        // Append slider to container
                        const sliderContainer = d3.select(metricContainer)
                            .append('div')
                            .classed('slider-container', true)
                            .style('width', width + 'px')
                            .append('svg')
                            .attr('width', width + margin.left + margin.right)
                            .attr('height', 50)
                            .append('g')
                            .attr('transform', 'translate(' + margin.left + ', 7)')
                            .call(slider);
                    }
                });
            }).catch(function(error) {
                console.error("Error loading or processing data:", error);
            });
        }

        //////////

        let currentlyDisplayedScenarios = [];


        function updateLinePlotVisibility(range, cumulativeEmissionsData) {
            const [minVal, maxVal] = range;
            const visibleScenarios = Object.keys(cumulativeEmissionsData)
                .filter(key => cumulativeEmissionsData[key].totalEmissions >= minVal && cumulativeEmissionsData[key].totalEmissions <= maxVal)
                .map(key => key);

            // Assuming updatePlot function or similar to redraw the line plot
            updatePlot(visibleScenarios);  // You may need to modify updatePlot to accept scenario filters
        }



        function updatePlot() {
            console.log("Updating plot with current filters:", filters);

            // Clear the canvas and draw the base axis first, regardless of data state
            context.clearRect(0, 0, containerWidth * dpi, containerHeight * dpi);
            drawAxis();  // Draw axes first to ensure they are behind the plot lines

            // Check if there are any active filters or if either toggle is active
            const anyActiveFilters = fields.some(field => filters[field] && filters[field].length > 0);

            // Check conditions for drawing
            if (!anyActiveFilters && !toggleBaselineActive && !toggleBestActive) {
                console.log("Not all conditions met for drawing plot.");
                showInitialMessage();  // Display message indicating the need to select filters
                return; // Exit the function if no filters are active and no toggles are active
            }

            // Filter data based on active filters if any
            let filteredData = [];
            if (anyActiveFilters) {
                filteredData = emissionsData.filter(d =>
                    Object.keys(filters).every(field =>
                        filters[field].length > 0 && filters[field].includes(d[field])
                    )
                );
            }

            // If no data matches filters and toggles are not active
            if (filteredData.length === 0 && !toggleBaselineActive && !toggleBestActive) {
                console.log("No data to display.");
                return;
            }

            // Update domains for scales based on existing data or full dataset if toggles are active
            if (filteredData.length > 0 || toggleBaselineActive || toggleBestActive) {
                x.domain(d3.extent(emissionsData, d => new Date(d.year)));
                y.domain([0, d3.max(emissionsData, d => d.emission)]);
            }

            context.save();
            context.translate(margin.left, margin.top);

            // Log scenarios that meet the current filter conditions
            console.log("Scenarios meeting current conditions:", filteredData.map(d => d.scenario));


            // Draw all applicable lines based on filters, if any are active
            if (anyActiveFilters) {
                drawLines(filteredData);
            }

            // Draw special scenarios if the baseline toggle is active
            if (toggleBaselineActive) {
                drawSpecialScenarios(emissionsData);
            }

            // Draw best scenarios if the best toggle is active
            if (toggleBestActive) {
                drawBestScenarios(emissionsData);
            }

            context.restore();

            // Redraw recorded lines if the lightbulb is on
            if (lightBulbOn) {
                drawRecordedLines(recordedLines);
            }
        }


        function drawLines(data) {
            data.forEach((d, i) => {
                if (i > 0 && d.scenario === data[i - 1].scenario) {
                    context.beginPath();
                    context.moveTo(x(data[i - 1].year), y(data[i - 1].emission));
                    context.lineTo(x(d.year), y(d.emission));

                    if (isRecording) {
                        context.strokeStyle = '#dc5d5d'; // Orange for scenario 2
                        context.lineWidth = 1.2;
                        recordedLines.push({start: data[i - 1], end: d, color: '#dc5d5d', lineWidth: 1.2});
                    } else {
                        context.strokeStyle = '#4b4b4b'; // Default grey color
                        context.lineWidth = 1.2;
                    }
                    context.stroke();
                }
            });
        }

        function drawSpecialScenarios(data) {
            const specialScenarios = [0, 6561, 13100, 19661, 32783, 39323];
            data.filter(d => specialScenarios.includes(Number(d.scenario))).forEach((d, i, arr) => {
                if (i > 0 && d.scenario === arr[i - 1].scenario) {
                    context.beginPath();
                    context.moveTo(x(new Date(arr[i - 1].year)), y(arr[i - 1].emission));
                    context.lineTo(x(new Date(d.year)), y(d.emission));
                    context.strokeStyle = '#b937b8'; // Purple for special scenarios
                    context.lineWidth = 2;
                    context.stroke();
                }
            });
        }

        function drawBestScenarios(data) {
            const bestScenarios = [3241, 9792, 16341, 22902, 36013];
            data.filter(d => bestScenarios.includes(Number(d.scenario))).forEach((d, i, arr) => {
                if (i > 0 && d.scenario === arr[i - 1].scenario) {
                    context.beginPath();
                    context.moveTo(x(new Date(arr[i - 1].year)), y(arr[i - 1].emission));
                    context.lineTo(x(new Date(d.year)), y(d.emission));
                    context.strokeStyle = '#23756b'; // Green for best scenarios
                    context.lineWidth = 2;
                    context.stroke();
                }
            });
        }


        const baselineToggle = document.getElementById('baselineToggle');
        let toggleBaselineActive = baselineToggle.checked;  // Control visibility of special scenario lines
        const baselineText = document.getElementById('baselineText'); // Get the text element

        baselineToggle.addEventListener('change', function() {
            toggleBaselineActive = this.checked;
            updatePlot();  // Update the plot based on toggle state
            if (toggleBaselineActive) {
                baselineText.classList.add('purple-text');  // Turn text purple when toggle is active
            } else {
                baselineText.classList.remove('purple-text');  // Remove purple color when toggle is not active
            }
        });


        const bestToggle = document.getElementById('best');
        let toggleBestActive = bestToggle.checked;  // Control visibility of best scenario lines

        bestToggle.addEventListener('change', function() {
            toggleBestActive = this.checked;
            updatePlot();  // Update the plot based on toggle state
        });




        function drawAxis() {
            context.save();
            context.translate(margin.left, margin.top);

            // Set y-axis to always reach up to 180,000 for emissions
            y.domain([0, 200000]);

            // Define the x-axis to cover from 2025 to 2050, but start labeling from 2026
            x.domain([new Date(2025, 0, 1), new Date(2050, 0, 1)]);

            context.beginPath();
            context.moveTo(0, height);
            context.lineTo(width, height);
            context.strokeStyle = 'black';
            context.stroke();

            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(0, height);
            context.stroke();

            // Unified font settings for all axis labels
            context.font = "12px Arial";
            context.fillStyle = 'black'; // Ensure consistent color for text
            context.textAlign = 'right';
            context.textBaseline = 'middle';
            y.ticks(10).forEach(d => {
                context.fillText(d.toLocaleString(), -10, y(d));
                context.beginPath();
                context.moveTo(-10, y(d));
                context.lineTo(width, y(d)); // Extend the line across the width
                context.strokeStyle = '#e1e1e1'; // Light grey color for the horizontal lines
                context.lineWidth = 0.5;  // Set the line width for horizontal grid lines
                context.stroke();
            });

            context.textAlign = 'center';
            context.textBaseline = 'top';
            x.ticks(d3.timeYear.every(2)).forEach(d => {
                if (d.getFullYear() >= 2026) {
                    context.fillText(d.getFullYear(), x(d), height + 5);
                }
            });

            context.fillText("Year", width / 2, height + 20);
            context.restore();

            // Secondary Y-axis for Percent Reduction
            context.save();
            const yRight = d3.scaleLinear()
                .domain([1, 0])  // 100% to 0%
                .range([height, 0]);

            context.translate(width + margin.right + 65, margin.top);  // Adjust for right edge alignment
            context.textAlign = "right";
            context.fillStyle = 'black'; // Ensure the same color as the primary Y-axis
            yRight.ticks(10).forEach(d => {
                context.fillText((d * 100).toFixed(0) + '%', 10, yRight(d));  // Removed small ticks drawing
            });

            context.textAlign = "center";
            context.translate(24, height / 2);  // Move closer to the axis for label
            context.rotate(-Math.PI / 2);
            context.fillText("% Emissions Reduction", 0, 0);

            context.restore();

            // Primary Y-axis title for Emissions
            context.save();
            context.translate(margin.left - 60, margin.top + height / 2);
            context.rotate(-Math.PI / 2);
            context.textAlign = "center";
            context.fillText("Emissions (MT-CO2)", 0, 0);
            context.restore();
        }



    }).catch(function(error) {
        console.error("Error loading or processing data:", error);
    });
});


//TOOLTIPS

const canvas = document.querySelector('canvas');
const tooltip = document.getElementById('tooltip');

canvas.addEventListener('mousemove', function(event) {
    const rect = this.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hoverData = checkHover(x, y);

    if (hoverData) {
        tooltip.style.display = 'block';
        tooltip.style.left = event.pageX + 'px';
        tooltip.style.top = (event.pageY + 20) + 'px';
        tooltip.textContent = hoverData.tooltipText;  // Set tooltip text based on data
    } else {
        tooltip.style.display = 'none';
    }
});

function checkHover(mouseX, mouseY) {
    // Tolerance in pixels around the line
    const tolerance = 5;

    for (let data of emissionsData) {
        // Calculate line start and end positions
        let startX = xScale(new Date(data.start.year));  // Assume xScale and yScale are set up
        let startY = yScale(data.start.emission);
        let endX = xScale(new Date(data.end.year));
        let endY = yScale(data.end.emission);

        // Check if mouse is near the line
        if (Math.abs(mouseY - startY) < tolerance && mouseX >= startX && mouseX <= endX) {
            return { tooltipText: `Scenario: ${data.scenario}, Emission: ${data.emission}` };
        }
    }

    return null;
}