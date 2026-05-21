(async () => {
  const { buildAssistantReply } = require('../src/services/responseService');

  async function runTest(msg) {
    try {
      const res = await buildAssistantReply(msg);
      console.log('---');
      console.log('Message:', msg);
      console.log(JSON.stringify(res, null, 2));
    } catch (err) {
      console.error('Error handling message:', msg, err);
    }
  }

  await runTest('How do I prevent malaria?');
  await runTest('Nina homa na baridi, nifanye nini?');
  await runTest('What is PEP for HIV?');
})();
