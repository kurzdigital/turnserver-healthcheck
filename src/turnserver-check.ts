import {logger} from "./logging";

const wrtc = require('wrtc');

/**
 * Checks if the given turn server is available.
 */
export function isTurnServerAvailable2(iceServer: RTCIceServer): Promise<boolean> {
    return new Promise(async (resolve) => {

        // Start a timeout that sets the promise to false if it wasn't set to true in the meanwhile
        const timeout = setTimeout(() => {
            logger.log('trace', `Promise was not resolved in the last 5 seconds. Resolving with 'false'`);
            resolve(false);
        }, 5000);

        let connection: RTCPeerConnection | null = null;
        try {
            logger.log('trace', 'Creating RTCPeerConnection');
            connection = new wrtc.RTCPeerConnection({iceServers: [iceServer]});
            logger.log('trace', 'Creating data channel');
            connection.createDataChannel('label');

            logger.log('trace', 'Creating offer');
            const offer = await connection.createOffer();
            logger.log('trace', 'Created offer', offer);
            if (offer.sdp.indexOf('typ relay') !== -1) {
                logger.log('trace', `Offer's sdp contains 'typ relay'. Resolving with 'true'`);
                resolve(true);
                connection.close();
                clearTimeout(timeout);
            }

            await connection.setLocalDescription(offer);
            connection.onicecandidate = ice => {
                logger.log('trace', 'Received ice candidate change', ice);
                if (!ice || !ice.candidate || !ice.candidate.candidate || ice.candidate.candidate.indexOf('typ relay') === -1) {
                    return;
                }
                logger.log('trace', `Ice candidate contains 'typ relay'. Resolving with 'true'`);
                resolve(true);
                connection.close();
                clearTimeout(timeout);
            };
        } catch (error) {
            logger.log('trace', `An error occurred while establishing the connection. Resolving with 'false'`, error);
            resolve(false);
            if (connection) {
                connection!!.close();
            }
            clearTimeout(timeout);
        }
    });
}

export async function isTurnServerAvailable(iceServer: RTCIceServer): Promise<boolean> {
    const pc1: RTCPeerConnection = new wrtc.RTCPeerConnection({iceServers: [iceServer]});
    pc1.onconnectionstatechange = ev => {
        logger.log('debug', `pc1.connectionState: ${pc1.connectionState}`);
    };
    const dataChannel = pc1.createDataChannel('label');
    dataChannel.onmessage = ev => {
        logger.log('debug', `dataChannel.onmessage: ${ev.data}`);
    };

    const pc2: RTCPeerConnection = new wrtc.RTCPeerConnection({iceServers: [iceServer]});
    pc2.onconnectionstatechange = ev => {
        logger.log('debug', `pc1.connectionState: ${pc1.connectionState}`);
    };

    pc1.onicecandidate = ice => {
        // logger.log('trace', 'Received ice candidate change', ice);
        if (!ice || !ice.candidate || !ice.candidate.candidate || ice.candidate.candidate.indexOf('typ relay') === -1) {
            return;
        }
        logger.log('trace', `Ice candidate contains 'typ relay': ${JSON.stringify(ice.candidate)}`);
        pc2.addIceCandidate(ice.candidate);
    };

    pc2.onicecandidate = ice => {
        // logger.log('trace', 'Received ice candidate change', ice);
        if (!ice || !ice.candidate || !ice.candidate.candidate || ice.candidate.candidate.indexOf('typ relay') === -1) {
            return;
        }
        logger.log('trace', `Ice candidate contains 'typ relay': ${JSON.stringify(ice.candidate)}`);
        pc1.addIceCandidate(ice.candidate);
    };

    pc2.ondatachannel = ev => {
        ev.channel.send("Hallo");
    };

    const offer = await pc1.createOffer();
    logger.log('debug', `Created offer: ${JSON.stringify(offer)}`);
    await pc1.setLocalDescription(offer);
    await pc2.setRemoteDescription(offer);
    const answer = await pc2.createAnswer();
    logger.log('debug', `Created answer: ${JSON.stringify(answer)}`);
    await pc2.setLocalDescription(answer);
    await pc1.setRemoteDescription(answer);
    return true;
}
