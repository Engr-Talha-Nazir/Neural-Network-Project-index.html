// Global variables
let dataset = null;
let model = null;
let isTraining = false;
let trainingHistory = {
    loss: [],
    valLoss: []
};

// Chart instances
let categoryChart, regionChart, inventoryChart, seasonalityChart;
let lossChart, valLossChart, predictionChart;

// DOM elements
const fileInput = document.getElementById('file-input');
const loadSampleBtn = document.getElementById('load-sample-btn');
const dataInfo = document.getElementById('data-info');
const rowCount = document.getElementById('row-count');
const colCount = document.getElementById('col-count');
const dataPreview = document.getElementById('data-preview');
const showEdaBtn = document.getElementById('show-eda-btn');
const edaContent = document.getElementById('eda-content');
const summaryTable = document.getElementById('summary-table');
const modelSelect = document.getElementById('model-select');
const trainBtn = document.getElementById('train-btn');
const stopBtn = document.getElementById('stop-btn');
const trainingProgress = document.getElementById('training-progress');
const progressFill = document.getElementById('progress-fill');
const epochInfo = document.getElementById('epoch-info');
const predictBtn = document.getElementById('predict-btn');
const predictionResults = document.getElementById('prediction-results');
const metricsTable = document.getElementById('metrics-table');

// Event listeners
document.addEventListener('DOMContentLoaded', initApp);
fileInput.addEventListener('change', handleFileUpload);
loadSampleBtn.addEventListener('click', loadSampleData);
showEdaBtn.addEventListener('click', showEDA);
trainBtn.addEventListener('click', startTraining);
stopBtn.addEventListener('click', stopTraining);
predictBtn.addEventListener('click', generatePredictions);

// Initialize the application
function initApp() {
    console.log("Inventory Demand Forecasting App Initialized");
    initializeCharts();
}

// Initialize empty charts
function initializeCharts() {
    // EDA Charts
    const categoryCtx = document.getElementById('category-chart').getContext('2d');
    categoryChart = new Chart(categoryCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Units Sold',
                data: [],
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const regionCtx = document.getElementById('region-chart').getContext('2d');
    regionChart = new Chart(regionCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Units Sold',
                data: [],
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const inventoryCtx = document.getElementById('inventory-chart').getContext('2d');
    inventoryChart = new Chart(inventoryCtx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Inventory vs Demand',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Inventory Level'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Demand Forecast'
                    },
                    beginAtZero: true
                }
            }
        }
    });

    const seasonalityCtx = document.getElementById('seasonality-chart').getContext('2d');
    seasonalityChart = new Chart(seasonalityCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Average Units Sold',
                data: [],
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 2,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Training Charts
    const lossCtx = document.getElementById('loss-chart').getContext('2d');
    lossChart = new Chart(lossCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Training Loss',
                data: [],
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const valLossCtx = document.getElementById('val-loss-chart').getContext('2d');
    valLossChart = new Chart(valLossCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Validation Loss',
                data: [],
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Prediction Chart
    const predictionCtx = document.getElementById('prediction-chart').getContext('2d');
    predictionChart = new Chart(predictionCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Actual Demand',
                    data: [],
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Predicted Demand',
                    data: [],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    tension: 0.4,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            if (results.errors.length > 0) {
                alert('Error parsing CSV: ' + results.errors[0].message);
                return;
            }
            
            dataset = results.data;
            processDataset();
        }
    });
}

// Load sample data
function loadSampleData() {
    // In a real application, this would fetch the sample data
    // For now, we'll simulate loading with a timeout
    showEdaBtn.disabled = true;
    trainBtn.disabled = true;
    
    setTimeout(() => {
        // Simulate loading the dataset from the provided CSV content
        dataset = [
            // Sample data would be parsed from the CSV content
            // For demonstration, we'll create a small sample
            {
                Date: '2022-01-01',
                Store_ID: 'S001',
                Product_ID: 'P0001',
                Category: 'Groceries',
                Region: 'North',
                Inventory_Level: 231,
                Units_Sold: 127,
                Units_Ordered: 55,
                Demand_Forecast: 135.47,
                Price: 33.5,
                Discount: 20,
                Weather_Condition: 'Rainy',
                Holiday_Promotion: 0,
                Competitor_Pricing: 29.69,
                Seasonality: 'Autumn'
            },
            {
                Date: '2022-01-01',
                Store_ID: 'S001',
                Product_ID: 'P0002',
                Category: 'Toys',
                Region: 'South',
                Inventory_Level: 204,
                Units_Sold: 150,
                Units_Ordered: 66,
                Demand_Forecast: 144.04,
                Price: 63.01,
                Discount: 20,
                Weather_Condition: 'Sunny',
                Holiday_Promotion: 0,
                Competitor_Pricing: 66.16,
                Seasonality: 'Autumn'
            }
            // More data would be added in a real implementation
        ];
        
        // For demo purposes, let's create a larger synthetic dataset
        createSyntheticDataset();
        processDataset();
    }, 1000);
}

