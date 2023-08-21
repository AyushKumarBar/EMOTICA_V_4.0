import React, { useRef, useState } from 'react';
import './Recognise.css';
import logo from "./logo.png";


function Recognise() {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const constraints = { video: true, audio: false };
    const [imageToShow, setImageToShow] = useState('');
    const [emotions, setEmotions] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');

    const BACKEND_URL = 'http://localhost:5000';


    const startCamera = async () => {
        try {
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            videoRef.current.srcObject = newStream;
            setStream(newStream);
            setAge('');
            setEmotions('');
            setGender('');
            setImageToShow('')
        } catch (error) {
            console.error('Error accessing camera:', error);
        }
    };


    const stopCamera = () => {
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setStream(null);
            // setAge('');
            // setEmotions('');
            // setGender('');
            console.log('Camera stopped');
        }
    };


    const captureFrame = () => {
        if (stream) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL('image/jpeg'); // Convert to base64

            sendImageToBackend(imageData);
        }
    };


    const handleReceivedImageData = (base64EncodedImageData) => {
        const base64ImageData = base64EncodedImageData;
        const decodedImageData = atob(base64ImageData);
        const byteArray = new Uint8Array(decodedImageData.length);
        for (let i = 0; i < decodedImageData.length; i++) {
            byteArray[i] = decodedImageData.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        const imageUrl = URL.createObjectURL(blob);
        setImageToShow(imageUrl); // Set the imageUrl to state
    };



    const sendImageToBackend = async (imageData) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/recognise`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData }),
            });

            if (response.ok) {
                try {
                    const data = await response.json();
                    // setBackendResponse(JSON.stringify(data, null, 2));
                    setEmotions(data.emotions);
                    setAge(data.age);
                    setGender(data.gender);
                    handleReceivedImageData(data.recognized_frame);

                } catch (error) {
                    console.error('Error processing response data:', error);
                }
            } else {
                console.error('Failed to send frame to backend.');
            }
        } catch (error) {
            console.error('Error sending frame:', error);
        }
    };


    return (
        <div className='main-container'>

            <div className="container bg-body-tertiary shadow-lg" >

                <nav className="navbar bg-body-tertiary mt-0 p-3" >
                    <div className="container-fluid">
                        <a className="navbar-brand" href="https://github.com/AyushKumarBar">
                            <img src={logo} alt="Logo" width="30" height="30" className="d-inline-block align-text-top" />
                            Emotica AI
                        </a>
                        <a className="btn bg-dark text-light" href="https://github.com/AyushKumarBar">GitHub</a>
                    </div>
                </nav>

                <div className='row mt-4 p-3'>
                    <div className="col mb-0">
                        <video className='video-box shadow mb-0' ref={videoRef} autoPlay />
                    </div>
                    <div className='col mb-0'>
                        {imageToShow && <img className='photo shadow' src={imageToShow} alt="Received from backend" />}
                    </div>
                </div>

                <div className='row mb-4 m-3'>
                    <div className="list-group stripped   col-md-6 mb-3 p-3 shadow rounded">
                        <p className="list-group-item list-group-item-action active text-center" aria-current="true">
                            Analysis :
                        </p>

                        {

                            `${age}` === '' ?
                                <>
                                    <p className="list-group-item list-group-item-action text-center">NA</p>
                                    <p className="list-group-item list-group-item-action text-center">NA</p>
                                    <p className="list-group-item list-group-item-action text-center">NA</p>
                                </> : <>
                                    <p className="list-group-item list-group-item-action text-center">{emotions}</p>
                                    <p className="list-group-item list-group-item-action text-center">{age}</p>
                                    <p className="list-group-item list-group-item-action text-center">{gender}</p>
                                </>

                        }

                    </div>
                    <div className="d-md-flex justify-content-md-center  p-3 col-md-6 rounded">
                        <div className='row shadow p-4 rounded'>
                            <button className="btn btn-primary mb-2" onClick={startCamera}>Start Camera</button>
                            <button className="btn btn-success mb-2" onClick={captureFrame}>Capture and Send Frame</button>
                            <button className="btn btn-danger mb-0" onClick={stopCamera}>Stop Camera</button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}

export default Recognise;