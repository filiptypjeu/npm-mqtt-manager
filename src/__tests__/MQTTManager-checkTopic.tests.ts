import { MQTTManager } from "../index";

test("valid_subscriptions", () => {
  var t = "test/abc";
  expect(MQTTManager.checkTopic(t)).toEqual(true);

  t = "test/another";
  expect(MQTTManager.checkTopic(t)).toEqual(true);
});

test("invalid_subscriptions", () => {
  var t = "";
  expect(MQTTManager.checkTopic(t)).toEqual(false);

  t = "/";
  expect(MQTTManager.checkTopic(t)).toEqual(false);

  t = "test/abc/";
  expect(MQTTManager.checkTopic(t)).toEqual(false);

  t = "/test/abc";
  expect(MQTTManager.checkTopic(t)).toEqual(false);
});

test("valid_subscriptions_multilevel_wildcard", () => {
  var t = "#";

  expect(MQTTManager.checkTopic(t)).toEqual(true);

  t = "test/#";
  expect(MQTTManager.checkTopic(t)).toEqual(true);

  t = "test/more/#";
  expect(MQTTManager.checkTopic(t)).toEqual(true);
});

test("invalid_subscriptions_multilevel_wildcard", () => {
  var t = "test/#/hello";
  expect(MQTTManager.checkTopic(t)).toEqual(false);

  t = "test/#/#";
  expect(MQTTManager.checkTopic(t)).toEqual(false);

  t = "test/#/";
  expect(MQTTManager.checkTopic(t)).toEqual(false);

  t = "test/a#";
  expect(MQTTManager.checkTopic(t)).toEqual(false);

  t = "test/#a";
  expect(MQTTManager.checkTopic(t)).toEqual(false);

  t = "#a";
  expect(MQTTManager.checkTopic(t)).toEqual(false);

  t = "a#";
  expect(MQTTManager.checkTopic(t)).toEqual(false);
});

test("valid_subscriptions_singlelevel_wildcard", () => {
  var t = "+";
  expect(MQTTManager.checkTopic(t)).toEqual(false);

  t = "test/+";
  expect(MQTTManager.checkTopic(t)).toEqual(true);

  t = "test/+/+";
  expect(MQTTManager.checkTopic(t)).toEqual(true);

  t = "test/+/more";
  expect(MQTTManager.checkTopic(t)).toEqual(true);

  t = "+/test";
  expect(MQTTManager.checkTopic(t)).toEqual(true);

  t = "test/+/extra/+/long/+/+";
  expect(MQTTManager.checkTopic(t)).toEqual(true);
});

test("invalid_subscriptions_singlelevel_wildcard", () => {
  var t = "test/+no";
  expect(MQTTManager.checkTopic(t)).toEqual(false);

  t = "test/no+";
  expect(MQTTManager.checkTopic(t)).toEqual(false);

  t = "+no/";
  expect(MQTTManager.checkTopic(t)).toEqual(false);

  t = "test+/no+/hello";
  expect(MQTTManager.checkTopic(t)).toEqual(false);

  t = "test+/+no/hello";
  expect(MQTTManager.checkTopic(t)).toEqual(false);

  t = "++";
  expect(MQTTManager.checkTopic(t)).toEqual(false);

  t = "test/++";
  expect(MQTTManager.checkTopic(t)).toEqual(false);

  t = "test/+++/another";
  expect(MQTTManager.checkTopic(t)).toEqual(false);
});

test("valid_subscriptions_singlelevel_and_multilevel_wildcards", () => {
  var t = "+/test/+/+/yes/+/#";
  expect(MQTTManager.checkTopic(t)).toEqual(true);
});
