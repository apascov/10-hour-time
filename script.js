// 10-Hour Time System Implementation
// Each day = 10 hours, 1 hour = 100 minutes, 1 minute = 100 seconds
// 1 custom second = 0.864 real seconds

// Constants
const SCALE = 100000 / 86400; // ≈ 1.157407407
const FULL_DAY = 86400; // seconds in a real day
const UPDATE_INTERVAL = 864; // milliseconds (0.864 seconds)

// State
let isAnalogMode = false;
let animationFrameId = null;
let currentMode = 'clock'; // 'clock', 'stopwatch', 'timer'

// Stopwatch state
let stopwatchRunning = false;
let stopwatchStartTime = 0;
let stopwatchElapsed = 0;
let stopwatchInterval = null;

// Timer state
let timerRunning = false;
let timerEndTime = 0;
let timerInterval = null;

/**
 * Calculate custom time from current UNIX timestamp
 * @returns {Object} Custom time object with h, m, s, and fractional values
 */
function getCustomTime() {
    // Get current LOCAL time in seconds since midnight
    const now = new Date();
    const localSeconds = now.getHours() * 3600 + 
                         now.getMinutes() * 60 + 
                         now.getSeconds() + 
                         now.getMilliseconds() / 1000;
    
    // Calculate custom seconds since midnight
    const customSecondsToday = localSeconds * SCALE;
    
    // Extract hours, minutes, seconds
    const hours = Math.floor(customSecondsToday / 10000);
    const minutes = Math.floor((customSecondsToday % 10000) / 100);
    const seconds = Math.floor(customSecondsToday % 100);
    
    // Calculate fractional values for smooth animation
    const fractionalSeconds = customSecondsToday % 100;
    const fractionalMinutes = (customSecondsToday % 10000) / 100;
    const fractionalHours = customSecondsToday / 10000;
    
    return {
        h: hours,
        m: minutes,
        s: seconds,
        fractionalH: fractionalHours,
        fractionalM: fractionalMinutes,
        fractionalS: fractionalSeconds,
        utcTime: now
    };
}

/**
 * Format time component with leading zero
 * @param {number} value - Time value to format
 * @returns {string} Formatted string with leading zero if needed
 */
function formatTimeComponent(value) {
    return value.toString().padStart(2, '0');
}

/**
 * Update digital clock display
 */
function updateDigitalClock() {
    const time = getCustomTime();
    const timeDisplay = document.getElementById('time-display');
    
    const formatted = `${formatTimeComponent(time.h)}:${formatTimeComponent(time.m)}:${formatTimeComponent(time.s)}`;
    timeDisplay.textContent = formatted;
}

/**
 * Update local time display for comparison
 */
function updateLocalDisplay() {
    const time = getCustomTime();
    const localDisplay = document.getElementById('utc-display');
    
    const hours = time.utcTime.getHours().toString().padStart(2, '0');
    const minutes = time.utcTime.getMinutes().toString().padStart(2, '0');
    const seconds = time.utcTime.getSeconds().toString().padStart(2, '0');
    const localFormatted = `${hours}:${minutes}:${seconds}`;
    localDisplay.textContent = localFormatted;
}

/**
 * Calculate rotation angle for clock hands
 * @param {Object} time - Custom time object from getCustomTime()
 * @returns {Object} Rotation angles for each hand
 */
function calculateHandAngles(time) {
    // Hour hand: full rotation in 10 hours
    const hourAngle = (time.fractionalH / 10) * 360;
    
    // Minute hand: full rotation in 100 minutes
    const minuteAngle = (time.fractionalM / 100) * 360;
    
    // Second hand: full rotation in 100 seconds
    // Use integer seconds for alignment with markers
    const secondAngle = (time.s / 100) * 360;
    
    return {
        hour: hourAngle,
        minute: minuteAngle,
        second: secondAngle
    };
}

/**
 * Update analog clock hands
 */
function updateAnalogClock() {
    const time = getCustomTime();
    const angles = calculateHandAngles(time);
    
    const hourHand = document.getElementById('hour-hand');
    const minuteHand = document.getElementById('minute-hand');
    const secondHand = document.getElementById('second-hand');
    
    // Apply rotation transformations using SVG transform attribute
    // Rotate around the center point (200, 200)
    hourHand.setAttribute('transform', `rotate(${angles.hour} 200 200)`);
    minuteHand.setAttribute('transform', `rotate(${angles.minute} 200 200)`);
    secondHand.setAttribute('transform', `rotate(${angles.second} 200 200)`);
}

/**
 * Main update function called on interval
 */
function updateClock() {
    updateDigitalClock();
    updateLocalDisplay();
    
    if (isAnalogMode) {
        updateAnalogClock();
    }
}

