// One-time setup: registers the production URL as a Paddle sandbox webhook
// destination and prints the endpoint secret. Run once; re-running creates a
// duplicate destination in the Paddle dashboard (harmless but untidy — delete
// the old one from Paddle > Developer tools > Notifications if you do).
import { Environment, Paddle } from "@paddle/paddle-node-sdk";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: Environment.sandbox,
});

async function seed() {
  const destination = await paddle.notificationSettings.create({
    description: "WalletOS production (sandbox testing)",
    destination: "https://walletos.online/api/webhooks/paddle",
    type: "url",
    subscribedEvents: [
      "subscription.created",
      "subscription.updated",
      "subscription.canceled",
      "subscription.activated",
      "subscription.past_due",
      "subscription.paused",
      "subscription.resumed",
      "subscription.trialing",
    ],
  });

  console.log(JSON.stringify({ id: destination.id, endpointSecretKey: destination.endpointSecretKey }, null, 2));
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
