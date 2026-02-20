/**
 * Habit Tracker Application
 * 
 * Features:
 * - Add, edit, and delete habits
 * - Daily check-in tracking
 * - Streak tracking (current streak + longest streak)
 * - localStorage persistence
 * - Automatic date change detection
 * - Edge case handling
 */

// ============================================
// State Management
// ============================================

/**
 * Application state
 * @type {Object}
 */
const state = {
    habits: [],
    lastCheckedDate: null, // Track last date check-in was performed
};

// ============================================
// Date Utilities
// ============================================

/**
 * Get today's date as YYYY-MM-DD string
 * @returns {string} Today's date in ISO format
 */
function getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * Get yesterday's date as YYYY-MM-DD string
 * @returns {string} Yesterday's date in ISO format
 */
function getYesterdayDateString() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
}

/**
 * Check if a date string is today
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if the date is today
 */
function isToday(dateString) {
    return dateString === getTodayDateString();
}

/**
 * Check if a date string is yesterday
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if the date is yesterday
 */
function isYesterday(dateString) {
    return dateString === getYesterdayDateString();
}

/**
 * Get the number of days between two dates
 * @param {string} date1 - First date string (YYYY-MM-DD)
 * @param {string} date2 - Second date string (YYYY-MM-DD)
 * @returns {number} Number of days difference
 */
function getDaysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// ============================================
// Streak Calculation Logic
// ============================================

/**
 * Calculate streaks for a habit based on check-in history
 * 
 * Streak Logic:
 * - Current streak: Consecutive days from today backwards
 * - Longest streak: Maximum consecutive days in history
 * - Streak resets if a day is missed
 * 
 * @param {Object} habit - Habit object with checkIns array
 * @returns {Object} Object containing currentStreak and longestStreak
 */
function calculateStreaks(habit) {
    if (!habit.checkIns || habit.checkIns.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    // Sort check-ins by date (newest first)
    const sortedCheckIns = [...habit.checkIns]
        .map(date => date.split('T')[0]) // Handle potential datetime strings
        .filter((date, index, self) => self.indexOf(date) === index) // Remove duplicates
        .sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

    if (sortedCheckIns.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    const today = getTodayDateString();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate current streak (only counts if checked in TODAY)
    // Current streak = consecutive days including today, backwards
    const mostRecentCheckIn = sortedCheckIns[0];
    
    // Only calculate current streak if checked in today
    // Missing today resets the current streak to 0
    if (isToday(mostRecentCheckIn)) {
        currentStreak = 1; // Today counts as day 1
        let expectedDate = getYesterdayDateString();
        
        // Count backwards consecutive days
        for (let i = 1; i < sortedCheckIns.length; i++) {
            const checkInDate = sortedCheckIns[i];
            const daysDiff = getDaysDifference(checkInDate, expectedDate);
            
            if (daysDiff === 0) {
                // Found the expected consecutive day
                currentStreak++;
                // Calculate next expected date (one day before this check-in)
                const checkInDateObj = new Date(checkInDate);
                checkInDateObj.setDate(checkInDateObj.getDate() - 1);
                expectedDate = checkInDateObj.toISOString().split('T')[0];
            } else {
                // Gap found - streak is broken
                break;
            }
        }
    }
    // If not checked in today, currentStreak remains 0

    // Calculate longest streak (scan entire history)
    expectedDate = null;
    tempStreak = 0;

    for (let i = 0; i < sortedCheckIns.length; i++) {
        const checkInDate = sortedCheckIns[i];

        if (i === 0) {
            tempStreak = 1;
            expectedDate = checkInDate;
        } else {
            const prevDate = sortedCheckIns[i - 1];
            const daysDiff = getDaysDifference(prevDate, checkInDate);

            if (daysDiff === 1) {
                // Consecutive day
                tempStreak++;
            } else {
                // Gap found - update longest streak and reset
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
        expectedDate = checkInDate;
    }

    // Update longest streak with final temp streak
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
}

/**
 * Update streaks for a habit and save to state
 * @param {Object} habit - Habit object
 */
function updateStreaks(habit) {
    const streaks = calculateStreaks(habit);
    habit.currentStreak = streaks.currentStreak;
    habit.longestStreak = streaks.longestStreak;
}

// ============================================
// localStorage Management
// ============================================

const STORAGE_KEY = 'habitTrackerData';
const LAST_CHECKED_DATE_KEY = 'habitTrackerLastCheckedDate';

/**
 * Load habits from localStorage
 * @returns {Array} Array of habit objects
 */
function loadHabitsFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const habits = JSON.parse(stored);
            // Recalculate streaks for all habits on load
            habits.forEach(habit => {
                updateStreaks(habit);
            });
            return habits;
        }
    } catch (error) {
        console.error('Error loading habits from storage:', error);
    }
    return [];
}

/**
 * Save habits to localStorage
 */
function saveHabitsToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.habits));
        state.lastCheckedDate = getTodayDateString();
        localStorage.setItem(LAST_CHECKED_DATE_KEY, state.lastCheckedDate);
    } catch (error) {
        console.error('Error saving habits to storage:', error);
    }
}

