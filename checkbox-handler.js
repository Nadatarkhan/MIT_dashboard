// create a new file named 'checkbox-handler.js'
document.addEventListener('DOMContentLoaded', function() {
    const selectAllBaselineCheckbox = document.getElementById('select-all-baseline');
    if (selectAllBaselineCheckbox) {
        selectAllBaselineCheckbox.addEventListener('change', function() {
            const baselineCheckboxes = document.querySelectorAll('.icon-container:not(.icon-container-2) input[name="baselineFilter"]');
            baselineCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }
});
