const podcastData = {
    "dec-2024": { listens: 565, shortName: "Dec '24" }, "jan-2025": { listens: 660, shortName: "Jan '25" },
    "feb-2025": { listens: 663, shortName: "Feb '25" }, "mar-2025": { listens: 679, shortName: "Mrt '25" },
    "apr-2025": { listens: 806, shortName: "Apr '25" }, "may-2025": { listens: 1069, shortName: "Mei '25" }
};
Chart.register(ChartDataLabels);
let listenChartInstance = null;

function updateDashboard() {
    let previousListens = null, totalListens = 0;
    const monthsOrder = ["dec-2024", "jan-2025", "feb-2025", "mar-2025", "apr-2025", "may-2025"];
    
    monthsOrder.forEach(key => {
        const info = podcastData[key];
        document.querySelector(`span[data-month="${key}"]`).textContent = info.listens !== null ? info.listens.toLocaleString('nl-NL') : "[NVT]";
        if (info.listens !== null) totalListens += info.listens;
        const growthEl = document.querySelector(`span[data-growth="${key}"]`);
        if (growthEl) {
            if (key === "dec-2024" || previousListens === null || info.listens === null) {
                growthEl.textContent = "N.v.t.";
            } else {
                const val = ((info.listens - previousListens) / previousListens) * 100;
                growthEl.textContent = val.toFixed(1) + "%";
                growthEl.className = 'font-bold'; 
                if (growthEl.closest('.data-card')) { 
                   growthEl.classList.add(val >= 0 ? "growth-positive" : "growth-negative");
                }
            }
        }
        if (info.listens !== null) previousListens = info.listens;
    });

    document.getElementById('totalListensPeriod').textContent = totalListens.toLocaleString('nl-NL');
    const firstM = podcastData["dec-2024"].listens, lastM = podcastData["may-2025"].listens;
    const totalGrowthEl = document.getElementById('totalGrowthPercentage');
    if (firstM !== null && lastM !== null) {
        if (firstM === 0 && lastM > 0) { 
            totalGrowthEl.textContent = "∞% ▲"; 
            totalGrowthEl.className = 'text-3xl font-bold'; 
        } else if (firstM === 0 && lastM === 0) { 
            totalGrowthEl.textContent = "0.0%"; 
            totalGrowthEl.className = 'text-3xl font-bold'; 
        } else if (firstM !== 0) {
            const val = ((lastM - firstM) / firstM) * 100;
            totalGrowthEl.textContent = `${val.toFixed(1)}%${val > 0 ? " ▲" : val < 0 ? " ▼" : ""}`;
            totalGrowthEl.className = 'text-3xl font-bold'; 
        } else { 
            totalGrowthEl.textContent = "[NVT]"; 
            totalGrowthEl.className = 'text-3xl font-bold'; 
        }
    } else { 
        totalGrowthEl.textContent = "[NVT]"; 
        totalGrowthEl.className = 'text-3xl font-bold'; 
    }
    document.getElementById('generationDate').textContent = new Date().toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    renderChart();
}

function renderChart() {
    const canvas = document.getElementById('listenTrendChart');
    const placeholder = document.getElementById('chartPlaceholderText');
    if (!canvas || !placeholder) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) { placeholder.style.display = 'block'; return; }
    if (!Object.values(podcastData).every(m => m.listens !== null)) { placeholder.style.display = 'block'; return; }
    placeholder.style.display = 'none';
    if (listenChartInstance) listenChartInstance.destroy();

    const darkTextColor = '#1f2937';
    const mediumTextColor = '#4b5563';
    const gridDarkColor = 'rgba(0, 0, 0, 0.1)'; 
    const barBgColor = '#2E58AE'; 
    const barBorderColor = '#1c3d5a'; 
    const datalabelColor = '#1f2937';

    listenChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.values(podcastData).map(m => m.shortName),
            datasets: [{ data: Object.values(podcastData).map(m => m.listens), backgroundColor: barBgColor, borderColor: barBorderColor, borderWidth: 1, borderRadius: 5, barPercentage: 0.7, categoryPercentage: 0.8 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Aantal Luisterbeurten', font: { size: 14, family: 'Inter'}, color: darkTextColor }, ticks: { color: mediumTextColor, font: { family: 'Inter'}}, grid: { color: gridDarkColor }},
                x: { title: { display: true, text: 'Maand (2024-2025)', font: { size: 14, family: 'Inter'}, color: darkTextColor }, ticks: { color: mediumTextColor, font: { family: 'Inter'}}, grid: { display: false }}
            },
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Trend Luistercijfers Cinematen Podcast', font: { size: 18, weight: 'bold', family: 'Inter'}, color: darkTextColor, padding: { top: 10, bottom: 30 }},
                tooltip: {
                    backgroundColor: '#1f2937', titleFont: { family: 'Inter', size: 14 }, bodyFont: { family: 'Inter', size: 12 }, titleColor: '#f3f4f6', bodyColor: '#f3f4f6',
                    callbacks: { label: c => `${c.dataset.label || 'Luisterb.'}: ${c.parsed.y.toLocaleString('nl-NL')}` }
                },
                datalabels: {
                    anchor: 'end', align: 'top', offset: 2, color: datalabelColor, 
                    font: { family: 'Inter', size: 11, weight: '600' },
                    formatter: val => val.toLocaleString('nl-NL')
                }
            }
        }
    });
}
document.addEventListener('DOMContentLoaded', updateDashboard); 