/**
 * Check if date has changed since last check
 * @returns {boolean} True if date has changed
 */
function hasDateChanged() {
    const lastChecked = localStorage.getItem(LAST_CHECKED_DATE_KEY);
    const today = getTodayDateString();
    
    if (!lastChecked) {
        return true; // First time running
    }
    
    return lastChecked !== today;
}

/**
 * Handle date rollover - check if any streaks need to be reset
 * This runs when a new day is detected
 */
function handleDateRollover() {
    const today = getTodayDateString();
    let needsUpdate = false;

    state.habits.forEach(habit => {
        if (!habit.checkIns || habit.checkIns.length === 0) {
            return;
        }

        // Get most recent check-in date
        const sortedCheckIns = [...habit.checkIns]
            .map(date => date.split('T')[0])
            .sort((a, b) => b.localeCompare(a));
        
        const mostRecentCheckIn = sortedCheckIns[0];
        const daysSinceLastCheckIn = getDaysDifference(mostRecentCheckIn, today);

        // If last check-in was more than 1 day ago (not today or yesterday), streak is broken
        if (daysSinceLastCheckIn > 1) {
            // Streak should already be 0, but recalculate to be sure
            updateStreaks(habit);
            needsUpdate = true;
        } else if (daysSinceLastCheckIn === 1 && !isToday(mostRecentCheckIn)) {
            // Last check-in was yesterday - streak continues if checked in yesterday
            // No action needed, streak is still valid
        }
    });

    if (needsUpdate) {
        saveHabitsToStorage();
        renderHabits();
    }
}

// ============================================
// Habit Management
// ============================================

/**
 * Create a new habit object
 * @param {string} name - Habit name
 * @returns {Object} New habit object
 */
function createHabit(name) {
    return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        checkIns: [],
        currentStreak: 0,
        longestStreak: 0,
        createdAt: new Date().toISOString(),
    };
}

/**
 * Add a new habit
 * @param {string} name - Habit name
 */
function addHabit(name) {
    if (!name || !name.trim()) {
        return;
    }

    const habit = createHabit(name);
    state.habits.push(habit);
    saveHabitsToStorage();
    renderHabits();
}

/**
 * Update an existing habit
 * @param {string} id - Habit ID
 * @param {string} newName - New habit name
 */
function updateHabit(id, newName) {
    if (!newName || !newName.trim()) {
        return;
    }

    const habit = state.habits.find(h => h.id === id);
    if (habit) {
        habit.name = newName.trim();
        saveHabitsToStorage();
        renderHabits();
    }
}

/**
 * Delete a habit
 * @param {string} id - Habit ID
 */
function deleteHabit(id) {
    state.habits = state.habits.filter(h => h.id !== id);
    saveHabitsToStorage();
    renderHabits();
}

/**
 * Toggle check-in for a habit on today's date
 * @param {string} id - Habit ID
 */
function toggleCheckIn(id) {
    const habit = state.habits.find(h => h.id === id);
    if (!habit) {
        return;
    }

    const today = getTodayDateString();
    
    // Check if already checked in today
    const todayCheckInIndex = habit.checkIns.findIndex(date => 
        date.split('T')[0] === today
    );

    if (todayCheckInIndex !== -1) {
        // Already checked in today - remove check-in
        habit.checkIns.splice(todayCheckInIndex, 1);
    } else {
        // Not checked in today - add check-in
        // Ensure no duplicate entries for today
        if (!habit.checkIns.includes(today)) {
            habit.checkIns.push(today);
        }
    }

    // Recalculate streaks
    updateStreaks(habit);
    
    // Save and re-render
    saveHabitsToStorage();
    renderHabits();
}

// ============================================
// DOM Rendering
// ============================================

/**
 * Render all habits to the DOM
 */
function renderHabits() {
    const container = document.getElementById('habits-container');
    const emptyState = document.getElementById('empty-state');

    if (!container || !emptyState) {
        return;
    }

    // Show/hide empty state
    if (state.habits.length === 0) {
        emptyState.classList.add('show');
        container.innerHTML = '';
        return;
    }

    emptyState.classList.remove('show');
    container.innerHTML = '';

    // Render each habit
    state.habits.forEach(habit => {
        const habitCard = createHabitCard(habit);
        container.appendChild(habitCard);
    });
}

/**
 * Create a habit card element
 * @param {Object} habit - Habit object
 * @returns {HTMLElement} Habit card element
 */
