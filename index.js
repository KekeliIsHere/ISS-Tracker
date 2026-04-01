const map = L.map('map',{ zoomControl: false }).setView([0, 0], 2);

//Initializing the Leaflet.js map
// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '© OpenStreetMap contributors'
// }).addTo(map);
// Using a clean light-themed tile layer
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',).addTo(map);

// ISS data
async function getISS() {
    let data;

    try {
        const res = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
        data = await res.json();
    } catch (err) {
        console.error("ISS fetch failed", err);
        return null;
    }
    const lat = data.latitude;
    const lon = data.longitude;
    

    return { 
        lat, 
        lon, 
        timestamp: data.timestamp,
        footprint: data.footprint,
        altitude: data.altitude,
        velocity: data.velocity,
        visibility: data.visibility
    };
}

const issIcon=L.icon({
    iconUrl: 'icons/iss_icon.png',  
    iconSize:     [50, 50]// size of the icon    
});

//Marker + Updating:

const toSatelliteBtn = document.getElementById('moveToSatellite');

let currentLat = 0;
let currentLon = 0;

toSatelliteBtn.onclick = () => {
    map.setView([currentLat, currentLon]);     
};
let marker;

function formatLat(lat) {
    return `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? "N" : "S"}`;
}

function formatLon(lon) {
    return `${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? "E" : "W"}`;
}

//Orbit Path
    let path = [];
    let polyline = null;

async function updateISS() {
    const result = await getISS();

    if (!result) return; // stop if API failed

    const { lat, lon, timestamp, altitude, velocity, visibility, footprint } = result;

    if (!marker) {
        marker = L.marker([lat, lon],{icon: issIcon}).addTo(map);
    } else {
        marker.setLatLng([lat, lon]);
    }

    //Coverage Area
    const radius = result.footprint*1000; // km → meters
    //Velocity
    const velocityKmH = velocity.toFixed(0) + " km/h";
    //Altitde
    const altitudeKm = altitude.toFixed(0) + " km";
    //Footprint
    const footprintKm = footprint.toFixed(0) + " km";
    //Vsibility
    const visibilityText = visibility === "daylight" ? "Daylight" : "Eclipse";


    path.push([lat, lon]);
    if (!polyline) {
        polyline = L.polyline(path, { color: '#ef4444' }).addTo(map);
    } else {
        polyline.setLatLngs(path);
    }

    if (showFootprint) {
        if (!footprintCircle) {
            footprintCircle = L.circle([lat, lon], {
                radius: radius,
                color: '#3b82f6',
                weight: 1,
                fillColor: '#3b82f6',
                fillOpacity: 0.15
            }).addTo(map);
        } else {
            footprintCircle.setLatLng([lat, lon]);
            footprintCircle.setRadius(radius);
        }
    } else {
        if (footprintCircle) {
            map.removeLayer(footprintCircle);
            footprintCircle = null;
        }
    }

    currentLat = lat;
    currentLon = lon;
  

    document.getElementById("lat-val").innerText =formatLat(lat);

    document.getElementById("lng-val").innerText =formatLon(lon);

    document.getElementById("time").innerText =new Date(timestamp * 1000).toLocaleTimeString();

    document.getElementById("altitude-val").innerText =altitudeKm;

    document.getElementById("velocity-val").innerText =velocityKmH;

    document.getElementById("visibility-val").innerText =visibilityText;

    document.getElementById("footprint-val").innerText =footprintKm;
}

// Footprint.
let footprintCircle = null;
let showFootprint = false;
const toggleFootprint = document.getElementById("toggle-footprint");

toggleFootprint.onchange = () => {
    showFootprint = toggleFootprint.checked;
};


const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('sidebar-toggle');
const mobileToggleBtn = document.getElementById('mobile-sidebar-toggle');

function toggleSidebar() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        sidebar.classList.toggle('open');
    } else {
        sidebar.classList.toggle('minimized');
        toggleBtn.innerText = sidebar.classList.contains('minimized') ? "▶" : "◀";
    }
    
    // Smooth map resize
    setTimeout(() => map.invalidateSize(), 400);
}



toggleBtn.onclick = toggleSidebar;
if (mobileToggleBtn) {
    mobileToggleBtn.onclick = toggleSidebar;
}


updateISS();
setInterval(updateISS, 5000);

