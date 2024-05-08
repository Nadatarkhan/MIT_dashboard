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

    const margin = {top: 30, right: 30, bottom: 30, left: 100},
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
        context.font = "italic 14px Arial";  // Adjust font size dynamically if needed
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
        const emissionsData = concatenatedData.map(d => {
            //console.log("Tech Schematic:", d.tech_schematic);  // Debugging line to see what is loaded
            return {
                year: new Date(d.epw_year),
                emission: +d.Emissions / 1000,
                scenario: d.Scenario,
                tech_schematic: d.tech_schematic,  // Explicitly handling tech_schematic
                ...fields.reduce((acc, field) => ({...acc, [field]: d[field]}), {})
            };
        });
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
                        context.strokeStyle = '#808080'; // Default grey color
                        context.lineWidth = 1;
                    }
                    context.stroke();
                }
            });
        }

        function drawSpecialScenarios(data) {
            const specialScenarios = [0, 2, 18, 20, 54, 56, 72, 74, 243, 245, 261, 263, 297, 299, 315, 317];
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
            const bestScenarios = [3240, 9799, 16360, 22919, 29478, 36039];
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

        baselineToggle.addEventListener('change', function() {
            toggleBaselineActive = this.checked;
            updatePlot();  // Update the plot based on toggle state
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

            // Set y-axis to always reach up to 180,000
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

            context.font = "12px Arial";
            context.textAlign = 'right';
            context.textBaseline = 'middle';
            y.ticks(10).forEach(d => {
                context.fillText(d.toLocaleString(), -10, y(d));
                context.beginPath();
                context.moveTo(-10, y(d));
                context.lineTo(width, y(d)); // Extend the line across the width
                context.strokeStyle = '#ccc'; // Light grey color for the horizontal lines
                context.stroke();
            });

            context.textAlign = 'center';
            context.textBaseline = 'top';
            // Generate ticks every two years starting from 2026
            x.ticks(d3.timeYear.every(2)).forEach(d => {
                // Only label starting from 2026 to 2050
                if (d.getFullYear() >= 2026) {
                    context.fillText(d.getFullYear(), x(d), height + 5);
                }
            });

            context.fillText("Year", width / 2, height + 20);

            context.restore();
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
