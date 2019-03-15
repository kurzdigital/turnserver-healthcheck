import {logger} from "./logging";

const wrtc = require('wrtc');

/**
 * Checks if the given turn server is available.
 */
export function isTurnServerAvailable(iceServer: RTCIceServer): Promise<boolean> {
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