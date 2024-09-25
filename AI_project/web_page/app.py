from flask import Flask, render_template, Response, jsonify
import cv2
import torch
import time

app = Flask(__name__)

# OpenCV 멀티스레딩 비활성화
cv2.setNumThreads(1)

# YOLOv5 모델 로드
model = torch.hub.load('yolov5', 'custom', path='static/weights/best.pt', source='local')

# 동영상 파일 연결 설정
camera1 = cv2.VideoCapture('static/videos/성은이가보내준거.mp4')
camera1.set(cv2.CAP_PROP_FPS, 50)  # 프레임 속도

if not camera1.isOpened():
    print("Video file not found")

def process_frame(frame):
    """YOLOv5로 프레임을 처리하여 객체 탐지"""
    results = model(frame)  # YOLOv5를 사용하여 객체 탐지 수행
    results.render()  # 프레임에 탐지된 객체 경계 상자를 그림

    drowning_detected = False
    for pred in results.xyxy[0]:
        label = int(pred[-1])  # 클래스 인덱스
        if label == 0:  # 0번 클래스를 익사
            drowning_detected = True

    return results.ims[0], drowning_detected

#동영상 스트리밍을 위한 프레임 생성
def generate_frames(camera):
    while True:
        success, frame = camera.read()
        if not success or frame is None:
            print("Failed to read frame, resetting video position")
            camera.set(cv2.CAP_PROP_POS_FRAMES, 0)  # Reset video to start
            continue
        else:
            processed_frame, _ = process_frame(frame)
            ret, buffer = cv2.imencode('.jpg', processed_frame)
            frame = buffer.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

            # time.sleep(1 / 30)  # Adjust frame rate to 30 FPS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/cctv')
def cctv():
    return render_template('cctv.html')

@app.route('/video_feed')
def video_feed():
    """첫 번째 CCTV 스트림 (동영상 반복 재생)"""
    return Response(generate_frames(camera1), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/detection_status')
def detection_status():
    """익사 감지 상태 반환"""
    success, frame = camera1.read()
    if success:
        _, drowning_detected = process_frame(frame)
    else:
        camera1.set(cv2.CAP_PROP_POS_FRAMES, 0)  # 동영상이 끝났으면 처음으로 돌림
        success, frame = camera1.read()
        _, drowning_detected = process_frame(frame)
    return jsonify({'drowning': drowning_detected})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)