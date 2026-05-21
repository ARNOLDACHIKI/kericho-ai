const webhookController = require("./src/controllers/webhookController");

const fakeReq = {
  body: {
    object: "whatsapp_business_account",
    entry: [
      {
        changes: [
          {
            value: {
              messages: [
                {
                  from: "254700000000",
                  text: { body: "Hello I have chest pain" }
                }
              ]
            }
          }
        ]
      }
    ]
  }
};

const fakeRes = {
  sendStatus: (code) => console.log("Response sent:", code)
};

webhookController.handleMessage(fakeReq, fakeRes);