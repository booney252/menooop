/**
 * A deterministic guard in front of the model.
 *
 * The system prompt handles red-flag topics, but self-harm is the one case
 * where we do not want to rely on a generation at all. If the message trips
 * this, the reply is fixed text and the API is never called.
 */
const CRISIS =
  /\b(kill myself|killing myself|end my life|ending my life|take my own life|don'?t want to (be here|live|go on)|want to die|wanna die|suicid|self[- ]harm|harm myself|hurt myself|cut myself)\b/i;

export const CRISIS_REPLY = `I want to stop and answer this one properly.

What you have just described needs a person, not an app, and it needs one today. Please contact your doctor now, or call your local emergency number. In the UK you can call 111, or Samaritans free on 116 123, at any hour. In the US and Canada, call or text 988.

I am not going to carry on with the rest of it. Please make that call, and come back when you have.`;

export const isCrisis = (text: string) => CRISIS.test(text);
