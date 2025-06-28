import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, writeBatch, doc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAQAEwE4-iWxCnp4RUnHCR_M60KmS7QreU",
    authDomain: "cinematen-cijfers.firebaseapp.com",
    projectId: "cinematen-cijfers",
    storageBucket: "cinematen-cijfers.appspot.com",
    messagingSenderId: "314949907797",
    appId: "1:314949907797:web:3440d6c7230cc6c6dd6bdc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let listenChartInstance = null;
let hoverIndex = null;
let podcastData = {};
let fullMonthNames = {};
let monthsOrder = [];

async function populateInitialData() {
    const batch = writeBatch(db);
    const initialData = {
        "dec-2024": { listens: 565, shortName: "Dec '24", fullName: "December 2024", order: 1, medianRetention: null },
        "jan-2025": { listens: 660, shortName: "Jan '25", fullName: "Januari 2025", order: 2, medianRetention: 65 },
        "feb-2025": { listens: 663, shortName: "Feb '25", fullName: "Februari 2025", order: 3, medianRetention: 65 },
        "mar-2025": { listens: 679, shortName: "Mrt '25", fullName: "Maart 2025", order: 4, medianRetention: 88 },
        "apr-2025": { listens: 806, shortName: "Apr '25", fullName: "April 2025", order: 5, medianRetention: 79 },
        "may-2025": { listens: 1069, shortName: "Mei '25", fullName: "Mei 2025", order: 6, medianRetention: 83 },
        "jun-2025": { listens: 865, shortName: "Jun '25", fullName: "Juni 2025", order: 7, medianRetention: 80 }
    };

    console.log("Populating/updating data with June included...");
    for (const [key, value] of Object.entries(initialData)) {
        const docRef = doc(db, "monthly-stats", key);
        batch.set(docRef, value);
    }

    await batch.commit();
    console.log("Data updated successfully with June included.");
}

// Function to manually populate/update data if needed (use in console)
async function forceUpdateData() {
    console.log("Force updating data...");
    await populateInitialData();
    // Refresh the data after update
    await fetchAndInitialize();
}

async function fetchAndInitialize() {
    try {
        const querySnapshot = await getDocs(query(collection(db, "monthly-stats"), orderBy("order")));

        podcastData = {};
        fullMonthNames = {};
        monthsOrder = [];
        
        if (querySnapshot.empty) {
            console.log("No data found in Firestore. Populating initial data...");
            await populateInitialData();
            // Fetch again after populating
            const newQuerySnapshot = await getDocs(query(collection(db, "monthly-stats"), orderBy("order")));
            newQuerySnapshot.forEach(doc => {
                const data = doc.data();
                podcastData[doc.id] = { 
                    listens: data.listens, 
                    shortName: data.shortName, 
                    medianRetention: data.medianRetention 
                };
                fullMonthNames[doc.id] = data.fullName;
                monthsOrder.push(doc.id);
            });
        } else {
            // Data exists, just read it without overwriting
            querySnapshot.forEach(doc => {
                const data = doc.data();
                podcastData[doc.id] = { 
                    listens: data.listens, 
                    shortName: data.shortName, 
                    medianRetention: data.medianRetention 
                };
                fullMonthNames[doc.id] = data.fullName;
                monthsOrder.push(doc.id);
            });
        }

        updateDashboard();
        renderChart();

    } catch (error) {
        console.error("Error fetching data from Firestore: ", error);
    }
}