/**
 * Generate clock face markers
 */
function generateClockMarkers() {
    const hourMarkersGroup = document.getElementById('hour-markers');
    const minuteMarkersGroup = document.getElementById('minute-markers');
    
    const centerX = 200;
    const centerY = 200;
    const radius = 180;
    
    // Generate 10 hour markers
    for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * 360 - 90; // Start at top (12 o'clock position)
        const radians = angle * (Math.PI / 180);
        
        // Hour marker line
        const x1 = centerX + Math.cos(radians) * (radius - 15);
        const y1 = centerY + Math.sin(radians) * (radius - 15);
        const x2 = centerX + Math.cos(radians) * radius;
        const y2 = centerY + Math.sin(radians) * radius;
        
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        marker.setAttribute('x1', x1);
        marker.setAttribute('y1', y1);
        marker.setAttribute('x2', x2);
        marker.setAttribute('y2', y2);
        marker.setAttribute('stroke', 'var(--marker-color)');
        marker.setAttribute('stroke-width', '3');
        marker.classList.add('hour-marker');
        hourMarkersGroup.appendChild(marker);
        
        // Hour number
        const textX = centerX + Math.cos(radians) * (radius - 35);
        const textY = centerY + Math.sin(radians) * (radius - 35);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', textX);
        text.setAttribute('y', textY);
        text.textContent = i;
        text.classList.add('hour-number');
        hourMarkersGroup.appendChild(text);
    }
    
    // Generate 100 minute markers (show every 10)
    for (let i = 0; i < 100; i++) {
        if (i % 10 === 0) continue; // Skip hour positions
        
        const angle = (i / 100) * 360 - 90;
        const radians = angle * (Math.PI / 180);
        
        const isMainMarker = i % 10 === 0;
        const markerLength = isMainMarker ? 10 : 5;
        const strokeWidth = isMainMarker ? 2 : 1;
        
        const x1 = centerX + Math.cos(radians) * (radius - markerLength);
        const y1 = centerY + Math.sin(radians) * (radius - markerLength);
        const x2 = centerX + Math.cos(radians) * radius;
        const y2 = centerY + Math.sin(radians) * radius;
        
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        marker.setAttribute('x1', x1);
        marker.setAttribute('y1', y1);
        marker.setAttribute('x2', x2);
        marker.setAttribute('y2', y2);
        marker.setAttribute('stroke', 'var(--marker-color)');
        marker.setAttribute('stroke-width', strokeWidth);
        marker.classList.add('minute-marker');
        minuteMarkersGroup.appendChild(marker);
    }
}

/**
 * Toggle between digital and analog display
 */
function toggleView() {
    const digitalDisplay = document.getElementById('digital-display');
    const analogDisplay = document.getElementById('analog-display');
    const toggleBtn = document.getElementById('toggle-view');
    
    isAnalogMode = !isAnalogMode;
    
    if (isAnalogMode) {
        digitalDisplay.classList.remove('active');
        analogDisplay.classList.add('active');
        toggleBtn.textContent = 'Switch to Digital';
        updateAnalogClock(); // Initial update for analog
    } else {
        digitalDisplay.classList.add('active');
        analogDisplay.classList.remove('active');
        toggleBtn.textContent = 'Switch to Analog';
    }
}

/**
 * Smart interval that syncs to custom seconds
 * This prevents skipping by always checking when the next second actually occurs
 */
function scheduleNextUpdate() {
    const time = getCustomTime();
    const currentSecond = time.s;
    
    // Calculate milliseconds until next custom second
    const fractionalPart = time.fractionalS - currentSecond;
    const msUntilNextSecond = (1 - fractionalPart) * UPDATE_INTERVAL;
    
    // Schedule update slightly before the next second (with small buffer)
    const delay = Math.max(10, msUntilNextSecond - 50);
    
    setTimeout(() => {
        updateClock();
        scheduleNextUpdate(); // Schedule the next update
    }, delay);
}

/**
 * Initialize the clock
 */
function init() {
    // Generate clock face markers
    generateClockMarkers();
    
    // Initial update
    updateClock();
    
    // Use smart scheduling instead of fixed interval
    scheduleNextUpdate();
    
    // Set up toggle button
    const toggleBtn = document.getElementById('toggle-view');
    toggleBtn.addEventListener('click', toggleView);
    
    // Set up mode buttons
    document.getElementById('clock-btn').addEventListener('click', () => switchMode('clock'));
    document.getElementById('stopwatch-btn').addEventListener('click', () => switchMode('stopwatch'));
    document.getElementById('timer-btn').addEventListener('click', () => switchMode('timer'));
    
    // Set up stopwatch controls
    document.getElementById('stopwatch-start').addEventListener('click', toggleStopwatch);
    document.getElementById('stopwatch-reset').addEventListener('click', resetStopwatch);
    
    // Set up timer controls
    document.getElementById('timer-start').addEventListener('click', toggleTimer);
    document.getElementById('timer-reset').addEventListener('click', resetTimer);
    
    // Optional: Use requestAnimationFrame for smoother analog animation
    if (isAnalogMode) {
        function animate() {
            updateAnalogClock();
            animationFrameId = requestAnimationFrame(animate);
        }
        animate();
    }
}

