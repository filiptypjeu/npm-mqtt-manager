import { connect, IClientPublishOptions, MqttClient } from "mqtt";

type Callback = (payload: Buffer) => void;

export interface ISubsciption {
  topic: string;
  callback: Callback;
}

interface ISubInternal extends ISubsciption {
  match: boolean;
}

interface ILogger {
  info: (msg: string) => void;
  error: (msg: string | Error) => void;
}

export class MQTTManager {
  public readonly name: string;
  public readonly address: string;
  public readonly topic: string;
  public readonly client: MqttClient;
  public readonly subscriptions: ISubInternal[] = [];

  protected readonly logger: ILogger | undefined;

  constructor(o: { name: string; root?: string; host: string; port: number; logger?: ILogger }) {
    this.name = o.name;
    this.address = `mqtt://${o.host}:${o.port}`;
    this.topic = o.root ? `${o.root}/${o.name}` : o.name;
    this.logger = o.logger;

    this.client = connect(this.address, {
      clientId: this.name,
      clean: true,
      reconnectPeriod: 60,
      rejectUnauthorized: false,
      will: {
        topic: this.statusTopic,
        payload: "offline",
        qos: 1,
        retain: true,
      },
    }).setMaxListeners(99);

    this.client.on("error", e => this.logger?.error(e));

    this.client.on("connect", () => {
      this.logger?.info(`Connected to MQTT broker at ${this.address} as ${this.name}`);

      // Publish online message
      this.publish(this.statusTopic, "online", { retain: true, qos: 1 });
    });

    this.client.on("message", (topic: string, payload: Buffer) => {
      // XXX: How to know if Buffer is printable as a string?
      this.logger?.info(`Recieved message: ${topic} | "${payload.toString()}"`);

      for (let i = 0; i < this.subscriptions.length; i++) {
        const sub = this.subscriptions[i];
        const match = sub.match ? MQTTManager.matchTopic(sub.topic, topic) : sub.topic === topic;
        if (match) {
          sub.callback(payload);
        }
      }
    });
  }

  public get statusTopic() {
    return this.topic + "/status";
  }

  public publish(topic: string, message: string | Buffer, options?: IClientPublishOptions): void {
    this.client.publish(topic, message, options || {}, e => {
      if (e) {
        this.logger?.error(`Could not publish to ${topic} - ${e}`);
      } else {
        const props = [options?.retain ? "R" : "", options?.qos ? options.qos : ""].join("").trim();
        this.logger?.info(
          `Published message${props ? ` [${props}]` : ""}: ${topic} | ${
            typeof message === "string" ? `"${message}"` : `Buffer[${message.length}](${new Uint32Array(message)})`
          }`
        );
      }
    });
  }

  public subscibe(topic: string, callback: Callback): void {
    this.addSubscription(topic, callback);
  }

  public subscribe(subscriptions: ISubsciption | ISubsciption[]): void {
    (Array.isArray(subscriptions) ? subscriptions : [subscriptions]).forEach(s => this.addSubscription(s.topic, s.callback));
  }

  public addSubscription(topic: string, callback: Callback): void {
    // Throw if topic already exists
    if (this.subscriptions.find(s => s.topic === topic)) {
      throw new Error(`Invalid subscription, duplicate topic: ${topic}`);
    }

    // Throw if topic is invalid
    if (!MQTTManager.checkTopic(topic)) {
      throw new Error(`Invalid subscription, invalid topic: ${topic}`);
    }

    this.subscriptions.push({
      topic,
      callback,
      match: topic.includes("#") || topic.includes("+"),
    });

    this.client.subscribe(topic, e => {
      if (e) {
        this.logger?.error(`Could not subscribe to ${topic} - ${e}`);
      } else {
        this.logger?.info(`Subscribed to topic ${topic}`);
      }
    });
  }

  public static checkTopic = (topic: string): boolean => {
    if (topic === "" || topic === "+") return false;

    const topicArray = topic.split("/");
    const length = topicArray.length;

    for (let i = 0; i < length; i++) {
      const s = topicArray[i];
      if (s === "") return false;
      if (s === "#") return i === length - 1;
      if (s.includes("#")) return false;
      if (s.includes("+") && s !== "+") return false;
    }

    return true;
  };

  public static matchTopic(filter: string, topic: string): boolean {
    const filterArray = filter.split("/");
    const length = filterArray.length;
    const topicArray = topic.split("/");

    for (let i = 0; i < length; ++i) {
      const left = filterArray[i];
      const right = topicArray[i];
      if (left === "#") return topicArray.length >= length - 1;
      if (left !== "+" && left !== right) return false;
    }

    return length === topicArray.length;
  }
}

export default MQTTManager;
