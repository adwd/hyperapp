/**
 * import { app } from "hyperapp"
 * app({
 *   model,
 *   actions,
 *   view
 * })
 * のように実行されるhyperappのエンジン。
 *
 * 
 * action実行
 * -> 次のmodel(状態)を計算
 * -> 前の状態と比較して、変更されていたらDOM Elementを追加・更新・削除
 * -> virtualnodeのルートから末尾までそれをやり、表示が更新される
 */
export default function (app) {
  var view = app.view || function () {
    return ""
  }

  var model
  var actions = {}

  var node
  var root
  var batch = []

  if (app.model !== undefined) {
    model = merge(model, app.model)
  }

  if (app.actions) {
    Object.keys(app.actions).forEach(function (key) {
      var action = app.actions[key]

      // actionsを作る
      // actionは実行すると次のmodelを作り、それをつかってrenderする
      actions[key] = function (data) {
        var result = action(model, data, actions)

        if (result == null || typeof result.then === "function") {
          return result
        } else {
          model = merge(model, result)
          render(model, view)
        }
      }
    })
  }

  // DOMがロードされていればrenderを実行、まだだったらDOMContentLoadedイベントでrenderする
  load(function () {
    root = document.body.appendChild(document.createElement("div"))

    render(model, view)
  })

  function load(fn) {
    if (document.readyState[0] !== "l") {
      fn()
    } else {
      document.addEventListener("DOMContentLoaded", fn)
    }
  }

  // modelとviewを使って、DOMを更新する
  function render(model, view) {
    patch(root, node, node = view(model, actions), 0)

    // batchにはDOM削除のfunctionが入っている
    for (var i = 0; i < batch.length; i++) {
      batch[i]()
    }

    batch = []
  }

  // virtualnodeからDOM Elementを作る
  function createElementFrom(node) {
    var element

    if (typeof node === "string") {
      element = document.createTextNode(node)

    } else {
      element = document.createElement(node.tag)

      for (var name in node.data) {
        setElementData(element, name, node.data[name])
      }

      for (var i = 0; i < node.children.length; i++) {
        element.appendChild(createElementFrom(node.children[i]))
      }
    }

    return element
  }

  function removeElementData(element, name, value) {
    element[name] = value
    element.removeAttribute(name)
  }

  function setElementData(element, name, value, oldValue) {
    name = name.toLowerCase()

    if (!value) {
      removeElementData(element, name, value, oldValue)

    } else if (name === "style") {
      for (var i in oldValue) {
        if (!(i in value)) {
          element.style[i] = ""
        }
      }

      for (var i in value) {
        element.style[i] = value[i]
      }
    } else {
      element.setAttribute(name, value)

      if (element.type === "text") {
        var oldSelStart = element.selectionStart
        var oldSelEnd = element.selectionEnd
      }

      element[name] = value

      if (oldSelStart >= 0) {
        element.setSelectionRange(oldSelStart, oldSelEnd)
      }
    }
  }

  function updateElementData(element, data, oldData) {
    for (var name in merge(oldData, data)) {
      var value = data[name]
      var oldValue = oldData[name]
      var realValue = element[name]

      if (
        value !== oldValue || typeof realValue === "boolean" && realValue !== value
      ) {
        setElementData(element, name, value, oldValue)
      }
    }
  }

  // oldNodeとnodeを比較してDOMの追加・変更・削除を実行する
  // 削除はbatchにためておいて、renderで実行する
  function patch(parent, oldNode, node, index) {
    var element = parent.childNodes[index]

    if (oldNode === undefined) {
      parent.appendChild(createElementFrom(node))

    } else if (node === undefined) {
      batch.push(parent.removeChild.bind(parent, element))

    } else if (shouldUpdate(node, oldNode)) {
      if (typeof node === "string") {
        element.textContent = node
      } else {
        parent.replaceChild(createElementFrom(node), element)
      }

    } else if (node.tag) {
      updateElementData(element, node.data, oldNode.data)

      var len = node.children.length, oldLen = oldNode.children.length

      for (var i = 0; i < len || i < oldLen; i++) {
        // childrenにも再帰的にpatchしていく
        patch(element, oldNode.children[i], node.children[i], i)
      }
    }
  }

  function merge(a, b) {
    var obj = {}
    var key

    if (isPrimitive(b) || Array.isArray(b)) {
      return b
    }

    for (key in a) {
      obj[key] = a[key]
    }
    for (key in b) {
      obj[key] = b[key]
    }

    return obj
  }

  function isPrimitive(type) {
    type = typeof type
    return type === "string" || type === "number" || type === "boolean"
  }

  function shouldUpdate(a, b) {
    return a.tag !== b.tag || typeof a !== typeof b || isPrimitive(a) && a !== b
  }
}
