import express from "express";
import React from "react";
import renderer from "react-test-renderer";
import withESI from "./withESI";

const Dummy = (props: { name?: string }) => <div>Hello {props.name}</div>;

test("client-side", () => {
  const DummyESI = withESI(Dummy, "id");
  expect(DummyESI.displayName).toBe("WithESI(Dummy)");

  (global.process as any).browser = true;
  const component = renderer.create(<DummyESI name="Kévin" />);
  expect(component).toMatchSnapshot();
});

test("client-side with serialized props", () => {
  const DummyESI = withESI(Dummy, "id");
  expect(DummyESI.displayName).toBe("WithESI(Dummy)");

  (global.process as any).browser = true;
  ((global as any).__REACT_ESI__ as any) = { id: { name: "Anne" } };
  const component = renderer.create(<DummyESI />);
  expect(component).toMatchSnapshot();
});

test("server-side", () => {
  const DummyESI = withESI(Dummy, "id");
  expect(DummyESI.displayName).toBe("WithESI(Dummy)");

  process.env.REACT_ESI_SECRET = "dummy";
  (global.process as any).browser = false;
  const component = renderer.create(
    <DummyESI esi={{ attrs: { onerror: "continue" } }} name="Kévin" />
  );
  expect(component).toMatchSnapshot();
});
