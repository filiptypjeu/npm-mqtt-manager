import { MQTTManager } from "../index";

test("match_topic", () => {
  const filter = "test/more";

  expect(MQTTManager.matchTopic(filter, "test/more")).toEqual(true);
  expect(MQTTManager.matchTopic(filter, "test")).toEqual(false);
  expect(MQTTManager.matchTopic(filter, "test/")).toEqual(false);
  expect(MQTTManager.matchTopic(filter, "test/moore")).toEqual(false);
  expect(MQTTManager.matchTopic(filter, "test/more/")).toEqual(false);
  expect(MQTTManager.matchTopic(filter, "test/more/no")).toEqual(false);
});

test("match_multilevel_wildcard_topic", () => {
  const filter = "test/more/#";

  expect(MQTTManager.matchTopic(filter, "test/more")).toEqual(true);
  expect(MQTTManager.matchTopic(filter, "test/more/yes")).toEqual(true);
  expect(MQTTManager.matchTopic(filter, "test/more/yes/ohhyes")).toEqual(true);
  expect(MQTTManager.matchTopic(filter, "test")).toEqual(false);
  expect(MQTTManager.matchTopic(filter, "test/notmore")).toEqual(false);
  expect(MQTTManager.matchTopic(filter, "test/notmore/more")).toEqual(false);
});

test("match_singlelevel_wildcard_topic", () => {
  const filter = "+/test/+/more/+";

  expect(MQTTManager.matchTopic(filter, "a/test/b/more/c")).toEqual(true);
  expect(MQTTManager.matchTopic(filter, "a")).toEqual(false);
  expect(MQTTManager.matchTopic(filter, "a/test")).toEqual(false);
  expect(MQTTManager.matchTopic(filter, "a/test/b")).toEqual(false);
  expect(MQTTManager.matchTopic(filter, "a/test/b/more")).toEqual(false);
  expect(MQTTManager.matchTopic(filter, "a/test/b/more/c/d")).toEqual(false);
  expect(MQTTManager.matchTopic(filter, "a/test/b/MORE/c")).toEqual(false);
});
