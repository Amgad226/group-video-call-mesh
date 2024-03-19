import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faVideo } from '@fortawesome/free-solid-svg-icons';
import { Modal } from 'antd';

const DeviceSelectionModal = ({ showModal, setShowModal, handleDeviceSelect, devices,
    activeVideoDevice, setActiveVideoDevice, activeAudioDevice, setActiveAudioDevice,
}) => {
    return (
        <Modal
            title="Select device"
            visible={showModal}
            onCancel={() => setShowModal(false)}
            footer={null}
        >
            <ul>
                {devices?.audioinput && (
                    <>
                        <div>Audio devices:</div>
                        {devices.audioinput.map(device => (
                            <button key={device.deviceId} disabled={activeAudioDevice === device.deviceId ? true : false} onClick={() => handleDeviceSelect(device)}>
                                <FontAwesomeIcon icon={faMicrophone} style={{ color: activeAudioDevice === device.deviceId ? 'green' : 'black' }} /> {device.label}
                            </button>
                        ))}
                        <br />
                    </>
                )}
                {devices?.videoinput && (
                    <>
                        <div>Video devices:</div>
                        {devices.videoinput.map(device => (
                            <button key={device.deviceId} disabled={activeVideoDevice === device.deviceId ? true : false} onClick={() => handleDeviceSelect(device)}>
                                <FontAwesomeIcon icon={faVideo} style={{ color: activeVideoDevice === device.deviceId ? 'green' : 'black' }} /> {device.label}
                            </button>
                        ))}
                    </>
                )}
            </ul>
        </Modal >
    );
};

export default DeviceSelectionModal;
