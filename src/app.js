var SVG_NS = "http://www.w3.org/2000/svg"

export default function (app) {
  var view = app.view || function () {
    return ""
  }

  var model
  var actions = {}

  var node
  var root
  var batch = []

  // もしかしたらこれいるかも？
  // init(actions, plugin.actions)

  function onError(error) {
    throw error
  }

  function init(container, group, lastName) {
    Object.keys(group).forEach(function (key) {
      if (!container[key]) {
        container[key] = {}
      }

      var name = lastName ? lastName + "." + key : key
      var action = group[key]
      var i

      if (typeof action === "function") {
        container[key] = function (data) {
          var result = action(model, data, actions, onError)

          if (result == null || typeof result.then === "function") {
            return result

          } else {
            model = merge(model, result)
            render(model, view)
          }
        }
      } else {
        init(container[key], action, name)
      }
    })
  }

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

  function render(model, view) {
    patch(root, node, node = view(model, actions), 0)

    for (var i = 0; i < batch.length; i++) {
      batch[i]()
    }

    batch = []
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

  function defer(fn, data) {
    setTimeout(function () {
      fn(data)
    }, 0)
  }

  function shouldUpdate(a, b) {
    return a.tag !== b.tag || typeof a !== typeof b || isPrimitive(a) && a !== b
  }

  function createElementFrom(node, isSVG) {
    var element

    if (typeof node === "string") {
      element = document.createTextNode(node)

    } else {
      element = (isSVG = isSVG || node.tag === "svg")
        ? document.createElementNS(SVG_NS, node.tag)
        : document.createElement(node.tag)

      for (var name in node.data) {
        setElementData(element, name, node.data[name])
      }

      for (var i = 0; i < node.children.length; i++) {
        element.appendChild(createElementFrom(node.children[i], isSVG))
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

      if (element.namespaceURI !== SVG_NS) {
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

  function patch(parent, oldNode, node, index) {
    var element = parent.childNodes[index]

    if (oldNode === undefined) {
      parent.appendChild(createElementFrom(node))

    } else if (node === undefined) {
      // Removing a child one at a time updates the DOM, so we end up
      // with an index out of date that needs to be adjusted. Instead,
      // collect all the elements and delete them in a batch.

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
        patch(element, oldNode.children[i], node.children[i], i)
      }
    }
  }
}
