import debug from 'debug';
import { PeersManager } from '../communication/peers_manager';
import { WebrtcPeer } from '../communication/wrtc_peer';
import { TimekeepRequest, TimekeepResponse } from '../communication/messages';
import { TIMEKEEPER_REFRESH_INTERVAL } from '../utils/constants';
import { destructuredPromise } from '../utils/promise';
import { now } from '../utils/time';

const log = debug(`soundsync:timekeeper`);

let deltaWithCoordinator = 0;
let networkLatency = 0;

let isFirstSyncPromiseResolved = false;
const [firstSyncPromise, resolve] = destructuredPromise();

export const getTimeDeltaWithCoodinator = () => deltaWithCoordinator;
export const getCurrentSynchronizedTime = () => now() + deltaWithCoordinator;

export const waitForFirstTimeSync = () => firstSyncPromise;
export const getNetworkLatency = () => networkLatency;

export const attachTimekeeperCoordinator = (server: PeersManager) => {
  server.on('peerControllerMessage:timekeepRequest', ({ peer, message }: {peer: WebrtcPeer; message: TimekeepRequest}) => {
    log(`Received request from ${peer.uuid}`);
    peer.sendControllerMessage({
      type: 'timekeepResponse',
      sentAt: message.sentAt,
      respondedAt: now(),
    });
  });
};

export const attachTimekeeperClient = (server: PeersManager) => {
  server.onControllerMessage('timekeepResponse', (message) => {
    const receivedAt = now();
    const roundtripTime = receivedAt - message.sentAt;
    const receivedByCoordinatorAt = message.sentAt + (roundtripTime / 2);
    const delta = message.respondedAt - receivedByCoordinatorAt;
    deltaWithCoordinator = delta;
    networkLatency = roundtripTime / 2;
    log(`Received response from coordinator, setting delta to ${delta}`);
    if (!isFirstSyncPromiseResolved) {
      isFirstSyncPromiseResolved = true;
      resolve();
    }
  });

  let intervalId;
  const sendTimekeepRequest = () => {
    log(`Sending request to coordinator`);
    // if (!server.coordinatorPeer) {
    //   clearInterval(intervalId);
    //   return;
    // }
    // server.coordinatorPeer.sendControllerMessage({
    //   type: 'timekeepRequest',
    //   sentAt: now(),
    // });
  };

  intervalId = setInterval(sendTimekeepRequest, TIMEKEEPER_REFRESH_INTERVAL);
  sendTimekeepRequest();
};
