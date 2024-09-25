let alertMessageElement = document.getElementById("alertMessage");
let alertBox = document.getElementById("alertBox");
let drowningDetected = false;
let drowningStartTime = null;
let drowningCount = 0; // 추가된 변수
let detectionWindow = 3000; // 3초 감지 창
let sirenSound = new Audio('static/sounds/siren.mp3'); // 사이렌 소리 
let drowningAlertTriggered = false;  // 알림 상태


// Flask 서버에서 익사 감지 상태를 주기적으로 확인
async function checkDrowningStatus() {
    try {
        let response = await fetch("/detection_status");  // Flask 서버의 상태를 확인
        let data = await response.json();  // JSON 응답을 파싱
        
        console.log("Drowning Status:", data.drowning);

        if (data.drowning) {
            const currentTime = new Date();
            if (!drowningDetected) {
                drowningDetected = true;
                drowningStartTime = currentTime;
                drowningCount = 1; // 첫 번째 감지
            } else {
                const duration = currentTime - drowningStartTime;
                if (duration <= detectionWindow) {
                    drowningCount++; // 3초 내에 감지 시 카운트 증가
                } else {
                    drowningCount = 1; // 3초 지나면 다시 카운트
                    drowningStartTime = currentTime;
                }

                if (drowningCount >= 2) {  // 3초 내 2회 이상 감지 시 비상 알림
                    triggerEmergencyAlert();
                }
            }
        } else if (drowningAlertTriggered) {
            // 이미 비상 알림이 울리고 있으면 추가 감지에 관계없이 유지
            triggerEmergencyAlert();
        } else {
            resetDrowningDetection();
        }
    } catch (error) {
        console.error("Error checking drowning status:", error);
    }
}

// 비상 알림 트리거
function triggerEmergencyAlert() {
    alertMessageElement.innerText = "Emergency: Drowning Detected!";
    alertBox.style.backgroundColor = "red"; // 비상 시 빨간색 배경
    sirenSound.play();  // 사이렌 소리 재생
    drowningAlertTriggered = true;  // 비상 알림 상태로 변경
}

// 알림 초기화
function resetDrowningDetection() {
    drowningDetected = false;
    drowningStartTime = null;
    drowningCount = 0;
    drowningAlertTriggered = false;  // 비상 알림 상태 해제
    alertMessageElement.innerText = "No Emergency";
    alertBox.style.backgroundColor = "";  // 초기 색상
    sirenSound.pause();  // 사이렌 소리 중지
    sirenSound.currentTime = 0;  // 소리 처음으로 되돌리기
}

// 비상 버튼 동작 처리
let emergencyBtn = document.getElementById("emergencyBtn");
emergencyBtn.addEventListener("click", () => {
    triggerEmergencyAlert();
    
});

// 정상 버튼 동작 처리
let normalBtn = document.getElementById("normalBtn");
normalBtn.addEventListener("click", () => {
    resetDrowningDetection();
    
});

// 1초마다 서버 상태 확인
setInterval(checkDrowningStatus, 1000);