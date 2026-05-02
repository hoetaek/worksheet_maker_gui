import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the Korean studio shell with the word search workflow by default', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /학습 자료 제작 스튜디오/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /도구/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /낱말 찾기/i })).toBeInTheDocument();
    const studentInfo = screen.getByLabelText(/학생 정보/i);
    expect(within(studentInfo).getByText('학년')).toBeInTheDocument();
    expect(within(studentInfo).getByText('3')).toBeInTheDocument();
    expect(within(studentInfo).getByText('반')).toBeInTheDocument();
    expect(within(studentInfo).getByText('1')).toBeInTheDocument();
    expect(within(studentInfo).getByText('이름')).toBeInTheDocument();
  });

  it('switches between the migrated workflows', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /단어 활동지/i }));
    expect(screen.getByRole('heading', { level: 2, name: /단어 활동지/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /단어 깜빡이/i }));
    expect(screen.getByRole('group', { name: /슬라이드 양식/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /도블 카드/i }));
    expect(screen.getByText(/단어 31개가 정확히 필요합니다/i)).toBeInTheDocument();
  });

  it('updates keyword rows as words are edited', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText(/단어 목록/i));
    await user.type(screen.getByLabelText(/단어 목록/i), 'cat, dog');

    const keywordTable = screen.getByLabelText(/검색어 목록/i);
    expect(within(keywordTable).getByText('cat png')).toBeInTheDocument();
    expect(within(keywordTable).getByText('dog png')).toBeInTheDocument();
  });
});