function updateDashboard() {
    let previousListens = null, totalListens = 0;
    let growthSum = 0, growthCount = 0, percentSum = 0;
    
    monthsOrder.forEach(key => {
        const info = podcastData[key];
        
        // Only count 2025 months for total listens (exclude December 2024)
        if (info.listens !== null && !key.includes('2024')) {
            totalListens += info.listens;
        }
        
        if (key !== monthsOrder[0] && previousListens !== null && info.listens !== null) {
                const val = ((info.listens - previousListens) / previousListens) * 100;
            growthSum += (info.listens - previousListens);
            percentSum += val;
            growthCount++;
        }
        if (info.listens !== null) previousListens = info.listens;
    });

    if (growthCount > 0) {
        document.getElementById('avgGrowthPerMonth').textContent = Math.round(growthSum / growthCount).toLocaleString('nl-NL');
        document.getElementById('avgGrowthPercentPerMonth').textContent = ((percentSum / growthCount) >= 0 ? '+' : '') + (percentSum / growthCount).toFixed(1) + '%';
    } else {
        document.getElementById('avgGrowthPerMonth').textContent = '[NVT]';
        document.getElementById('avgGrowthPercentPerMonth').textContent = '[NVT]';
    }

    document.getElementById('totalListensPeriod').textContent = totalListens.toLocaleString('nl-NL');
    const firstM = podcastData[monthsOrder[0]].listens, lastM = podcastData[monthsOrder[monthsOrder.length - 1]].listens;
    const totalGrowthEl = document.getElementById('totalGrowthPercentage');
    if (firstM !== null && lastM !== null && firstM !== 0) {
            const val = ((lastM - firstM) / firstM) * 100;
            totalGrowthEl.textContent = `${val.toFixed(1)}%${val > 0 ? " ▲" : val < 0 ? " ▼" : ""}`;
    } else { 
        totalGrowthEl.textContent = "[NVT]"; 
    }
    document.getElementById('generationDate').textContent = new Date().toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function updateMonthInfoCard(monthKey) {
    const info = podcastData[monthKey];
    if (!info) return;
    let groei = null;
    const idx = monthsOrder.indexOf(monthKey);
    if (idx > 0) {
        const prev = podcastData[monthsOrder[idx - 1]];
        if (prev && prev.listens !== null && info.listens !== null) {
            groei = ((info.listens - prev.listens) / prev.listens) * 100;
        }
    }
    const groeiText = groei === null ? 'N.v.t.' : (groei >= 0 ? '+' : '') + groei.toFixed(1) + '%';
    const retentionText = info.medianRetention !== null ? `${info.medianRetention}%` : 'N.v.t.';
    
    document.getElementById('monthInfoCard').innerHTML = `
        <div><strong>${fullMonthNames[monthKey] || info.shortName}</strong></div>
        <div>Luisterbeurten: <strong>${info.listens.toLocaleString('nl-NL')}</strong></div>
        <div>Groei t.o.v. vorige maand: <strong>${groeiText}</strong></div>
        <div>Gemiddelde mediane uitluistertijd: <strong>${retentionText}</strong> 
            <span class="retention-info-icon" title="Dit cijfer is het gemiddelde van de 'mediane luistertijden' van alle afleveringen deze maand. De mediaan is het punt waarop 50% van het publiek nog luistert. Een hoger % betekent dat we de aandacht langer vasthouden.">ℹ️</span>
        </div>
    `;
}

function renderChart() {
    const canvas = document.getElementById('listenTrendChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (listenChartInstance) listenChartInstance.destroy();

    const darkTextColor = '#2E58AE';
    const mediumTextColor = '#2E58AE';
    const gridDarkColor = 'rgba(0, 0, 0, 0.1)'; 
    const barBorderColor = '#1c3d5a'; 
    const datalabelColor = '#2E58AE';

    listenChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.values(podcastData).map(m => m.shortName),
            datasets: [{
                data: Object.values(podcastData).map(m => m.listens),
                backgroundColor: (context) => context.dataIndex === hoverIndex ? '#7c3aed' : '#2E58AE',
                borderColor: barBorderColor,
                borderWidth: 1,
                borderRadius: 5,
                barPercentage: 0.7,
                categoryPercentage: 0.8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Aantal Luisterbeurten', font: { size: 14, family: 'Inter' }, color: darkTextColor }, ticks: { color: mediumTextColor, font: { family: 'Inter' } }, grid: { color: gridDarkColor } },
                x: { title: { display: true, text: 'Maand (2024-2025)', font: { size: 14, family: 'Inter' }, color: darkTextColor }, ticks: { color: mediumTextColor, font: { family: 'Inter' } }, grid: { display: false } }
            },
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Trend Luistercijfers Cinematen Podcast', font: { size: 18, weight: 'bold', family: 'Inter' }, color: darkTextColor, padding: { top: 10, bottom: 30 } },
                tooltip: { enabled: false },
                datalabels: {
                    anchor: 'end', align: 'top', offset: 2, color: datalabelColor, 
                    font: { family: 'Inter', size: 15, weight: '600' },
                    formatter: val => val.toLocaleString('nl-NL')
                }
            },
            onHover: (event, chartElements) => {
                if (chartElements.length > 0) {
                    hoverIndex = chartElements[0].index;
                    updateMonthInfoCard(monthsOrder[hoverIndex]);
                } else {
                    hoverIndex = null;
                    updateMonthInfoCard(monthsOrder[monthsOrder.length - 1]);
                }
                listenChartInstance.update('none');
            }
        }
    });
    updateMonthInfoCard(monthsOrder[monthsOrder.length - 1]);

    canvas.addEventListener('mouseleave', () => {
        hoverIndex = null;
        updateMonthInfoCard(monthsOrder[monthsOrder.length - 1]);
        listenChartInstance.update('none');
    });
}

document.addEventListener('DOMContentLoaded', fetchAndInitialize); 