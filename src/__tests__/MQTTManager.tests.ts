import MQTTManager from "../index";
import vars from "./VARS";

if (vars.host) {
  const mqtt = new MQTTManager({ ...vars, logger: console });

  let v = 0,
    w = 0;

  test("subscribe invalid topic", () => {
    expect(() => mqtt.subscribe(mqtt.topic + "//test", () => {})).toThrow();
  });

  const callback1 = (payload: Buffer) => {
    v = Number(payload);
  };
  const callback2 = (payload: Buffer) => {
    w = Number(payload) + 1;
  };
  const callback3 = () => {};

  test("subscribe", async () => {
    mqtt.subscribe(mqtt.topic + "/test1", callback1);
    mqtt.subscribe(mqtt.topic + "/test1", callback2);
    mqtt.subscribe(mqtt.topic + "/test2", callback3);
    expect(mqtt.subscriptions).toEqual([
      {
        topic: mqtt.topic + "/test1",
        callbacks: [callback1, callback2],
        match: false,
      },
      {
        topic: mqtt.topic + "/test2",
        callbacks: [callback3],
        match: false,
      },
    ]);
    await new Promise(r => setTimeout(r, 500));

    expect(v).toEqual(0);
  });

  test("publish", async () => {
    mqtt.publish(mqtt.topic + "/test1", "123");
    await new Promise(r => setTimeout(r, 500));
    expect(v).toEqual(123);
    expect(w).toEqual(124);
  });

  test("unsubscribe", async () => {
    mqtt.unsubscribe(mqtt.topic + "/test2");
    expect(mqtt.subscriptions).toHaveLength(1);
    await new Promise(r => setTimeout(r, 500));

    mqtt.unsubscribe(mqtt.topic + "/test1", callback1);
    expect(mqtt.subscriptions).toHaveLength(1);
    await new Promise(r => setTimeout(r, 500));

    mqtt.publish(mqtt.topic + "/test1", "42");
    await new Promise(r => setTimeout(r, 500));
    expect(v).toEqual(123);
    expect(w).toEqual(43);

    mqtt.unsubscribe(mqtt.topic + "/test1", callback2);
    expect(mqtt.subscriptions).toHaveLength(0);
    await new Promise(r => setTimeout(r, 500));

    mqtt.publish(mqtt.topic + "/test1", "0");
    await new Promise(r => setTimeout(r, 500));
    expect(v).toEqual(123);
    expect(w).toEqual(43);
  });

  test("exit", () => {
    mqtt.client.end(true);
  });
}
