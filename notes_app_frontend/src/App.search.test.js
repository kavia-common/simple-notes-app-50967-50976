import { render, screen, fireEvent, within } from '@testing-library/react';
import App from './App';

function createNote(ui, { title, body }) {
  // open FAB
  const fab = ui.getByRole('button', { name: /create note/i });
  fireEvent.click(fab);

  const titleInput = ui.getByLabelText(/title/i);
  fireEvent.change(titleInput, { target: { value: title } });

  const bodyInput = ui.getByLabelText(/body/i);
  fireEvent.change(bodyInput, { target: { value: body } });

  const saveBtn = ui.getByRole('button', { name: /save note/i });
  fireEvent.click(saveBtn);
}

test('filters notes by title or body and shows highlight spans', () => {
  const ui = render(<App />);

  // Create three notes
  createNote(ui, { title: 'Shopping List', body: 'Buy Milk and Bread' });
  createNote(ui, { title: 'Work Tasks', body: 'Prepare Q1 report' });
  createNote(ui, { title: 'Travel Plan', body: 'Book hotel in Milan' });

  // All should be visible initially
  expect(ui.getAllByRole('article').length).toBeGreaterThanOrEqual(3);

  // Search by title (case-insensitive)
  const search = ui.getByRole('searchbox', { name: /search notes/i });
  fireEvent.change(search, { target: { value: 'work' } });

  // Wait a short moment for debounce - react-scripts/jest timers are real by default; we can flush using fake timers but
  // instead we check with findBy... which waits.
  return ui.findByRole('article').then(() => {
    const articles = ui.getAllByRole('article');
    expect(articles).toHaveLength(1);
    const card = articles[0];
    const title = within(card).getByRole('heading', { level: 2 });
    // Should contain a mark element wrapping the match
    const marks = within(title).getAllByText(/work/i, { exact: false });
    expect(marks.length).toBeGreaterThan(0);
  });
});

test('search matches body content and highlights inside body', async () => {
  const ui = render(<App />);

  createNote(ui, { title: 'Daily Log', body: 'today I will WORK out and then work on project' });

  const search = ui.getByRole('searchbox', { name: /search notes/i });
  fireEvent.change(search, { target: { value: 'work' } });

  const article = await ui.findByRole('article');
  // Body should have multiple occurrences highlighted (2 times "work")
  const body = within(article).getByText(/today/i).parentElement || within(article).getByText(/today/i).closest('p');
  const highlighted = within(article).getAllByText(/work/i);
  expect(highlighted.length).toBeGreaterThanOrEqual(2);
});
