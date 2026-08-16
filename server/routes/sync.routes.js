const express = require('express');
const router = express.Router();
const sync = require('../sync');
const { requireAuth } = require('../auth');

function checkSyncSecret(req, res, next) {
  if (req.headers['x-sync-secret'] !== sync.SYNC_SECRET) {
    return res.status(403).json({ error: 'Invalid sync secret' });
  }
  next();
}

// GET /api/sync/data - Return entire local DB dataset (authenticated by sync secret)
router.get('/data', checkSyncSecret, (req, res) => {
  try {
    const payload = sync.getLocalSyncPayload();
    return res.json(payload);
  } catch (error) {
    console.error('Fetch sync data error:', error);
    return res.status(500).json({ error: 'Failed to fetch sync payload.' });
  }
});

// POST /api/sync/data - Merge dataset from peer (authenticated by sync secret)
router.post('/data', checkSyncSecret, (req, res) => {
  try {
    const changesMade = sync.mergeData(req.body);
    return res.json({ success: true, changesMade });
  } catch (error) {
    console.error('Post sync data error:', error);
    return res.status(500).json({ error: 'Failed to process sync payload.' });
  }
});

// GET /api/sync/peers - Fetch active and historic peers list
router.get('/peers', requireAuth, (req, res) => {
  try {
    const peers = sync.getPeers();
    return res.json({ peers });
  } catch (error) {
    console.error('Fetch peers error:', error);
    return res.status(500).json({ error: 'Failed to fetch peers.' });
  }
});

// POST /api/sync/trigger - Manually trigger sync cycle with all peers
router.post('/trigger', requireAuth, async (req, res) => {
  try {
    const peers = sync.getPeers();
    if (peers.length === 0) {
      return res.json({ success: true, message: 'No peers found to sync with.' });
    }

    console.log(`Manual sync requested. Syncing with ${peers.length} peers...`);
    const syncPromises = peers.map(peer => sync.syncWithPeer(peer.url));
    await Promise.all(syncPromises);

    return res.json({ success: true, message: `Sync cycle triggered with ${peers.length} peers.` });
  } catch (error) {
    console.error('Manual sync trigger error:', error);
    return res.status(500).json({ error: 'Failed to run manual peer sync.' });
  }
});

module.exports = router;
