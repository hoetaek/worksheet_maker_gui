import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the studio shell with the word search workflow by default', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /learning material studio/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /tools/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /word search/i })).toBeInTheDocument();
    expect(screen.getByText(/3학년 1반 이름/i)).toBeInTheDocument();
  });

  it('switches between the migrated workflows', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /worksheet/i }));
    expect(screen.getByRole('heading', { name: /단어 활동지/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /flicker/i }));
    expect(screen.getByRole('group', { name: /slide templates/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /dobble/i }));
    expect(screen.getByText(/Dobble needs exactly 31 words/i)).toBeInTheDocument();
  });

  it('updates keyword rows as words are edited', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText(/word list/i));
    await user.type(screen.getByLabelText(/word list/i), 'cat, dog');

    const keywordTable = screen.getByLabelText(/keyword rows/i);
    expect(within(keywordTable).getByText('cat png')).toBeInTheDocument();
    expect(within(keywordTable).getByText('dog png')).toBeInTheDocument();
  });
});
