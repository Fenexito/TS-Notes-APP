/**
 * @file theme-manager.js
 * @summary Manages theme switching (light/dark) and persists the user's choice.
 */

export function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) {
        console.warn('Theme toggle switch not found. Theming will not be available.');
        return;
    }

    // Function to apply the theme by setting the class on the body
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.checked = true;
        } else {
            document.body.classList.remove('dark-theme');
            themeToggle.checked = false;
        }
    };

    // Listen for changes on the toggle switch
    themeToggle.addEventListener('change', () => {
        const newTheme = themeToggle.checked ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme); // Save preference to localStorage
        applyTheme(newTheme);
    });

    // Determine the initial theme on page load
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    let initialTheme;
    if (savedTheme) {
        // Use saved theme if it exists
        initialTheme = savedTheme;
    } else {
        // Otherwise, respect the user's OS-level preference
        initialTheme = systemPrefersDark ? 'dark' : 'light';
    }

    applyTheme(initialTheme);

    // Also, listen for OS-level theme changes if the user hasn't set a preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        const newColorScheme = e.matches ? 'dark' : 'light';
        // Only apply if the user hasn't manually overridden the theme
        if (!localStorage.getItem('theme')) {
            applyTheme(newColorScheme);
        }
    });
}