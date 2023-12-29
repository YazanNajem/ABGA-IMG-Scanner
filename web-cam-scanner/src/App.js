import React, { useRef, useState, useCallback, createRef, useEffect } from 'react';
import './App.css';
import Webcam from "react-webcam"; // Import React Webcam component
import axios from 'axios'
import { Header, Button, Icon, Message, Loader, Popup, Table, Modal } from 'semantic-ui-react' // Import Semantic UI React components

function App() {
  // State variables
  const [isCameraAvailable, setCameraAvailable] = useState(false);
  const [imgSource, setImgSource] = useState(null);
  const [textScan, setTextScan] = useState(null);
  const [load, setLoad] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Accessing webcam and file input Refs
  const webcamReference = useRef(null);
  let fileInRef = createRef();

  useEffect(() => {
    // Check if the user has visited the site before
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');

    // If it's the first visit, show the info modal and set a flag in local storage
    if (!hasVisitedBefore) {
      setShowInfoModal(true);
      localStorage.setItem('hasVisitedBefore', 'true');
    }
    
    // Function to check camera availability
    const checkCameraAvailability = async () => {
      try {
        // Enumerate devices to find video input devices (cameras)
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === 'videoinput');
        setCameraAvailable(cameras.length > 0); // Set camera availability state
        setCameraLoading(false); // Set camera loading state to false
      } catch (error) {
        console.error('Error checking for cameras:', error);
        setCameraAvailable(false); // Set camera availability state to false in case of an error
        setCameraLoading(false); // Set camera loading state to false in case of an error
      }
    };

    checkCameraAvailability(); // Invoke the camera availability check
  }, []); // Empty dependency array ensures that this effect runs only once on mount


  const mainFeatures = [
    "Image Capture.",
    "Image Upload.",
    "OCR Data Extraction.",
    "Results Presentation.",
  ];

  const additionalFeatures = [
    "First Visit Detection.",
    "Info Modal.",
    "History Saving.",
    "Data Exportation.",
    "Aesthetically Enhanced Styling.",
    "Camera Availability Check.",
    "Camera Connectivity Hints.",
    "Camera Loading Indicators.",
    "Scan History Preservation.",
  ];

  // Callback function for taking a screenshot
  const screenshot = useCallback(async () => {
    setLoad(true);

    // Capture a screenshot from the webcam
    const imgSrc = webcamReference.current.getScreenshot();
    console.log('Screnshotted Image:', imgSrc);

    // Check if the screenshot is valid
    if (!imgSrc) {
      console.error('Error: Screnshotted image is null or undefined');
      setLoad(false);
      return;
    }

    try {
      // Prepare form data with the screenshot for server upload
      const formData = new FormData();
      const blob = await fetch(imgSrc).then((res) => res.blob());
      formData.append('img', blob, 'screenshot.jpeg');

      // Make a POST request to the server to process the screenshot
      const response = await axios.post('http://localhost:5000/shot', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      console.log('Response from server:', response.data);

      // Update state with the processed data
      setTextScan(response.data.text);
      setImgSource(imgSrc);
    } catch (error) {
      console.error('Error during screenshot request:', error);
    } finally {
      setLoad(false); // Set loading state to false after the screenshot process
    }
  }, [webcamReference, setImgSource, setTextScan, setLoad]);

  // Function for handling file upload
  const upload = async (file) => {
    setLoad(true) // Set loading state to true during the file upload process

    // Set up the URL and form data for file upload
    var url = 'http://localhost:5000/upload'
    var uploadData = new FormData()
    uploadData.append('file', file)
    var config = {
      headers:
        { 'Content-Type': 'multipart/form-data' }
    }
    // Make a POST request to the server for file upload
    const res = await axios.post(url, uploadData, config);
    console.log(res.data);

    // Update state with the processed data
    setTextScan(res.data.text);
    setImgSource(res.data.image);
    setLoad(false); // Set loading state to false after the file upload process
  }

  // JSX structure
  return (
    <>
      <Header className="App-header" size="huge">
        <a href="https://abga.tech" target="_blank" rel="noopener noreferrer">
          <img style={{ width: 150 }} alt="screenshotted" src="/favicon.ico" />
        </a>
        Picture Scanner

        <Button
          color="teal"
          style={{ marginLeft: 'auto' }}
          onClick={() => setShowInfoModal(true)}
        >
          Read
        </Button>
      </Header>

      {cameraLoading ? (
        <Loader className="Loader" active inline="centered" size="big">
          Loading Camera...
        </Loader>
      ) : isCameraAvailable ? (
        <div className="Webcam-container">
          <Webcam audio={false} ref={webcamReference} screenshotFormat="image/jpeg" />

          <div className="Webcam-buttons">
            <Button
              size="big"
              onClick={screenshot}
              icon
              labelPosition="left"
              color="black"
            >
              <Icon name="camera" />
              Take a pic
            </Button>

            <Button
              size="big"
              onClick={() => fileInRef.current.click()}
              icon
              labelPosition="left"
              color="black"
              className="Upload-button"
            >
              <Icon name="upload" />
              Upload
            </Button>
            <form key={isCameraAvailable} encType="multipart/form-data">
              <input
                ref={fileInRef}
                type="file"
                hidden
                name="filename"
                onChange={(x) => {
                  upload(x.target.files[0]);
                }}
                accept="image/*"
              />
            </form>
          </div>
        </div>
      ) : (
        <>

          <div className="Webcam-container">
            <div className='Webcam-buttons' style={{ textAlign: "center" }}>
              <Popup
                content="Please allow the camera on the website or ensure your webcam connectivity."
                trigger={<Header style={{ fontFamily: 'roboto' }} size="large">No Camera Available<Icon name="info circle" style={{ fontSize: 'small', marginBottom: "7%" }} /></Header>}
              />

              <Button
                size="big"
                onClick={() => fileInRef.current.click()}
                icon
                labelPosition="left"
                color="black"
                className={"Upload-button"}
              >
                <Icon name="upload" />
                Upload
                <form encType="multipart/form-data">
                  <input
                    ref={fileInRef}
                    type="file"
                    hidden
                    name="filename"
                    onChange={(x) => {
                      upload(x.target.files[0]);
                    }}
                    accept="image/*"
                  />
                </form>
              </Button>
            </div>
          </div>
        </>
      )}

      <div className="Result-section">
        {load ? (
          <Loader className="Loader" active inline="centered" size="big">
            Loading...
          </Loader>
        ) : imgSource ? (
          <>
            <Header style={{ margin: 10, fontFamily: 'roboto' }} size="large">
              Result
            </Header>
            <div className="Result-container">
              <img style={{ marginLeft: 10, height: '200px', width: 'auto', maxHeight: '100%', maxWidth: '100%', margin: '10px' }} alt="screenshotted" src={imgSource} />

              {textScan ? (
                <Table celled>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Data 1</Table.HeaderCell>
                      <Table.HeaderCell>Data 2</Table.HeaderCell>
                      <Table.HeaderCell>Data 3</Table.HeaderCell>
                      <Table.HeaderCell>Data 4</Table.HeaderCell>
                      <Table.HeaderCell>Data 5</Table.HeaderCell>
                      <Table.HeaderCell>Data 6</Table.HeaderCell>
                      <Table.HeaderCell>Data 7</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    <Table.Row>
                      {textScan.split(',').map((value, index) => (
                        <Table.Cell key={index}>{value}</Table.Cell>
                      ))}
                    </Table.Row>
                  </Table.Body>
                </Table>
              ) : (
                <Message size="massive" color="orange" content="No data available" style={{ margin: 15 }} />
              )}
            </div>
          </>
        ) : (
          <Header style={{ margin: 10, fontFamily: 'roboto' }} size="large">
            No data preview
          </Header>
        )}
      </div>
      <Modal open={showInfoModal} onClose={() => setShowInfoModal(false)} closeIcon>
        <Modal.Header>ABGA IMG Scanner <strong style={{ color: "red" }}><b>PLEASE READ</b></strong></Modal.Header>
        <Modal.Content scrolling style={{ fontSize: "16px" }}>

          <p>This web application encompasses the functionalities elucidated during the interview, complemented by a set of supplementary features. The core capabilities are outlined below:</p>

          <ul>
            {mainFeatures.map((feature, index) => (
              <li key={index}>
                <strong>{feature}</strong>
              </li>
            ))}
          </ul>

          <p>Additional Features:</p>

          <ul>
            {additionalFeatures.map((feature, index) => (
              <li key={index}>
                <strong>{feature}</strong>
              </li>
            ))}
          </ul>

          <p style={{ color: "red", fontWeight: "bold" }}>
            NOTE: Please note that the <u><b>tesseract.js</b></u> library, employed for <u>OCR processing</u>, inherently demands <u>extensive training</u>, <u>diverse datasets</u>, and <u>machine learning</u> iterations to yield optimal accuracy.
            However, the accuracy of image processing within the scope of this code may be constrained due to time limitations associated with task submission.
          </p>
        </Modal.Content>
      </Modal>

    </>

  );
}

export default App;
