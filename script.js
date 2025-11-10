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

/**
 * Calculate custom time from current UNIX timestamp
 * @returns {Object} Custom time object with h, m, s, and fractional values
 */
function getCustomTime() {
    // Get current UTC time in seconds since midnight
    const now = new Date();
    const utcSeconds = now.getUTCHours() * 3600 + 
                       now.getUTCMinutes() * 60 + 
                       now.getUTCSeconds() + 
                       now.getUTCMilliseconds() / 1000;
    
    // Calculate custom seconds since midnight
    const customSecondsToday = utcSeconds * SCALE;
    
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
 * Update UTC time display for comparison
 */
function updateUTCDisplay() {
    const time = getCustomTime();
    const utcDisplay = document.getElementById('utc-display');
    
    const utcFormatted = time.utcTime.toUTCString().split(' ')[4]; // Extract HH:MM:SS
    utcDisplay.textContent = utcFormatted;
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
    updateUTCDisplay();
    
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
    
    // Optional: Use requestAnimationFrame for smoother analog animation
    if (isAnalogMode) {
        function animate() {
            updateAnalogClock();
            animationFrameId = requestAnimationFrame(animate);
        }
        animate();
    }
}

// Start the clock when page loads
document.addEventListener('DOMContentLoaded', init);
