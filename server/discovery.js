const { Bonjour } = require('bonjour-service');
const sync = require('./sync');

let bonjourInstance = null;
let publishedService = null;
let serviceBrowser = null;

function startDiscovery(port, localInstanceId) {
  // Initialize Bonjour service
  bonjourInstance = new Bonjour();

  console.log(`Publishing local mDNS service: Bitlogic Hub CRM (${localInstanceId}) on port ${port}...`);

  const deviceName = require('os').hostname().toLowerCase().replace(/[^a-z0-9]/g, '-');

  // 1. Publish local service
  publishedService = bonjourInstance.publish({
    name: `bitlogic-${deviceName}-${localInstanceId}`,
    type: 'bitlogic',
    port: Number(port),
    txt: { id: localInstanceId }
  });

  publishedService.on('error', (err) => {
    console.error('Bonjour publish error:', err);
  });

  // 2. Discover other peer services on the LAN
  console.log('Browsing for peer Bitlogic CRM instances on local network...');
  serviceBrowser = bonjourInstance.find({ type: 'bitlogic' });

  serviceBrowser.on('up', (service) => {
    try {
      if (!service.txt || !service.txt.id) return;

      const peerId = typeof service.txt.id === 'string'
        ? service.txt.id
        : service.txt.id.toString();

      // Ignore ourselves
      if (peerId === localInstanceId) return;

      // Find first IPv4 address
      const ip = service.addresses.find(addr => !addr.includes(':')) || service.addresses[0] || service.host;
      const peerUrl = `http://${ip}:${service.port}`;

      console.log(`Discovered Peer Server: ${service.name} (${peerId}) at ${peerUrl}`);

      // Update peer details
      sync.updatePeer(peerId, peerUrl);

      // Trigger bidirectional sync
      sync.syncWithPeer(peerUrl);
    } catch (err) {
      console.error('Error handling discovered service:', err);
    }
  });

  serviceBrowser.on('down', (service) => {
    if (service.txt && service.txt.id) {
      const peerId = typeof service.txt.id === 'string' ? service.txt.id : service.txt.id.toString();
      console.log(`Peer went offline: ${service.name} (${peerId})`);
    }
  });
}

function stopDiscovery() {
  if (publishedService) {
    publishedService.stop();
  }
  if (serviceBrowser) {
    serviceBrowser.stop();
  }
  if (bonjourInstance) {
    bonjourInstance.destroy();
  }
  console.log('Bonjour discovery stopped.');
}

module.exports = {
  startDiscovery,
  stopDiscovery
};
