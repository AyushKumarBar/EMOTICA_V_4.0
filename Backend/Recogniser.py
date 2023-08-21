from flask import Flask, request, jsonify
from facial_emotion_recognition import EmotionRecognition
import cv2
import numpy as np
import base64
from flask_cors import CORS
from keras.models import load_model


face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
model = load_model('model.h5',compile=False)


app = Flask(__name__)
CORS(app)

er = EmotionRecognition(device='cpu')
gender_dict = {0:'Male', 1:'Female'}



def recognize_emotions(image_data):
    image_bytes = base64.b64decode(image_data.split(',')[1])
    image_np = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_np, flags=cv2.IMREAD_COLOR)
    recognized_frame = er.recognise_emotion(image, return_type='BGR')
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    # face_regions = []
    for (x, y, w, h) in faces:
        face_region = gray[y:y+h, x:x+w]
        # face_regions.append(face_region)
    emotion = er._predict(face_region)
    resized_face_region = cv2.resize(
    face_region, (128, 128), interpolation=cv2.INTER_AREA)
    normalized_face_region = resized_face_region / 255.0
    img_array = normalized_face_region.reshape(1, 128, 128, 1)
    pred = model.predict(img_array)
    gender = gender_dict[round(pred[0][0][0])]
    age = round(pred[1][0][0])
    # print(emotion,age,gender)


    return recognized_frame, emotion, gender, age


@app.route('/api/recognise', methods=['POST'])
def process_frame():
    data = request.get_json()
    image_data = data.get('image')
    
    recognized_frame, emotions, gender, age = recognize_emotions(image_data)

    result = {'recognized_frame': base64.b64encode(cv2.imencode('.jpg', recognized_frame)[1]).decode('utf-8'),
              'emotions': emotions, 'gender': gender, 'age':age}
    return jsonify(result)


if __name__ == '__main__':
    app.run()
