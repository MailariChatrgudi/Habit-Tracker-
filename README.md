# Habit Tracker Web App

A minimal, modern habit tracker built with HTML, CSS, and Vanilla JavaScript. Track your daily habits, build consistency, and monitor your streaks.

## Features

- ✅ **Add, Edit, and Delete Habits** - Full CRUD functionality for managing your habits
- ✅ **Daily Check-In** - Simple one-click check-in for each habit
- ✅ **Streak Tracking** - Track both current streak and longest streak
- ✅ **Local Storage** - All data persists across page refreshes
- ✅ **Automatic Date Detection** - Handles date changes automatically
- ✅ **Clean UI** - Modern, accessible interface with visual streak indicators
- ✅ **Edge Case Handling** - Handles multiple check-ins per day, date rollovers, and more

## Streak Logic Explanation

### Current Streak
The **current streak** represents consecutive days of completing a habit, counting backwards from today.

**Key Rules:**
1. **Must be checked in TODAY** - If you haven't checked in today, your current streak is 0 (even if you checked in yesterday)
2. **Consecutive days only** - The streak counts backwards from today, including only consecutive days
3. **Missing a day resets** - If there's a gap (even one day), the current streak resets to 0

**Example:**
- Checked in: Today, Yesterday, Day Before → Current Streak = 3
- Checked in: Yesterday, Day Before (but NOT today) → Current Streak = 0
- Checked in: Today, Day Before (skipped yesterday) → Current Streak = 1

### Longest Streak
The **longest streak** tracks the maximum consecutive days you've ever completed the habit, regardless of when it occurred.

**Key Rules:**
1. **Historical maximum** - Scans your entire check-in history
2. **Any consecutive period** - Finds the longest run of consecutive days, even if it's not current
3. **Never decreases** - Once achieved, it remains your record (unless you delete check-ins)

**Example:**
- History: Today, Yesterday, 5 days ago, 4 days ago, 3 days ago
- Current Streak = 2 (today + yesterday)
- Longest Streak = 3 (the 3 consecutive days from 5-3 days ago)

## Edge Cases Handled

### Multiple Check-Ins Per Day
- Only **one check-in per day** counts toward streaks
- Checking in multiple times on the same day doesn't increase your streak
- You can toggle check-in on/off for today

### Date Rollover
- The app automatically detects when a new day starts
- Checks every minute for date changes
- If you haven't checked in today, your current streak resets to 0
- Longest streak is preserved

### Browser Refresh
- All data is stored in `localStorage`
- Streaks are recalculated on page load
- Date changes are detected and handled automatically

### Timezone Handling
- Uses local date/time for consistency
- Date comparisons use ISO date strings (YYYY-MM-DD)
- Works correctly across timezone changes

## Usage

1. **Add a Habit**: Type a habit name in the input field and click "Add Habit"
2. **Check In**: Click "Check In Today" button for each habit you complete
3. **Edit**: Click "Edit" to change a habit's name
4. **Delete**: Click "Delete" to remove a habit (with confirmation)
5. **View Streaks**: See your current streak and longest streak for each habit