/**
 * Switch between clock, stopwatch, and timer modes
 */
function switchMode(mode) {
    currentMode = mode;
    
    // Update mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${mode}-btn`).classList.add('active');
    
    // Update displays
    document.querySelectorAll('.mode-display').forEach(display => display.classList.remove('active'));
    document.getElementById(`${mode}-mode`).classList.add('active');
    
    // Show/hide toggle button (only for clock mode)
    const toggleBtn = document.getElementById('toggle-view');
    if (mode === 'clock') {
        toggleBtn.classList.remove('hidden');
    } else {
        toggleBtn.classList.add('hidden');
    }
}

/**
 * Format custom time from milliseconds
 */
function formatCustomTime(ms, includeMs = false) {
    const customSeconds = (ms / 1000) * SCALE;
    const h = Math.floor(customSeconds / 10000);
    const m = Math.floor((customSeconds % 10000) / 100);
    const s = Math.floor(customSeconds % 100);
    
    // Custom milliseconds: 1000 per custom second
    const customMs = Math.floor((customSeconds % 1) * 1000);
    
    return {
        h: h,
        m: m,
        s: s,
        ms: customMs,
        formatted: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
        formattedMs: `.${customMs.toString().padStart(3, '0')}`
    };
}

/**
 * Stopwatch functions
 */
function toggleStopwatch() {
    const btn = document.getElementById('stopwatch-start');
    
    if (!stopwatchRunning) {
        stopwatchRunning = true;
        stopwatchStartTime = Date.now() - stopwatchElapsed;
        btn.textContent = 'Pause';
        
        stopwatchInterval = setInterval(() => {
            stopwatchElapsed = Date.now() - stopwatchStartTime;
            const time = formatCustomTime(stopwatchElapsed, true);
            document.getElementById('stopwatch-display').textContent = time.formatted;
            document.getElementById('stopwatch-ms-display').textContent = time.formattedMs;
        }, 10); // Update more frequently for smooth millisecond display
    } else {
        stopwatchRunning = false;
        btn.textContent = 'Resume';
        clearInterval(stopwatchInterval);
    }
}

function resetStopwatch() {
    stopwatchRunning = false;
    stopwatchElapsed = 0;
    clearInterval(stopwatchInterval);
    document.getElementById('stopwatch-start').textContent = 'Start';
    document.getElementById('stopwatch-display').textContent = '00:00:00';
    document.getElementById('stopwatch-ms-display').textContent = '.000';
}

/**
 * Timer functions
 */
function toggleTimer() {
    const btn = document.getElementById('timer-start');
    
    if (!timerRunning) {
        // Get input values
        const hours = parseInt(document.getElementById('timer-hours').value) || 0;
        const minutes = parseInt(document.getElementById('timer-minutes').value) || 0;
        const seconds = parseInt(document.getElementById('timer-seconds').value) || 0;
        
        // Convert to real milliseconds
        const totalCustomSeconds = hours * 10000 + minutes * 100 + seconds;
        const totalRealMs = (totalCustomSeconds / SCALE) * 1000;
        
        if (totalRealMs > 0) {
            timerRunning = true;
            timerEndTime = Date.now() + totalRealMs;
            btn.textContent = 'Pause';
            
            timerInterval = setInterval(() => {
                const remaining = timerEndTime - Date.now();
                
                if (remaining <= 0) {
                    // Timer finished
                    document.getElementById('timer-display').textContent = '00:00:00';
                    resetTimer();
                    alert('Timer finished!');
                } else {
                    const time = formatCustomTime(remaining);
                    document.getElementById('timer-display').textContent = time.formatted;
                }
            }, 50);
        }
    } else {
        timerRunning = false;
        btn.textContent = 'Resume';
        clearInterval(timerInterval);
    }
}

function resetTimer() {
    timerRunning = false;
    clearInterval(timerInterval);
    document.getElementById('timer-start').textContent = 'Start';
    document.getElementById('timer-display').textContent = '00:00:00';
    document.getElementById('timer-hours').value = '';
    document.getElementById('timer-minutes').value = '';
    document.getElementById('timer-seconds').value = '';
}

// Start the clock when page loads
document.addEventListener('DOMContentLoaded', init);
