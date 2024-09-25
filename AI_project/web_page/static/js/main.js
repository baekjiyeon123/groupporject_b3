// 실시간 시계 업데이트
function updateTime() {
    const now = new Date();
    document.getElementById("clock").innerText = now.toLocaleTimeString();
}
setInterval(updateTime, 1000);

// 날씨 데이터 가져오기
async function getWeatherData() {
    const apiKey = 'cd608abbd0f5b56811354cdd4d237f61';
    const lat = 37.7749;  // 임의의 위도
    const lon = 122.4194; // 임의의 경도 
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    document.getElementById("wind-speed").innerText = data.wind.speed + " m/s";
    document.getElementById("wave-height").innerText = (data.main.sea_level || "N/A") + " m"; // 파고 정보가 없을 수 있음
    document.getElementById("temperature").innerText = data.main.temp + " °C";
}

// GPS 위치 가져오기
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function showPosition(position) {
    document.getElementById("latitude").innerText = position.coords.latitude;
    document.getElementById("longitude").innerText = position.coords.longitude;

    // 지도의 중앙을 GPS 위치로 설정
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const map = L.map('map').setView([lat, lon], 13);

    // OpenStreetMap 타일 추가
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // GPS 위치 마커 추가
    L.marker([lat, lon]).addTo(map)
        .bindPopup('Your Location')
        .openPopup();
}

// 페이지 로드 시 날씨 데이터와 위치 가져오기
window.onload = function() {
    getWeatherData();
    getLocation();
};

let map;
function initMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // 지도 초기화
            map = new google.maps.Map(document.getElementById("map"), {
                center: userLocation,
                zoom: 14
            });

            // 지도에 마커 추가
            new google.maps.Marker({
                position: userLocation,
                map: map,
                title: "Your Location"
            });

            // HTML에 위도와 경도 표시
            document.getElementById("latitude").innerText = userLocation.lat;
            document.getElementById("longitude").innerText = userLocation.lng;
        }, function () {
            alert("Unable to retrieve your location");
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