// Create a synthetic dataset for demonstration
function createSyntheticDataset() {
    const categories = ['Groceries', 'Toys', 'Electronics', 'Clothing', 'Furniture'];
    const regions = ['North', 'South', 'East', 'West'];
    const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'];
    const weather = ['Sunny', 'Rainy', 'Cloudy', 'Snowy'];
    
    dataset = [];
    
    for (let i = 0; i < 500; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const region = regions[Math.floor(Math.random() * regions.length)];
        const season = seasons[Math.floor(Math.random() * seasons.length)];
        const weatherCondition = weather[Math.floor(Math.random() * weather.length)];
        
        const baseDemand = Math.floor(Math.random() * 200) + 50;
        const inventory = Math.floor(baseDemand * (0.5 + Math.random()));
        const sold = Math.floor(baseDemand * (0.7 + Math.random() * 0.6));
        const ordered = Math.floor(sold * (0.8 + Math.random() * 0.4));
        const forecast = baseDemand * (0.9 + Math.random() * 0.2);
        
        dataset.push({
            Date: `2022-01-${String(Math.floor(i/50) + 1).padStart(2, '0')}`,
            Store_ID: `S${String(Math.floor(Math.random() * 5) + 1).padStart(3, '0')}`,
            Product_ID: `P${String(i + 1).padStart(4, '0')}`,
            Category: category,
            Region: region,
            Inventory_Level: inventory,
            Units_Sold: sold,
            Units_Ordered: ordered,
            Demand_Forecast: forecast,
            Price: Math.floor(Math.random() * 80) + 20,
            Discount: Math.floor(Math.random() * 3) * 10,
            Weather_Condition: weatherCondition,
            Holiday_Promotion: Math.random() > 0.7 ? 1 : 0,
            Competitor_Pricing: Math.floor(Math.random() * 80) + 20,
            Seasonality: season
        });
    }
}

// Process the loaded dataset
function processDataset() {
    if (!dataset || dataset.length === 0) return;
    
    // Update data info
    rowCount.textContent = dataset.length;
    colCount.textContent = Object.keys(dataset[0]).length;
    
    // Show data preview (first 5 rows)
    let previewHTML = '<table><thead><tr>';
    const headers = Object.keys(dataset[0]);
    headers.forEach(header => {
        previewHTML += `<th>${header}</th>`;
    });
    previewHTML += '</tr></thead><tbody>';
    
    for (let i = 0; i < Math.min(5, dataset.length); i++) {
        previewHTML += '<tr>';
        headers.forEach(header => {
            previewHTML += `<td>${dataset[i][header]}</td>`;
        });
        previewHTML += '</tr>';
    }
    previewHTML += '</tbody></table>';
    
    dataPreview.innerHTML = previewHTML;
    dataInfo.classList.remove('hidden');
    
    // Enable EDA button
    showEdaBtn.disabled = false;
}

// Show Exploratory Data Analysis
function showEDA() {
    if (!dataset) return;
    
    // Calculate summary statistics
    calculateSummaryStats();
    
    // Update charts with data
    updateEDACharts();
    
    // Show EDA content
    edaContent.classList.remove('hidden');
    
    // Enable training button
    trainBtn.disabled = false;
}

// Calculate summary statistics
function calculateSummaryStats() {
    const numericColumns = [
        'Inventory_Level', 'Units_Sold', 'Units_Ordered', 
        'Demand_Forecast', 'Price', 'Discount', 'Competitor_Pricing'
    ];
    
    let summaryHTML = '<table><thead><tr><th>Column</th><th>Count</th><th>Mean</th><th>Std</th><th>Min</th><th>Max</th></tr></thead><tbody>';
    
    numericColumns.forEach(col => {
        const values = dataset.map(row => row[col]).filter(val => !isNaN(val));
        const count = values.length;
        const mean = values.reduce((a, b) => a + b, 0) / count;
        const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / count);
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        summaryHTML += `<tr>
            <td>${col}</td>
            <td>${count}</td>
            <td>${mean.toFixed(2)}</td>
            <td>${std.toFixed(2)}</td>
            <td>${min.toFixed(2)}</td>
            <td>${max.toFixed(2)}</td>
        </tr>`;
    });
    
    summaryHTML += '</tbody></table>';
    summaryTable.innerHTML = summaryHTML;
}

