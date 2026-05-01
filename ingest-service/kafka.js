const { Kafka } = require("kafkajs");
const config = require("./config");

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: config.kafka.groupId });
const admin = kafka.admin();

let producerReady = false;
let consumerReady = false;
let adminReady = false;

async function connectProducer() {
  if (!producerReady) {
    await producer.connect();
    producerReady = true;
    console.log("[Kafka] ✓ Producer connected");
  }
  return producer;
}

async function connectAdmin() {
  if (!adminReady) {
    await admin.connect();
    adminReady = true;
  }
  return admin;
}

async function ensureTopic() {
  const kafkaAdmin = await connectAdmin();
  await kafkaAdmin.createTopics({
    waitForLeaders: true,
    topics: [
      {
        topic: config.kafka.topic,
        numPartitions: config.kafka.partitions,
        replicationFactor: config.kafka.replicationFactor
      }
    ]
  });
}

async function publishAISMessage(message) {
  const kafkaProducer = await connectProducer();
  await kafkaProducer.send({
    topic: config.kafka.topic,
    messages: [
      {
        key: String(message?.MetaData?.MMSI ?? ""),
        value: JSON.stringify(message)
      }
    ]
  });
}

async function startConsumer(eachMessage) {
  if (!consumerReady) {
    await consumer.connect();
    consumerReady = true;
    console.log("[Kafka] ✓ Consumer connected");
    await consumer.subscribe({ topic: config.kafka.topic, fromBeginning: false });
  }

  await consumer.run({ eachMessage });
}

async function disconnectKafka() {
  await Promise.allSettled([
    producerReady ? producer.disconnect() : Promise.resolve(),
    consumerReady ? consumer.disconnect() : Promise.resolve(),
    adminReady ? admin.disconnect() : Promise.resolve()
  ]);
}

module.exports = {
  ensureTopic,
  publishAISMessage,
  startConsumer,
  disconnectKafka
};
