const { handleIncomingMessage } = require('../controllers/chatController');

function makeRes() {
  return {
    status(code) {
      this._status = code;
      return this;
    },
    json(obj) {
      console.log('RES', this._status || 200, JSON.stringify(obj, null, 2));
      return obj;
    }
  };
}

async function run() {
  // 1. Detect topic (headache)
  await handleIncomingMessage({ body: { text: 'I have a headache', from: '254712000000' } }, makeRes());
  // 2. Provide duration
  await handleIncomingMessage({ body: { text: '2 days', from: '254712000000' } }, makeRes());
  // 3. Use reset command
  await handleIncomingMessage({ body: { text: 'menu', from: '254712000000' } }, makeRes());
  // 4. Ask FAQ (if keyword present in faqs.json)
  await handleIncomingMessage({ body: { text: 'How to prevent malaria?', from: '254712000001' } }, makeRes());
}

run().catch((e) => console.error(e));
