import { h, app } from "hyperapp"

app({
    model: {
      title: "Hi.",
      count: 0
    },
    actions: {
      add: model => ({ count: model.count + 1 }),
      sub: model => ({ count: model.count - 1 })
    },
    view: (model, actions) =>
      <div>
        <h1>{model.title}</h1>
        <p>count: {model.count}</p>
        <button onClick={actions.add}>+</button>
        <button onClick={actions.sub}>-</button>
      </div>
})
