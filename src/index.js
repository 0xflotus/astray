export function walk(node, visitor, state = {}, parent = null) {
	if (!node) return;

	if (typeof node !== 'object') {
		return node;
	}

	if (Array.isArray(node)) {
		for (let tmp, item, i=0; i < node.length; i++) {
			tmp = walk(item = node[i], visitor, state, parent);
			if (!tmp) node.splice(i--, 1);
			else if (tmp === item) continue;
			else node[i] = tmp; // else if tmp.node?
		}
		return node;
	}

	let type = node.type;
	if (!type) return node;

	let block = visitor[type];
	let key, item, tmp, xx = 1;

	if (node.path === void 0) {
		Object.defineProperty(node, 'path', {
			enumerable: false,
			writable: false,
			value: {
				bindings: {},
				scanned: false,
				parent: parent,
				skip: () => (xx = 2),
				remove: () => (xx = 0),
				replace: (y) => (xx = y),
				traverse: walk.bind(0, node)
			}
		})
	}

	if (block) {
		if (typeof block === 'function') {
			block(node, state);
		} else if (block.enter) {
			block.enter(node, state);
		}

		if (xx !== 1) {
			if (xx === 2) return node; // skip()
			if (!xx) return; // remove() | replace(falsey)
			node = xx; // replace(any) (TODO: WRAP)
		}
	}

	for (key in node) {
		item = node[key];
		if (item == null) continue;
		if (typeof item !== 'object') continue;
		tmp = walk(item, visitor, state, node);
		if (tmp === void 0) delete node[key];
		else if (tmp === item) continue;
		else node[key] = tmp;
	}

	if (block && block.exit) {
		block.exit(node, state);
		// Now is too late to skip
		if (!xx) return; // remove() | replace(falsey)
		else if (xx != 1 && xx != 2) node = xx; // replace(any) (TODO: WRAP)
	}

	return node;
}