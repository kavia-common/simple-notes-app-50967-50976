import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders app title', () => {
  render(<App />);
  const title = screen.getByRole('heading', { name: /notes/i });
  expect(title).toBeInTheDocument();
});

test('renders search input', () => {
  render(<App />);
  const search = screen.getByRole('searchbox', { name: /search notes/i });
  expect(search).toBeInTheDocument();
});

test('renders theme toggle and toggles label', () => {
  render(<App />);
  const toggle = screen.getByRole('button', { name: /switch to/i });
  expect(toggle).toBeInTheDocument();
  // Clicking should flip label target
  const initialLabel = toggle.getAttribute('aria-label');
  fireEvent.click(toggle);
  const updatedLabel = toggle.getAttribute('aria-label');
  expect(updatedLabel).not.toEqual(initialLabel);
});
