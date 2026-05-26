import { Children, cloneElement, isValidElement } from 'react';
import type { ReactNode } from 'react';
import type { ReactElement } from 'react';
import type { Component } from '../types';
import { linkIt } from './linkIt';

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
): ReactNode {
  if (typeof children === 'string') {
    return linkIt(children, component, regex);
  }

  if (isReactChildrenIterable(children)) {
    return processChildren(children, component, regex);
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
    );

    return cloneElement(
      children,
      children.props,
      processedChildren,
    );
  }

  return children;
}

function processChildren(
  children: ReactNode,
  component: Component,
  regex: RegExp,
): ReactNode[] {
  return (
    Children.map(children, (child) => findText(child, component, regex)) ?? []
  );
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
  return (
    isValidElement<{ children?: ReactNode }>(children) &&
    'children' in children.props
  );
}
