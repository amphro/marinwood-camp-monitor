import Client from 'twilio';
import { log } from './log';

// Download the helper library from https://www.twilio.com/docs/node/install
// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// TODO should error with no number provided
const PHONE_NUMBER_ADMIN = process.env.PHONE_NUMBER_ADMIN || "";
const PHONE_NUMBER_USER = process.env.PHONE_NUMBER_USER || "";

const client = Client(accountSid, authToken);

const DISABLE_MESSAGING = ("false" === process.env.DISABLE_MESSAGING)

export enum MessageType {
  ADMIN,
  USER
}

export async function sendMessage(message: string, type: MessageType = MessageType.USER) {
  let numbers = [PHONE_NUMBER_ADMIN];

  if (type === MessageType.USER) {
    numbers.push(PHONE_NUMBER_USER);
  }
  
  if (DISABLE_MESSAGING) {
    log(`disabled! - sending message to ${numbers.join(',')}: ${message}`);
    return;
  }
  log(`sending message to ${numbers.join(',')}: ${message}`);

  try {
    for (let number of numbers) {
      const messageRes = await client.messages.create({body: message, from: '+18666969018', to: number});
      log(`twilio message id: ${messageRes.sid}`)
    }
  } catch (e: any) {
    log(e && e.message || e);
  }
  

  
}

