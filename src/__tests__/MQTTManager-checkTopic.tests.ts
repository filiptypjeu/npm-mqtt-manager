import { MQTTManager } from "../index";

test("valid_subscriptions", () => {
  expect(MQTTManager.checkTopic("test/abc")).toEqual(true);
  expect(MQTTManager.checkTopic("test/another")).toEqual(true);
});

test("invalid_subscriptions", () => {
  expect(MQTTManager.checkTopic("")).toEqual(false);
  expect(MQTTManager.checkTopic("/")).toEqual(false);
  expect(MQTTManager.checkTopic("test/abc/")).toEqual(false);
  expect(MQTTManager.checkTopic("/test/abc")).toEqual(false);
});

test("valid_subscriptions_multilevel_wildcard", () => {
  expect(MQTTManager.checkTopic("#")).toEqual(true);
  expect(MQTTManager.checkTopic("test/#")).toEqual(true);
  expect(MQTTManager.checkTopic("test/more/#")).toEqual(true);
});

test("invalid_subscriptions_multilevel_wildcard", () => {
  expect(MQTTManager.checkTopic("test/#/hello")).toEqual(false);
  expect(MQTTManager.checkTopic("test/#/#")).toEqual(false);
  expect(MQTTManager.checkTopic("test/#/")).toEqual(false);
  expect(MQTTManager.checkTopic("test/a#")).toEqual(false);
  expect(MQTTManager.checkTopic("test/#a")).toEqual(false);
  expect(MQTTManager.checkTopic("#a")).toEqual(false);
  expect(MQTTManager.checkTopic("a#")).toEqual(false);
});

test("valid_subscriptions_singlelevel_wildcard", () => {
  expect(MQTTManager.checkTopic("+")).toEqual(false);
  expect(MQTTManager.checkTopic("test/+")).toEqual(true);
  expect(MQTTManager.checkTopic("test/+/+")).toEqual(true);
  expect(MQTTManager.checkTopic("test/+/more")).toEqual(true);
  expect(MQTTManager.checkTopic("+/test")).toEqual(true);
  expect(MQTTManager.checkTopic("st/+/extra/+/long/+/+")).toEqual(true);
});

test("invalid_subscriptions_singlelevel_wildcard", () => {
  expect(MQTTManager.checkTopic("tets/+no")).toEqual(false);
  expect(MQTTManager.checkTopic("test/no+")).toEqual(false);
  expect(MQTTManager.checkTopic("+no")).toEqual(false);
  expect(MQTTManager.checkTopic("test+/no")).toEqual(false);
  expect(MQTTManager.checkTopic("++")).toEqual(false);
  expect(MQTTManager.checkTopic("test/++")).toEqual(false);
  expect(MQTTManager.checkTopic("test/+++/another")).toEqual(false);
});

test("valid_subscriptions_singlelevel_and_multilevel_wildcards", () => {
  expect(MQTTManager.checkTopic("+/test/+/+/yes/+/#")).toEqual(true);
});