function createHabitCard(habit) {
    const card = document.createElement('div');
    card.className = 'habit-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('data-habit-id', habit.id);

    const today = getTodayDateString();
    const isCheckedInToday = habit.checkIns.some(date => date.split('T')[0] === today);
    
    // Get most recent check-in date for display
    const sortedCheckIns = [...habit.checkIns]
        .map(date => date.split('T')[0])
        .sort((a, b) => b.localeCompare(a));
    const lastCheckInDate = sortedCheckIns[0] || 'Never';

    card.innerHTML = `
        <div class="habit-card-header">
            <h3 class="habit-name">${escapeHtml(habit.name)}</h3>
            <div class="habit-actions">
                <button 
                    class="btn btn-secondary btn-small" 
                    aria-label="Edit habit: ${escapeHtml(habit.name)}"
                    data-action="edit"
                >
                    Edit
                </button>
                <button 
                    class="btn btn-danger btn-small" 
                    aria-label="Delete habit: ${escapeHtml(habit.name)}"
                    data-action="delete"
                >
                    Delete
                </button>
            </div>
        </div>
        <div class="habit-body">
            <div class="habit-stats">
                <div class="stat-item">
                    <span class="stat-label">Current Streak</span>
                    <span class="stat-value streak-active ${habit.currentStreak > 0 ? 'streak-active' : ''}">
                        ${habit.currentStreak}
                    </span>
                    ${habit.currentStreak > 0 ? '<div class="streak-indicator"><span class="streak-fire">🔥</span><span class="streak-text">Keep it up!</span></div>' : ''}
                </div>
                <div class="stat-item">
                    <span class="stat-label">Longest Streak</span>
                    <span class="stat-value streak-longest">${habit.longestStreak}</span>
                </div>
            </div>
            <div class="habit-check-in">
                <button 
                    class="check-in-button ${isCheckedInToday ? 'checked' : ''}"
                    data-action="check-in"
                    ${isCheckedInToday ? 'aria-pressed="true"' : 'aria-pressed="false"'}
                    aria-label="${isCheckedInToday ? 'Uncheck' : 'Check in'} for ${escapeHtml(habit.name)}"
                >
                    ${isCheckedInToday ? '✓ Checked In Today' : 'Check In Today'}
                </button>
                <span class="check-in-date">Last: ${formatDateDisplay(lastCheckInDate)}</span>
            </div>
        </div>
    `;

    // Add event listeners
    const editBtn = card.querySelector('[data-action="edit"]');
    const deleteBtn = card.querySelector('[data-action="delete"]');
    const checkInBtn = card.querySelector('[data-action="check-in"]');

    editBtn.addEventListener('click', () => openEditModal(habit));
    deleteBtn.addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete "${habit.name}"?`)) {
            deleteHabit(habit.id);
        }
    });
    checkInBtn.addEventListener('click', () => toggleCheckIn(habit.id));

    return card;
}

/**
 * Format date for display
 * @param {string} dateString - Date string (YYYY-MM-DD) or "Never"
 * @returns {string} Formatted date string
 */
function formatDateDisplay(dateString) {
    if (dateString === 'Never') {
        return 'Never';
    }

    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (isToday(dateString)) {
        return 'Today';
    } else if (isYesterday(dateString)) {
        return 'Yesterday';
    } else {
        // Format as "Jan 29, 2026" or similar
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Modal Management
// ============================================

/**
 * Open edit modal for a habit
 * @param {Object} habit - Habit object to edit
 */
function openEditModal(habit) {
    const modal = document.getElementById('edit-modal');
    const input = document.getElementById('edit-habit-name');
    
    if (!modal || !input) {
        return;
    }

    input.value = habit.name;
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('show');
    input.focus();

    // Store current habit ID for form submission
    modal.dataset.habitId = habit.id;
}

/**
 * Close edit modal
 */
function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.setAttribute('aria-hidden', 'true');
        modal.classList.remove('show');
        modal.dataset.habitId = '';
    }
}

// ============================================
// Event Listeners
// ============================================

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Add habit form
    const addForm = document.getElementById('add-habit-form');
    if (addForm) {
        addForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('habit-name');
            if (input && input.value.trim()) {
                addHabit(input.value);
                input.value = '';
                input.focus();
            }
        });
    }

    // Edit habit form
    const editForm = document.getElementById('edit-habit-form');
    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const modal = document.getElementById('edit-modal');
            const input = document.getElementById('edit-habit-name');
            
            if (modal && input && modal.dataset.habitId) {
                updateHabit(modal.dataset.habitId, input.value);
                closeEditModal();
            }
        });
    }

    // Modal close buttons
    const modalCloseBtn = document.querySelector('.modal-close');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const modal = document.getElementById('edit-modal');
    const modalBackdrop = document.querySelector('.modal-backdrop');

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeEditModal);
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', closeEditModal);
    }

    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeEditModal);
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeEditModal();
        }
    });
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize the application
 */
function init() {
    // Load habits from storage
    state.habits = loadHabitsFromStorage();
    
    // Check if date has changed and handle rollover
    if (hasDateChanged()) {
        handleDateRollover();
    }
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Render habits
    renderHabits();

    // Set up periodic date check (every minute)
    setInterval(() => {
        if (hasDateChanged()) {
            handleDateRollover();
        }
    }, 60000); // Check every minute
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
