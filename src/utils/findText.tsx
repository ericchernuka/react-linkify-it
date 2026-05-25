import { Children, isValidElement, cloneElement } from 'react';
import type { ReactNode } from 'react';
import type { Key } from 'react';
import type { ReactElement } from 'react';
import type { Component } from '../types';
import { linkIt } from './linkIt';

interface TraversalState {
  nextKey: number;
  usedKeys: Set<string>;
}

const createTraversalState = (): TraversalState => ({
  nextKey: 0,
  usedKeys: new Set(),
});

const getTraversalKey = (state: TraversalState): number => {
  while (state.usedKeys.has(String(state.nextKey))) {
    state.nextKey += 1;
  }

  const key = state.nextKey;
  state.usedKeys.add(String(key));
  state.nextKey += 1;

  return key;
};

const getTraversalElementKey = (state: TraversalState): string =>
  `react-linkify-it-el-${getTraversalKey(state)}`;

const reserveTraversalKey = (state: TraversalState, key: Key): void => {
  const keyString = String(key);
  state.usedKeys.add(keyString);

  // React.Children prefixes user keys with ".$"; generated keys collide with the
  // original value React reports in duplicate-key warnings.
  if (keyString.startsWith('.$')) {
    state.usedKeys.add(keyString.slice(2));
  }
};

/**
 * Recursively finds and processes text nodes in React children, applying linkification.
 *
 * @param {ReactNode} children - The React children to process.
 * @param {Component} component - The component to wrap matches with.
 * @param {RegExp} regex - The regex pattern to match.
 * @returns {ReactNode} The processed React node with linkified content.
 */
export function findText(
  children: ReactNode,
  component: Component,
  regex: RegExp,
  state: TraversalState = createTraversalState(),
): ReactNode {
  if (typeof children === 'string') {
    return linkIt(children, component, regex, () => getTraversalKey(state));
  }

  if (isReactChildrenIterable(children)) {
    return processChildren(children, component, regex, state);
  }

  if (
    isElementWithChildren(children) &&
    children.type !== 'a' &&
    children.type !== 'button'
  ) {
    const processedChildren = findText(
      children.props.children,
      component,
      regex,
      state,
    );

    const props =
      children.key === null
        ? { key: getTraversalElementKey(state) }
        : undefined;

    return cloneElement(
      children,
      props,
      processedChildren,
    );
  }

  return children;
}

function processChildren(
  children: ReactNode,
  component: Component,
  regex: RegExp,
  state: TraversalState,
): ReactNode[] {
  const processedChildren: ReactNode[] = [];
  const childrenArray = Children.toArray(children);

  childrenArray.forEach((child) => {
    if (isValidElement(child) && child.key !== null) {
      reserveTraversalKey(state, child.key);
    }
  });

  childrenArray.forEach((child) => {
    const processedChild = findText(child, component, regex, state);

    if (Array.isArray(processedChild)) {
      processedChildren.push(...processedChild);
    } else {
      processedChildren.push(processedChild);
    }
  });

  return processedChildren;
}

function isReactChildrenIterable(children: ReactNode): boolean {
  return (
    Array.isArray(children) ||
    (typeof children === 'object' &&
      children !== null &&
      Symbol.iterator in children)
  );
}

function isElementWithChildren(
  children: ReactNode,
): children is ReactElement<{ children?: ReactNode }> {
  return isValidElement<{ children?: ReactNode }>(children) && 'children' in children.props;
}
