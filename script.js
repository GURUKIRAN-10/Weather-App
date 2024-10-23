const API_KEY = 'f6557f035840eebf22cb0d80327fea8a'; // Replace with your OpenWeatherMap API key
const cities = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Hyderabad'];
let tempThreshold = 35; // Default threshold value
let dailySummaries = {}; // Store daily summaries
let chart = null; // Reference to Chart.js instance
let fetchInterval = 5 * 60 * 1000; // Default 5 minutes in milliseconds

// Convert temperature from Kelvin to user-selected unit
function kelvinToTemperature(kelvin) {
    const tempUnit = document.getElementById('tempUnit').value;
    if (tempUnit === 'F') {
        return ((kelvin - 273.15) * 9/5 + 32).toFixed(2); // Convert to Fahrenheit
    }
    return (kelvin - 273.15).toFixed(2); // Default to Celsius
}

// Fetch weather data at intervals
function startWeatherMonitoring() {
    setInterval(fetchWeatherData, fetchInterval);
}

// Fetch weather data for the selected city
function fetchWeatherData() {
    const selectedCity = document.getElementById('citySelect').value;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${selectedCity}&appid=${API_KEY}`;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error fetching weather data: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const temperature = kelvinToTemperature(data.main.temp); // Use the new function
            const feelsLike = kelvinToTemperature(data.main.feels_like); // Also for feels like
            const humidity = data.main.humidity;
            const windSpeed = data.wind.speed;
            const condition = data.weather[0].main;
            const timestamp = data.dt;
            processWeatherData(selectedCity, temperature, feelsLike, humidity, windSpeed, condition, timestamp);
            displayCurrentWeatherData(temperature, feelsLike, humidity, windSpeed);
        })
        .catch(error => console.error(error));
}

// Display current weather data
function displayCurrentWeatherData(temperature, feelsLike, humidity, windSpeed) {
    document.getElementById('temperature').innerText = `Temperature: ${temperature} °${document.getElementById('tempUnit').value}`;
    document.getElementById('feelsLike').innerText = `Feels Like: ${feelsLike} °${document.getElementById('tempUnit').value}`;
    document.getElementById('humidity').innerText = `Humidity: ${humidity} %`;
    document.getElementById('windSpeed').innerText = `Wind Speed: ${windSpeed} m/s`;
}

// Process weather data and update the summary
function processWeatherData(city, temperature, feelsLike, humidity, windSpeed, condition, timestamp) {
    const date = new Date(timestamp * 1000).toDateString();
    if (!dailySummaries[date]) {
        dailySummaries[date] = {
            temps: [],
            feelsLikeTemps: [],
            humidityLevels: [],
            windSpeeds: [],
            conditions: {},
        };
    }
    const summary = dailySummaries[date];
    summary.temps.push(parseFloat(temperature));
    summary.feelsLikeTemps.push(parseFloat(feelsLike));
    summary.humidityLevels.push(parseInt(humidity));
    summary.windSpeeds.push(parseFloat(windSpeed));
    summary.conditions[condition] = (summary.conditions[condition] || 0) + 1;
    displayDailySummary();
}

// Display daily summaries and visualize data
function displayDailySummary() {
    const today = new Date().toDateString();
    const summary = dailySummaries[today];
    if (!summary) return;

    const avgTemp = (summary.temps.reduce((a, b) => a + b, 0) / summary.temps.length).toFixed(2);
    const maxTemp = Math.max(...summary.temps).toFixed(2);
    const minTemp = Math.min(...summary.temps).toFixed(2);
    
    // Calculate the dominant weather condition
    const dominantWeather = Object.keys(summary.conditions).reduce((a, b) => summary.conditions[a] > summary.conditions[b] ? a : b);
    document.getElementById('avg-temp').innerText = avgTemp;
    document.getElementById('max-temp').innerText = maxTemp;
    document.getElementById('min-temp').innerText = minTemp;
    document.getElementById('dom-weather').innerText = dominantWeather;

    if (parseFloat(maxTemp) >= tempThreshold) {
        alert(`Alert! Max temperature of ${maxTemp}°${document.getElementById('tempUnit').value} exceeds threshold of ${tempThreshold}°${document.getElementById('tempUnit').value}`);
    }
    updateChart(today, parseFloat(avgTemp), parseFloat(minTemp), parseFloat(maxTemp));
}

// Initialize or update Chart.js graph
function updateChart(date, avgTemp, minTemp, maxTemp) {
    const ctx = document.getElementById('weatherChart').getContext('2d');
    // Initialize or update the chart instance
    if (chart) {
        // Update existing chart with new data
        chart.data.labels.push(date);
        chart.data.datasets[0].data.push(avgTemp);
        chart.data.datasets[1].data.push(minTemp);
        chart.data.datasets[2].data.push(maxTemp);
        chart.update();
    } else {
        // Create a new Chart instance
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [date],
                datasets: [
                    {
                        label: 'Average Temperature (°C)',
                        data: [avgTemp],
                        borderColor: 'blue',
                        backgroundColor: 'rgba(0, 0, 255, 0.1)',
                        fill: false,
                        borderWidth: 2,
                        tension: 0,
                    },
                    {
                        label: 'Minimum Temperature (°C)',
                        data: [minTemp],
                        borderColor: 'green',
                        backgroundColor: 'rgba(0, 255, 0, 0.1)',
                        fill: false,
                        borderWidth: 2,
                        tension: 0,
                    },
                    {
                        label: 'Maximum Temperature (°C)',
                        data: [maxTemp],
                        borderColor: 'red',
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                        fill: false,
                        borderWidth: 2,
                        tension: 0,
                    },
                ],
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Temperature (°C)',
                        },
                    },
                },
            },
        });
    }
}

// Start monitoring when the page loads
window.onload = function() {
    startWeatherMonitoring(); // Start fetching data at intervals
    fetchWeatherData(); // Initial fetch
};
