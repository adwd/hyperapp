var i, node, children, stack = []

export default function (tag, data) {
  children = []
  i = arguments.length

  while (i-- > 2) {
    stack.push(arguments[i])
  }

  while (stack.length) {
    if (Array.isArray(node = stack.pop())) {
      i = node.length

      while (i--) {
        stack.push(node[i])
      }
    } else if (node != null && node !== true && node !== false) {
      // Ignore nulls and booleans; this is conditional rendering.

      if (typeof node === "number") {
        node = node + ""
      }

      children.push(node)
    }
  }

  return {
    tag: tag,
    data: data || {},
    children: children
  }
}