// Update EDA charts with data
function updateEDACharts() {
    // Sales by Category
    const categorySales = {};
    dataset.forEach(row => {
        if (!categorySales[row.Category]) {
            categorySales[row.Category] = 0;
        }
        categorySales[row.Category] += row.Units_Sold;
    });
    
    categoryChart.data.labels = Object.keys(categorySales);
    categoryChart.data.datasets[0].data = Object.values(categorySales);
    categoryChart.update();
    
    // Sales by Region
    const regionSales = {};
    dataset.forEach(row => {
        if (!regionSales[row.Region]) {
            regionSales[row.Region] = 0;
        }
        regionSales[row.Region] += row.Units_Sold;
    });
    
    regionChart.data.labels = Object.keys(regionSales);
    regionChart.data.datasets[0].data = Object.values(regionSales);
    regionChart.update();
    
    // Inventory vs Demand
    const inventoryData = dataset.map(row => ({
        x: row.Inventory_Level,
        y: row.Demand_Forecast
    }));
    
    inventoryChart.data.datasets[0].data = inventoryData;
    inventoryChart.update();
    
    // Seasonality Analysis
    const seasonSales = {};
    dataset.forEach(row => {
        if (!seasonSales[row.Seasonality]) {
            seasonSales[row.Seasonality] = 0;
        }
        seasonSales[row.Seasonality] += row.Units_Sold;
    });
    
    // Order seasons logically
    const seasonOrder = ['Spring', 'Summer', 'Autumn', 'Winter'];
    seasonalityChart.data.labels = seasonOrder;
    seasonalityChart.data.datasets[0].data = seasonOrder.map(season => 
        seasonSales[season] || 0
    );
    seasonalityChart.update();
}

// Start model training
function startTraining() {
    if (!dataset) return;
    
    isTraining = true;
    trainBtn.disabled = true;
    stopBtn.disabled = false;
    trainingProgress.classList.remove('hidden');
    
    // Reset training history
    trainingHistory = { loss: [], valLoss: [] };
    lossChart.data.labels = [];
    lossChart.data.datasets[0].data = [];
    valLossChart.data.labels = [];
    valLossChart.data.datasets[0].data = [];
    
    // Simulate training process
    simulateTraining();
}

// Stop model training
function stopTraining() {
    isTraining = false;
    trainBtn.disabled = false;
    stopBtn.disabled = true;
    
    // Enable prediction button if we have a model
    if (trainingHistory.loss.length > 0) {
        predictBtn.disabled = false;
    }
}

// Simulate model training (in a real app, this would use TensorFlow.js)
function simulateTraining() {
    const totalEpochs = 50;
    let currentEpoch = 0;
    
    const trainingInterval = setInterval(() => {
        if (!isTraining || currentEpoch >= totalEpochs) {
            clearInterval(trainingInterval);
            stopTraining();
            return;
        }
        
        currentEpoch++;
        
        // Simulate training progress
        const progress = (currentEpoch / totalEpochs) * 100;
        progressFill.style.width = `${progress}%`;
        epochInfo.textContent = `Epoch: ${currentEpoch}/${totalEpochs}`;
        
        // Simulate loss values
        const loss = 2.5 * Math.exp(-currentEpoch / 15) + 0.1 * Math.random();
        const valLoss = 2.8 * Math.exp(-currentEpoch / 12) + 0.15 * Math.random();
        
        trainingHistory.loss.push(loss);
        trainingHistory.valLoss.push(valLoss);
        
        // Update loss charts
        lossChart.data.labels.push(currentEpoch);
        lossChart.data.datasets[0].data.push(loss);
        lossChart.update();
        
        valLossChart.data.labels.push(currentEpoch);
        valLossChart.data.datasets[0].data.push(valLoss);
        valLossChart.update();
        
        // Enable prediction button after some training
        if (currentEpoch > 10) {
            predictBtn.disabled = false;
        }
    }, 200);
}

// Generate predictions
function generatePredictions() {
    if (!dataset) return;
    
    predictionResults.classList.remove('hidden');
    
    // Calculate evaluation metrics (simulated)
    const metrics = {
        'RMSE': (1.5 + Math.random() * 0.5).toFixed(3),
        'MAE': (1.2 + Math.random() * 0.4).toFixed(3),
        'MAPE': (8.5 + Math.random() * 3).toFixed(2) + '%',
        'R²': (0.85 + Math.random() * 0.1).toFixed(3)
    };
    
    // Display metrics
    let metricsHTML = '<table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>';
    for (const [metric, value] of Object.entries(metrics)) {
        metricsHTML += `<tr><td>${metric}</td><td>${value}</td></tr>`;
    }
    metricsHTML += '</tbody></table>';
    metricsTable.innerHTML = metricsHTML;
    
    // Generate prediction chart data
    const sampleSize = 30;
    const actual = [];
    const predicted = [];
    const labels = [];
    
    for (let i = 0; i < sampleSize; i++) {
        const actualValue = 100 + Math.random() * 200;
        const predictedValue = actualValue * (0.9 + Math.random() * 0.2);
        
        actual.push(actualValue);
        predicted.push(predictedValue);
        labels.push(`Day ${i+1}`);
    }
    
    // Update prediction chart
    predictionChart.data.labels = labels;
    predictionChart.data.datasets[0].data = actual;
    predictionChart.data.datasets[1].data = predicted;
    predictionChart.update();
}
