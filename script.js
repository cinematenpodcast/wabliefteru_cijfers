import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC1wtF4VqDSQ5GKIJZSR38kOHhTPW7F9bg",
    authDomain: "wabliefteru-cijfers-1234.firebaseapp.com",
    projectId: "wabliefteru-cijfers-1234",
    storageBucket: "wabliefteru-cijfers-1234.firebasestorage.app",
    messagingSenderId: "1072294646165",
    appId: "1:1072294646165:web:83dd5958c8d1a4106ca69c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let listenChartInstance = null;
let hoverIndex = null;
let podcastData = {};
let fullMonthNames = {};
let monthsOrder = [];

async function fetchSocialStats() {
    try {
        const docRef = doc(db, "socials", "instagram");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const followers = data.followers;
            const followersElement = document.getElementById('instagramFollowers');
            if (followersElement) {
                followersElement.textContent = followers.toLocaleString('nl-NL');
            }
        } else {
            console.log("No such document for instagram stats!");
            const followersElement = document.getElementById('instagramFollowers');
            if (followersElement) {
                followersElement.textContent = 'N/A';
            }
        }
    } catch (error) {
        console.error("Error fetching social stats: ", error);
        const followersElement = document.getElementById('instagramFollowers');
        if (followersElement) {
            followersElement.textContent = 'Error';
        }
    }
}

async function fetchAndInitialize() {
    try {
        const querySnapshot = await getDocs(query(collection(db, "monthly-stats"), orderBy("order")));

        podcastData = {};
        fullMonthNames = {};
        monthsOrder = [];
        
        if (querySnapshot.empty) {
            console.error("No data found in Firestore. The database is empty and frontend writing is disabled.");
            const placeholder = document.getElementById('chartPlaceholderText');
            if(placeholder) {
                placeholder.textContent = 'Geen data gevonden in de database.';
                placeholder.style.display = 'block';
            }
            const chart = document.getElementById('listenTrendChart');
            if(chart) {
                chart.style.display = 'none';
            }
        } else {
            // Data exists, just read it
            querySnapshot.forEach(doc => {
                const data = doc.data();
                podcastData[doc.id] = { 
                    listens: data.listens, 
                    shortName: data.shortName, 
                    consumptionHours: data.consumptionHours 
                };
                fullMonthNames[doc.id] = data.fullName;
                monthsOrder.push(doc.id);
            });
            updateDashboard();
            renderChart();
        }
        
        await fetchSocialStats();

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
    const firstMKey = monthsOrder.find(key => !key.includes('2024'));
    const lastMKey = monthsOrder[monthsOrder.length - 1];

    if (firstMKey && lastMKey) {
        const firstM = podcastData[firstMKey].listens;
        const lastM = podcastData[lastMKey].listens;
        const totalGrowthEl = document.getElementById('totalGrowthPercentage');
        
        if (firstM !== null && lastM !== null && firstM !== 0) {
            const val = ((lastM - firstM) / firstM) * 100;
            totalGrowthEl.textContent = `${val.toFixed(1)}%${val > 0 ? " ▲" : val < 0 ? " ▼" : ""}`;
        } else { 
            totalGrowthEl.textContent = "[NVT]"; 
        }
    } else {
        document.getElementById('totalGrowthPercentage').textContent = "[NVT]";
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
    const consumptionText = info.consumptionHours !== null ? `${info.consumptionHours}` : 'N.v.t.';
    
    document.getElementById('monthInfoCard').innerHTML = `
        <div><strong>${fullMonthNames[monthKey] || info.shortName}</strong></div>
        <div>Luisterbeurten: <strong>${info.listens.toLocaleString('nl-NL')}</strong></div>
        <div>Groei t.o.v. vorige maand: <strong>${groeiText}</strong></div>
        <div>Totaal aantal uren beluisterd: <strong>${consumptionText}</strong></div>
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
    const barBorderColor = '#13282e'; 
    const datalabelColor = '#74f5ac';

    listenChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.values(podcastData).map(m => m.shortName),
            datasets: [{
                data: Object.values(podcastData).map(m => m.listens),
                backgroundColor: (context) => context.dataIndex === hoverIndex ? '#74f5ac' : '#1f3338',
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
                y: { beginAtZero: true, title: { display: true, text: 'Aantal Luisterbeurten', font: { size: 14, family: 'Inter' }, color: '#74f5ac' }, ticks: { color: '#74f5ac', font: { family: 'Inter' } }, grid: { color: 'rgba(116, 245, 172, 0.2)' } },
                x: { title: { display: true, text: 'Maand (2024-2025)', font: { size: 14, family: 'Inter' }, color: '#74f5ac' }, ticks: { color: '#74f5ac', font: { family: 'Inter' } }, grid: { display: false } }
            },
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Trend Luistercijfers Wabliefteru Podcast', font: { size: 18, weight: 'bold', family: 'Inter' }, color: '#74f5ac', padding: { top: 10, bottom: 30 } },
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