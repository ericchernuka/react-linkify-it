import { test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { type ReactNode, useEffect } from 'react';
import { LinkIt } from '../../components/LinkIt';
import { UrlComponent } from '../../components/UrlComponent';
import { urlRegex } from '../../utils/regexPatterns';

const expectNoConsoleErrors = (testBody: () => void) => {
  const consoleError = vi
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);

  try {
    testBody();
    expect(consoleError).toHaveBeenCalledTimes(0);
  } finally {
    consoleError.mockRestore();
  }
};

test('LinkIt component with basic functionality', () => {
  render(
    <LinkIt
      component={(match, key) => <UrlComponent match={match} key={key} />}
      regex={urlRegex}
    >
      Visit https://example.com for more info
    </LinkIt>,
  );

  const link = screen.getByRole('link', { name: 'https://example.com' });
  expect(link).toHaveAttribute('href', 'https://example.com');
  // Text is split, so just check parts exist
  expect(screen.getByText(/Visit/)).toBeInTheDocument();
  expect(screen.getByText(/for more info/)).toBeInTheDocument();
});

test('LinkIt component with no matches', () => {
  render(
    <LinkIt
      component={(match, key) => <UrlComponent match={match} key={key} />}
      regex={urlRegex}
    >
      This text has no URLs
    </LinkIt>,
  );

  expect(screen.getByText('This text has no URLs')).toBeInTheDocument();
  expect(screen.queryByRole('link')).toBeNull();
});

test('LinkIt component with multiple matches', () => {
  render(
    <LinkIt
      component={(match, key) => <UrlComponent match={match} key={key} />}
      regex={urlRegex}
    >
      Visit https://example.com and also check www.github.com
    </LinkIt>,
  );

  const links = screen.getAllByRole('link');
  expect(links).toHaveLength(2);
  expect(links[0]).toHaveAttribute('href', 'https://example.com');
  expect(links[1]).toHaveAttribute('href', 'http://www.github.com');
});

test('LinkIt component with mixed content including React elements', () => {
  expectNoConsoleErrors(() => {
    render(
      <LinkIt
        component={(match, key) => <UrlComponent match={match} key={key} />}
        regex={urlRegex}
      >
        Check out https://example.com
        <div>and this nested content</div>
        also www.test.com
      </LinkIt>,
    );

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(screen.getByText('and this nested content')).toBeInTheDocument();
  });
});

test('LinkIt component with custom component', () => {
  const CustomComponent = ({ match }: { match: string }) => (
    <span data-testid="custom-link" data-url={match}>
      {match}
    </span>
  );

  render(
    <LinkIt
      component={(match, key) => <CustomComponent match={match} key={key} />}
      regex={urlRegex}
    >
      Visit https://example.com
    </LinkIt>,
  );

  const customElement = screen.getByTestId('custom-link');
  expect(customElement).toHaveAttribute('data-url', 'https://example.com');
  expect(customElement).toHaveTextContent('https://example.com');
});

test('LinkIt component with empty children', () => {
  render(
    <LinkIt
      component={(match, key) => <UrlComponent match={match} key={key} />}
      regex={urlRegex}
    ></LinkIt>,
  );

  expect(screen.queryByRole('link')).toBeNull();
});

test('LinkIt preserves keyed child identity across rerenders', () => {
  let mountCount = 0;

  const StableChild = ({ children }: { children: ReactNode }) => {
    useEffect(() => {
      mountCount += 1;
    }, []);

    return <span>{children}</span>;
  };

  const { rerender } = render(
    <LinkIt
      component={(match, key) => <UrlComponent match={match} key={key} />}
      regex={urlRegex}
    >
      <StableChild key="stable-child">Visit https://example.com</StableChild>
    </LinkIt>,
  );

  rerender(
    <LinkIt
      component={(match, key) => <UrlComponent match={match} key={key} />}
      regex={urlRegex}
    >
      <StableChild key="stable-child">Visit https://example.com</StableChild>
    </LinkIt>,
  );

  expect(mountCount).toBe(1);
});

test('LinkIt does not warn about missing keys for generated siblings', () => {
  expectNoConsoleErrors(() => {
    render(
      <LinkIt
        component={(match, key) => <UrlComponent match={match} key={key} />}
        regex={urlRegex}
      >
        Check out https://example.com
        <div>and this nested content</div>
        also www.test.com
      </LinkIt>,
    );
  });
});

test('LinkIt does not collide with existing generated-key-shaped siblings', () => {
  expectNoConsoleErrors(() => {
    render(
      <LinkIt
        component={(match, key) => <UrlComponent match={match} key={key} />}
        regex={urlRegex}
      >
        <span key="react-linkify-it-link-0">existing</span>
        Visit https://example.com
      </LinkIt>,
    );
  });
});

test('LinkIt linkifies iterable children', () => {
  render(
    <LinkIt
      component={(match, key) => <UrlComponent match={match} key={key} />}
      regex={urlRegex}
    >
      {new Set(['Visit https://example.com'])}
    </LinkIt>,
  );

  expect(
    screen.getByRole('link', { name: 'https://example.com' }),
  ).toHaveAttribute('href', 'https://example.com');
});

test('LinkIt handles dynamic text changing from no URLs to changing URLs', () => {
  expectNoConsoleErrors(() => {
    const renderLinkIt = (children: string) => (
      <LinkIt
        component={(match, key) => <UrlComponent match={match} key={key} />}
        regex={urlRegex}
      >
        {children}
      </LinkIt>
    );

    const { rerender } = render(renderLinkIt('No links here yet'));

    expect(screen.queryByRole('link')).toBeNull();

    rerender(renderLinkIt('Now visit https://example.com'));

    expect(
      screen.getByRole('link', { name: 'https://example.com' }),
    ).toHaveAttribute('href', 'https://example.com');

    rerender(
      renderLinkIt(
        'Try https://changed.example.com and www.changed-two.example now',
      ),
    );

    expect(
      screen.queryByRole('link', { name: 'https://example.com' }),
    ).toBeNull();
    expect(
      screen.getByRole('link', { name: 'https://changed.example.com' }),
    ).toHaveAttribute('href', 'https://changed.example.com');
    expect(
      screen.getByRole('link', { name: 'www.changed-two.example' }),
    ).toHaveAttribute('href', 'http://www.changed-two.example');
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });
});
