/* global describe, it, expect */

import { h } from "../src"

describe("h", () => {
  it("creates an empty vnode", () => {
    expect(
      h("div")
    ).toEqual({
      tag: "div",
      data: {},
      children: []
    })
  })

  it("creates a vnode with a single child", () => {
    expect(
      h("div", {}, ["foo"])
    ).toEqual({
      tag: "div",
      data: {},
      children: ["foo"]
    })

    expect(
      h("div", {}, "foo")
    ).toEqual({
      tag: "div",
      data: {},
      children: ["foo"]
    })
  })

  it("creates a vnode with props data", () => {
    const props = {
      id: "foo",
      class: "bar",
      style: {
        color: "red"
      }
    }

    expect(h("div", props, "baz")
    ).toEqual({
      tag: "div",
      data: props,
      children: ["baz"]
    })

  })

  it("doesn't create children from null or boolean values", () => {
    const expected = {
      tag: "div",
      data: {},
      children: []
    }

    expect(
      h("div", {}, true)
    ).toEqual(expected)

    expect(
      h("div", {}, false)
    ).toEqual(expected)

    expect(
      h("div", {}, null)
    ).toEqual(expected)
  })

  it("creates a vnode from a component / tag function", () => {
    const Component = (data, children) => h("div", data, children)

    expect(
      h(Component, { id: "foo" }, "bar")
    ).toEqual({
      tag: "div",
      data: { id: "foo" },
      children: ["bar"]
    })

    expect(
      h(Component, { id: "foo" }, [h(Component, { id: "bar" })])
    ).toEqual({
      tag: "div",
      data: { id: "foo" },
      children: [{
        tag: "div",
        data: { id: "bar" },
        children: []
      }]
    })
  })
})


