import { connect, IClientPublishOptions, MqttClient } from "mqtt";

type Callback = (payload: Buffer, topic: string) => void;

export interface ISubscription {
  topic: string;
  callback: Callback;
}

interface ISubInternal {
  topic: string;
  callbacks: Callback[];
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

  constructor(o: { name: string; root?: string; host: string; port: number; logger?: ILogger; logErrors?: boolean }) {
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

    if (o.logErrors !== false) this.client.on("error", e => this.logger?.error(e));

    this.client.on("connect", () => {
      this.logger?.info(`Connected to MQTT broker at ${this.address} as ${this.name}`);

      // Publish online message
      this.publish(this.statusTopic, "online", { retain: true, qos: 1 });
    });

    this.client.on("message", (topic: string, payload: Buffer) => {
      // XXX: How to know if Buffer is printable as a string?
      this.logger?.info(`Recieved message: ${topic} | "${payload.toString()}"`);

      for (const sub of this.subscriptions) {
        const match = sub.match ? MQTTManager.matchTopic(sub.topic, topic) : sub.topic === topic;
        if (match) {
          sub.callbacks.forEach(c => c(payload, topic));
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

  /**
   * @deprecated Because of typo in method name...
   */
  public subscibe(topic: string, callback: Callback): void {
    this.addSubscription(topic, callback);
  }

  public subscribe(topic: string, callback: Callback): void;
  public subscribe(subscriptions: ISubscription | ISubscription[]): void;
  public subscribe(param: ISubscription | ISubscription[] | string, callback?: Callback): void {
    if (typeof param !== "string") (Array.isArray(param) ? param : [param]).forEach(s => this.addSubscription(s.topic, s.callback));
    else if (callback) this.addSubscription(param, callback);
  }

  public addSubscription(topic: string, callback: Callback): void {
    // Throw if topic is invalid
    if (!MQTTManager.checkTopic(topic)) {
      throw new Error(`Invalid subscription, invalid topic: ${topic}`);
    }

    const sub = this.subscriptions.find(s => s.topic === topic);
    if (sub) {
      sub.callbacks.push(callback);
      this.logger?.info(`Added callback (${sub.callbacks.length}) to topic ${topic}`);
      return;
    }

    this.subscriptions.push({
      topic,
      callbacks: [callback],
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

  public unsubscribe(topic: string, callback?: Callback): void;
  public unsubscribe(subscriptions: ISubscription | ISubscription[]): void;
  public unsubscribe(param: ISubscription | ISubscription[] | string, callback?: Callback): void {
    if (typeof param !== "string") (Array.isArray(param) ? param : [param]).forEach(s => this.removeSubscription(s.topic, s.callback));
    else this.removeSubscription(param, callback);
  }

  public removeSubscription(topic: string, callback?: Callback): void {
    const sub = this.subscriptions.find(s => s.topic === topic);
    if (!sub) {
      this.logger?.error(`Could not unsubscribe from ${topic} - not subscribed`);
      return;
    }

    if (sub.callbacks.length > 1) {
      if (!sub.callbacks.find(c => c === callback)) {
        this.logger?.error(`Could not unsubscribe from ${topic} - could not find matching callback`);
        return;
      }
      sub.callbacks = sub.callbacks.filter(c => c !== callback);
      this.logger?.info(`Removed callback (${sub.callbacks.length}) from topic ${topic}`);
      return;
    }

    this.subscriptions.splice(this.subscriptions.indexOf(sub), 1);
    this.client.unsubscribe(topic, {}, e => {
      if (e) {
        this.logger?.error(`Could not unsubscribe from ${topic} - ${e}`);
      } else {
        this.logger?.info(`Unsubscribed from topic ${topic}`);
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
